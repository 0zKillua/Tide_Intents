import { cn } from "@/lib/utils";

const matches = [
  { pair: "USDC/SUI", amount: "50,000", rate: "8.5%", type: "Lend" },
  { pair: "DEEP/USDC", amount: "120,000", rate: "6.2%", type: "Borrow" },
  { pair: "SUI/USDT", amount: "100,000", rate: "12.4%", type: "Lend" },
  { pair: "BTC/USDC", amount: "2.5", rate: "5.8%", type: "Borrow" },
  { pair: "USDC/DEEP", amount: "75,000", rate: "7.1%", type: "Lend" },
  { pair: "SUI/USDC", amount: "25,000", rate: "9.0%", type: "Borrow" },
];

export function LiveTicker() {
  return (
    <div className="w-full bg-surface/50 border-y border-white/5 overflow-hidden py-3 backdrop-blur-md">
      <div className="flex animate-scroll whitespace-nowrap gap-16 w-max">
        {[...matches, ...matches, ...matches].map((match, i) => ( // Triple for seamless loop
          <div key={i} className="flex items-center gap-3 text-sm">
            <span className={cn(
              "w-2 h-2 rounded-full animate-pulse",
              match.type === "Lend" ? "bg-success" : "bg-primary"
            )} />
            <span className="font-bold text-white">{match.type} Match</span>
            <span className="text-gray-400">{match.pair}</span>
            <span className="font-mono text-white">{match.amount}</span>
            <span className={cn(
              "font-mono font-medium",
              match.type === "Lend" ? "text-success" : "text-primary"
            )}>@{match.rate}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
