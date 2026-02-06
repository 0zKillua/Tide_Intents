import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { LiveTicker } from "@/components/ui/LiveTicker";
import { FloatingTags } from "@/components/ui/FloatingTags";
import { CosmicBackground } from "@/components/ui/CosmicBackground";
import { InteractiveProtocolFlow } from "@/components/landing/InteractiveProtocolFlow";

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

      {/* Protocol Explainer / Features */}
      <InteractiveProtocolFlow />
      
      <footer className="py-8 text-center text-gray-500 text-sm">
        © 2026 Tide Protocol. Built on Sui.
      </footer>
    </div>
  );
}

