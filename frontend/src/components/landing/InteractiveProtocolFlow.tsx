import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, 
  FileCode, 
  Server, 
  Database, 
  ArrowRight,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

// Steps mimicking the actual Move lifecycle
const FLOW_STEPS = [
  {
    id: "submit",
    label: "Submit Intent",
    description: "User submits a 'LendOffer' or 'BorrowRequest'. This creates a Shared Object on-chain, visible to the entire network.",
    targetNode: "contract"
  },
  {
    id: "monitor",
    label: "Solvers Monitor",
    description: "Off-chain solvers detect the new event. They compute the optimal match without user intervention.",
    targetNode: "solvers"
  },
  {
    id: "match",
    label: "Execute Match",
    description: "Solvers execute the match. Code verifies the trade and updates the Tide Protocol state.",
    targetNode: "contract"
  },
  {
    id: "settle",
    label: "DeepBook Settlement",
    description: "DeepBook V3 handles liquidations and collateral repayment. Your collateral is never idle—it powers the most efficient order book on Sui.",
    targetNode: "deepbook"
  }
];

export function InteractiveProtocolFlow() {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % FLOW_STEPS.length);
    }, 5000); 
    return () => clearInterval(interval);
  }, [isPlaying]);

  const step = FLOW_STEPS[activeStep];

  return (
    <section className="py-24 px-4 bg-[#02040A] relative overflow-hidden">
      
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full" />
          <div className="absolute bottom-[20%] right-[10%] w-[600px] h-[600px] bg-secondary/5 blur-[100px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10 flex flex-col lg:flex-row gap-16 items-center">
        
        <div className="flex-1 space-y-8 max-w-xl">
           <div>
               <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
                 How <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Tide</span> Works
               </h2>
               <p className="text-gray-400 text-lg leading-relaxed">
                 A fully on-chain intent execution layer. Experience instant matching and smart collateral management.
               </p>
           </div>

           <div className="space-y-4">
             {FLOW_STEPS.map((s, idx) => (
               <button
                 key={s.id}
                 onClick={() => { setActiveStep(idx); setIsPlaying(false); }}
                 className={cn(
                   "w-full text-left p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden group",
                   activeStep === idx 
                     ? "bg-white/5 border-primary/50 shadow-[0_0_20px_rgba(0,242,234,0.15)]" 
                     : "bg-transparent border-white/5 hover:bg-white/5"
                 )}
               >
                 <div className="flex items-center gap-5 relative z-10">
                    <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border transition-colors shrink-0",
                        activeStep === idx ? "bg-primary text-black border-primary" : "bg-transparent text-gray-500 border-gray-700"
                    )}>
                        {idx + 1}
                    </div>
                    <div>
                        <h3 className={cn("font-bold text-lg transition-colors", activeStep === idx ? "text-white" : "text-gray-400 group-hover:text-gray-300")}>
                            {s.label}
                        </h3>
                    </div>
                 </div>
                 
                 {activeStep === idx && isPlaying && (
                    <motion.div 
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 5, ease: "linear" }}
                        className="absolute bottom-0 left-0 h-0.5 bg-primary"
                    />
                 )}
               </button>
             ))}
           </div>
        </div>

        <div className="flex-1 w-full flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[650px] aspect-[4/3] bg-surface/20 rounded-[32px] border border-white/10 backdrop-blur-2xl p-6 shadow-2xl flex flex-col">
                 
                 {/* Top Info Card */}
                 <div className="relative z-20 mb-4 h-16">
                     <AnimatePresence mode="wait">
                         <motion.div
                            key={activeStep}
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            transition={{ duration: 0.2 }}
                            className="px-5 py-3 rounded-xl bg-[#0A0C14]/90 border border-white/10 shadow-lg backdrop-blur-md inline-block max-w-md"
                         >
                            <div className="flex items-center gap-2 mb-1 text-primary text-[10px] font-mono uppercase tracking-widest">
                                <Zap className="w-3 h-3" />
                                {step.label}
                            </div>
                            <p className="text-gray-200 text-sm leading-snug">
                                {step.description}
                            </p>
                         </motion.div>
                     </AnimatePresence>
                 </div>

                 {/* Graph Container */}
                 <div className="flex-1 w-full h-full relative -mt-4">
                    <ProtocolGraph activeStep={activeStep} />
                 </div>
            </div>
        </div>

      </div>
    </section>
  );
}

function ProtocolGraph({ activeStep }: { activeStep: number }) {
    // UPDATED POSITIONS: Moved Solvers and DeepBook LEFT to make room for badges
    const POS = {
        user: { x: 50, y: 60 },
        solvers: { x: 220, y: 60 },     // Moved from 240
        contract: { x: 50, y: 200 },
        deepbook: { x: 220, y: 200 },   // Moved from 240
    };

    return (
        // Increased viewBox width to 350 to allow overflow on the right
        <svg className="w-full h-full" viewBox="0 0 350 300" preserveAspectRatio="xMidYMid meet">
            <defs>
                <linearGradient id="grad-line" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00F2EA" stopOpacity="0" />
                    <stop offset="50%" stopColor="#00F2EA" />
                    <stop offset="100%" stopColor="#00F2EA" stopOpacity="0" />
                </linearGradient>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            <Connection start={POS.user} end={POS.contract} isActive={activeStep === 0} direction="down" />
            <Connection start={POS.contract} end={POS.solvers} isActive={activeStep === 1} direction="diagonal-up" />
            <Connection start={POS.solvers} end={POS.contract} isActive={activeStep === 2} direction="diagonal-down" />
            <Connection start={POS.contract} end={POS.deepbook} isActive={activeStep === 3} direction="right" isDouble />

            <GraphNode 
                x={POS.user.x} y={POS.user.y} 
                icon={User} label="User" 
                isActive={activeStep === 0} 
            />

            <GraphNode 
                x={POS.contract.x} y={POS.contract.y} 
                icon={FileCode} label="Tide Protocol" 
                subLabel="Shared Object"
                isActive={activeStep === 0 || activeStep === 2 || activeStep === 3} 
                size="large"
            />

            <GraphNode 
                x={POS.solvers.x} y={POS.solvers.y} 
                icon={Server} label="Solvers" 
                isActive={activeStep === 1 || activeStep === 2} 
            />

            {/* DeepBook Node Group */}
            <g>
                <GraphNode 
                    x={POS.deepbook.x} y={POS.deepbook.y} 
                    icon={Database} 
                    label="DeepBook V3" 
                    isActive={activeStep === 3} 
                    size="large"
                    highlightColor="text-blue-400"
                />
                
                {/* Powered By Label (Static) */}
                <foreignObject x={POS.deepbook.x - 60} y={POS.deepbook.y + 45} width={120} height={30}>
                    <div className="flex justify-center">
                        <span className="text-[10px] font-bold text-blue-400/80 tracking-widest uppercase bg-blue-900/10 px-2 py-0.5 rounded border border-blue-500/20">
                            Powered By
                        </span>
                    </div>
                </foreignObject>

                {/* Feature Badges - Shifted Right */}
                <AnimatePresence>
                    {activeStep === 3 && (
                        <>
                            <motion.g 
                                initial={{ opacity: 0, x: -10 }} 
                                animate={{ opacity: 1, x: 0 }} 
                                exit={{ opacity: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <FeatureBadge x={POS.deepbook.x + 50} y={POS.deepbook.y - 30} label="Smart Collateral" subLabel="Earns Yield" />
                            </motion.g>
                            <motion.g 
                                initial={{ opacity: 0, x: -10 }} 
                                animate={{ opacity: 1, x: 0 }} 
                                exit={{ opacity: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                <FeatureBadge x={POS.deepbook.x + 50} y={POS.deepbook.y + 15} label="Repay Loan" subLabel="with Collateral" />
                            </motion.g>
                        </>
                    )}
                </AnimatePresence>
            </g>

        </svg>
    )
}

function FeatureBadge({ x, y, label, subLabel }: { x: number, y: number, label: string, subLabel?: string }) {
    return (
        <foreignObject x={x} y={y} width={140} height={50} className="overflow-visible">
            <div className="flex flex-col items-start justify-center gap-0.5">
                <div className="bg-[#1e293b] border border-blue-500/40 px-3 py-1.5 rounded-lg shadow-xl flex items-center gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse shrink-0" />
                     <div className="flex flex-col leading-none">
                         <span className="text-[10px] font-bold text-white whitespace-nowrap">{label}</span>
                         {subLabel && <span className="text-[8px] text-blue-300 whitespace-nowrap">{subLabel}</span>}
                     </div>
                </div>
            </div>
        </foreignObject>
    )
}

function Connection({ start, end, isActive, direction }: any) {
    
    let pathD = `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
    // Simple logic for curve vs straight
    // Avoid curving vertical lines excessively
    if (direction === "diagonal-up" || direction === "diagonal-down") {
         // pathD = `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`; 
    }

    return (
        <g>
            <path d={pathD} stroke="rgba(255,255,255,0.05)" strokeWidth="2" fill="none" />
            {isActive && (
                <motion.path
                    d={pathD}
                    stroke="url(#grad-line)"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray="20 100" // Dashed pattern
                    animate={{ strokeDashoffset: [100, -100] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    filter="url(#glow)"
                />
            )}
        </g>
    )
}

function GraphNode({ x, y, icon: Icon, label, subLabel, isActive, size = "normal", highlightColor }: any) {
    
    return (
        <foreignObject x={x - 50} y={y - 50} width={100} height={100}>
            <div className="flex flex-col items-center justify-center h-full"> 
                <motion.div 
                    animate={{ 
                        scale: isActive ? 1.1 : 1,
                        borderColor: isActive ? (highlightColor ? "rgba(96, 165, 250, 0.8)" : "rgba(0, 242, 234, 0.8)") : "rgba(255,255,255,0.1)",
                        backgroundColor: isActive ? (highlightColor ? "rgba(30, 64, 175, 0.2)" : "rgba(0, 242, 234, 0.1)") : "rgba(0,0,0,0.5)",
                        boxShadow: isActive ? (highlightColor ? "0 0 20px rgba(59,130,246,0.3)" : "0 0 20px rgba(0,242,234,0.3)") : "none"
                    }}
                    className={cn(
                        "rounded-full border backdrop-blur-md flex items-center justify-center transition-all duration-500",
                        size === "large" ? "w-20 h-20" : "w-14 h-14"
                    )}
                >
                    <Icon className={cn(
                        "transition-all duration-500", 
                        size === "large" ? "w-8 h-8" : "w-6 h-6", 
                        isActive ? (highlightColor ? "text-blue-400" : "text-primary") : "text-gray-500"
                    )} />
                </motion.div>
                <div className="mt-3 text-center">
                    <p className={cn(
                        "text-[11px] font-bold uppercase tracking-wider transition-colors duration-300", 
                        isActive ? "text-white" : "text-gray-600"
                    )}>
                        {label}
                    </p>
                    {subLabel && <p className="text-[9px] text-blue-400 font-medium mt-0.5">{subLabel}</p>}
                </div>
            </div>
        </foreignObject>
    )
}
