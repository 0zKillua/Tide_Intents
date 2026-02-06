import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { TransactionPendingOverlay } from "@/components/ui/TransactionPendingOverlay";
import { X, Loader2 } from "lucide-react";
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { TIDE_CONFIG } from "@/tide_config";

interface FillRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any; // SuiObjectData from chain
  type: "Lend" | "Borrow"; // Lend = filling BorrowRequest, Borrow = filling LendOffer
}

export function FillRequestModal({ isOpen, onClose, data, type }: FillRequestModalProps) {
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();
  const [txStatus, setTxStatus] = useState<"pending" | "success" | "error" | "idle">("idle");
  const [txMessage, setTxMessage] = useState("");
  const [fillAmount, setFillAmount] = useState<string>("");

  // Fix: import useEffect if missing (it is missing in previous file content block shown)
  
  // Auto-close success
  // Note: FillRequestModal has a window.reload() on success. We should delay that.
  useEffect(() => {
    if (txStatus === "success") {
        const t = setTimeout(() => {
            setTxStatus("idle");
            onClose();
        }, 2000);
        return () => clearTimeout(t);
    }
  }, [txStatus, onClose]);

  if (!isOpen || !data) return null;

  // ... (rest of parsing logic is unchanged)
  // Parse the SuiObjectData structure
  const fields = data.content?.fields || data;
  const offerId = data.objectId || data.id?.id;
  const isLender = type === "Lend"; // Filling a BorrowRequest
  
  // Checks
  const allowPartial = fields.allow_partial_fill || false; // LendOffer has this, BorrowRequest might not
  
  // Initial parsing
  const assetValue = fields.asset?.fields?.value || fields.asset?.value || fields.asset || '0';
  const availableAmount = isLender 
      ? parseInt(fields.request_amount || '0') / 1e6 
      : parseInt(assetValue) / 1e6;

  // Set initial amount on open
  if (fillAmount === "" && availableAmount > 0) {
      setFillAmount(availableAmount.toString());
  }

  // Derived values based on fillAmount
  const currentAmount = parseFloat(fillAmount) || 0;
  const MOCK_SUI_PRICE_USD = 1;
  
  const rate = isLender 
      ? parseInt(fields.max_rate_bps || '0') / 100
      : parseInt(fields.min_rate_bps || '0') / 100;
      
  const ltvPercent = isLender
      ? parseInt(fields.min_ltv_bps || '0') / 100
      : parseInt(fields.max_ltv_bps || '8000') / 100;

  const durationMs = parseInt(fields.duration_ms || fields.max_duration_ms || '0');
  const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
  
  // Calculate Collateral
  const collateralValueUSD = currentAmount / (ltvPercent / 100);
  const collateralRequired = collateralValueUSD / MOCK_SUI_PRICE_USD;

  const handleConfirm = async () => {
    if (!currentAccount) {
      setTxStatus("error");
      setTxMessage("Please connect wallet first");
      return;
    }
    
    // Validate amount
    if (currentAmount <= 0 || currentAmount > availableAmount) {
        setTxStatus("error");
        setTxMessage("Invalid amount");
        return;
    }
    
    setTxStatus("pending");
    setTxMessage(isLender ? "Filling borrow request..." : "Accepting lend offer...");
    
    try {
      const tx = new Transaction();
      const packageId = TIDE_CONFIG.PACKAGE_ID;
      const usdcConfig = TIDE_CONFIG.COINS.USDC;
      const suiConfig = TIDE_CONFIG.COINS.SUI;
      
      const amountRaw = Math.floor(currentAmount * Math.pow(10, usdcConfig.DECIMALS));
      
      if (isLender) {
        // Filling a BorrowRequest (Lender)
        // User provides Principal (USDC)
        const coins = await suiClient.getCoins({ owner: currentAccount.address, coinType: usdcConfig.TYPE });
        if (!coins.data.length) throw new Error("No USDC found");
        
        // Merge & Split to get exact amount
        const primaryCoin = coins.data[0];
        if (coins.data.length > 1) {
            tx.mergeCoins(tx.object(primaryCoin.coinObjectId), coins.data.slice(1).map(c => tx.object(c.coinObjectId)));
        }
        const [paymentCoin] = tx.splitCoins(tx.object(primaryCoin.coinObjectId), [tx.pure.u64(amountRaw)]);
        
        tx.moveCall({
          target: `${packageId}::matcher::fill_borrow_request`,
          typeArguments: [usdcConfig.TYPE, suiConfig.TYPE], // Coin, Collateral
          arguments: [
            tx.object(offerId),
            paymentCoin,
            tx.object("0x6"), // clock
          ],
        });
        
      } else {
        // Filling a LendOffer (Borrower) - User provides COLLATERAL (SUI)
        const collateralRaw = Math.ceil(collateralRequired * Math.pow(10, suiConfig.DECIMALS));
        const ltvBps = Math.floor(ltvPercent * 100);
        
        // Use GAS coin for SUI payment
        const [collateralCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(collateralRaw)]);
        
        tx.moveCall({
          target: `${packageId}::matcher::fill_lend_offer`,
          typeArguments: [usdcConfig.TYPE, suiConfig.TYPE],
          arguments: [
            tx.object(offerId),
            collateralCoin,
            tx.pure.u64(amountRaw),
            tx.pure.u64(ltvBps),
            tx.pure.u64(durationMs),
            tx.object("0x6"),
          ],
        });
      }
      
      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log("Transaction result:", result);
            setTxStatus("success");
            setTxMessage("Transaction Successful!");
            // Window reload handled in useEffect
          },
          onError: (e) => {
            setTxStatus("error");
            setTxMessage("Failed: " + e.message);
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
      <Card className="w-[450px] border-secondary/50 relative">
        <Button variant="ghost" size="icon" className="absolute right-2 top-2 h-6 w-6" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
        <CardHeader>
          <CardTitle className="text-xl">Confirm {isLender ? "Lending" : "Borrowing"}</CardTitle>
          <CardDescription>
             {allowPartial ? "You can fill a portion of this offer." : "Full fill required."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">Amount to {isLender ? "Lend" : "Borrow"}</label>
            <div className="relative">
                <Input 
                    type="number" 
                    value={fillAmount}
                    onChange={(e) => setFillAmount(e.target.value)}
                    disabled={!allowPartial && !isLender} // Only enable if partial allowed
                    className="font-mono text-lg pr-16"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono">USDC</span>
            </div>
            <p className="text-xs text-gray-500 text-right">Available: {availableAmount.toLocaleString()} USDC</p>
          </div>
          
          <div className="p-4 bg-surface rounded-lg border border-surface-hover space-y-3">
             <div className="flex justify-between items-center">
                <span className="text-gray-400">Interest Rate</span>
                <span className={isLender ? "text-success" : "text-warning"}>{rate.toFixed(2)}% APR</span>
             </div>
             {!isLender && (
               <>
                 <div className="flex justify-between items-center">
                    <span className="text-gray-400">Collateral Required</span>
                    <span className="text-white font-mono">{collateralRequired.toFixed(6)} SUI</span>
                 </div>
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">LTV / Duration</span>
                    <span className="text-gray-500">{ltvPercent}% / {durationDays} days</span>
                 </div>
               </>
             )}
          </div>
        </CardContent>
        <CardFooter>
           <Button className="w-full bg-secondary text-white" onClick={handleConfirm} disabled={txStatus !== "idle"}>
             {txStatus === "pending" ? <Loader2 className="animate-spin" /> : "Confirm Transaction"}
           </Button>
        </CardFooter>
      </Card>
    </div>
    </>
  );
}
