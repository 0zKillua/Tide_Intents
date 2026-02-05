import { useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIntents } from "@/hooks/useIntents";
import { CreateIntentModal } from "@/components/modals/CreateIntentModal";
import { FillRequestModal } from "@/components/modals/FillRequestModal";
import { Filter, Plus } from "lucide-react";
import type { BorrowRequest } from "@/types";

export function MarketLend() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<BorrowRequest | null>(
    null,
  );

  // Real Data
  const { borrowRequests, isLoading } = useIntents();

  // Filter state
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRequests = borrowRequests.filter((_req) => {
    // Search Logic (Mock for now since we need to decode coin types)
    // Assuming req structure matches our types, but we need to verify mapping
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Market: Lend
          </h1>
          <p className="text-gray-400">
            Earn fixed yield by filling open borrow requests.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            className="bg-primary text-black hover:bg-primary/90 gap-2"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="h-4 w-4" /> Create Offer
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 flex gap-4 bg-surface/50 border-surface-hover items-center">
        <div className="relative flex-1 max-w-sm">
          <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Filter by Collateral (e.g. SUI)"
            className="pl-9 bg-background/50 border-surface-hover"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {/* Mock filters */}
          <Button
            variant="outline"
            size="sm"
            className="border-surface-hover text-gray-400"
          >
            Duration: Any
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-surface-hover text-gray-400"
          >
            APY: &gt; 5%
          </Button>
        </div>
      </Card>

      {/* Order Book */}
      <Card className="bg-surface/50">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Collateral</TableHead>
              <TableHead>Requesting</TableHead>
              <TableHead>LTV</TableHead>
              <TableHead>APR</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-gray-400"
                >
                  Loading Market Data...
                </TableCell>
              </TableRow>
            )}

            {!isLoading && filteredRequests.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-gray-400"
                >
                  No active requests found.
                </TableCell>
              </TableRow>
            )}

            {filteredRequests.map((req: any) => {
              if (req.content?.dataType !== "moveObject") return null;
              const fields = req.content.fields;

              // Safe parsing
              const collateralVal = parseInt(fields.collateral || "0") / 1e8; // Assuming BTC (8 decimals)
              const requestAmount =
                parseInt(fields.request_amount || "0") / 1e6; // Assuming USDC (6 decimals)
              const ltv = parseInt(fields.min_ltv_bps || "0") / 100;
              const apr = parseInt(fields.max_rate_bps || "0") / 100;
              const durationDays = Math.ceil(
                parseInt(fields.duration_ms || "0") / (1000 * 60 * 60 * 24),
              );

              return (
                <TableRow key={req.objectId}>
                  <TableCell className="font-bold text-white flex items-center gap-2">
                    {/* Placeholder parsing until we sync types */}
                    <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center text-xs text-secondary">
                      C
                    </div>
                    {collateralVal.toFixed(4)} Collateral
                  </TableCell>
                  <TableCell>{requestAmount.toFixed(2)} USDC</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="text-success border-success/30"
                    >
                      {ltv}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-success font-mono">
                    {apr.toFixed(2)}%
                  </TableCell>
                  <TableCell>{durationDays}d</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => setSelectedRequest(req)}
                    >
                      Fill Request
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
        type="Lend"
      />

      <FillRequestModal
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        data={selectedRequest}
        type="Lend"
      />
    </div>
  );
}
