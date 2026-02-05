import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSignAndExecuteTransaction, useCurrentAccount, useSuiClientContext } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { TIDE_CONFIG } from "@/tide_config";
import { AlertTriangle } from "lucide-react";

export function Faucet() {
  const currentAccount = useCurrentAccount();
  const { network } = useSuiClientContext();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  // Debugging log
  console.log("Current Application Network:", network);

  const isLocal = network === 'local' || network === 'testnet'; // Allow testnet too
  
  // Use client to manually inspect the object first
  const client = useSuiClientContext().client;

  const mintToken = async (symbol: "USDC" | "BTC") => {
    if (!currentAccount) {
        alert("Connect wallet first!");
        return;
    }
    
    // We allow non-local for now just to see errors if any, but alert persists
    if (!isLocal) {
        alert(`Wrong Network (${network}). Please switch your Phantom Wallet to "Testnet" or "Local".`);
        return;
    }

    const config = symbol === "USDC" ? TIDE_CONFIG.COINS.USDC : TIDE_CONFIG.COINS.BTC;
    const amount = symbol === "USDC" ? 1000 * 1e6 : 1 * 1e8; // 1000 USDC or 1 BTC

    try {
        console.log(`Fetching Treasury Cap: ${config.TREASURY_CAP}...`);
        const objectInfo = await client.getObject({
            id: config.TREASURY_CAP,
            options: { showOwner: true }
        });
        console.log("Treasury Cap Info:", objectInfo);
        
        if (objectInfo.error) {
            throw new Error(`Object Fetch Failed: ${objectInfo.error.code}`);
        }
        
        const owner = objectInfo.data?.owner;
        if (owner && typeof owner === 'object' && 'Shared' in owner) {
             console.log("Confirmed Shared Object. Initial Version:", owner.Shared.initial_shared_version);
        } else {
             console.warn("WARNING: Object is NOT shared!", owner);
        }

        const initialSharedVersion = (owner as any)?.Shared?.initial_shared_version;
        
        const tx = new Transaction();
        
        // Construct the argument explicitly based on object type
        let treasuryArg;
        if (initialSharedVersion) {
            treasuryArg = tx.sharedObjectRef({
                objectId: config.TREASURY_CAP,
                initialSharedVersion: initialSharedVersion,
                mutable: true
            });
        } else {
            treasuryArg = tx.object(config.TREASURY_CAP);
        }

        // Call sui::coin::mint_and_transfer(treasury_cap, amount, recipient)
        tx.moveCall({
          target: "0x2::coin::mint_and_transfer",
          typeArguments: [config.TYPE],
          arguments: [
            treasuryArg,
            tx.pure.u64(amount),
            tx.pure.address(currentAccount.address),
          ],
        });

        signAndExecuteTransaction(
          { transaction: tx },
          {
            onSuccess: (result: any) => {
              console.log("Minted!", result);
              alert(`Successfully minted ${symbol}!`);
            },
            onError: (err: any) => {
              console.error("Mint failed", err);
              alert(`Mint failed: ${err.message || JSON.stringify(err)}`);
            }
          }
        );
    } catch (e: any) {
        console.error("Setup Check Failed:", e);
        alert(`Setup Check Failed: ${e.message}`);
    }
  };

  return (
    <Card className="bg-surface/50 border-surface-hover mb-6">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="text-lg">Devnet Faucet</CardTitle>
                <CardDescription>Mint test tokens for local development</CardDescription>
            </div>
            {!isLocal && (
                <div className="flex items-center gap-2 text-warning bg-warning/10 px-3 py-1 rounded-md border border-warning/20">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-xs font-bold">Wrong Network: {network}</span>
                </div>
            )}
        </div>
      </CardHeader>
      <CardContent className="flex gap-4">
        <Button variant="outline" onClick={() => mintToken("USDC")} disabled={!isLocal}>
          Mint 1,000 USDC
        </Button>
        <Button variant="outline" onClick={() => mintToken("BTC")} disabled={!isLocal}>
          Mint 1 BTC
        </Button>
      </CardContent>
    </Card>
  );
}
