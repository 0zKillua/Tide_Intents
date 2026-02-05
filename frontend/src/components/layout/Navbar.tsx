import { ConnectButton } from "@mysten/dapp-kit";
import { Link } from "react-router-dom";

export function Navbar() {
  return (
    <nav className="h-16 border-b border-surface-hover bg-background/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 group">
          {/* Logo */}
          <div className="relative flex items-center justify-center w-10 h-10">
            <div className="absolute inset-0 bg-primary/20 rounded-xl rotate-3 group-hover:rotate-6 transition-transform" />
            <div className="absolute inset-0 bg-secondary/20 rounded-xl -rotate-3 group-hover:-rotate-6 transition-transform" />
             <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6 text-primary relative z-10"
            >
              <path d="M2 12h5" />
              <path d="M17 12h5" />
              <path d="M7 12c0 2.5 1.5 4 3 4s3-1.5 3-4-1.5-4-3-4-3 1.5-3 4z" />
              <path d="M11 12c0-2.5 1.5-4 3-4s3 1.5 3 4-1.5 4-3 4-3-1.5-3-4z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-white group-hover:text-primary transition-colors">
            Tide
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
            <span>Sui Mainnet</span>
          </div>
          <div>Gas: &lt; 0.01 SUI</div>
        </div>
        
        <ConnectButton className="!bg-primary !text-black !font-semibold !rounded-md hover:!opacity-90 transition-opacity" />
      </div>
    </nav>
  );
}
