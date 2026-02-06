import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  TrendingUp, 
  TrendingDown, 
  ListTodo, 
  BarChart3,
  Settings,
  Wallet
} from "lucide-react";
import { ConnectButton } from "@mysten/dapp-kit";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const links = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Market: Lend", href: "/market/lend", icon: TrendingUp },
  { name: "Market: Borrow", href: "/market/borrow", icon: TrendingDown },
  { name: "Portfolio", href: "/portfolio", icon: ListTodo },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
];

export function Sidebar() {
  return (
    <aside className="w-64 border-r border-white/5 bg-background/50 backdrop-blur-xl hidden lg:flex flex-col h-[calc(100vh-4rem)] sticky top-16 z-30 transition-all duration-300">
      
      {/* Decorative gradient top */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

      <div className="flex-1 py-8 px-4 space-y-2 relative">
        <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Menu</p>
        
        {links.map((link) => (
          <NavLink
            key={link.href}
            to={link.href}
            className="relative block"
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="activeSidebar"
                    className="absolute inset-0 bg-secondary/10 border-r-2 border-secondary rounded-l-md"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30
                    }}
                  />
                )}
                
                <div
                  className={cn(
                    "relative flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors duration-200 z-10",
                    isActive
                      ? "text-primary"
                      : "text-gray-400 hover:text-white hover:bg-white/5 rounded-md" 
                  )}
                >
                  <link.icon className={cn("w-4 h-4 transition-colors", isActive ? "text-primary" : "text-gray-500 group-hover:text-gray-300")} />
                  {link.name}
                  
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(0,242,234,0.5)]"
                    />
                  )}
                </div>
              </>
            )}
          </NavLink>
        ))}
      </div>
      
      <div className="p-4 border-t border-white/5 space-y-4 bg-background/20 backdrop-blur-md">
        <div className="p-3 rounded-xl bg-gradient-to-br from-surface to-surface-hover border border-white/5 shadow-inner">
             <div className="flex items-center gap-3 mb-3">
                 <div className="p-2 rounded-lg bg-secondary/20 text-secondary">
                     <Wallet className="w-4 h-4" />
                 </div>
                 <div className="flex flex-col">
                     <span className="text-xs text-gray-400 font-medium">Wallet Status</span>
                     <div className="h-1.5 w-16 bg-gray-800 rounded-full mt-1 overflow-hidden">
                         <div className="h-full w-full bg-success/80 animate-pulse" />
                     </div>
                 </div>
             </div>
             <ConnectButton className="!w-full !rounded-lg !bg-secondary !border-0 !text-white hover:!bg-secondary/80 transition-all !font-medium !text-sm !h-10 shadow-[0_4px_12px_rgba(41,121,255,0.2)]" />
        </div>

        <button className="flex items-center gap-3 px-3 py-2 w-full text-sm font-medium text-gray-400 hover:text-white transition-colors group">
          <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
          Settings
        </button>
      </div>
    </aside>
  );
}
