import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { X, Check, AlertTriangle, Loader2 } from "lucide-react";
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !data) return null;

  // Parse the SuiObjectData structure
  const fields = data.content?.fields || data;
  const offerId = data.objectId || data.id?.id;
  
  const isLender = type === "Lend"; // Filling a BorrowRequest
  
  // Mock BTC price for collateral calculation (in a real app, this comes from an oracle)
  const MOCK_BTC_PRICE_USD = 50000;
  
  let amount: number;
  let asset: string;
  let rate: number;
  let collateralRequired: number = 0;
  let ltvPercent: number = 0;
  let durationDays: number = 30;
  let durationMs: number = 0;
  
  if (isLender) {
    // Filling a BorrowRequest: borrower wants USDC, lender provides it
    amount = parseInt(fields.request_amount || '0') / 1e6;
    asset = "USDC";
    rate = parseInt(fields.max_rate_bps || '0') / 100;
  } else {
    // Filling a LendOffer: borrower takes liquidity, provides collateral
    const assetValue = fields.asset?.fields?.value || fields.asset?.value || fields.asset || '0';
    amount = parseInt(assetValue) / 1e6;
    asset = "USDC";
    rate = parseInt(fields.min_rate_bps || '0') / 100;
    
    // Calculate required collateral based on max_ltv
    ltvPercent = parseInt(fields.max_ltv_bps || '8000') / 100; // Default 80%
    const collateralValueUSD = amount / (ltvPercent / 100); // Value in USD
    collateralRequired = collateralValueUSD / MOCK_BTC_PRICE_USD; // Convert to BTC
    durationMs = parseInt(fields.max_duration_ms || '2592000000'); // Default 30 days
    durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
  }

  const handleConfirm = async () => {
    if (!currentAccount) {
      alert("Please connect wallet first");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const tx = new Transaction();
      const packageId = TIDE_CONFIG.PACKAGE_ID;
      
      if (isLender) {
        // Filling a BorrowRequest using fill_borrow_request
        // fill_borrow_request<CoinType, CollateralType>(request, payment, clock, ctx)
        const usdcConfig = TIDE_CONFIG.COINS.USDC;
        const btcConfig = TIDE_CONFIG.COINS.BTC;
        const amountRaw = Math.ceil(amount * Math.pow(10, usdcConfig.DECIMALS));
        
        // Get user's USDC coins
        const coins = await suiClient.getCoins({
          owner: currentAccount.address,
          coinType: usdcConfig.TYPE,
        });
        
        if (!coins.data || coins.data.length === 0) {
          alert("No USDC found. Please use the Faucet to get mock USDC first.");
          setIsSubmitting(false);
          return;
        }
        
        // Check balance
        const totalBalance = coins.data.reduce((acc, c) => acc + parseInt(c.balance), 0);
        if (totalBalance < amountRaw) {
          alert(`Insufficient USDC balance. You have ${(totalBalance / 1e6).toFixed(2)} USDC, need ${amount.toFixed(2)} USDC`);
          setIsSubmitting(false);
          return;
        }
        
        // Merge coins if needed
        let primaryCoinId = coins.data[0].coinObjectId;
        if (coins.data.length > 1) {
          const otherCoins = coins.data.slice(1).map(c => c.coinObjectId);
          tx.mergeCoins(tx.object(primaryCoinId), otherCoins.map(id => tx.object(id)));
        }
        
        // Split exact amount
        const [paymentCoin] = tx.splitCoins(tx.object(primaryCoinId), [amountRaw]);
        
        tx.moveCall({
          target: `${packageId}::matcher::fill_borrow_request`,
          typeArguments: [usdcConfig.TYPE, btcConfig.TYPE],
          arguments: [
            tx.object(offerId), // BorrowRequest object
            paymentCoin,
            tx.object("0x6"), // clock
          ],
        });
        
      } else {
        // Filling a LendOffer using fill_lend_offer (atomic instant borrow!)
        // fill_lend_offer<CoinType, CollateralType>(offer, collateral, borrow_amount, ltv_bps, duration_ms, clock, ctx)
        
        const usdcConfig = TIDE_CONFIG.COINS.USDC;
        const btcConfig = TIDE_CONFIG.COINS.BTC;
        const collateralRaw = Math.ceil(collateralRequired * Math.pow(10, btcConfig.DECIMALS));
        const amountRaw = Math.floor(amount * Math.pow(10, usdcConfig.DECIMALS));
        const ltvBps = Math.floor(ltvPercent * 100);
        
        // Get user's BTC coins
        const coins = await suiClient.getCoins({
          owner: currentAccount.address,
          coinType: btcConfig.TYPE,
        });
        
        if (!coins.data || coins.data.length === 0) {
          alert("No BTC collateral found. Please use the Faucet to get mock BTC first.");
          setIsSubmitting(false);
          return;
        }
        
        // Check balance
        const totalBalance = coins.data.reduce((acc, c) => acc + parseInt(c.balance), 0);
        if (totalBalance < collateralRaw) {
          alert(`Insufficient BTC balance. You have ${(totalBalance / 1e8).toFixed(6)} BTC, need ${collateralRequired.toFixed(6)} BTC`);
          setIsSubmitting(false);
          return;
        }
        
        // Merge coins if needed
        let primaryCoinId = coins.data[0].coinObjectId;
        if (coins.data.length > 1) {
          const otherCoins = coins.data.slice(1).map(c => c.coinObjectId);
          tx.mergeCoins(tx.object(primaryCoinId), otherCoins.map(id => tx.object(id)));
        }
        
        // Split exact collateral amount
        const [collateralCoin] = tx.splitCoins(tx.object(primaryCoinId), [collateralRaw]);
        
        tx.moveCall({
          target: `${packageId}::matcher::fill_lend_offer`,
          typeArguments: [usdcConfig.TYPE, btcConfig.TYPE],
          arguments: [
            tx.object(offerId), // LendOffer object (shared)
            collateralCoin,
            tx.pure.u64(amountRaw),
            tx.pure.u64(ltvBps),
            tx.pure.u64(durationMs),
            tx.object("0x6"), // clock
          ],
        });
      }
      
      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log("Transaction Success:", result);
            alert(`✅ ${isLender ? "Loan funded" : "Loan created"} successfully!\n\nYou ${isLender ? "lent" : "borrowed"} ${amount} USDC.\n\nTransaction: ${result.digest}`);
            onClose();
          },
          onError: (error) => {
            console.error("Transaction Error:", error);
            alert("Transaction failed: " + error.message);
            setIsSubmitting(false);
          },
        }
      );
        
    } catch (e: any) {
      console.error(e);
      alert("Error: " + e.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="w-[450px] border-secondary/50 relative">
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute right-2 top-2 h-6 w-6" 
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
        <CardHeader>
          <CardTitle className="text-xl">Confirm {isLender ? "Lending" : "Borrowing"}</CardTitle>
          <CardDescription>Review the terms before executing the transaction.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-surface rounded-lg border border-surface-hover space-y-3">
             <div className="flex justify-between items-center">
                <span className="text-gray-400">You {isLender ? "Lend" : "Receive"}</span>
                <span className="text-xl font-mono font-bold text-white">{amount.toLocaleString()} {asset}</span>
             </div>
             <div className="flex justify-between items-center">
                <span className="text-gray-400">Interest Rate</span>
                <span className={isLender ? "text-success" : "text-warning"}>{rate.toFixed(2)}% APR</span>
             </div>
             {!isLender && (
               <>
                 <div className="flex justify-between items-center">
                    <span className="text-gray-400">Collateral Required</span>
                    <span className="text-white font-mono">{collateralRequired.toFixed(6)} BTC</span>
                 </div>
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">LTV / Duration</span>
                    <span className="text-gray-500">{ltvPercent}% / {durationDays} days</span>
                 </div>
               </>
             )}
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-400 p-2 bg-yellow-500/10 rounded border border-yellow-500/20">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <span>{isLender 
              ? "You will provide USDC to the borrower." 
              : "Your BTC collateral will be locked until loan repayment."}
            </span>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
           <Button 
             className="w-full bg-secondary text-white hover:bg-secondary/90 h-12 text-lg"
             onClick={handleConfirm}
             disabled={isSubmitting}
           >
             {isSubmitting ? (
               <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</>
             ) : (
               <><Check className="mr-2 h-5 w-5" /> Confirm Transaction</>
             )}
           </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
