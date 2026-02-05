import { motion } from "framer-motion";
import { ArrowRight, Droplets } from "lucide-react";

export function FluidGlassLanding() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#020b2d] font-sans text-white selection:bg-cyan-500/30">
      
      {/* Background Gradient - Intensified Central Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#0f2852] via-[#020b2d] to-[#020b2d] opacity-90" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[800px] bg-cyan-900/10 blur-[120px] rounded-full" />

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-6 md:px-12">
        <div className="md:w-32" /> {/* Spacer for centering */}
        
        {/* Centered Logo */}
        <div className="absolute left-1/2 top-6 -translate-x-1/2 flex items-center gap-2">
            <Droplets className="h-6 w-6 text-white" />
            <span className="text-lg font-semibold tracking-wide">Built on Sui</span>
        </div>

        {/* Right Actions */}
        <div className="ml-auto w-auto flex justify-end gap-3 md:w-32 md:gap-4">
            <button className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-900 transition-all hover:bg-cyan-300 hover:shadow-[0_0_20px_rgba(34,211,238,0.5)]">
                Launch App
            </button>
             <button className="hidden rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10 md:block">
                Read Docs
            </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="relative z-10 flex min-h-[85vh] flex-col items-center pt-20 text-center">
        
        {/* Headlines - Size Reduced and Spaced */}
        <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative z-30 max-w-4xl px-4 mt-8 md:mt-16"
        >
          <h1 className="text-4xl font-bold tracking-tight text-white/90 drop-shadow-sm md:text-6xl lg:text-7xl">
            Your Intents,<br />
            Matched by the {" "}
            <span className="bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent font-extrabold shadow-cyan-500/50 drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]">
              Tide.
            </span>
          </h1>
          
          <p className="mx-auto mt-6 max-w-xl text-base text-slate-400 md:text-lg lg:text-xl font-light">
            The first intent-centric lending protocol on Sui. Match directly
            with lenders and borrowers. Zero spread. Instant execution.
          </p>
        </motion.div>

        {/* Central Ribbon Wave - Thickened */}
        <div className="absolute top-[55%] left-0 right-0 -translate-y-1/2 w-full h-[500px] pointer-events-none z-0">
             <RibbonWave />
        </div>
        
        {/* Floating Constellation (Repositioned to avoid text) */}
        <div className="absolute top-[50%] left-0 right-0 -translate-y-1/2 w-full h-[500px] z-20 pointer-events-none max-w-[1400px] mx-auto">
             <FloatingConstellation />
        </div>

        {/* Bottom Actions */}
        <div className="mt-auto mb-16 flex flex-col items-center gap-8 z-30">
            <div className="flex flex-col gap-4 sm:flex-row">
                 <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="group relative flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-900 to-cyan-700 px-8 py-3 text-lg font-semibold text-cyan-50 shadow-[0_0_20px_-5px_rgba(34,211,238,0.4)] transition-all hover:shadow-[0_0_30px_-5px_rgba(34,211,238,0.6)] border border-cyan-500/30"
                    >
                    Launch App
                    <ArrowRight className="h-5 w-5" />
                </motion.button>
                
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="rounded-full bg-[#0f172a] px-8 py-3 text-lg font-semibold text-white border border-slate-700 hover:border-slate-500 transition-colors"
                >
                    Read Docs
                </motion.button>
            </div>
            
            <div className="flex gap-6 text-sm text-slate-500">
                <a href="#" className="hover:text-cyan-400 transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-cyan-400 transition-colors">Terms of Service</a>
            </div>
        </div>

      </main>
      
      {/* Overlay to fade bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#020b2d] to-transparent pointer-events-none z-0" />
    </div>
  );
}

function RibbonWave() {
    return (
        <div className="relative w-full h-full flex items-center">
            <svg className="w-full h-full" viewBox="0 0 1440 500" preserveAspectRatio="none">
                 <defs>
                    <linearGradient id="ribbon-gradient-main" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="rgba(45, 212, 191, 0.4)" />
                        <stop offset="50%" stopColor="rgba(34, 211, 238, 0.8)" />
                        <stop offset="100%" stopColor="rgba(59, 130, 246, 0.4)" />
                    </linearGradient>
                    <linearGradient id="ribbon-gradient-glow" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="rgba(34, 211, 238, 0.1)" />
                        <stop offset="100%" stopColor="rgba(59, 130, 246, 0.1)" />
                    </linearGradient>
                 </defs>

                 {/* Wave 3: Background Volume (Thicker) */}
                 <motion.path 
                    d="M0,250 C200,350 600,150 1000,250 C1300,320 1440,250 1440,250 V450 H0 Z"
                    fill="url(#ribbon-gradient-glow)"
                    className="blur-2xl"
                    animate={{
                        d: [
                            "M0,250 C250,380 650,120 1050,280 C1350,320 1440,250 1440,250 V450 H0 Z",
                            "M0,250 C200,350 600,150 1000,250 C1300,320 1440,250 1440,250 V450 H0 Z",
                            "M0,250 C250,380 650,120 1050,280 C1350,320 1440,250 1440,250 V450 H0 Z"
                        ]
                    }}
                    transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
                 />

                 {/* Wave 1: Main Cyan Flow (Middle Body) */}
                 <motion.path 
                    d="M0,250 C300,150 600,350 900,250 C1200,150 1440,250 1440,250 V380 H0 Z"
                    fill="url(#ribbon-gradient-main)"
                    className="opacity-70 mix-blend-screen"
                    animate={{
                        d: [
                            "M0,250 C360,180 720,320 1080,250 C1260,200 1440,250 1440,250 V380 H0 Z",
                            "M0,250 C300,150 600,350 900,250 C1200,150 1440,250 1440,250 V380 H0 Z",
                             "M0,250 C360,180 720,320 1080,250 C1260,200 1440,250 1440,250 V380 H0 Z"
                        ]
                    }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                 />
                 
                 {/* Wave 2: Top Edge Highlight (Stroke) - Thicker, distinct */}
                 <motion.path 
                    d="M0,250 C360,180 720,320 1080,250 C1260,200 1440,250"
                    fill="none"
                    stroke="rgba(207, 250, 254, 0.9)"
                    strokeWidth="3"
                    filter="drop-shadow(0 0 8px rgba(34,211,238,0.8))"
                    animate={{
                         d: [
                            "M0,250 C360,180 720,320 1080,250 C1260,200 1440,250",
                            "M0,250 C300,150 600,350 900,250 C1200,150 1440,250",
                             "M0,250 C360,180 720,320 1080,250 C1260,200 1440,250"
                        ]
                    }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                 />
            </svg>
        </div>
    )
}


function FloatingConstellation() {
  const features = [
    // Left Group (Pushed further left)
    { label: "United Decilization", x: "12%", y: "42%" }, 
    { label: "No Bad Debt Socialization", x: "25%", y: "65%" },
    
    // Right Group (Pushed further right)
    { label: "Move Secured", x: "65%", y: "75%" },
    { label: "P2P Matching", x: "82%", y: "38%" },
    { label: "Isolated Risk", x: "88%", y: "60%" },
  ];

  return (
    <div className="relative h-full w-full">
      {features.map((feature, i) => (
        <FloatingPill key={i} {...feature} index={i} />
      ))}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
            {/* Subtle connection lines matching the new pill positions */}
            <path d="M180,220 Q400,320 800,350" stroke="white" fill="none" strokeWidth="0.5" />
            <path d="M900,200 Q1100,280 1300,300" stroke="white" fill="none" strokeWidth="0.5" />
      </svg>
    </div>
  );
}

function FloatingPill({ label, x, y, index }: { label: string; x: string; y: string, index: number }) {
  return (
    <motion.div
      style={{ left: x, top: y }}
      className="absolute z-40"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        y: [0, -8, 0],
      }}
      transition={{
        opacity: { duration: 0.5, delay: index * 0.1 },
        y: {
            duration: 3 + index,
            repeat: Infinity,
            ease: "easeInOut",
            delay: index * 0.5,
        }
      }}
    >
        <div className="group flex items-center">
            {/* The Dot */}
            <div className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,1)] mr-0 z-10" />
            {/* The Line Connector (Horizontal) */}
            <div className="h-[1px] w-8 bg-gradient-to-r from-cyan-400/50 to-white/20 transition-all group-hover:w-12 group-hover:to-white/40" />
            
            {/* The Pill */}
            <div className="rounded-full border border-white/20 bg-white/5 px-4 py-2 backdrop-blur-md transition-all hover:border-cyan-400/50 hover:bg-cyan-900/40 hover:shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                <span className="text-sm font-medium text-slate-100 whitespace-nowrap">{label}</span>
            </div>
      </div>
    </motion.div>
  );
}
