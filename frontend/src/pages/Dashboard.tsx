import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
// import { mockMarketStats } from "@/data/mock";
import { ArrowDownLeft, Activity, Wallet } from "lucide-react";
import { Faucet } from "@/components/Faucet";
import { useIntents } from "@/hooks/useIntents";
import { useBalances } from "@/hooks/useBalances";
import { TIDE_CONFIG } from "@/tide_config";

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

  const activeLendOffers = lendOffers.filter((obj: any) => {
    const fields = obj.content.fields;
    const asset = fields.asset?.fields?.value || fields.asset?.value || fields.asset || '0';
    return parseInt(asset) > 0;
  });

  const activeBorrowRequests = borrowRequests.filter((obj: any) => {
    const fields = obj.content.fields;
    const collateral = fields.collateral?.fields?.value || fields.collateral || '0';
    return parseInt(collateral) > 0;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
        <p className="text-gray-400">Your command center for localized lending markets.</p>
      </div>

      {/* DeepBook Market Info */}
      <div className="relative group p-1 rounded-xl overflow-hidden">
         {/* Animated Border Tracer */}
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[500%] bg-[conic-gradient(from_0deg,transparent_0_140deg,#ffffff_180deg,transparent_180deg_320deg,#ffffff_360deg)] animate-spin opacity-100" style={{ animationDuration: '4s' }} />
         
         <Card className="relative h-full bg-gradient-to-r from-blue-600 to-blue-500 text-white border-0 shadow-lg rounded-xl overflow-hidden">
             {/* Background Watermark */}
             <div className="absolute -right-8 -bottom-12 opacity-10 rotate-12 pointer-events-none">
                 <img src="/deepbook-logo-v3.png" alt="DeepBook Watermark" className="w-64 h-64 object-contain grayscale brightness-200" />
             </div>
             
             <CardContent className="p-6 relative z-10">
                 <div className="flex flex-col gap-6">
                     <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                            <div className="bg-white p-1.5 rounded-lg shadow-sm">
                               <Activity className="text-primary w-6 h-6" />
                            </div>
                            Active Markets
                        </h2>
                        <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm border border-white/10">1 Active Pair</span>
                     </div>

                     <div className="grid gap-3">
                        {/* DeepBook SUI/USDC Pool Item */}
                        <div className="group/item flex flex-col md:flex-row items-start md:items-center justify-between bg-black/20 hover:bg-black/30 transition-colors p-4 rounded-xl border border-white/10 backdrop-blur-md">
                            <div className="flex items-center gap-4">
                                <div className="bg-white p-1.5 rounded-lg shadow-sm h-10 w-10 flex items-center justify-center">
                                    <img src="/deepbook-logo-v3.png" alt="DeepBook" className="w-full h-full object-contain" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-lg tracking-tight">SUI / MOCK_USDC</span>
                                        <span className="text-[10px] uppercase font-bold tracking-wider bg-blue-400/20 text-blue-100 px-1.5 py-0.5 rounded border border-blue-400/30">V3 CLOB</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-blue-100/80">
                                        <span>Tick Size: 0.000000001</span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1 text-blue-300"><div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" /> Live</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-3 md:mt-0 flex flex-col items-start md:items-end gap-1">
                                 <div className="text-[10px] uppercase font-bold tracking-wider text-blue-200/70">DeepBook Pool ID</div>
                                 <div className="font-mono text-xs bg-black/40 px-3 py-1.5 rounded-lg text-blue-100 border border-white/5 select-all hover:bg-black/60 transition-colors cursor-copy opacity-80 group-hover/item:opacity-100">
                                     {TIDE_CONFIG.DEEPBOOK.SUI_USDC_POOL}
                                 </div>
                            </div>
                        </div>
                     </div>
                 </div>
             </CardContent>
          </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User Balances Card */}
          <Card className="border-primary/30 bg-gradient-to-br from-surface to-background h-full">
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
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Active Offers</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{activeLendOffers.length}</div>
            <p className="text-xs text-gray-400">Waiting for borrowers</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-warning">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Active Requests</CardTitle>
            <ArrowDownLeft className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{activeBorrowRequests.length}</div>
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
                {!isLoading && activeBorrowRequests.length === 0 && (
                   <TableRow><TableCell colSpan={6}>No active borrow requests found.</TableCell></TableRow>
                )}
                {activeBorrowRequests.map((obj: any) => {
                  const fields = obj.content.fields;
                  const principalVal = parseInt(fields.request_amount) / 1e6; // Assuming USDC
                  const collateralRaw = fields.collateral?.fields?.value || fields.collateral || '0';
                  // Check type for decimals. Assuming BTC is 8 decimals? Or SUI?
                  // Let's check type.
                  const typeString = obj.content?.type || "";
                  const isSui = typeString.includes("0x2::sui::SUI");
                  const decimals = isSui ? 1e9 : 1e8; // Default 1e8 for others?
                  
                  const collateralVal = parseInt(collateralRaw) / decimals;
                  const rate = parseInt(fields.max_rate_bps) / 100;
                  const days = parseInt(fields.duration_ms) / (1000 * 60 * 60 * 24);
                  
                  return (
                  <TableRow key={obj.objectId}>
                    <TableCell className="font-mono text-xs">{fields.borrower.slice(0, 6)}...{fields.borrower.slice(-4)}</TableCell>
                    <TableCell className="font-bold">{formatUSD(principalVal)} USDC</TableCell>
                    <TableCell>{collateralVal.toFixed(4)} {isSui ? "SUI" : "BTC"}</TableCell>
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
                {!isLoading && lendOffers.filter((obj: any) => {
                    const fields = obj.content.fields;
                    const asset = fields.asset?.fields?.value || fields.asset?.value || fields.asset || '0';
                    return parseInt(asset) > 0;
                }).length === 0 && (
                   <TableRow><TableCell colSpan={6}>No active lend offers found.</TableCell></TableRow>
                )}
                {lendOffers.filter((obj: any) => {
                    const fields = obj.content.fields;
                    const asset = fields.asset?.fields?.value || fields.asset?.value || fields.asset || '0';
                    return parseInt(asset) > 0;
                }).map((obj: any) => {
                  const fields = obj.content.fields;
                  const assetRaw = fields.asset?.fields?.value || fields.asset?.value || fields.asset || '0';
                  const principalVal = parseInt(assetRaw) / 1e6; // Assuming USDC
                  const rate = parseInt(fields.min_rate_bps) / 100;
                  const ltv = parseInt(fields.max_ltv_bps) / 100;
                  
                  return (
                  <TableRow key={obj.objectId}>
                    <TableCell className="font-mono text-xs">{fields.provider.slice(0, 6)}...{fields.provider.slice(-4)}</TableCell>
                    <TableCell className="font-bold text-primary">{formatUSD(principalVal)} USDC</TableCell>
                    <TableCell>{rate}%</TableCell>
                    <TableCell>{ltv}%</TableCell>
                    <TableCell>Max {fields.max_duration_ms} ms</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="default">Borrow</Button>
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
