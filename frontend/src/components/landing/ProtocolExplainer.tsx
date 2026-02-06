import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, 
  Waves, 
  Shield, 
  ShieldOff, 
  User, 
  FileSignature, 
  Server, 
  Database, 
  ArrowRight,
  Cpu,
  Layers
} from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "flow", label: "How it Works" },
  { id: "arch", label: "Architecture" },
  { id: "design", label: "Design Principles" },
];

export function ProtocolExplainer() {
  const [activeTab, setActiveTab] = useState("flow");

  return (
    <section className="py-24 px-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-secondary/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
            Under the Hood
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Understand how Tide redefines lending with intent-centric architecture.
          </p>
        </div>

        {/* Custom Tab Bar */}
        <div className="flex justify-center mb-16">
          <div className="flex p-1 bg-surface/30 backdrop-blur-md rounded-2xl border border-white/5">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300",
                  activeTab === tab.id ? "text-white" : "text-gray-400 hover:text-white"
                )}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="explainer-tab"
                    className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-xl shadow-[0_0_15px_rgba(0,242,234,0.1)]"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            
            {/* TAB 1: FLOW */}
            {activeTab === "flow" && (
              <motion.div
                key="flow"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="grid gap-8"
              >
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative">
                   {/* Line Connector for Desktop */}
                   <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-secondary/30 to-transparent -translate-y-1/2 z-0" />

                   <FlowStep 
                      icon={User} 
                      label="User" 
                      desc="Signs an intent off-chain." 
                      step={1} 
                   />
                   <ArrowRight className="md:hidden text-gray-600 rotate-90 my-2" />
                   <div className="hidden md:flex text-secondary/50"><ArrowRight /></div>

                   <FlowStep 
                      icon={FileSignature} 
                      label="Intent" 
                      desc="Declarative order broadcasted." 
                      step={2} 
                   />
                   <ArrowRight className="md:hidden text-gray-600 rotate-90 my-2" />
                   <div className="hidden md:flex text-secondary/50"><ArrowRight /></div>

                   <FlowStep 
                      icon={Server} 
                      label="Solvers" 
                      desc="Competes to fill the order." 
                      step={3} 
                   />
                   <ArrowRight className="md:hidden text-gray-600 rotate-90 my-2" />
                   <div className="hidden md:flex text-secondary/50"><ArrowRight /></div>

                   <FlowStep 
                      icon={Database} 
                      label="Settlement" 
                      desc="Atomic execution on Sui." 
                      step={4} 
                   />
                </div>
                
                <div className="mt-8 text-center bg-surface/30 p-6 rounded-2xl border border-white/5 backdrop-blur-sm mx-auto max-w-2xl">
                    <p className="text-gray-300">
                        <span className="text-secondary font-bold">"Sign & Forget"</span> — Users just express what they want. Complexity is handled off-chain by professional solvers.
                    </p>
                </div>
              </motion.div>
            )}

            {/* TAB 2: ARCHITECTURE */}
            {activeTab === "arch" && (
              <motion.div
                key="arch"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="grid md:grid-cols-3 gap-6"
              >
                <ArchCard 
                    title="Intents Layer"
                    icon={Layers}
                    desc="A standard for expressing lending and borrowing desires without locking funds immediately."
                    color="text-primary"
                    bg="bg-primary/10"
                />
                <ArchCard 
                    title="Solver Network"
                    icon={Cpu}
                    desc="Distributed network of market makers that monitor intents and provide optimal execution paths."
                    color="text-secondary"
                    bg="bg-secondary/10"
                />
                <ArchCard 
                    title="DeepBook V3"
                    icon={Database}
                    desc="The central liquidity layer. Tide utilizes DeepBook for atomic swaps and liquidation routes."
                    color="text-success"
                    bg="bg-success/10"
                />
              </motion.div>
            )}

            {/* TAB 3: DESIGN */}
            {activeTab === "design" && (
              <motion.div
                key="design"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.5 }}
                className="grid md:grid-cols-4 gap-6"
              >
                  <BentoCard 
                    title="Instant Matching" 
                    icon={Zap} 
                    desc="Milliseconds to match. Zero wait time."
                    className="md:col-span-2 bg-gradient-to-br from-surface/50 to-secondary/10"
                    iconColor="text-secondary"
                  />
                  <BentoCard 
                    title="Fluid Liquidity" 
                    icon={Waves} 
                    desc="No spread. Dynamic rates."
                    className="md:col-span-2 bg-gradient-to-br from-surface/50 to-primary/10"
                    iconColor="text-primary"
                  />
                  <BentoCard 
                    title="Isolated Risk" 
                    icon={Shield} 
                    desc="Bilateral structure means no bad debt pools."
                    className="md:col-span-1"
                    iconColor="text-success"
                  />
                  <BentoCard 
                    title="No Shared Pools" 
                    icon={ShieldOff} 
                    desc="Eliminates LP exploitation vectors."
                    className="md:col-span-3 bg-gradient-to-r from-surface/50 to-destructive/10"
                    iconColor="text-destructive"
                  />
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function FlowStep({ icon: Icon, label, desc, step }: any) {
    return (
        <div className="relative z-10 flex flex-col items-center text-center space-y-4 group">
            <div className="w-16 h-16 rounded-2xl bg-surface border border-white/10 flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:border-primary/50 transition-all duration-300">
                <Icon className="w-8 h-8 text-gray-300 group-hover:text-primary transition-colors" />
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-surface-hover border border-white/10 flex items-center justify-center text-xs font-bold text-gray-400">
                    {step}
                </div>
            </div>
            <div>
                <h4 className="font-bold text-white mb-1">{label}</h4>
                <p className="text-sm text-gray-400 max-w-[150px]">{desc}</p>
            </div>
        </div>
    )
}

function ArchCard({ title, icon: Icon, desc, color, bg }: any) {
    return (
        <div className="p-8 rounded-3xl bg-surface/40 border border-white/5 backdrop-blur-md hover:bg-surface/60 transition-colors group">
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform", bg)}>
                <Icon className={cn("w-7 h-7", color)} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 group-hover:text-primary transition-colors">{title}</h3>
            <p className="text-gray-400 leading-relaxed">{desc}</p>
        </div>
    )
}

function BentoCard({ title, icon: Icon, desc, className, iconColor }: any) {
    return (
        <div className={cn("p-6 rounded-3xl bg-surface/40 border border-white/5 backdrop-blur-md flex flex-col justify-between hover:border-white/10 transition-all", className)}>
            <div className={cn("w-12 h-12 rounded-xl bg-black/20 flex items-center justify-center mb-4", iconColor)}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                <p className="text-gray-400 text-sm">{desc}</p>
            </div>
        </div>
    )
}
