import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Waves, Shield, Zap, ShieldOff } from "lucide-react";
import { LiveTicker } from "@/components/ui/LiveTicker";
import { FloatingTags } from "@/components/ui/FloatingTags";
import { CosmicBackground } from "@/components/ui/CosmicBackground";

export function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background selection:bg-secondary/30 text-white relative overflow-hidden">
       {/* Cosmic Background */}
       <CosmicBackground />





      {/* Simplified Navbar for Landing */}
      <nav className="h-16 px-6 flex items-center justify-between sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-8 h-8">
              <div className="absolute inset-0 bg-primary/20 rounded-lg rotate-3" />
               <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5 text-primary relative z-10"
              >
                <path d="M2 12h5" />
                <path d="M17 12h5" />
                <path d="M7 12c0 2.5 1.5 4 3 4s3-1.5 3-4-1.5-4-3-4-3 1.5-3 4z" />
                <path d="M11 12c0-2.5 1.5-4 3-4s3 1.5 3 4-1.5 4-3 4-3-1.5-3-4z" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Tide
            </span>
        </div>
        <Link to="/dashboard">
          <Button className="bg-primary text-black hover:bg-primary/90 font-semibold shadow-md shadow-primary/10">
            Launch App
          </Button>
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="relative flex-1 flex flex-col items-center justify-center text-center px-4 pt-32 pb-20 overflow-hidden">
        {/* Floating Highlights - contained within hero */}
        <FloatingTags />
        
        {/* Background Gradients */}
        
        <div className="space-y-8 max-w-4xl relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface/80 border border-surface-hover text-sm text-secondary mb-4 backdrop-blur-md shadow-lg shadow-black/20">
             <span className="flex h-2 w-2 rounded-full bg-secondary animate-ping" />
             Live on Sui Testnet
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white drop-shadow-sm leading-tight">
            Liquidity that moves <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary bg-300% animate-gradient">
              with the Tide.
            </span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            The first intent-centric lending protocol on Sui. Match directly with lenders and borrowers. Zero spread. Instant execution.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link to="/dashboard">
              <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-primary text-black hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all hover:scale-105 hover:shadow-primary/40">
                Launch App <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full border-surface-hover hover:bg-surface-hover text-white backdrop-blur-md">
              Read Docs
            </Button>
          </div>
        </div>
      </section>

      {/* Live Ticker */}
      <div className="pb-12">
        <LiveTicker />
      </div>

      {/* Features Grid */}
      <section className="py-24 px-6 bg-surface/30 border-t border-surface-hover">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-4 p-6 rounded-2xl bg-surface/50 border border-white/5 hover:border-secondary/50 transition-colors group">
            <div className="w-12 h-12 rounded-lg bg-secondary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Zap className="h-6 w-6 text-secondary" />
            </div>
            <h3 className="text-xl font-bold text-white">Instant Matching</h3>
            <p className="text-gray-400 text-sm">
              Off-chain solvers match intents in milliseconds, settling atomically on Sui.
            </p>
          </div>
          <div className="space-y-4 p-6 rounded-2xl bg-surface/50 border border-white/5 hover:border-primary/50 transition-colors group">
             <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Waves className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-white">Fluid Liquidity</h3>
            <p className="text-gray-400 text-sm">
              No spread. Dynamic rates. Pure market efficiency.
            </p>
          </div>
          <div className="space-y-4 p-6 rounded-2xl bg-surface/50 border border-white/5 hover:border-success/50 transition-colors group">
             <div className="w-12 h-12 rounded-lg bg-success/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Shield className="h-6 w-6 text-success" />
            </div>
            <h3 className="text-xl font-bold text-white">Isolated Risk</h3>
            <p className="text-gray-400 text-sm">
              Bilateral loans. <strong>No bad debt socialization.</strong>
            </p>
          </div>
          <div className="space-y-4 p-6 rounded-2xl bg-gradient-to-br from-destructive/10 to-surface/50 border border-destructive/30 hover:border-destructive/50 transition-colors group">
             <div className="w-12 h-12 rounded-lg bg-destructive/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShieldOff className="h-6 w-6 text-destructive" />
            </div>
            <h3 className="text-xl font-bold text-white">No Shared Pools</h3>
            <p className="text-gray-400 text-sm">
              Pools enable exploits. Tide has none. <strong>Inherently secure.</strong>
            </p>
          </div>
        </div>
      </section>
      
      <footer className="py-8 text-center text-gray-500 text-sm">
        © 2026 Tide Protocol. Built on Sui.
      </footer>
    </div>
  );
}

