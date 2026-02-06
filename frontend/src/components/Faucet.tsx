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

  console.log("Current Application Network:", network);

  const isLocal = network === 'local' || network === 'testnet';
  
  const client = useSuiClientContext().client;

  const mintUSDC = async () => {
    if (!currentAccount) {
        alert("Connect wallet first!");
        return;
    }
    
    if (!isLocal) {
        alert(`Wrong Network (${network}). Please switch your Wallet to "Testnet".`);
        return;
    }

    const config = TIDE_CONFIG.COINS.USDC;
    const amount = 1000 * 1e6; // 1000 USDC

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
              alert("Successfully minted 1,000 USDC!");
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
                <CardTitle className="text-lg">Testnet Faucet</CardTitle>
                <CardDescription>Mint USDC test tokens (Get SUI from Sui Faucet)</CardDescription>
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
        <Button variant="outline" onClick={mintUSDC} disabled={!isLocal}>
          Mint 1,000 USDC
        </Button>
      </CardContent>
    </Card>
  );
}

