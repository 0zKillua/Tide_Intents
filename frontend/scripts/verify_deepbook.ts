
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { requestSuiFromFaucetV0 } from "@mysten/sui/faucet";

// Config copied from tide_config.ts to avoid alias issues
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

async function main() {
    console.log("Setting up client...");
    const client = new SuiClient({ url: getFullnodeUrl("testnet") });
    
    // Generate fresh keypair
    const keypair = Ed25519Keypair.generate();
    const address = keypair.toSuiAddress();
    console.log("Generated address:", address);
    
    // Fund it
    console.log("Requesting SUI from faucet...");
    try {
        await requestSuiFromFaucetV0({
            host: getFullnodeUrl("testnet"),
            recipient: address
        });
    } catch (e) {
        console.warn("Faucet request failed (might need retrying or manual funding if rate limited):", e);
    }

    // Wait for funds
    console.log("Waiting for funds...");
    let balance = 0;
    for (let i = 0; i < 10; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const coins = await client.getCoins({ owner: address, coinType: "0x2::sui::SUI" });
        if (coins.data.length > 0) {
            balance = parseInt(coins.data[0].balance);
            console.log("Balance:", balance);
            break;
        }
    }
    
    if (balance === 0) {
        console.error("No funds received. Exiting.");
        return;
    }

    // Attempt Swap: Swap 1 SUI for USDC
    console.log("Constructing Swap Transaction (1 SUI -> USDC)...");
    const tx = new Transaction();
    
    const suiAmount = 1_000_000_000; // 1 SUI
    const [coinIn] = tx.splitCoins(tx.gas, [tx.pure.u64(suiAmount)]);
    
    // Empty coins for DeepBook output
    const deepEmpty = tx.moveCall({
        target: '0x2::coin::zero',
        typeArguments: ['0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP'],
        arguments: []
    });
      
    const usdcEmpty = tx.moveCall({
        target: '0x2::coin::zero',
        typeArguments: [TIDE_CONFIG.COINS.USDC.TYPE],
        arguments: []
    });
    
    // Swap SUI -> USDC
    const [baseOut, quoteOut, deepOut] = tx.moveCall({
        target: `${TIDE_CONFIG.DEEPBOOK.PACKAGE_ID}::pool::swap_exact_quantity`,
        typeArguments: [TIDE_CONFIG.COINS.SUI.TYPE, TIDE_CONFIG.COINS.USDC.TYPE],
        arguments: [
            tx.object(TIDE_CONFIG.DEEPBOOK.SUI_USDC_POOL),
            coinIn,
            usdcEmpty,
            deepEmpty,
            tx.pure.u64(0), // min size
            tx.object("0x6"), // Clock
        ]
    });
    
    // Cleanup
    tx.transferObjects([baseOut, quoteOut], tx.pure.address(address));
    
    tx.moveCall({
        target: '0x2::coin::destroy_zero',
        typeArguments: ['0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP'],
        arguments: [deepOut]
    });
    
    console.log("Executing Transaction...");
    try {
        const result = await client.signAndExecuteTransaction({
            signer: keypair,
            transaction: tx,
            options: {
                showEffects: true,
                showEvents: true,
                showObjectChanges: true
            }
        });
        
        console.log("Transaction Status:", result.effects?.status.status);
        if (result.effects?.status.status === 'failure') {
            console.error("Failure Error:", result.effects.status.error);
        } else {
             console.log("Swap Successful!");
             console.log("Digest:", result.digest);
        }
        
    } catch (e: any) {
        console.error("Execution Failed:", e.message);
    }
}

main().catch(console.error);
