import { Routes, Route, Outlet } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { LandingPage, Dashboard, MarketLend, MarketBorrow, Portfolio, Analytics, FluidGlassLanding } from "@/pages";

// Wrapper for the main app layout (Navbar + Sidebar)
function AppLayout() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

function App() {
  return (
    <Routes>
      {/* Public Landing Page */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/fluid-glass" element={<FluidGlassLanding />} />
      
      {/* Protected App Routes */}
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/market/lend" element={<MarketLend />} />
        <Route path="/market/borrow" element={<MarketBorrow />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/analytics" element={<Analytics />} />
      </Route>
    </Routes>
  );
}

export default App;
