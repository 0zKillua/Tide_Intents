import { ConnectButton } from "@mysten/dapp-kit";
import { Link } from "react-router-dom";
import { TideLogo } from "@/components/ui/TideLogo";

export function Navbar() {
  return (
    <nav className="h-16 border-b border-surface-hover bg-background/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 group">
          {/* Logo */}
          <TideLogo size={40} className="shadow-[0_0_15px_rgba(73,115,255,0.5)]" />
          <span className="text-xl font-bold tracking-tight text-white group-hover:text-primary transition-colors">
            Tide
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse shadow-[0_0_8px_#10b981]"></span>
            <span>Sui Testnet</span>
          </div>
          <div>Gas: &lt; 0.01 SUI</div>
        </div>
        
        <ConnectButton className="!bg-primary !text-white !font-semibold !rounded-md hover:!opacity-90 transition-opacity" />
      </div>
    </nav>
  );
}
