import { 
  Zap, 
  Coins, 
  Lock, 
  ShieldCheck,
  TrendingUp,
  ArrowDown,
  Database,
  RefreshCw
} from 'lucide-react';

export function ArchitectureDiagram() {
  // Styles locked to Dark Mode with the vibrant palette
  const theme = {
    bg: 'bg-[#0a0c10]',
    textPrimary: 'text-slate-200',
    textSecondary: 'text-slate-400',
    cardBg: 'bg-slate-900/50',
    cardBorder: 'border-slate-800',
    headerGrad: 'from-white to-slate-400',
  };

  return (
    <div className={`${theme.bg} ${theme.textPrimary} p-8 font-sans overflow-hidden relative`}>
      
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-16 text-center">
       
        <h1 className={`text-5xl font-extrabold bg-gradient-to-r ${theme.headerGrad} bg-clip-text text-transparent mb-4 transition-all`}>
          Architecture
        </h1>
        <p className={`${theme.textSecondary} max-w-2xl mx-auto`}>
          Built on Sui's object-centric model. High-efficiency lending through intent matching and DeepBook integration.
        </p>
      </div>

      {/* Main Diagram Area */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
        
        {/* SVG Connector Overlay - Atomic Matching Flow */}
        <svg className="hidden lg:block absolute top-0 left-0 w-full h-full pointer-events-none z-0" style={{ minHeight: '400px' }}>
          <defs>
            <linearGradient id="grad-lend" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#eab308" stopOpacity="0.5" />
            </linearGradient>
            <linearGradient id="grad-borrow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#eab308" stopOpacity="0.5" />
            </linearGradient>
            <linearGradient id="grad-out" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#eab308" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          
          {/* Path from LendOffer to Solver */}
          <path d="M 320 120 Q 420 120 500 200" fill="none" stroke="url(#grad-lend)" strokeWidth="2" strokeDasharray="8,4">
            <animate attributeName="stroke-dashoffset" from="100" to="0" dur="3s" repeatCount="indefinite" />
          </path>
          
          {/* Path from BorrowRequest to Solver */}
          <path d="M 320 280 Q 420 280 500 200" fill="none" stroke="url(#grad-borrow)" strokeWidth="2" strokeDasharray="8,4">
            <animate attributeName="stroke-dashoffset" from="100" to="0" dur="3s" repeatCount="indefinite" />
          </path>

          {/* Path from Solver to Loan Object (Visual connection to settlement layer) */}
          <path d="M 580 200 L 780 200" fill="none" stroke="url(#grad-out)" strokeWidth="3" strokeDasharray="10,5">
            <animate attributeName="stroke-dashoffset" from="100" to="0" dur="2s" repeatCount="indefinite" />
            <animate attributeName="stroke-width" values="2;4;2" dur="2s" repeatCount="indefinite" />
          </path>
        </svg>

        {/* Column 1: Discovery Layer */}
        <div className="relative z-10 space-y-6">
          <div className="text-sm font-bold uppercase tracking-widest text-center mb-2 text-blue-400">Discovery Layer</div>
          
          {/* LendOffer */}
          <div className={`p-4 rounded-xl border transition-all relative group ${theme.cardBg} border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Coins size={20} className="text-blue-400" />
              </div>
              <span className="font-bold">LendOffer</span>
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded font-bold bg-blue-500/20 text-blue-300">SHARED</span>
            </div>
            <div className={`text-xs space-y-1 ${theme.textSecondary}`}>
              <div className="flex justify-between"><span>Amount:</span> <span className="font-mono font-bold text-blue-500">USDC</span></div>
              <div className="flex justify-between"><span>Max LTV:</span> <span className="font-mono text-blue-200">u64</span></div>
              <div className="flex justify-between"><span>Interest Rate:</span> <span className="font-mono text-blue-200">u64</span></div>
            </div>
          </div>

          {/* BorrowRequest */}
          <div className={`p-4 rounded-xl border transition-all relative group ${theme.cardBg} border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.1)]`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Lock size={20} className="text-purple-400" />
              </div>
              <span className="font-bold">BorrowRequest</span>
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded font-bold bg-purple-500/20 text-purple-300">SHARED</span>
            </div>
            <div className={`text-xs space-y-1 ${theme.textSecondary}`}>
              <div className="flex justify-between"><span>Amount:</span> <span className="font-mono font-bold text-purple-400">USDC</span></div>
              <div className="flex justify-between"><span>Collateral:</span> <span className="font-mono text-purple-200">SUI</span></div>
              <div className="flex justify-between"><span>Min LTV:</span> <span className="font-mono text-purple-200">u64</span></div>
              <div className="flex justify-between"><span>Interest Rate:</span> <span className="font-mono text-purple-200">u64</span></div>
            </div>
          </div>
        </div>

        {/* Column 2: The Solver */}
        <div className="relative z-10 flex flex-col items-center justify-start pt-12">
          <div className="w-24 h-24 rounded-full p-0.5 animate-pulse transition-all bg-gradient-to-tr from-yellow-500 to-orange-400 shadow-[0_0_40px_rgba(234,179,8,0.2)]">
            <div className="w-full h-full rounded-full flex items-center justify-center bg-[#0a0c10]">
              <Zap size={40} className="text-yellow-400" />
            </div>
          </div>
          <div className="mt-6 text-center">
            <h3 className="text-xl font-black tracking-tighter text-white">The Solver</h3>
            <p className={`text-[11px] mt-2 italic max-w-[180px] mx-auto ${theme.textSecondary}`}>
              Atomic matching engine that binds lender capital to borrower requests.
            </p>
          </div>
          
          <div className="mt-12 flex flex-col items-center">
            <div className="text-[10px] font-bold text-yellow-500 uppercase tracking-[0.2em] mb-2 opacity-50">Liquidity Layer</div>
            <ArrowDown className="text-yellow-500 animate-bounce" />
          </div>
        </div>

        {/* Column 3: Settlement Layer */}
        <div className="relative z-10 space-y-6">
          <div className="text-sm font-bold uppercase tracking-widest text-center mb-2 text-emerald-400">Settlement Layer</div>

          {/* Loan Object */}
          <div className={`p-10 rounded-xl border transition-all relative overflow-hidden ${theme.cardBg} border-emerald-500/30 shadow-[0_0_25px_rgba(16,185,129,0.15)]`}>
            <div className="absolute top-0 right-0 w-1 h-full bg-emerald-500/50 animate-pulse" />
            <div className="flex flex-col items-center text-center">
              <div className="p-4 bg-emerald-500/20 rounded-full mb-4">
                <ShieldCheck size={32} className="text-emerald-400" />
              </div>
              <span className="font-bold text-lg text-emerald-100 mb-2 tracking-tight ">Loan Object</span>
              <p className={`text-xs ${theme.textSecondary}`}>
                Shared state object tracking escrowed collateral & debt lifecycle.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* DeepBook Integration Element */}
      <div className="max-w-3xl mx-auto mt-12 relative z-20">
        <div className="p-1 rounded-2xl bg-gradient-to-r from-blue-500/20 via-yellow-500/20 to-emerald-500/20">
          <div className={`rounded-xl p-6 border transition-all shadow-2xl relative overflow-hidden ${theme.cardBg} ${theme.cardBorder}`}>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
                  <Database size={28} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight text-white">DeepBook Integration</h3>
                  <p className="text-xs text-blue-400 font-mono font-bold uppercase">The Engine of Efficiency</p>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-4">
                {[
                  { label: 'Smart Collateral', icon: <TrendingUp size={14} className="text-blue-400" /> },
                  { label: 'Best Rates', icon: <RefreshCw size={14} className="text-emerald-400" /> },
                  { label: 'Deep Liquidity', icon: <Database size={14} className="text-yellow-400" /> }
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-700 bg-slate-900 text-[10px] font-bold uppercase text-slate-300 transition-all">
                    {item.icon}
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-800/50 italic text-center text-xs px-4 text-slate-500">
              &quot;Atomic settlements and liquidations leverage DeepBook CLOB, while collateral generates yield via DeepBook-margin.&quot;
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
