const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration from deployed_config.json
const DEPLOYED_CONFIG = require('../../deployed_config.json');

const DEEPBOOK_PACKAGE = "0xbc331f09e5c737d45f074ad2d17c3038421b3b9018699e370d88d94938c53d28";
const POOL_ID = "0x25fa26d1d3125bc32c9665dae5505b96737c939d4ab79014b379ffee954684f4"; // From previous step
const MOCK_USDC_TYPE = DEPLOYED_CONFIG.MOCK_USDC_TYPE;
const SUI_TYPE = "0x2::sui::SUI";

// Helper to run commands
function runCommandJSON(cmd) {
    try {
        // console.log(`Running: ${cmd}`);
        const output = execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' });
        const lines = output.split('\n').filter(line => !line.startsWith('[warning]'));
        const jsonStr = lines.join('\n').trim();
        // console.log(`Output: ${jsonStr.substring(0, 100)}...`);
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error("Error running command:", cmd);
        if (e.stdout) console.error("Stdout:", e.stdout.toString());
        if (e.stderr) console.error("Stderr:", e.stderr.toString());
        throw e;
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


function getCoin(type) {
    const cmd = `sui client objects --json`;
    const objects = runCommandJSON(cmd);
    // Find coin with standard struct type (relaxed matching)
    return objects.find(o => {
        const objType = o.type || (o.data && o.data.type);
        if (objType && objType.includes(type)) {
             console.log(`Found candidate: ${objType}`);
        }
        return objType && objType.includes(type) && objType.includes("0x2::coin::Coin");
    });
}
// Debug
function debugObjects(type) {
    const cmd = `sui client objects --json`;
    const objects = runCommandJSON(cmd);
    console.log(`Searching for: ${type}`);
    console.log("Available types:");
    objects.forEach(o => {
       const t = o.type || (o.data && o.data.type);
       console.log(` - ${t}`);
    });
}

// Function to find the coin object ID from the "data" field if wrapper exists
function getObjectId(obj) {
    return obj.data ? obj.data.objectId : obj.objectId;
}

function getObjectVersion(obj) {
    return obj.data ? obj.data.version : obj.version;
}

async function main() {
    console.log("=== Seeding DeepBook Pool ===");
    console.log(`Pool: ${POOL_ID}`);
    console.log(`Quote: ${MOCK_USDC_TYPE}`);

    // 1. Find MOCK_USDC Coin
    let usdcCoin = getCoin(MOCK_USDC_TYPE);
    
        if (!usdcCoin) {
        console.log("⚠️ No MOCK_USDC coin found. Minting new coins...");
        const treasuryCapId = DEPLOYED_CONFIG.USDC_CAP_ID;
        
        let recipient = runCommandJSON('sui client active-address --json');
        if (typeof recipient === 'object' && recipient.result) recipient = recipient.result;
        // In case it's just a string, ensure it's clean
        if (typeof recipient !== 'string') throw new Error("Could not get active address");
        
        console.log(`Minting to: ${recipient}`);

        const mintCmd = `sui client call \
            --package 0x2 \
            --module coin \
            --function mint_and_transfer \
            --type-args ${MOCK_USDC_TYPE} \
            --args ${treasuryCapId} 10000000000 ${recipient} \
            --gas-budget 50000000 \
            --json`;
            
        const mintRes = runCommandJSON(mintCmd);
        if (mintRes.effects.status.status !== 'success') {
             throw new Error("Mint failed: " + JSON.stringify(mintRes.effects.status));
        }
        console.log("✅ Minted 10,000 MOCK_USDC");
        
        // Find it again
        usdcCoin = getCoin(MOCK_USDC_TYPE);
        if (!usdcCoin) throw new Error("Still no coin found after minting!");
    }
    const usdcCoinId = getObjectId(usdcCoin);
    console.log(`Found MOCK_USDC: ${usdcCoinId}`);

    // 2. Create BalanceManager (Shared)
    console.log("\nStep 1: Creating BalanceManager...");
    try {
        const createBmCmd = `sui client ptb \
            --move-call "${DEEPBOOK_PACKAGE}::balance_manager::new" \
            --assign bm \
            --move-call "0x2::transfer::public_share_object<${DEEPBOOK_PACKAGE}::balance_manager::BalanceManager>" bm.0 \
            --gas-budget 50000000 \
            --json`;
        
        const createBmRes = runCommandJSON(createBmCmd);
        
        if (createBmRes.effects.status.status !== 'success') {
            throw new Error(`BM Creation failed: ${JSON.stringify(createBmRes.effects.status)}`);
        }
        
        // Find created shared object (BalanceManager)
        const createdObj = createBmRes.objectChanges.find(o => 
            o.objectType.includes('::balance_manager::BalanceManager') && (o.type === 'created' || o.type === 'published')
        );
        
        if (!createdObj) {
            // If checking 'objectChanges' fails, check 'created' list
             throw new Error("BalanceManager object not found in effects");
        }
        
        const balanceManagerId = createdObj.objectId;
        console.log(`✅ BalanceManager Created: ${balanceManagerId}`);
        
        console.log("Waiting 5s for indexing...");
        await sleep(5000);

        // 3. Deposit & Place Order (in one go, now that BM is shared and we have its ID)
        console.log("\nStep 2: Deposit & Place Bid...");
        
        // Params (Atomic Units)
        // Price: 1 USDC = 1,000,000 MISTs (TickSize 100 * 10000 Ticks? No, direct price u64)
        // DeepBook V3 uses direct price if I recall? Or is it Ticks? 
        // Manual command used 1,000,000. 
        const price = 1000000; // 1.0 USDC
        
        // Quantity: 5 SUI = 5 * 10^9 MISTs
        const quantity = 5000000000; // 5 SUI
        const isBid = true;
        const expire = 1999999999999; 
        
        // We must pass the *shared* BM object ID.
        // And we need to split coin? No, take the whole MOCK_USDC coin for now (assuming it's expendable).
        // Actually, let's split 10 USDC worth. 10 * 10^6 = 10,000,000.
        
        const depositAmount = 10000000;
        
        const tradeCmd = `sui client ptb \
            --split-coins @${usdcCoinId} [${depositAmount}] \
            --assign deposit_coin \
            --move-call "${DEEPBOOK_PACKAGE}::balance_manager::deposit<${MOCK_USDC_TYPE}>" @${balanceManagerId} deposit_coin.0 \
            --move-call "${DEEPBOOK_PACKAGE}::balance_manager::generate_proof_as_owner" @${balanceManagerId} \
            --assign proof \
            --move-call "${DEEPBOOK_PACKAGE}::pool::place_limit_order<${SUI_TYPE},${MOCK_USDC_TYPE}>" \
                @${POOL_ID} \
                @${balanceManagerId} \
                proof.0 \
                1 \
                0 \
                0 \
                ${price} \
                ${quantity} \
                ${isBid} \
                false \
                ${expire} \
                @0x6 \
            --gas-budget 100000000 \
            --json`;
            
        const tradeRes = runCommandJSON(tradeCmd);
        
        if (tradeRes.effects.status.status !== 'success') {
            console.error("❌ Trade Failed!");
            console.error(JSON.stringify(tradeRes.effects.status, null, 2));
            process.exit(1);
        }
        
        console.log("✅ Order Placed Successfully!");
        console.log(`Digest: ${tradeRes.digest}`);
        
    } catch (e) {
        console.error("Failed:", e.message);
        process.exit(1);
    }
}

main();
