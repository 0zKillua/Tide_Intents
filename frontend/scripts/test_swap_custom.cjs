/**
 * DeepBook Swap Verification Script
 * Tests SUI -> MOCK_USDC swap on the deployed DeepBook pool.
 * Uses CLI commands for reliability.
 * 
 * Run: node scripts/test_swap_custom.js
 */

const { execSync } = require('child_process');

// Config - Using CUSTOM deployed pool with MOCK_USDC
const TIDE_CONFIG = {
    DEEPBOOK: {
        // Package ID that created the custom pool
        PACKAGE_ID: "0xfb28c4cbc6865bd1c897d26aecbe1f8792d1509a20ffec692c800660cbec6982",
        // Custom SUI/MOCK_USDC pool deployed and seeded by user
        SUI_USDC_POOL: "0x25fa26d1d3125bc32c9665dae5505b96737c939d4ab79014b379ffee954684f4",
    },
    COINS: {
        // Custom MOCK_USDC from tide_tokens
        USDC: {
            TYPE: "0xef553a6b8a00ac9c00d7983a24e4ca9a9748dcad02f0ab31bb8c502583ab1d0a::mock_usdc::MOCK_USDC",
        },
        SUI: {
            TYPE: "0x2::sui::SUI",
        }
    }
};

// Testnet DEEP Token (NOT mainnet!)
const DEEP_TOKEN_TYPE = "0x36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8::deep::DEEP";

function runCommand(cmd) {
    try {
        console.log(`> ${cmd.substring(0, 80)}...`);
        const output = execSync(cmd, { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 });
        // Filter out warnings
        const lines = output.split('\n').filter(line => !line.startsWith('[warning]'));
        return lines.join('\n').trim();
    } catch (e) {
        console.error("Command failed:", e.stderr?.substring(0, 500) || e.message);
        throw e;
    }
}

function runCommandJSON(cmd) {
    const output = runCommand(cmd);
    return JSON.parse(output);
}

async function main() {
    console.log("=== DeepBook Swap Verification ===\n");

    // Get active address
    const activeAddress = runCommand('sui client active-address').trim();
    console.log(`Using Address: ${activeAddress}`);

    // Swap parameters (mimic RepayModal)
    const suiInputAmount = 1_050_000_000; // 1.05 SUI
    const minQuoteOut = 0; // No slippage protection for test

    console.log(`\n--- Swap Parameters ---`);
    console.log(`SUI Input: ${suiInputAmount / 1e9} SUI`);
    console.log(`Pool: ${TIDE_CONFIG.DEEPBOOK.SUI_USDC_POOL}\n`);

    // Build PTB command for swap
    // swap_exact_quantity<Base, Quote>(pool, base_in, quote_in, deep_in, min_out, clock)
    const cmd = `sui client ptb \\
        --split-coins gas [${suiInputAmount}] \\
        --assign sui_coin \\
        --move-call "0x2::coin::zero<${TIDE_CONFIG.COINS.USDC.TYPE}>" \\
        --assign usdc_empty \\
        --move-call "0x2::coin::zero<${DEEP_TOKEN_TYPE}>" \\
        --assign deep_empty \\
        --move-call "${TIDE_CONFIG.DEEPBOOK.PACKAGE_ID}::pool::swap_exact_quantity<${TIDE_CONFIG.COINS.SUI.TYPE},${TIDE_CONFIG.COINS.USDC.TYPE}>" \\
            @${TIDE_CONFIG.DEEPBOOK.SUI_USDC_POOL} \\
            sui_coin.0 \\
            usdc_empty.0 \\
            deep_empty.0 \\
            ${minQuoteOut} \\
            @0x6 \\
        --assign swap_result \\
        --transfer-objects "[swap_result.0, swap_result.1]" @${activeAddress} \\
        --move-call "0x2::coin::destroy_zero<${DEEP_TOKEN_TYPE}>" swap_result.2 \\
        --gas-budget 100000000 \\
        --json`;

    console.log("Executing swap transaction...\n");
    
    try {
        const result = runCommandJSON(cmd);

        if (result.effects?.status?.status === 'failure') {
            console.error("❌ Transaction FAILED");
            console.error("Error:", result.effects.status.error);
            return;
        }

        console.log("✅ Transaction Successful!");
        console.log("Digest:", result.digest);

        // Analyze balance changes
        console.log("\n--- Balance Changes ---");
        if (result.balanceChanges) {
            for (const change of result.balanceChanges) {
                const amt = parseInt(change.amount);
                if (change.coinType.includes("sui::SUI")) {
                    console.log(`SUI: ${(amt / 1e9).toFixed(6)}`);
                } else if (change.coinType.includes("MOCK_USDC")) {
                    console.log(`USDC: ${(amt / 1e6).toFixed(6)}`);
                    if (amt > 0) {
                        console.log(`\n✅ SUCCESS: Received ${amt / 1e6} USDC from swap!`);
                    } else {
                        console.log(`\n⚠️ No USDC received - pool may be empty or price mismatch`);
                    }
                }
            }
        }

    } catch (e) {
        console.error("\n❌ Swap failed. This indicates the DeepBook pool has issues.");
        console.error("Possible causes:");
        console.error("  1. Pool has no liquidity (no bids at the price level)");
        console.error("  2. Pool type mismatch (SUI/MOCK_USDC vs expected)");
        console.error("  3. Pool not properly seeded");
    }
}

main().catch(console.error);
