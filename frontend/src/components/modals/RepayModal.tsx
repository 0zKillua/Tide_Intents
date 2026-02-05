import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { X, Loader2 } from "lucide-react";
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { TIDE_CONFIG } from "@/tide_config";

interface RepayModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: any; 
}

export function RepayModal({ isOpen, onClose, loan }: RepayModalProps) {
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !loan) return null;

  // Extract Loan Data
  const fields = loan.content?.fields || loan; // handle structure differences
  const principal = parseInt(fields.principal) / 1e6;
  const rateBps = parseInt(fields.interest_rate_bps);
  const durationMs = parseInt(fields.duration_ms);

  
  // Calculate Interest (Simple Interest based on contract logic)
  // interest = (principal * rate_bps * duration_ms) / (10000 * 31536000000) ??
  // Let's look at math::calculate_interest in move, usually it's principal * rate * duration / scale
  // For frontend estimation, we'll try to match. Assuming rate is APR in bps.
  // Rate 500 = 5%. 
  // Interest = Principal * (Rate/10000) * (Duration/Year)
  const YEAR_MS = 31536000000;
  const interestRaw = (parseInt(fields.principal) * rateBps * durationMs) / (10000 * YEAR_MS);
  const interest = interestRaw / 1e6;
  
  const totalDue = principal + interest;
  const totalDueRaw = Math.ceil(parseInt(fields.principal) + interestRaw);

  const handleRepay = async () => {
    if (!currentAccount) return;
    setIsSubmitting(true);

    try {
      const tx = new Transaction();
      const packageId = TIDE_CONFIG.PACKAGE_ID;
      const usdcConfig = TIDE_CONFIG.COINS.USDC;
      const btcConfig = TIDE_CONFIG.COINS.BTC; // Assuming collateral is BTC for now, ideally dynamic
      
      // Fetch USDC
      const coins = await suiClient.getCoins({
        owner: currentAccount.address,
        coinType: usdcConfig.TYPE
      });
      
      if (!coins.data.length) throw new Error("No USDC found");
      
      const balance = coins.data.reduce((acc, c) => acc + parseInt(c.balance), 0);
      if (balance < totalDueRaw) throw new Error("Insufficient balance");
      
      const primaryCoin = coins.data[0];
      if (coins.data.length > 1) {
        tx.mergeCoins(tx.object(primaryCoin.coinObjectId), coins.data.slice(1).map(c => tx.object(c.coinObjectId)));
      }
      
      const [paymentCoin] = tx.splitCoins(tx.object(primaryCoin.coinObjectId), [totalDueRaw]);
      
      tx.moveCall({
         target: `${packageId}::loan::repay`,
         typeArguments: [usdcConfig.TYPE, btcConfig.TYPE], // Dynamic in real app
         arguments: [
             tx.object(loan.objectId),
             paymentCoin,
             tx.object("0x6") // Clock
         ]
      });

      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log(result);
            alert("Loan Repaid Successfully!");
            onClose();
          },
          onError: (e) => alert("Repay failed: " + e.message)
        }
      );

    } catch (e: any) {
        alert("Error: " + e.message);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="w-[400px] border-primary/50 relative">
        <Button variant="ghost" size="icon" className="absolute right-2 top-2 h-6 w-6" onClick={onClose}>
            <X className="h-4 w-4" />
        </Button>
        <CardHeader>
            <CardTitle>Repay Loan</CardTitle>
            <CardDescription>Pay back principal + interest to unlock collateral.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="p-4 bg-surface rounded border border-surface-hover space-y-2">
                <div className="flex justify-between">
                    <span className="text-gray-400">Principal</span>
                    <span className="text-white">{principal.toFixed(2)} USDC</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-400">Interest</span>
                    <span className="text-warning">+{interest.toFixed(4)} USDC</span>
                </div>
                <div className="h-px bg-gray-700 my-2" />
                <div className="flex justify-between font-bold">
                    <span className="text-gray-400">Total Due</span>
                    <span className="text-white">{totalDue.toFixed(4)} USDC</span>
                </div>
            </div>
        </CardContent>
        <CardFooter>
            <Button className="w-full bg-primary text-black hover:bg-primary/90" onClick={handleRepay} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : "Confirm Repayment"}
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
