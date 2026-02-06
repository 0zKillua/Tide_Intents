/**
 * DeepBook Swap Verification Script
 * Tests the SUI -> MOCK_USDC swap on the deployed DeepBook pool.
 * This mimics the logic used in RepayModal for "Repay with Collateral".
 * 
 * Run: npx ts-node scripts/test_swap_custom.ts
 */

import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { requestSuiFromFaucetV0 } from "@mysten/sui/faucet";

// Config matching tide_config.ts
const TIDE_CONFIG = {
    PACKAGE_ID: "0x2b7ded2926ca0fb9c603a993642e51cf395c43eae693b59ee8c37ada6f222981",
    DEEPBOOK: {
        PACKAGE_ID: "0xbc331f09e5c737d45f074ad2d17c3038421b3b9018699e370d88d94938c53d28",
        SUI_USDC_POOL: "0x25fa26d1d3125bc32c9665dae5505b96737c939d4ab79014b379ffee954684f4",
    },
    COINS: {
        USDC: {
            TYPE: "0xef553a6b8a00ac9c00d7983a24e4ca9a9748dcad02f0ab31bb8c502583ab1d0a::mock_usdc::MOCK_USDC",
            DECIMALS: 6,
        },
        SUI: {
            TYPE: "0x2::sui::SUI",
            DECIMALS: 9,
        }
    }
};

const DEEP_TOKEN_TYPE = "0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP";

async function main() {
    console.log("=== DeepBook Swap Verification ===\n");
    
    const client = new SuiClient({ url: getFullnodeUrl("testnet") });

    // 1. Setup wallet
    const keypair = Ed25519Keypair.generate();
    const address = keypair.toSuiAddress();
    console.log(`Generated Test Address: ${address}`);

    // 2. Fund wallet via faucet
    console.log("Requesting SUI from faucet...");
    try {
        await requestSuiFromFaucetV0({
            host: getFullnodeUrl("testnet"),
            recipient: address
        });
    } catch (e: any) {
        console.warn("Faucet error (may be rate limited):", e.message || e);
    }

    // Wait for funds
    console.log("Waiting for funds...");
    let balance = 0;
    for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const coins = await client.getCoins({ owner: address, coinType: "0x2::sui::SUI" });
        if (coins.data.length > 0) {
            balance = parseInt(coins.data[0].balance);
            if (balance > 0) {
                console.log(`✅ Balance: ${(balance / 1e9).toFixed(4)} SUI`);
                break;
            }
        }
    }

    if (balance === 0) {
        console.error("❌ No funds received. Exiting.");
        return;
    }

    // 3. Prepare swap parameters (mimic RepayModal)
    // Scenario: Repay 1 USDC debt, with 5% buffer
    const usdcNeeded = 1_000_000; // 1 USDC
    const suiInputAmount = 1_050_000_000; // 1.05 SUI (5% buffer)

    console.log(`\n--- Swap Parameters ---`);
    console.log(`Debt to Repay: ${usdcNeeded / 1e6} USDC`);
    console.log(`SUI to Swap: ${suiInputAmount / 1e9} SUI (includes 5% buffer)`);
    console.log(`Pool: ${TIDE_CONFIG.DEEPBOOK.SUI_USDC_POOL}\n`);

    // 4. Build transaction
    const tx = new Transaction();

    // Split SUI from gas
    const [coinIn] = tx.splitCoins(tx.gas, [tx.pure.u64(suiInputAmount)]);

    // Create empty coins for DeepBook
    const deepEmpty = tx.moveCall({
        target: "0x2::coin::zero",
        typeArguments: [DEEP_TOKEN_TYPE],
        arguments: []
    });

    const usdcEmpty = tx.moveCall({
        target: "0x2::coin::zero",
        typeArguments: [TIDE_CONFIG.COINS.USDC.TYPE],
        arguments: []
    });

    // Call swap_exact_quantity: swap SUI -> USDC
    const [baseOut, quoteOut, deepOut] = tx.moveCall({
        target: `${TIDE_CONFIG.DEEPBOOK.PACKAGE_ID}::pool::swap_exact_quantity`,
        typeArguments: [TIDE_CONFIG.COINS.SUI.TYPE, TIDE_CONFIG.COINS.USDC.TYPE],
        arguments: [
            tx.object(TIDE_CONFIG.DEEPBOOK.SUI_USDC_POOL),
            coinIn,          // base_in (SUI)
            usdcEmpty,       // quote_in (empty)
            deepEmpty,       // deep_in (empty)
            tx.pure.u64(0),  // min_quote_out (0 for testing - no slippage protection)
            tx.object("0x6"), // Clock
        ]
    });

    // Transfer outputs back to user
    tx.transferObjects([baseOut, quoteOut], tx.pure.address(address));

    // Cleanup unused DEEP coin
    tx.moveCall({
        target: "0x2::coin::destroy_zero",
        typeArguments: [DEEP_TOKEN_TYPE],
        arguments: [deepOut]
    });

    // 5. Execute
    console.log("Executing swap transaction...\n");
    try {
        const result = await client.signAndExecuteTransaction({
            signer: keypair,
            transaction: tx,
            options: {
                showEffects: true,
                showEvents: true,
                showBalanceChanges: true,
            }
        });

        if (result.effects?.status.status === "failure") {
            console.error("❌ Transaction FAILED");
            console.error("Error:", result.effects.status.error);
            return;
        }

        console.log("✅ Transaction Successful!");
        console.log("Digest:", result.digest);

        // Analyze results
        console.log("\n--- Balance Changes ---");
        if (result.balanceChanges) {
            for (const change of result.balanceChanges) {
                const amt = parseInt(change.amount);
                if (change.coinType.includes("sui::SUI")) {
                    console.log(`SUI: ${(amt / 1e9).toFixed(6)}`);
                } else if (change.coinType.includes("MOCK_USDC")) {
                    console.log(`USDC: ${(amt / 1e6).toFixed(6)}`);
                    
                    if (amt >= usdcNeeded) {
                        console.log(`\n✅ SUCCESS: Received enough USDC to repay debt!`);
                    } else if (amt > 0) {
                        console.log(`\n⚠️ WARNING: Received ${amt / 1e6} USDC, but needed ${usdcNeeded / 1e6} USDC`);
                    } else {
                        console.log(`\n❌ ERROR: No USDC received!`);
                    }
                }
            }
        } else {
            console.log("No balance changes found");
        }

    } catch (e: any) {
        console.error("❌ Execution Exception:", e.message);
        if (e.cause) {
            console.error("Cause:", e.cause);
        }
    }
}

main().catch(console.error);
