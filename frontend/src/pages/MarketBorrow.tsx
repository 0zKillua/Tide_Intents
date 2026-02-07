import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIntents } from "@/hooks/useIntents";
import { CreateIntentModal } from "@/components/modals/CreateIntentModal";
import { FillRequestModal } from "@/components/modals/FillRequestModal";
import { Filter, Plus } from "lucide-react";
import type { LendOffer } from "@/types";

export function MarketBorrow() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<LendOffer | null>(null);
  
  const { lendOffers, isLoading } = useIntents();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-bold tracking-tight text-white">Market: Borrow</h1>
           <p className="text-gray-400">Access liquidity by posting collateral instantly.</p>
        </div>
        <div className="flex items-center gap-2">
           <Button className="bg-primary text-white hover:bg-primary/90 gap-2" onClick={() => setIsCreateOpen(true)}>
             <Plus className="h-4 w-4" /> Create Request
           </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 flex gap-4 bg-surface/50 border-surface-hover items-center">
        <div className="relative flex-1 max-w-sm">
           <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
           <Input 
             placeholder="Search Assets" 
             className="pl-9 bg-background/50 border-surface-hover"
           />
        </div>
      </Card>

      {/* Order Book */}
      <Card className="bg-surface/50">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Available Liquidity</TableHead>
              <TableHead>Max LTV</TableHead>
              <TableHead>Min APR</TableHead>
              <TableHead>Max Duration</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-400">Loading Liquidity...</TableCell></TableRow>}
            
            {!isLoading && lendOffers.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-400">No active offers found.</TableCell></TableRow>
            )}

            {lendOffers.filter((obj: any) => {
              const fields = obj.content?.fields || obj;
              const assetValue = fields.asset?.fields?.value || fields.asset?.value || fields.asset || '0';
              return parseInt(assetValue) > 0;
            }).map((obj: any) => {
              // Data is in content.fields for SuiObjectData
              const fields = obj.content?.fields || obj;
              const assetValue = fields.asset?.fields?.value || fields.asset?.value || fields.asset || '0';
              const principalVal = parseInt(assetValue) / 1e6;
              const rate = parseInt(fields.min_rate_bps || '0') / 100;
              const ltv = parseInt(fields.max_ltv_bps || '0') / 100;
              const durationMs = parseInt(fields.max_duration_ms || '0');
              const days = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
              
              return (
              <TableRow key={obj.objectId || obj.id?.id}>
                 <TableCell className="font-bold text-white flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary">U</div>
                    {principalVal.toLocaleString()} USDC
                 </TableCell>
                 <TableCell><Badge variant="outline" className="text-secondary border-secondary/30">
                    {ltv}%
                 </Badge></TableCell>
                 <TableCell className="text-warning font-mono">{rate.toFixed(2)}%</TableCell>
                 <TableCell>{days}d</TableCell>
                 <TableCell className="text-right">
                    <Button size="sm" variant="default" onClick={() => setSelectedOffer(obj)}>
                      Borrow
                    </Button>
                 </TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <CreateIntentModal 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
        type="Borrow"
      />

      <FillRequestModal 
        isOpen={!!selectedOffer}
        onClose={() => setSelectedOffer(null)}
        data={selectedOffer}
        type="Borrow"
      />
    </div>
  );
}
