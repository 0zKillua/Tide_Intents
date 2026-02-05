import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useIntents } from "@/hooks/useIntents";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Trash2 } from "lucide-react";
import { Transaction } from "@mysten/sui/transactions";
import { TIDE_CONFIG } from "@/tide_config";

export function MyIntents() {
  const currentAccount = useCurrentAccount();
  const { lendOffers, borrowRequests, isLoading } = useIntents();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  
  // Filter to only show current user's intents
  const myLendOffers = lendOffers.filter((obj: any) => {
    const fields = obj.content?.fields || obj;
    return fields.provider === currentAccount?.address;
  });
  
  const myBorrowRequests = borrowRequests.filter((obj: any) => {
    const fields = obj.content?.fields || obj;
    return fields.borrower === currentAccount?.address;
  });

  const handleCancel = async (objectId: string, isLend: boolean) => {
    try {
        const tx = new Transaction();
        const packageId = TIDE_CONFIG.PACKAGE_ID;
        const usdcType = TIDE_CONFIG.COINS.USDC.TYPE;
        const btcType = TIDE_CONFIG.COINS.BTC.TYPE;

        if (isLend) {
            tx.moveCall({
                target: `${packageId}::intents::cancel_lend_offer`,
                typeArguments: [usdcType], 
                arguments: [tx.object(objectId)]
            });
        } else {
            tx.moveCall({
                target: `${packageId}::intents::cancel_borrow_request`,
                typeArguments: [usdcType, btcType],
                arguments: [tx.object(objectId)]
            });
        }

        signAndExecuteTransaction(
            { transaction: tx },
            {
                onSuccess: (result) => {
                    alert(`Intent cancelled! Funds returned. TX: ${result.digest}`);
                },
                onError: (err) => {
                    console.error(err);
                    alert("Cancel failed: " + err.message);
                }
            }
        );
    } catch (e: any) {
        console.error(e);
        alert("Error preparing transaction: " + e.message);
    }
  };

  if (!currentAccount) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <h1 className="text-3xl font-bold tracking-tight text-white">My Intents</h1>
        <p className="text-gray-400">Please connect your wallet to view your intents.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">My Intents</h1>
        <p className="text-gray-400">Manage your open offers and requests.</p>
      </div>

      {/* My Lend Offers */}
      <Card className="bg-surface/50">
        <CardHeader>
          <CardTitle className="text-lg text-success">My Lend Offers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Amount</TableHead>
                <TableHead>Min Rate</TableHead>
                <TableHead>Max LTV</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={6} className="text-center py-4 text-gray-400">Loading...</TableCell></TableRow>}
              
              {!isLoading && myLendOffers.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-4 text-gray-400">No lend offers created yet.</TableCell></TableRow>
              )}
              
              {myLendOffers.map((obj: any) => {
                const fields = obj.content?.fields || obj;
                const assetValue = fields.asset?.fields?.value || fields.asset?.value || fields.asset || '0';
                const amount = parseInt(assetValue) / 1e6;
                const rate = parseInt(fields.min_rate_bps || '0') / 100;
                const ltv = parseInt(fields.max_ltv_bps || '0') / 100;
                const days = Math.ceil(parseInt(fields.max_duration_ms || '0') / (1000 * 60 * 60 * 24));
                
                return (
                  <TableRow key={obj.objectId}>
                    <TableCell className="font-bold text-white">{amount.toLocaleString()} USDC</TableCell>
                    <TableCell className="text-success">{rate}%</TableCell>
                    <TableCell>{ltv}%</TableCell>
                    <TableCell>{days}d</TableCell>
                    <TableCell><Badge className="bg-success/20 text-success">Active</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        className="gap-1"
                        onClick={() => handleCancel(obj.objectId || obj.id?.id, true)}
                      >
                        <Trash2 className="h-3 w-3" /> Cancel
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* My Borrow Requests */}
      <Card className="bg-surface/50">
        <CardHeader>
          <CardTitle className="text-lg text-warning">My Borrow Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Requested</TableHead>
                <TableHead>Collateral</TableHead>
                <TableHead>Max Rate</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={6} className="text-center py-4 text-gray-400">Loading...</TableCell></TableRow>}
              
              {!isLoading && myBorrowRequests.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-4 text-gray-400">No borrow requests created yet.</TableCell></TableRow>
              )}
              
              {myBorrowRequests.map((obj: any) => {
                const fields = obj.content?.fields || obj;
                const requestAmount = parseInt(fields.request_amount || '0') / 1e6;
                const collateralValue = fields.collateral?.fields?.value || fields.collateral?.value || fields.collateral || '0';
                const collateral = parseInt(collateralValue) / 1e8;
                const rate = parseInt(fields.max_rate_bps || '0') / 100;
                const days = Math.ceil(parseInt(fields.duration_ms || '0') / (1000 * 60 * 60 * 24));
                
                return (
                  <TableRow key={obj.objectId}>
                    <TableCell className="font-bold text-white">{requestAmount.toLocaleString()} USDC</TableCell>
                    <TableCell>{collateral.toFixed(4)} BTC</TableCell>
                    <TableCell className="text-warning">{rate}%</TableCell>
                    <TableCell>{days}d</TableCell>
                    <TableCell><Badge className="bg-warning/20 text-warning">Pending</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        className="gap-1"
                        onClick={() => handleCancel(obj.objectId || obj.id?.id, false)}
                      >
                        <Trash2 className="h-3 w-3" /> Cancel
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
