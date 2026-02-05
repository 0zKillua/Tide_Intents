const { execSync } = require('child_process');
const fs = require('fs');

function runCommand(cmd) {
    try {
        console.log(`> ${cmd}`);
        return execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' });
    } catch (e) {
        console.error(`Error running command: ${cmd}`);
        console.error(e.stderr || e.message);
        throw e;
    }
}

function main() {
    // 1. Load Config
    if (!fs.existsSync('deployed_config.json')) {
        throw new Error("deployed_config.json not found. Run setup_local.js first.");
    }
    const config = JSON.parse(fs.readFileSync('deployed_config.json', 'utf8'));
    console.log("Loaded Configuration:", config);

    const pkg = config.PACKAGE_ID;
    const activeAddress = runCommand('sui client active-address').trim();

    // 2. Discover Market ID (USDC-BTC)
    // We created it, but we need its ID. It's a shared object.
    // We can filter objects by type `Market<USDC, BTC>`
    console.log("\n--- Discovering Market ---");
    const marketType = `${pkg}::market::Market<${config.MOCK_USDC_TYPE}, ${config.MOCK_BTC_TYPE}>`;
    
    // Fetch objects
    const objsJson = runCommand(`sui client objects --json`);
    const objects = JSON.parse(objsJson);
    const marketObj = objects.find(o => o.type === marketType);
    
    if (!marketObj) {
        // Fallback: It might be because client objects only shows OWNED objects?
        // Ah, Markets are SHARED. `sui client objects` usually shows owned.
        // We might need to query via RPC if we can't find it. 
        // OR, we assume checking recent transaction effects from setup would be better, but we lost that context.
        // Let's try to infer if we can't find it easily. 
        // Actually, for this test, we can just proceed with creating *new* offers and matching them if we had the market ID.
        console.warn("Could not find Market object in owned list (expected for Shared Object).");
        console.warn("Attempting to find via dry-run creation or manual inspection? No, let's skip strict verify for now or fail.");
        // For the sake of the script, let's try to proceed by looking up the specific object ID if we can... 
        // Since we can't easily query shared objects by type via CLI without fullnode RPC search index...
        // We might be blocked on this specific step without the ID.
        
        // WORKAROUND: In setup_local.js, we should have saved the Market ID. 
        // Since we didn't, let's rely on the user or just create a NEW market for THIS test run?
        // No, let's create a new market right now and capture its ID.
        console.log("Creating a fresh Market for this test run to ensure we have the ID...");
        const createTx = runCommand(`sui client call --package ${pkg} --module market --function create_market --type-args ${config.MOCK_USDC_TYPE} ${config.MOCK_BTC_TYPE} --args ${config.ADMIN_CAP_ID} --gas-budget 100000000 --json`);
        const createRes = JSON.parse(createTx);
        const newMarket = createRes.objectChanges.find(o => o.objectType === marketType && o.type === 'created');
        if (!newMarket) throw new Error("Failed to create test market");
        config.MARKET_ID = newMarket.objectId;
        console.log(`Using Market ID: ${config.MARKET_ID}`);
    } else {
        config.MARKET_ID = marketObj.objectId.id;
    }

    // Helper to find a coin object or mint one
    function getCoinId(type, capId) {
        console.log(`Finding coin of type: ${type}`);
        const output = runCommand(`sui client objects --json`);
        const objects = JSON.parse(output);
        // Loose matching for spaces, with safety check
        const coin = objects.find(o => o.type && o.type.replace(/\s/g, '') === `0x2::coin::Coin<${type}>`);
        
        if (coin) {
            console.log(`Found existing coin: ${coin.objectId}`);
            return coin.objectId;
        }

        console.log(`No coin found for ${type}. Minting new one...`);
        // We know the module name from the type: pkg::mock_usdc::MOCK_USDC -> mock_usdc
        // Extract module name
        const parts = type.split('::');
        const moduleName = parts[1]; // mock_usdc
        const funcName = `mint_${moduleName.split('_')[1]}`; // mint_usdc, mint_btc

        // Construct mint call
        // Args: registry (Oh wait, we removed registry and made Caps shared public)
        // Correct: The caps are shared. Function is tide::mock_usdc::init? No.
        // The Mocks use `public_share_object(cap)`. 
        // We need to call `sui::coin::mint_and_transfer` using the Shared TreasuryCap!
        const cmd = `sui client call --package 0x2 --module coin --function mint_and_transfer --type-args ${type} --args ${capId} 1000000000 ${activeAddress} --gas-budget 100000000 --json`;
        const resJson = runCommand(cmd);
        const res = JSON.parse(resJson);
        
        // Find the new object
        const newCoin = res.objectChanges.find(o => o.type === 'created' && o.objectType.replace(/\s/g, '').includes(`Coin<${type}>`));
        if (!newCoin) throw new Error(`Failed to mint coin for ${type}`);
        console.log(`Minted new coin: ${newCoin.objectId}`);
        return newCoin.objectId;
    }

    const usdcCoinId = getCoinId(config.MOCK_USDC_TYPE, config.USDC_CAP_ID);
    const btcCoinId = getCoinId(config.MOCK_BTC_TYPE, config.BTC_CAP_ID);
    console.log(`Using USDC Coin: ${usdcCoinId}`);
    console.log(`Using BTC Coin: ${btcCoinId}`);

    // 3. User A (Lender) creates LendOffer
    console.log("\n--- Step 1: Create Lend Offer (User A) ---");
    // Function: create_lend_offer(payment, min_rate, max_ltv, max_dur, min_fill, partial_fill, market_id, clock)
    // Args: Coin, 500bps, 8000bps, 30days, 0 min fill, true partial, marketid, clock
    const offerTx = runCommand(`sui client call --package ${pkg} --module intents --function create_lend_offer --type-args ${config.MOCK_USDC_TYPE} --args ${usdcCoinId} 500 8000 2592000000 0 true ${config.MARKET_ID} 0x6 --gas-budget 100000000 --json`);
    const offerRes = JSON.parse(offerTx);
    const offerObj = offerRes.objectChanges.find(o => o.objectType.includes('::intents::LendOffer') && o.type === 'created');
    console.log(`Lend Offer Created: ${offerObj.objectId}`);

    // 4. User B (Borrower) creates BorrowRequest
    console.log("\n--- Step 2: Create Borrow Request (User B) ---");
    // Function: create_borrow_request(collateral, req_amount, max_rate, min_ltv, commission, duration, market_id, clock)
    // Args: BTC, 1000 USDC, 600bps, 6000bps, 10bps, 10days, marketid, clock
    const requestTx = runCommand(`sui client call --package ${pkg} --module intents --function create_borrow_request --type-args ${config.MOCK_USDC_TYPE} ${config.MOCK_BTC_TYPE} --args ${btcCoinId} 1000000000 600 6000 10 864000000 ${config.MARKET_ID} 0x6 --gas-budget 100000000 --json`);
    const requestRes = JSON.parse(requestTx);
    const requestObj = requestRes.objectChanges.find(o => o.objectType.includes('::intents::BorrowRequest') && o.type === 'created');
    console.log(`Borrow Request Created: ${requestObj.objectId}`);

    // 5. Match Intents
    console.log("\n--- Step 3: Match Intents (Matcher) ---");
    // Function: match_intents(offer, request, clock)
    const matchTx = runCommand(`sui client call --package ${pkg} --module matcher --function match_intents --type-args ${config.MOCK_USDC_TYPE} ${config.MOCK_BTC_TYPE} --args ${offerObj.objectId} ${requestObj.objectId} 0x6 --gas-budget 100000000 --json`);
    const matchRes = JSON.parse(matchTx);
    
    // Check for Loan Creation
    const loanObj = matchRes.objectChanges.find(o => o.objectType.includes('::loan::Loan') && o.type === 'created');
    if (loanObj) {
        console.log(`SUCCESS: Loan Created: ${loanObj.objectId}`);
    } else {
        console.error("FAILURE: No Loan object created.");
        console.log(JSON.stringify(matchRes, null, 2));
    }

    console.log("\nE2E Flow Finished.");
}

main();
