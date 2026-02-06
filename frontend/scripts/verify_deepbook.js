
import * as Client from "@mysten/sui/client";
import * as Transactions from "@mysten/sui/transactions";
import * as Keypairs from "@mysten/sui/keypairs/ed25519";
import * as Faucet from "@mysten/sui/faucet";

console.log("Client Exports:", Object.keys(Client));

// Use CoreClient as found in exports
const { CoreClient } = Client;
const { Transaction } = Transactions;
const { Ed25519Keypair } = Keypairs;
const { requestSuiFromFaucetV0 } = Faucet;

const TESTNET_URL = "https://fullnode.testnet.sui.io:443";

async function main() {
    console.log("Setting up client...");
    const client = new CoreClient({ url: TESTNET_URL });
    
    // Generate fresh keypair
    const keypair = Ed25519Keypair.generate();
    const address = keypair.toSuiAddress();
    console.log("Generated address:", address);
    
    // Fund it
    console.log("Requesting SUI from faucet...");
    try {
        await requestSuiFromFaucetV0({
            host: "https://faucet.testnet.sui.io", 
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
        // Use client.getCoins if available, or try to find alternative
        try {
             // Inspect client prototype to find getCoins equivalent if different
             const coins = await client.getCoins({ owner: address, coinType: "0x2::sui::SUI" });
             if (coins.data.length > 0) {
                balance = parseInt(coins.data[0].balance);
                console.log("Balance:", balance);
                break;
            }
        } catch(e) {
            console.log("Error checking balance:", e.message);
            // Fallback checking balance via getBalance if getCoins fails?
            // client.getBalance({ owner: address })
        }
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

    // Attempt Swap: Swap 0.1 SUI for USDC
    console.log("Constructing Swap Transaction (0.1 SUI -> USDC)...");
    const tx = new Transaction();
    
    const suiAmount = 100_000_000; // 0.1 SUI
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
            coinIn,     // base_in (SUI)
            usdcEmpty,  // quote_in (USDC - 0)
            deepEmpty,  // deep_in (DEEP - 0)
            tx.pure.u64(0), // min_quote_out
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
            console.error("Failure Error:", JSON.stringify(result.effects?.status.error, null, 2));
        } else {
             console.log("Swap Successful!");
             console.log("Digest:", result.digest);
        }
        
    } catch (e) {
        console.error("Execution Failed:", e.message);
    }
}

main().catch(console.error);
