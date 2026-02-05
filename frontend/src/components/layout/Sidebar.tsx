import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  TrendingUp, 
  TrendingDown, 
  ListTodo, 
  BarChart3,
  Settings
} from "lucide-react";
import { ConnectButton } from "@mysten/dapp-kit";
import { cn } from "@/lib/utils";

const links = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Market: Lend", href: "/market/lend", icon: TrendingUp },
  { name: "Market: Borrow", href: "/market/borrow", icon: TrendingDown },
  { name: "My Intents", href: "/intents", icon: ListTodo },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
];

export function Sidebar() {
  return (
    <aside className="w-64 border-r border-surface-hover bg-surface/30 hidden lg:flex flex-col h-[calc(100vh-4rem)] sticky top-16">
      <div className="flex-1 py-6 px-4 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.href}
            to={link.href}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-secondary/20 text-secondary"
                  : "text-gray-400 hover:bg-surface-hover hover:text-white"
              )
            }
          >
            <link.icon className="w-4 h-4" />
            {link.name}
          </NavLink>
        ))}
      </div>
      
      <div className="p-4 border-t border-surface-hover space-y-4">
        <ConnectButton className="w-full justify-center" />
        <button className="flex items-center gap-3 px-3 py-2 w-full text-sm font-medium text-gray-400 hover:text-white transition-colors">
          <Settings className="w-4 h-4" />
          Settings
        </button>
      </div>
    </aside>
  );
}
