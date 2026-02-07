
import { useState, useEffect } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useIntents } from "@/hooks/useIntents";
import { useLoans } from "@/hooks/useLoans";
import { useLoanNotes } from "@/hooks/useLoanNotes";
import { useHistory } from "@/hooks/useHistory";
import { Loader2, AlertTriangle } from "lucide-react";
import { RepayModal } from "@/components/modals/RepayModal";
import { ClaimModal } from "@/components/modals/ClaimModal";
import { TransactionPendingOverlay } from "@/components/ui/TransactionPendingOverlay";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";

import { Transaction } from "@mysten/sui/transactions";
import { TIDE_CONFIG } from "@/tide_config";
import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function Portfolio() {
  const currentAccount = useCurrentAccount();
  const [activeTab, setActiveTab] = useState("loans");
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const { lendOffers, borrowRequests, refetch } = useIntents();
  const { loans, isLoading: isLoansLoading } = useLoans();
  const { notes, isLoading: isNotesLoading } = useLoanNotes();
  const { history } = useHistory();
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [selectedClaimNote, setSelectedClaimNote] = useState<any>(null);
  const [txStatus, setTxStatus] = useState<"pending" | "success" | "error" | "idle">("idle");
  const [txMessage, setTxMessage] = useState("");
  
  // Confirmation State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // Fix: import useEffect if missing (it is missing in previous file content block shown)

  // Auto-close success
  useEffect(() => {
    if (txStatus === "success") {
        const t = setTimeout(() => {
            setTxStatus("idle");
            refetch(); // Refetch on success
        }, 2000);
        return () => clearTimeout(t);
    }
  }, [txStatus, refetch]);


  const handleCancelLend = async (offerId: string, coinType: string) => {
    setConfirmConfig({
        isOpen: true,
        title: "Cancel Lend Offer",
        message: "Are you sure you want to cancel this lend offer? This will return your funds.",
        onConfirm: () => executeCancelLend(offerId, coinType)
    });
  };

  const executeCancelLend = async (offerId: string, coinType: string) => {
    if (txStatus !== "idle") return;
    
    setTxStatus("pending");
    setTxMessage("Cancelling offer...");

    try {
        const tx = new Transaction();
        tx.moveCall({
            target: `${TIDE_CONFIG.PACKAGE_ID}::intents::cancel_lend_offer`,
            typeArguments: [coinType],
            arguments: [tx.object(offerId)],
        });
        signAndExecuteTransaction({ transaction: tx }, {
            onSuccess: () => {
                setTxStatus("success");
                setTxMessage("Offer cancelled successfully");
            },
            onError: (e) => {
                setTxStatus("error");
                setTxMessage("Failed to cancel: " + e.message);
            }
        });
    } catch(e: any) {
        setTxStatus("error");
        setTxMessage("Error: " + e.message);
    } 
  };

  const handleCancelBorrow = async (requestId: string, principalType: string, collateralType: string) => {
    setConfirmConfig({
        isOpen: true,
        title: "Cancel Borrow Request",
        message: "Are you sure you want to cancel this borrow request? This will return your collateral.",
        onConfirm: () => executeCancelBorrow(requestId, principalType, collateralType)
    });
  };

  const executeCancelBorrow = async (requestId: string, principalType: string, collateralType: string) => {
    if (txStatus !== "idle") return;
    
    setTxStatus("pending");
    setTxMessage("Cancelling request...");

    try {
        const tx = new Transaction();
        tx.moveCall({
            target: `${TIDE_CONFIG.PACKAGE_ID}::intents::cancel_borrow_request`,
            typeArguments: [principalType, collateralType],
            arguments: [tx.object(requestId)],
        });
        signAndExecuteTransaction({ transaction: tx }, {
            onSuccess: () => {
                setTxStatus("success");
                setTxMessage("Request cancelled successfully");
            },
            onError: (e) => {
                setTxStatus("error");
                setTxMessage("Failed to cancel: " + e.message);
            }
        });
    } catch(e: any) {
        setTxStatus("error");
        setTxMessage("Error: " + e.message);
    } 
  };
  
  if (!currentAccount) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
         <h2 className="text-2xl font-bold">Connect Wallet</h2>
         <p className="text-gray-400">Please connect your wallet to view your portfolio.</p>
      </div>
    );
  }

  // Filter Active Intents
  const myLendOffers = lendOffers.filter((o: any) => {
      const fields = o.content?.fields || o;
      const provider = fields?.provider;
      // Handle different Balance serialization formats
      const assetValue = fields.asset?.fields?.value || fields.asset?.value || fields.asset || '0';
      const assetVal = parseInt(assetValue);
      
      console.log("[Portfolio Debug] LendOffer:", { 
          objectId: o.objectId, 
          provider, 
          myAddress: currentAccount.address, 
          match: provider === currentAccount.address,
          assetVal 
      });
      
      return provider === currentAccount.address && assetVal > 0;
  });

  const myBorrowRequests = borrowRequests.filter((r: any) => {
      const fields = r.content?.fields || r;
      const borrower = fields?.borrower;
      // Handle different Balance serialization formats
      const collateralValue = fields.collateral?.fields?.value || fields.collateral?.value || fields.collateral || '0';
      const collateralVal = parseInt(collateralValue);
      return borrower === currentAccount.address && collateralVal > 0;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <TransactionPendingOverlay 
          isVisible={txStatus !== "idle"} 
          status={txStatus === "idle" ? "pending" : txStatus}
          message={txMessage} 
          onClose={() => setTxStatus("idle")}
      />
      
      <ConfirmationModal 
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        variant="destructive"
        confirmLabel="Yes, Cancel"
      />
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Portfolio</h1>
        <p className="text-gray-400">Manage your active positions and open orders.</p>
      </div>

      <Tabs defaultValue="loans" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="relative flex p-1 bg-surface/30 backdrop-blur-md rounded-xl border border-white/5 mb-8">
            {["intents", "loans", "history", "liquidations"].map((tab) => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                        "relative z-10 flex-1 py-2.5 text-sm font-medium transition-colors duration-200",
                        activeTab === tab ? "text-white" : "text-gray-400 hover:text-gray-200"
                    )}
                >
                    {activeTab === tab && (
                        <motion.div
                            layoutId="activeTab"
                            className="absolute inset-0 bg-secondary rounded-lg shadow-lg"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                    )}
                    <span className="relative z-20">
                        {tab === "intents" && "Active Intents"}
                        {tab === "loans" && "Active Loans"}
                        {tab === "history" && "History"}
                        {tab === "liquidations" && "Liquidations"}
                    </span>
                </button>
            ))}
        </div>

        {/* Tab 1: Active Intents */}
        <TabsContent value="intents" className="space-y-6 mt-6">
            <div className="space-y-4">
                <h3 className="text-xl font-semibold text-primary">My Lend Offers</h3>
                <Card className="bg-surface/50 border-surface-hover">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Amount Remaining</TableHead>
                                <TableHead>Min Rate</TableHead>
                                <TableHead>Max LTV</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {myLendOffers.length === 0 && (
                                <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">No active lend offers.</TableCell></TableRow>
                            )}
                            {myLendOffers.map((offer: any) => {
                                const fields = offer.content?.fields || offer;
                                // Use same fallback logic as filter
                                const assetValue = fields.asset?.fields?.value || fields.asset?.value || fields.asset || '0';
                                const remaining = parseInt(assetValue) / 1e6;
                                return (
                                    <TableRow key={offer.objectId}>
                                        <TableCell className="font-mono text-white">{remaining.toLocaleString()} USDC</TableCell>
                                        <TableCell>{(parseInt(fields.min_rate_bps) / 100).toFixed(2)}%</TableCell>
                                        <TableCell>{(parseInt(fields.max_ltv_bps) / 100)}%</TableCell>
                                        <TableCell><Badge className="bg-success/20 text-success">Active</Badge></TableCell>
                                        <TableCell className="text-right">
                                            <Button 
                                                variant="destructive" 
                                                size="sm" 
                                                disabled={txStatus !== "idle"}
                                                onClick={() => handleCancelLend(offer.objectId, TIDE_CONFIG.COINS.USDC.TYPE)}
                                            >
                                                Cancel
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </Card>
            </div>

            <div className="space-y-4">
                <h3 className="text-xl font-semibold text-warning">My Borrow Requests</h3>
                <Card className="bg-surface/50 border-surface-hover">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Collateral Locked</TableHead>
                                <TableHead>Requesting</TableHead>
                                <TableHead>Max Rate</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {myBorrowRequests.length === 0 && (
                                <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">No active borrow requests.</TableCell></TableRow>
                            )}
                            {myBorrowRequests.map((req: any) => {
                                const fields = req.content.fields;
                                const typeString = req.content?.type || "";
                                const isSuiCollateral = typeString.includes("0x2::sui::SUI");
                                const colDecimals = isSuiCollateral ? 9 : 6;
                                
                                const collateral = parseInt(fields.collateral || '0') / Math.pow(10, colDecimals);
                                const requesting = parseInt(fields.request_amount || '0') / 1e6;
                                return (
                                    <TableRow key={req.objectId}>
                                        <TableCell className="font-mono text-white">{collateral.toFixed(6)} {isSuiCollateral ? "SUI" : "USDC"}</TableCell>
                                        <TableCell>{requesting.toLocaleString()} USDC</TableCell>
                                        <TableCell>{(parseInt(fields.max_rate_bps) / 100).toFixed(2)}%</TableCell>
                                        <TableCell><Badge className="bg-warning/20 text-warning">Pending</Badge></TableCell>
                                        <TableCell className="text-right">
                                            <Button 
                                                variant="destructive" 
                                                size="sm" 
                                                disabled={txStatus !== "idle"}
                                                onClick={() => {
                                                    const colType = isSuiCollateral ? TIDE_CONFIG.COINS.SUI.TYPE : TIDE_CONFIG.COINS.USDC.TYPE;
                                                    handleCancelBorrow(req.objectId, TIDE_CONFIG.COINS.USDC.TYPE, colType);
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </Card>
            </div>
        </TabsContent>

        {/* Tab 2: Active Loans */}
        <TabsContent value="loans" className="space-y-6 mt-6">
            <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white">Active Loans (I'm Borrowing)</h3>
                <Card className="bg-surface/50 border-surface-hover">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Principal Due</TableHead>
                                <TableHead>Collateral Locked</TableHead>
                                <TableHead>Interest Rate</TableHead>
                                <TableHead>Start Time</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoansLoading && <TableRow><TableCell colSpan={5} className="text-center"><Loader2 className="animate-spin m-auto" /></TableCell></TableRow>}
                            {!isLoansLoading && loans.length === 0 && (
                                <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">You have no active loans.</TableCell></TableRow>
                            )}
                            {loans.map((loan: any) => {
                                if (loan.state !== 0) return null; // Only Active
                                const principal = parseInt(loan.principal) / 1e6;
                                const typeString = loan.type || ""; // Loan<Coin, Collateral>
                                console.log("[Portfolio] Loan Type:", typeString, "Content:", loan.content);
                                const isSuiCollateral = typeString.includes("::sui::SUI");
                                const colDecimals = isSuiCollateral ? 9 : 6;
                                const collateral = parseInt(loan.collateral) / Math.pow(10, colDecimals);
                                const rate = parseInt(loan.interest_rate_bps) / 100;
                                const date = new Date(parseInt(loan.start_time_ms));
                                
                                return (
                                    <TableRow key={loan.objectId}>
                                        <TableCell className="font-bold text-white">{principal.toLocaleString()} USDC</TableCell>
                                        <TableCell className="font-mono">{collateral.toFixed(6)} {isSuiCollateral ? "SUI" : "USDC"}</TableCell>
                                        <TableCell className="text-warning">{rate.toFixed(2)}%</TableCell>
                                        <TableCell className="text-gray-400">{date.toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            <Button size="sm" className="bg-primary text-white hover:bg-primary/90" onClick={() => setSelectedLoan(loan)}>Repay Loan</Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </Card>
            </div>

            <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white">My Loan Notes (I'm Lending)</h3>
                <Card className="bg-surface/50 border-surface-hover">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Principal Lent</TableHead>
                                <TableHead>Interest Rate</TableHead>
                                <TableHead>Loan ID</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isNotesLoading && <TableRow><TableCell colSpan={5} className="text-center"><Loader2 className="animate-spin m-auto" /></TableCell></TableRow>}
                            {!isNotesLoading && notes.length === 0 && (
                                <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">You have no active lending notes.</TableCell></TableRow>
                            )}
                            {notes.map((note: any) => {
                                const principal = parseInt(note.principal) / 1e6;
                                const rate = parseInt(note.interest_rate_bps) / 100;
                                const loanId = note.loan_id?.id || note.loan_id;
                                
                                // loanState is now fetched from the Loan object via useLoanNotes hook
                                // 0=Active, 1=Repaid, 2=Liquidated
                                const loanState: number = note.loanState ?? 0;
                                
                                const getStatusBadge = () => {
                                    if (loanState === 1) return <Badge className="bg-success/20 text-success">Repaid</Badge>;
                                    if (loanState === 2) return <Badge className="bg-red-500/20 text-red-400">Liquidated</Badge>;
                                    return <Badge className="bg-success/20 text-success">Active</Badge>;
                                };
                                
                                return (
                                    <TableRow key={note.objectId}>
                                        <TableCell className="font-bold text-white">{principal.toLocaleString()} USDC</TableCell>
                                        <TableCell className="text-warning">{rate.toFixed(2)}%</TableCell>
                                        <TableCell className="font-mono text-xs text-gray-500">{typeof loanId === 'string' ? loanId.slice(0, 8) : '...' }...</TableCell>
                                        <TableCell>{getStatusBadge()}</TableCell>
                                        <TableCell className="text-right">
                                            {loanState >= 1 ? (
                                                <Button size="sm" className="bg-success text-white hover:bg-success/90" onClick={() => setSelectedClaimNote(note)}>Claim</Button>
                                            ) : (
                                                <Button size="sm" variant="secondary" disabled>Wait for Repay</Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </Card>
            </div>
        </TabsContent>

        {/* Tab 3: History */}
        <TabsContent value="history" className="space-y-4 mt-6">
            <Card className="bg-surface/50 border-surface-hover">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Event</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Transaction</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {history.length === 0 && (
                            <TableRow><TableCell colSpan={4} className="text-center py-8 text-gray-500">No transaction history yet.</TableCell></TableRow>
                        )}
                        {history.map((event, idx) => (
                            <TableRow key={idx}>
                                <TableCell>
                                    <Badge className={
                                        event.type === "Loan Repaid" ? "bg-success/20 text-success" :
                                        event.type === "Loan Claimed" ? "bg-primary/20 text-primary" :
                                        "bg-secondary/20 text-secondary"
                                    }>
                                        {event.type}
                                    </Badge>
                                </TableCell>
                                <TableCell className="font-mono text-white">
                                    {event.data.principal?.toFixed(2) || event.data.amount?.toFixed(2) || '-'} USDC
                                </TableCell>
                                <TableCell className="text-gray-400">
                                    {new Date(event.timestamp).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right">
                                    <a 
                                        href={`https://suiscan.xyz/testnet/tx/${event.digest}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-xs text-secondary hover:underline"
                                    >
                                        {event.digest.slice(0, 8)}...
                                    </a>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </TabsContent>

        {/* Tab 4: Liquidations */}
        <TabsContent value="liquidations" className="space-y-6 mt-6">
             <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 mb-4">
                <AlertTriangle className="h-5 w-5" />
                <span>Liquidations occur when LTV exceeds the threshold. Liquidators earn a bonus.</span>
             </div>
             
             <Card className="bg-surface/50 border-surface-hover">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Borrower</TableHead>
                            <TableHead>Health Factor</TableHead>
                            <TableHead>Debt</TableHead>
                            <TableHead>Collateral Value</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">No active loans at risk.</TableCell></TableRow>
                    </TableBody>
                </Table>
             </Card>
        </TabsContent>

      </Tabs>
      
      {selectedLoan && (
        <RepayModal 
            isOpen={!!selectedLoan} 
            onClose={() => setSelectedLoan(null)} 
            loan={selectedLoan} 
        />
      )}
      
      {selectedClaimNote && (
        <ClaimModal 
            isOpen={!!selectedClaimNote} 
            onClose={() => setSelectedClaimNote(null)} 
            note={selectedClaimNote} 
        />
      )}
    </div>
  );
}
