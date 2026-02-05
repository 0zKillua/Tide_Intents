import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
// import { mockMarketStats } from "@/data/mock";
import { ArrowDownLeft, Activity, Wallet } from "lucide-react";
import { Faucet } from "@/components/Faucet";
import { useIntents } from "@/hooks/useIntents";
import { useBalances } from "@/hooks/useBalances";

// Helper to format currency
const formatUSD = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
};

export function Dashboard() {
  const { lendOffers, borrowRequests, isLoading } = useIntents();
  const { balances, isLoading: loadingBalances } = useBalances();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
        <p className="text-gray-400">Your command center for localized lending markets.</p>
      </div>

      {/* User Balances Card */}
      <Card className="border-primary/30 bg-gradient-to-br from-surface to-background">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" /> Your Balances
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingBalances ? (
            <p className="text-gray-500">Loading balances...</p>
          ) : Object.keys(balances).length === 0 ? (
            <p className="text-gray-500">Connect wallet or use Faucet to get tokens.</p>
          ) : (
            <div className="flex flex-wrap gap-6 pt-2">
              {Object.entries(balances).map(([symbol, data]) => (
                <div key={symbol} className="flex flex-col">
                  <span className="text-xs text-gray-400">{symbol}</span>
                  <span className="text-2xl font-bold text-white font-mono">
                    {data.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Faucet />

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-success">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Active Offers</CardTitle>
            <Activity className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{lendOffers.length}</div>
            <p className="text-xs text-gray-400">Waiting for borrowers</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-warning">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Active Requests</CardTitle>
            <ArrowDownLeft className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{borrowRequests.length}</div>
            <p className="text-xs text-gray-400">Waiting for lenders</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-1">
        
        {/* Active Borrow Requests (from Chain) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Live Borrow Requests</h2>
          </div>
          <Card className="bg-surface/50">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Borrower</TableHead>
                  <TableHead>Principal Needed</TableHead>
                  <TableHead>Collateral Offered</TableHead>
                  <TableHead>Max Rate</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && <TableRow><TableCell colSpan={6}>Loading on-chain data...</TableCell></TableRow>}
                {!isLoading && borrowRequests.length === 0 && (
                   <TableRow><TableCell colSpan={6}>No active borrow requests found.</TableCell></TableRow>
                )}
                {borrowRequests.map((obj: any) => {
                  const fields = obj.content.fields;
                  const principalVal = parseInt(fields.request_amount) / 1e6; // Assuming USDC
                  const collateralVal = parseInt(fields.collateral) / 1e8; // Assuming BTC
                  const rate = parseInt(fields.max_rate_bps) / 100;
                  const days = parseInt(fields.duration_ms) / (1000 * 60 * 60 * 24);
                  
                  return (
                  <TableRow key={obj.objectId}>
                    <TableCell className="font-mono text-xs">{fields.borrower.slice(0, 6)}...{fields.borrower.slice(-4)}</TableCell>
                    <TableCell className="font-bold">{formatUSD(principalVal)} USDC</TableCell>
                    <TableCell>{collateralVal} BTC</TableCell>
                    <TableCell className="text-warning">{rate}%</TableCell>
                    <TableCell>{days.toFixed(1)} days</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="default">Lend</Button>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </div>

        {/* Active Lend Offers (from Chain) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Live Lend Offers</h2>
          </div>
          <Card className="bg-surface/50">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lender</TableHead>
                  <TableHead>Amount Available</TableHead>
                  <TableHead>Min Rate</TableHead>
                  <TableHead>LTV</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && <TableRow><TableCell colSpan={6}>Loading on-chain data...</TableCell></TableRow>}
                {!isLoading && lendOffers.length === 0 && (
                   <TableRow><TableCell colSpan={6}>No active lend offers found.</TableCell></TableRow>
                )}
                {lendOffers.map((obj: any) => {
                  const fields = obj.content.fields;
                  const principalVal = parseInt(fields.asset) / 1e6; // Assuming USDC
                  const rate = parseInt(fields.min_rate_bps) / 100;
                  const ltv = parseInt(fields.max_ltv_bps) / 100;
                  
                  return (
                  <TableRow key={obj.objectId}>
                    <TableCell className="font-mono text-xs">{fields.provider.slice(0, 6)}...{fields.provider.slice(-4)}</TableCell>
                    <TableCell className="font-bold text-success">{formatUSD(principalVal)} USDC</TableCell>
                    <TableCell>{rate}%</TableCell>
                    <TableCell>{ltv}%</TableCell>
                    <TableCell>Max {fields.max_duration_ms} ms</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="secondary">Borrow</Button>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </div>

      </div>
    </div>
  );
}
