import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { TransactionPendingOverlay } from "@/components/ui/TransactionPendingOverlay";
import { X, Loader2, ArrowRightLeft, Wallet } from "lucide-react";
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
  const [txStatus, setTxStatus] = useState<"pending" | "success" | "error" | "idle">("idle");
  const [txMessage, setTxMessage] = useState("");
  const [useCollateral, setUseCollateral] = useState(false);

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

  if (!isOpen || !loan) return null;

  // Extract Loan Data
  const fields = loan.content?.fields || loan;
  const principal = parseInt(fields.principal) / 1e6;
  const rateBps = parseInt(fields.interest_rate_bps);
  const durationMs = parseInt(fields.duration_ms);
  const collateralRaw = parseInt(fields.collateral?.fields?.value || fields.collateral?.value || fields.collateral || '0');
  const collateral = collateralRaw / 1e9; // SUI has 9 decimals

  // Calculate Interest
  const YEAR_MS = 31536000000;
  const interestRaw = (parseInt(fields.principal) * rateBps * durationMs) / (10000 * YEAR_MS);
  const interest = interestRaw / 1e6;
  
  const totalDue = principal + interest;
  const totalDueRaw = Math.ceil(parseInt(fields.principal) + interestRaw);

  // For collateral repay: estimate SUI needed (1:1 rate for hackathon)
  // Add 5% buffer for slippage
  const suiNeededRaw = Math.ceil(totalDueRaw * 1000 * 1.05); // Convert USDC (6 dec) to SUI (9 dec) at 1:1
  const suiNeeded = suiNeededRaw / 1e9;

  const handleRepayWithUSDC = async () => {
    if (!currentAccount) return;
    setTxStatus("pending");
    setTxMessage("Repaying loan with USDC...");

    try {
      const tx = new Transaction();
      const packageId = TIDE_CONFIG.PACKAGE_ID;
      const usdcConfig = TIDE_CONFIG.COINS.USDC;
      const suiConfig = TIDE_CONFIG.COINS.SUI;
      
      // Fetch USDC
      const coins = await suiClient.getCoins({
        owner: currentAccount.address,
        coinType: usdcConfig.TYPE
      });
      
      if (!coins.data.length) throw new Error("No USDC found");
      
      const balance = coins.data.reduce((acc, c) => acc + parseInt(c.balance), 0);
      if (balance < totalDueRaw) throw new Error("Insufficient USDC balance");
      
      const primaryCoin = coins.data[0];
      if (coins.data.length > 1) {
        tx.mergeCoins(tx.object(primaryCoin.coinObjectId), coins.data.slice(1).map(c => tx.object(c.coinObjectId)));
      }
      
      const [paymentCoin] = tx.splitCoins(tx.object(primaryCoin.coinObjectId), [totalDueRaw]);
      
      tx.moveCall({
         target: `${packageId}::loan::repay`,
         typeArguments: [usdcConfig.TYPE, suiConfig.TYPE],
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
            setTxStatus("success");
            setTxMessage("Loan Repaid Successfully!");
          },
          onError: (e) => {
            setTxStatus("error");
            setTxMessage("Repay failed: " + e.message);
          }
        }
      );

    } catch (e: any) {
        setTxStatus("error");
        setTxMessage("Error: " + e.message);
    } 
  };

  const handleRepayWithCollateral = async () => {
    if (!currentAccount) return;
    setTxStatus("pending");
    setTxMessage("Swapping collateral & repaying...");

    try {
      const tx = new Transaction();
      const packageId = TIDE_CONFIG.PACKAGE_ID;
      const usdcConfig = TIDE_CONFIG.COINS.USDC;
      const suiConfig = TIDE_CONFIG.COINS.SUI;
      const deepbookConfig = TIDE_CONFIG.DEEPBOOK;
      
      // Step 1: Start collateral repayment (get SUI + FlashReceipt)
      const [suiCoin, receipt] = tx.moveCall({
        target: `${packageId}::loan::start_collateral_repayment`,
        typeArguments: [usdcConfig.TYPE, suiConfig.TYPE],
        arguments: [
          tx.object(loan.objectId),
          tx.pure.u64(suiNeededRaw), // Amount of SUI to withdraw
        ]
      });
      
      // Step 2: Swap SUI -> USDC via DeepBook
      // Get DEEP tokens from user's wallet for swap fees
      const deepTokenType = deepbookConfig.DEEP_TOKEN_TYPE;
      const deepCoins = await suiClient.getCoins({
        owner: currentAccount.address,
        coinType: deepTokenType
      });
      
      let deepCoin;
      if (deepCoins.data.length > 0) {
        // Sort by balance descending to pick the largest coin first
        const sortedDeepCoins = [...deepCoins.data].sort(
          (a, b) => parseInt(b.balance) - parseInt(a.balance)
        );
        const primaryDeep = sortedDeepCoins[0];
        
        // Merge other coins into the primary (largest) one
        if (sortedDeepCoins.length > 1) {
          tx.mergeCoins(tx.object(primaryDeep.coinObjectId), 
            sortedDeepCoins.slice(1).map(c => tx.object(c.coinObjectId)));
        }
        
        // Calculate fee amount - use what's available, fees are typically small
        const deepBalance = sortedDeepCoins.reduce((acc, c) => acc + parseInt(c.balance), 0);
        const feeAmount = Math.min(deepBalance, 1000000); // 1 DEEP max (actual fees ~0.4 DEEP)
        [deepCoin] = tx.splitCoins(tx.object(primaryDeep.coinObjectId), [feeAmount]);
      } else {
        // No DEEP tokens - create empty coin (will fail if fees required)
        deepCoin = tx.moveCall({
          target: '0x2::coin::zero',
          typeArguments: [deepTokenType],
          arguments: []
        });
      }
      
      const usdcEmpty = tx.moveCall({
        target: '0x2::coin::zero',
        typeArguments: [usdcConfig.TYPE],
        arguments: []
      });
      
      // DeepBook swap_exact_quantity returns (base_out, quote_out, deep_out)
      const [suiRemainder, usdcProceeds, deepOut] = tx.moveCall({
        target: `${deepbookConfig.PACKAGE_ID}::pool::swap_exact_quantity`,
        typeArguments: [suiConfig.TYPE, usdcConfig.TYPE],
        arguments: [
          tx.object(deepbookConfig.SUI_USDC_POOL),
          suiCoin,
          usdcEmpty,
          deepCoin,
          tx.pure.u64(totalDueRaw), // min_quote_out: at least what we owe
          tx.object("0x6"), // Clock
        ]
      });
      
      // Transfer remaining DEEP back to user (if any)
      tx.transferObjects([deepOut], currentAccount.address);
      
      // Step 3: Finish collateral repayment with USDC proceeds
      tx.moveCall({
        target: `${packageId}::loan::finish_collateral_repayment`,
        typeArguments: [usdcConfig.TYPE, suiConfig.TYPE],
        arguments: [
          tx.object(loan.objectId),
          receipt,
          usdcProceeds,
        ]
      });
      
      // Transfer any remaining SUI back to user
      tx.transferObjects([suiRemainder], currentAccount.address);

      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log(result);
            setTxStatus("success");
            setTxMessage("Loan Repaid with Collateral Successfully!");
          },
          onError: (e) => {
             setTxStatus("error");
             setTxMessage("Collateral Repay failed: " + e.message);
          }
        }
      );

    } catch (e: any) {
        console.error(e);
        setTxStatus("error");
        setTxMessage("Error: " + e.message);
    } 
  };

  const handleRepay = useCollateral ? handleRepayWithCollateral : handleRepayWithUSDC;

  return (
    <>
    <TransactionPendingOverlay 
        isVisible={txStatus !== "idle"} 
        status={txStatus === "idle" ? "pending" : txStatus}
        message={txMessage} 
        onClose={() => setTxStatus("idle")}
    />
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="w-[420px] border-primary/50 relative">
        <Button variant="ghost" size="icon" className="absolute right-2 top-2 h-6 w-6" onClick={onClose}>
            <X className="h-4 w-4" />
        </Button>
        <CardHeader>
            <CardTitle>Repay Loan</CardTitle>
            <CardDescription>Pay back principal + interest to unlock collateral.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            {/* Repay Method Toggle */}
            <div className="flex gap-2 p-1 bg-surface rounded-lg">
              <button
                onClick={() => setUseCollateral(false)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  !useCollateral 
                    ? 'bg-primary text-black' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Wallet className="w-4 h-4" />
                Pay with USDC
              </button>
              <button
                onClick={() => setUseCollateral(true)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  useCollateral 
                    ? 'bg-primary text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <ArrowRightLeft className="w-4 h-4" />
                Use Collateral
              </button>
            </div>

            {/* Loan Details */}
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

            {/* Collateral Info (when using collateral) */}
            {useCollateral && (
              <div className="p-4 bg-secondary/10 rounded border border-secondary/30 space-y-2">
                <div className="flex items-center gap-2 text-secondary text-sm font-medium mb-2">
                  <ArrowRightLeft className="w-4 h-4" />
                  DeepBook Atomic Swap
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Your Collateral</span>
                    <span className="text-white">{collateral.toFixed(4)} SUI</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-400">SUI to Swap (~5% buffer)</span>
                    <span className="text-secondary">{suiNeeded.toFixed(4)} SUI</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Your SUI collateral will be swapped for USDC via DeepBook and used to repay the loan automatically.
                </p>
              </div>
            )}
        </CardContent>
        <CardFooter>
            <Button 
              className={`w-full bg-primary text-white hover:opacity-90`} 
              onClick={handleRepay} 
              disabled={txStatus !== "idle"}
            >
                {txStatus === "pending" ? <Loader2 className="animate-spin" /> : (
                  useCollateral ? "Swap & Repay" : "Confirm Repayment"
                )}
            </Button>
        </CardFooter>
      </Card>
    </div>
    </>
  );
}
