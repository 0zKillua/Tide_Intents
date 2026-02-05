export { Dashboard } from "./Dashboard";
export { MarketLend } from "./MarketLend";
export { MarketBorrow } from "./MarketBorrow";
export { LandingPage } from "./LandingPage";
export { MyIntents } from "./MyIntents";
export { FluidGlassLanding } from "./FluidGlassLanding";

// Placeholder Pages

export function Analytics() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
      <p className="text-gray-400">Protocol-wide statistics.</p>
    </div>
  )
}
