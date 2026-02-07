import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { TransactionPendingOverlay } from "@/components/ui/TransactionPendingOverlay";
import { X } from "lucide-react";
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { TIDE_CONFIG } from "@/tide_config";

interface CreateIntentModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "Lend" | "Borrow";
}

type TokenKey = "USDC" | "SUI";

export function CreateIntentModal({ isOpen, onClose, type }: CreateIntentModalProps) {
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();
  
  // Independent States
  const [collateralAmount, setCollateralAmount] = useState("");
  const [principalAmount, setPrincipalAmount] = useState(""); // Used for Lend amount too
  
  // Dynamic Tokens based on Type
  const tokens: TokenKey[] = type === "Lend" ? ["USDC"] : ["SUI"];
  const [selectedToken, setSelectedToken] = useState<TokenKey>(tokens[0]);

  // Reset selected token when type changes
  useEffect(() => {
    setSelectedToken(type === "Lend" ? "USDC" : "SUI");
  }, [type]);
  
  const [rate, setRate] = useState("500"); // BPS
  const [ltv, setLtv] = useState("70"); // % used for converting to BPS
  const [duration, setDuration] = useState("30"); // Days
  const [allowPartialFill, setAllowPartialFill] = useState(true);
  const [txStatus, setTxStatus] = useState<"pending" | "success" | "error" | "idle">("idle");
  const [txMessage, setTxMessage] = useState("");
  // const [isSubmitting, setIsSubmitting] = useState(false); 

  useEffect(() => {
    if (txStatus === "success") {
        const t = setTimeout(() => {
            setTxStatus("idle");
            onClose();
        }, 2000);
        return () => clearTimeout(t);
    }
  }, [txStatus, onClose]);

  // Early return AFTER all hooks
  if (!isOpen) return null;

  const handlePost = async () => {
    if (!currentAccount) {
      alert("Please connect wallet first");
      return;
    }
    
    setTxStatus("pending");
    setTxMessage(`Creating ${type} Intent...`);
    
    try {
      const tx = new Transaction();
      const packageId = TIDE_CONFIG.PACKAGE_ID;
      const marketId = TIDE_CONFIG.MARKET_ID;
      const rateBps = parseInt(rate);
      const durationMs = parseInt(duration) * 24 * 60 * 60 * 1000;
      
      const tokenConfig = TIDE_CONFIG.COINS[selectedToken];
      
      if (type === "Lend") {
        // LEND: User provides PRINCIPAL (USDC). 
        // We use principalAmount input.
        // NOTE: For this demo, we only have one market <USDC, SUI>.
        // Lenders lend USDC.
        const usdcConfig = TIDE_CONFIG.COINS.USDC;
        const amountNum = parseFloat(principalAmount);
        
        // Fetch USDC coins instead if lending
        const usdcCoins = await suiClient.getCoins({
             owner: currentAccount.address,
             coinType: usdcConfig.TYPE
        });

        if (isNaN(amountNum) || amountNum <= 0) { throw new Error("Invalid lend amount"); }
        
        const amountRaw = Math.floor(amountNum * Math.pow(10, usdcConfig.DECIMALS));
        
        // Coin Logic
        if (!usdcCoins.data || usdcCoins.data.length === 0) throw new Error("No coins found");
        let primaryCoinId = usdcCoins.data[0].coinObjectId;
        const totalBalance = usdcCoins.data.reduce((acc, c) => acc + parseInt(c.balance), 0);
        if (totalBalance < amountRaw) throw new Error("Insufficient balance");
        
        if (usdcCoins.data.length > 1) {
             const otherCoins = usdcCoins.data.slice(1).map(c => c.coinObjectId);
             tx.mergeCoins(tx.object(primaryCoinId), otherCoins.map(id => tx.object(id)));
        }
        const [paymentCoin] = tx.splitCoins(tx.object(primaryCoinId), [amountRaw]);

        tx.moveCall({
          target: `${packageId}::intents::create_lend_offer`,
          typeArguments: [usdcConfig.TYPE],
          arguments: [
            paymentCoin,
            tx.pure.u64(rateBps),
            tx.pure.u64(parseInt(ltv) * 100), // Max LTV BPS
            tx.pure.u64(durationMs),
            tx.pure.u64(Math.floor(amountRaw / 10)), // min_fill
            tx.pure.bool(allowPartialFill),
            tx.pure.id(marketId),
            tx.object("0x6"),
          ],
        });

      } else {
        // BORROW: User provides COLLATERAL (SUI) and asks for PRINCIPAL (USDC).
        
        const colAmountNum = parseFloat(collateralAmount);
        const reqAmountNum = parseFloat(principalAmount);
        
        if (isNaN(colAmountNum) || colAmountNum <= 0) throw new Error("Invalid collateral amount");
        if (isNaN(reqAmountNum) || reqAmountNum <= 0) throw new Error("Invalid borrow amount");

        const colRaw = Math.floor(colAmountNum * Math.pow(10, tokenConfig.DECIMALS)); // Collateral decimals (SUI = 9)
        const principalConfig = TIDE_CONFIG.COINS.USDC; 
        const reqRaw = Math.floor(reqAmountNum * Math.pow(10, principalConfig.DECIMALS));
        
        // For native SUI, split directly from gas coin (simplest and most reliable approach)
        const [collateralCoin] = tx.splitCoins(tx.gas, [colRaw]);

        tx.moveCall({
          target: `${packageId}::intents::create_borrow_request`,
          typeArguments: [principalConfig.TYPE, tokenConfig.TYPE], // CoinType(USDC), CollateralType(SUI)
          arguments: [
            collateralCoin,                                 // collateral: Coin<CollateralType>
            tx.pure.u64(reqRaw),                            // request_amount
            tx.pure.u64(rateBps),                           // max_rate_bps
            tx.pure.u64(parseInt(ltv) * 100),               // Min LTV BPS
            tx.pure.u64(50),                                // matcher_commission_bps (0.5%)
            tx.pure.u64(durationMs),                        // duration_ms
            tx.pure.id(marketId),                           // market_id
            tx.object("0x6"),                               // clock
          ],
        });
      }
      
      signAndExecuteTransaction(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log("Transaction Success:", result);
            setTxStatus("success");
            setTxMessage(`${type} Intent created successfully!`);
          },
          onError: (error) => {
            console.error("Transaction Error:", error);
            setTxStatus("error");
            setTxMessage("Transaction failed: " + error.message);
          },
        }
      );
        
    } catch (e: any) {
      console.error(e);
      setTxStatus("error");
      setTxMessage("Error: " + e.message);
    } 
    // removed finally block to prevent early reset
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
      <Card className="w-[420px] border-primary/50 relative">
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute right-2 top-2 text-gray-400 hover:text-white"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
        <CardHeader>
          <CardTitle className="text-xl">Create {type} Intent</CardTitle>
          <CardDescription>
            {type === "Lend" 
              ? "Offer liquidity and earn fixed yield." 
              : "Post collateral and specify the amount you need."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Token Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">
              {type === "Lend" ? "Token to Lend" : "Collateral Token"}
            </label>
            <div className="flex gap-2">
              {tokens.map((token) => (
                <Button
                  key={token}
                  variant={selectedToken === token ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedToken(token)}
                  className={selectedToken === token ? "bg-primary text-white" : ""}
                >
                  {token}
                </Button>
              ))}
            </div>
          </div>

          {/* Amount Inputs */}
          {type === "Lend" ? (
             <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Amount to Lend</label>
                <div className="relative">
                  <Input 
                    placeholder="0.00" 
                    type="number" 
                    className="font-mono text-lg pr-16"
                    value={principalAmount}
                    onChange={(e) => setPrincipalAmount(e.target.value)}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono">
                    {selectedToken}
                  </span>
                </div>
             </div>
          ) : (
             <>
                 <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400">Collateral Amount (You Pay)</label>
                    <div className="relative">
                      <Input 
                        placeholder="0.00" 
                        type="number" 
                        className="font-mono text-lg pr-16"
                        value={collateralAmount}
                        onChange={(e) => setCollateralAmount(e.target.value)}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono">
                        {selectedToken}
                      </span>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400">Amount Needed (You Receive)</label>
                    <div className="relative">
                      <Input 
                        placeholder="0.00" 
                        type="number" 
                        className="font-mono text-lg pr-16"
                        value={principalAmount}
                        onChange={(e) => setPrincipalAmount(e.target.value)}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono">
                        USDC
                      </span>
                    </div>
                 </div>
             </>
          )}

          {/* Rate & LTV */}
          <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Rate (bps)</label>
                <Input 
                  placeholder="500" 
                  type="number" 
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                />
                <p className="text-xs text-gray-500">{parseInt(rate) / 100}% APR</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">
                    {type === "Lend" ? "Max LTV %" : "Min LTV %"}
                </label>
                <Input 
                  placeholder="70" 
                  type="number" 
                  value={ltv}
                  onChange={(e) => setLtv(e.target.value)}
                />
              </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">Duration (Days)</label>
            <Input 
              placeholder="30" 
              type="number" 
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>

          {type === "Lend" && (
            <div className="flex items-center space-x-2 pt-2">
              <input 
                type="checkbox" 
                id="partialFill" 
                checked={allowPartialFill}
                onChange={(e) => setAllowPartialFill(e.target.checked)}
                className="rounded border-gray-600 bg-surface/50 text-primary focus:ring-primary"
              />
              <label 
                htmlFor="partialFill" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-300"
              >
                Allow Partial Fills
              </label>
            </div>
          )}

        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button 
            className="bg-primary text-white hover:bg-primary/90 w-full" 
            onClick={handlePost} 
            disabled={txStatus !== "idle" || (type === 'Lend' ? !principalAmount : (!principalAmount || !collateralAmount))}
          >
            {txStatus === "pending" ? "Processing..." : `Create ${type} Intent`}
          </Button>
        </CardFooter>
      </Card>
    </div>
    </>
  );
}
