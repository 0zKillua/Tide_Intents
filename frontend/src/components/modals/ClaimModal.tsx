import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { TransactionPendingOverlay } from "@/components/ui/TransactionPendingOverlay";
import { X, Loader2, CheckCircle2 } from "lucide-react";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { TIDE_CONFIG } from "@/tide_config";

interface ClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: any; 
}

export function ClaimModal({ isOpen, onClose, note }: ClaimModalProps) {
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const [txStatus, setTxStatus] = useState<"pending" | "success" | "error" | "idle">("idle");
  const [txMessage, setTxMessage] = useState("");
  
  // Auto-close success
  useEffect(() => {
    if (txStatus === "success") {
        const t = setTimeout(() => {
            setTxStatus("idle");
            onClose();
        }, 2000);
        return () => clearTimeout(t);
    }
  }, [txStatus, onClose]);

  if (!isOpen || !note) return null;

  // Extract Note Data
  const fields = note.content?.fields || note;
  const principal = parseInt(fields.principal) / 1e6;
  const rateBps = parseInt(fields.interest_rate_bps);
  const loanId = fields.loan_id?.id || fields.loan_id;

  // We don't know exact total claimable without checking the Loan object state for `repaid_funds`
  // But we can estimate it's at least Principal.
  // In a real app, we'd fetch the Loan object here to show exact amounts.
  
  const handleClaim = async () => {
    if (!currentAccount) return;
    setTxStatus("pending");
    setTxMessage("Claiming funds...");

    try {
      const tx = new Transaction();
      const packageId = TIDE_CONFIG.PACKAGE_ID;
      const usdcConfig = TIDE_CONFIG.COINS.USDC;
      const suiConfig = TIDE_CONFIG.COINS.SUI; // Collateral is SUI
      
      tx.moveCall({
         target: `${packageId}::loan::claim`,
         typeArguments: [usdcConfig.TYPE, suiConfig.TYPE],
         arguments: [
             tx.object(loanId), // The Loan Object (Shared)
             tx.object(note.objectId) // The Note Object (Owned)
         ]
      });

      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log(result);
            setTxStatus("success");
            setTxMessage("Funds Claimed Successfully!");
          },
          onError: (e) => {
             setTxStatus("error");
             setTxMessage("Claim failed: " + e.message);
          }
        }
      );

    } catch (e: any) {
        setTxStatus("error");
        setTxMessage("Error: " + e.message);
    } 
  };

  return (
    <>
    <TransactionPendingOverlay 
        isVisible={txStatus !== "idle"} 
        status={txStatus === "idle" ? "pending" : txStatus}
        message={txMessage} 
        onClose={() => setTxStatus("idle")}
    />
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="w-[400px] border-success/50 relative">
        <Button variant="ghost" size="icon" className="absolute right-2 top-2 h-6 w-6" onClick={onClose}>
            <X className="h-4 w-4" />
        </Button>
        <CardHeader>
            <CardTitle>Claim Repayment</CardTitle>
            <CardDescription>Withdraw your principal and earned interest.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex flex-col items-center justify-center p-6 bg-success/10 rounded-lg border border-success/20 text-success space-y-2">
                <CheckCircle2 className="h-10 w-10" />
                <p className="font-medium">Loan Repaid</p>
            </div>
            
            <div className="p-4 bg-surface rounded border border-surface-hover space-y-2">
                <div className="flex justify-between">
                    <span className="text-gray-400">Principal Lent</span>
                    <span className="text-white">{principal.toFixed(2)} USDC</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-400">Interest Rate</span>
                    <span className="text-success">{(rateBps/100).toFixed(2)}% APR</span>
                </div>
            </div>
        </CardContent>
        <CardFooter>
            <Button className="w-full bg-success text-black hover:bg-success/90" onClick={handleClaim} disabled={txStatus !== "idle"}>
                {txStatus === "pending" ? <Loader2 className="animate-spin" /> : "Claim Funds"}
            </Button>
        </CardFooter>
      </Card>
    </div>
    </>
  );
}
