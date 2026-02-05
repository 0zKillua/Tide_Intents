
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { TIDE_CONFIG } from "@/tide_config";

export function MyActiveIntents({ lendOffers, borrowRequests }: { lendOffers: any[], borrowRequests: any[] }) {
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  if (!currentAccount) return null;

  // Filter for my items
  const myOffers = lendOffers.filter(o => o.content?.fields?.provider === currentAccount.address);
  const myRequests = borrowRequests.filter(r => r.content?.fields?.borrower === currentAccount.address);

  if (myOffers.length === 0 && myRequests.length === 0) return null;

  const handleCancel = async (objectId: string, isLend: boolean) => {
      const tx = new Transaction();
      const packageId = TIDE_CONFIG.PACKAGE_ID;
      
      // We need CoinType and CollateralType. 
      // For MVP, we know LendOffer uses <CoinType> (USDC) and BorrowRequest uses <CoinType, CollateralType> (USDC, BTC)
      // Ideally we extract this from the object type string `0x...::intents::LendOffer<0x...::mock_usdc::MOCK_USDC>`
      
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
  };

  return (
    <div className="space-y-4">
       <h2 className="text-xl font-semibold text-white">My Active Intents</h2>
       <Card className="bg-surface/50 border-primary/20">
          <Table>
            <TableHeader>
               <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
               </TableRow>
            </TableHeader>
            <TableBody>
              {myOffers.map((obj) => (
                  <TableRow key={obj.objectId}>
                      <TableCell className="text-success font-bold">LEND OFFER</TableCell>
                      <TableCell>{(parseInt(obj.content.fields.asset)/1e6).toFixed(2)} USDC</TableCell>
                      <TableCell><span className="text-xs bg-success/20 text-success px-2 py-1 rounded">Open</span></TableCell>
                      <TableCell className="text-right">
                          <Button size="sm" variant="destructive" onClick={() => handleCancel(obj.objectId, true)}>
                             <Trash2 className="h-4 w-4 mr-2" /> Cancel
                          </Button>
                      </TableCell>
                  </TableRow>
              ))}
              {myRequests.map((obj) => (
                  <TableRow key={obj.objectId}>
                      <TableCell className="text-warning font-bold">BORROW REQUEST</TableCell>
                      <TableCell>For {(parseInt(obj.content.fields.request_amount)/1e6).toFixed(2)} USDC</TableCell>
                      <TableCell><span className="text-xs bg-warning/20 text-warning px-2 py-1 rounded">Open</span></TableCell>
                      <TableCell className="text-right">
                          <Button size="sm" variant="destructive" onClick={() => handleCancel(obj.objectId, false)}>
                             <Trash2 className="h-4 w-4 mr-2" /> Cancel
                          </Button>
                      </TableCell>
                  </TableRow>
              ))}
            </TableBody>
          </Table>
       </Card>
    </div>
  );
}
