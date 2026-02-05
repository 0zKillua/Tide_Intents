import { Shield, Ban, Link2, Lock, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const tags = [
  { text: "No Bad Debt Socialization", icon: Shield, color: "text-success border-success/50 bg-success/10 shadow-[0_0_15px_rgba(34,197,94,0.3)]" },
  { text: "No Pools", icon: Ban, color: "text-destructive border-destructive/50 bg-destructive/10 shadow-[0_0_15px_rgba(239,68,68,0.3)]" },
  { text: "Move Secured", icon: Lock, color: "text-warning border-warning/50 bg-warning/10 shadow-[0_0_15px_rgba(234,179,8,0.3)]" },
  { text: "P2P Matching", icon: Link2, color: "text-primary border-primary/50 bg-primary/10 shadow-[0_0_15px_rgba(59,130,246,0.3)]" },
  { text: "Isolated Risk", icon: Sparkles, color: "text-secondary border-secondary/50 bg-secondary/10 shadow-[0_0_15px_rgba(168,85,247,0.3)]" },
];

// Starting positions spread across the hero section (percent based)
const positions = [
  { top: 15, left: 10 },
  { top: 25, left: 80 },
  { top: 65, left: 15 },
  { top: 75, left: 75 },
  { top: 45, left: 85 },
];

export function FloatingTags() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      <svg className="absolute inset-0 w-full h-full">
        {tags.map((_, i) => (
           <motion.line
             key={`line-${i}`}
             x1="50%"
             y1="50%"
             x2={`${positions[i].left}%`}
             y2={`${positions[i].top}%`}
             stroke="url(#constellation-gradient)"
             strokeWidth="1"
             initial={{ pathLength: 0, opacity: 0 }}
             animate={{ 
               pathLength: [0, 1, 1], 
               opacity: [0, 0.4, 0.2],
               x2: [`${positions[i].left}%`, `${positions[i].left + (i % 2 === 0 ? 2 : -2)}%`, `${positions[i].left}%`],
               y2: [`${positions[i].top}%`, `${positions[i].top + (i % 2 === 0 ? -2 : 2)}%`, `${positions[i].top}%`]
             }}
             transition={{
                duration: 5 + i,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
             }}
           />
        ))}
        <defs>
          <linearGradient id="constellation-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.3)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>
      </svg>
      
      {tags.map((tag, i) => (
        <motion.div
          key={i}
          className="absolute"
          initial={{ 
            top: `${positions[i].top}%`, 
            left: `${positions[i].left}%`, 
            opacity: 0, 
            scale: 0.8 
          }}
          animate={{ 
            top: [`${positions[i].top}%`, `${positions[i].top + (i % 2 === 0 ? -2 : 2)}%`, `${positions[i].top}%`],
            left: [`${positions[i].left}%`, `${positions[i].left + (i % 2 === 0 ? 2 : -2)}%`, `${positions[i].left}%`],
            opacity: 1,
            scale: 1
          }}
          transition={{
            duration: 5 + i,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
            opacity: { duration: 1, delay: i * 0.2 },
            scale: { duration: 1, delay: i * 0.2 }
          }}
        >
          <div 
             className={`flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-md text-sm font-semibold whitespace-nowrap ${tag.color}`}
          >
            <tag.icon className="w-4 h-4" />
            {tag.text}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
