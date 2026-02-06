/**
 * Test Collateral Repayment Flow
 * Simulates exact frontend transaction to find the error
 */

const { execSync } = require('child_process');

// Config
const PACKAGE_ID = "0x2b7ded2926ca0fb9c603a993642e51cf395c43eae693b59ee8c37ada6f222981";
const LOAN_ID = "0x0a431fc02afd807e0730d5e5b2dc252888b3dde6d2a82f4f92245fbfafe1c1f4";
const USDC_TYPE = "0xef553a6b8a00ac9c00d7983a24e4ca9a9748dcad02f0ab31bb8c502583ab1d0a::mock_usdc::MOCK_USDC";
const SUI_TYPE = "0x2::sui::SUI";
const DEEPBOOK_PACKAGE = "0xfb28c4cbc6865bd1c897d26aecbe1f8792d1509a20ffec692c800660cbec6982";
const POOL_ID = "0x25fa26d1d3125bc32c9665dae5505b96737c939d4ab79014b379ffee954684f4";
const DEEP_TYPE = "0x36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8::deep::DEEP";

// Amounts (matching frontend - from screenshot 10.04 USDC * 1.05 buffer)
const SUI_NEEDED = 10543200000; // ~10.54 SUI
const TOTAL_DEBT = 10041096; // ~10.04 USDC

function run(cmd) {
    console.log(`> ${cmd.substring(0, 100)}...`);
    try {
        return execSync(cmd, { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 });
    } catch (e) {
        console.error("Command failed:", e.stderr?.substring(0, 1000) || e.message);
        throw e;
    }
}

async function main() {
    console.log("=== Testing Collateral Repayment ===\n");
    
    const address = run('sui client active-address').trim().replace(/\[warning\].*\n?/g, '').trim();
    console.log("Address:", address);
    
    // Get DEEP coin with largest balance
    const deepCoinsRaw = run(`sui client objects --json 2>/dev/null | jq '[.[] | select(.data.content.type | contains("${DEEP_TYPE}"))]'`);
    const deepCoins = JSON.parse(deepCoinsRaw);
    if (!deepCoins.length) {
        console.error("No DEEP tokens found!");
        return;
    }
    
    // Sort by balance descending
    deepCoins.sort((a, b) => parseInt(b.data.content.fields.balance) - parseInt(a.data.content.fields.balance));
    
    const DEEP_COIN = deepCoins[0].data.objectId;
    const DEEP_BALANCE = deepCoins[0].data.content.fields.balance;
    console.log(`Using DEEP Coin: ${DEEP_COIN} (Balance: ${DEEP_BALANCE})`);
    
    // Use 10 DEEP (10,000,000) for fees to be safe
    const DEEP_FEE_AMOUNT = 10000000;

    // Build the full transaction as a PTB
    // This mirrors exactly what RepayModal.tsx does
    const cmd = `sui client ptb --dry-run \\
        --move-call "${PACKAGE_ID}::loan::start_collateral_repayment<${USDC_TYPE},${SUI_TYPE}>" \\
            @${LOAN_ID} ${SUI_NEEDED} \\
        --assign start_result \\
        --move-call "0x2::coin::zero<${USDC_TYPE}>" \\
        --assign usdc_empty \\
        --split-coins @${DEEP_COIN} "[${DEEP_FEE_AMOUNT}]" \\
        --assign deep_split \\
        --move-call "${DEEPBOOK_PACKAGE}::pool::swap_exact_quantity<${SUI_TYPE},${USDC_TYPE}>" \\
            @${POOL_ID} \\
            start_result.0 \\
            usdc_empty.0 \\
            deep_split.0 \\
            ${TOTAL_DEBT} \\
            @0x6 \\
        --assign swap_result \\
        --move-call "${PACKAGE_ID}::loan::finish_collateral_repayment<${USDC_TYPE},${SUI_TYPE}>" \\
            @${LOAN_ID} \\
            start_result.1 \\
            swap_result.1 \\
        --transfer-objects "[swap_result.0, swap_result.2]" @${address} \\
        --gas-budget 100000000`;
    
    console.log("\nExecuting dry run...\n");
    try {
        const output = run(cmd);
        console.log(output);
    } catch (e) {
        console.log("\n=== ANALYZING ERROR ===");
        // The error is in the exception
    }
}

main();
