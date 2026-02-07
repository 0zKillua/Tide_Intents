import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { LiveTicker } from "@/components/ui/LiveTicker";
import { ArchitectureDiagram } from "@/components/landing/ArchitectureDiagram";
import { CosmicBackground } from "@/components/ui/CosmicBackground";
import { TideLogo } from "@/components/ui/TideLogo";

// Typewriter Effect Component
// Typewriter Effect Component

// Typewriter Effect Component with Icon support
// Typewriter Effect Component with Icon support
// Typewriter Effect Component
const Typewriter = ({ texts }: { texts: string[] }) => {
  const [textIndex, setTextIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(50);

  useEffect(() => {
    const handleTyping = () => {
      const currentText = texts[textIndex];
      const currentLength = displayedText.length;
      
      // Typing Phase
      if (!isDeleting) {
        if (currentLength < currentText.length) {
          setDisplayedText(currentText.substring(0, currentLength + 1));
          setTypingSpeed(40); 
        } else {
          // Finished Typing - Pause
          setTimeout(() => setIsDeleting(true), 1500); // Shorter pause for flow
        }
      } 
      // Deleting Phase
      else {
        if (currentLength > 0) {
          setDisplayedText(currentText.substring(0, currentLength - 1));
          setTypingSpeed(20); 
        } else {
          // Finished Deleting - Move to next text
          setIsDeleting(false);
          setTextIndex((prev) => (prev + 1) % texts.length);
        }
      }
    };

    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, textIndex, texts, typingSpeed]);

  return (
    <div className="inline-flex items-center gap-2 h-20 md:h-24">
      <span className="inline-block text-2xl md:text-3xl font-normal text-slate-800 tracking-wider font-sans leading-relaxed">
        {displayedText}
      </span>
      {/* Cursor */}
      <span className="animate-pulse text-blue-500 font-light text-3xl md:text-4xl pb-1">|</span>
    </div>
  );
};

export function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0a0c10] selection:bg-cyan-200/50 text-slate-900 relative overflow-x-hidden">
        
      {/* Light Theme Section Wrapper (Navbar + Hero) */}
      <div className="bg-slate-50 relative pb-20">
       
        {/* Left Side - Subtle Light Gradient */ }
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-white via-blue-50/50 to-white pointer-events-none z-0" />
        
        {/* Animated Glow Orbs - Pastels for Light Mode */ }
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] rounded-full bg-blue-200/40 blur-[180px] pointer-events-none z-0 mix-blend-multiply animate-pulse-slow" />
        <div className="absolute bottom-[-20%] left-[-5%] w-[600px] h-[600px] rounded-full bg-cyan-200/40 blur-[150px] pointer-events-none z-0 mix-blend-multiply" />

        {/* Video Background - Faded for Light Mode */ }
        <div 
            className="absolute top-0 right-0 w-[80%] h-screen pointer-events-none z-0 translate-x-[15%]"
            style={{
                maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,1) 50%)',
                WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,1) 50%)'
            }}
        >
            <video 
              autoPlay 
              loop 
              muted 
              playsInline
              className="w-full h-full object-cover brightness-125 saturate-150"
            >
              <source src="/landingpage_video2.mp4" type="video/mp4" />
            </video>
        </div>

       {/* Cosmic Background (Inverted/Subtle for texture) */}
       <div className="opacity-10 mix-blend-multiply invert">
          <CosmicBackground />
       </div>

      {/* Simplified Navbar for Landing */}
      <nav className="absolute top-0 w-full h-20 px-6 flex items-center justify-between z-50 bg-transparent">
        <div className="flex items-center gap-3">
        <div className="flex items-center gap-3">
             <TideLogo size={40} className="shadow-[0_0_20px_rgba(59,130,246,0.3)] text-primary" />
            <span className="text-xl font-bold tracking-tight text-slate-900 drop-shadow-sm">
              Tide
            </span>
        </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 border border-green-200 text-sm text-green-700 shadow-sm">
             <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]" />
             Live on Sui Testnet
          </div>
          <Link to="/dashboard">
            <Button className="bg-primary text-white hover:bg-blue-700 font-bold shadow-lg shadow-blue-600/20 transition-all hover:scale-105 border-none">
              Launch App
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-start justify-center text-left px-12 md:pl-40 pt-48 pb-20 overflow-hidden w-full">
        
        {/* Built on Sui Badge - Inverted for White Theme */}
         {/* Built on Sui Badge - Inverted for White Theme */}
         <div className="absolute top-[25%] right-[23%] z-20 flex flex-col items-center animate-fade-in-delayed opacity-90 hidden md:flex pointer-events-none">
             <span className="text-xs font-semibold tracking-[0.2em] text-white/50 mb-3 uppercase drop-shadow-md">Built on</span>
             <img 
               src="/sui_logo_white.png" 
               alt="SUI" 
               className="h-20 w-auto drop-shadow-lg" 
             />
          </div>

        {/* Background Gradients - White/Light Flow */ }
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-slate-50 via-blue-50/20 to-transparent pointer-events-none z-0" />

        <div className="space-y-6 max-w-4xl relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 mt-12">

          {/* Powered By Badge - Top */}
          <div className="hidden md:flex items-center gap-4 mb-8 ml-20">
             <span className="text-xs font-sans tracking-[0.2em] text-slate-500 ">Powered By</span>
             <div className="h-8 w-px bg-slate-300" />
             
             <div className="relative group flex items-center">
                 <div className="absolute inset-0 bg-blue-500/5 blur-xl rounded-full group-hover:bg-blue-400/10 transition-all duration-500" />
                 <img 
                   src="/deepbook_logo.png" 
                   alt="DeepBook" 
                   className="h-16 w-auto object-contain relative z-10 transition-transform duration-300 hover:scale-105"
                 />
             </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-extralight tracking-wide text-slate-900 drop-shadow-sm leading-tight mb-4">
            Liquidity that moves <br />
            with <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-700 drop-shadow-lg">
              the Tide.
            </span>
          </h1>

          {/* Static Subtitle */}
          <p className="text-xl md:text-2xl font-light text-slate-600 tracking-wider mb-6">
             An Intent Centric Lending Protocol on SUI.
          </p>

          <div className="min-h-[80px] mb-8 max-w-3xl text-left relative z-10 flex items-center">
             <Typewriter texts={[
                "Match directly with lenders and borrowers.",
                "Zero spread. Instant execution.",
                "Smart collateral. A loan that repays itself.",
                "Turbo charged with Deepbook.",
                "No Pools, No Bad debt Socialization."
             ]} />
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-start gap-4 pt-4">
            <Link to="/dashboard">
              <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-primary text-white hover:bg-blue-700 shadow-xl shadow-blue-600/20 transition-all hover:scale-105 font-bold">
                Launch App <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full border-slate-300 hover:bg-slate-100 text-slate-700">
              Read Docs
            </Button>
          </div>
        </div>
        


      </section>
      </div> {/* End of Light Theme Section Wrapper */}

      {/* Live Ticker - Light Section */}
      <div className="w-full bg-black border-t border-slate-200 relative z-20">
        <LiveTicker />
      </div>

      {/* Protocol Explainer / Architecture */}
      <div className="bg-[#0a0c10]">
        <ArchitectureDiagram />
      </div>
      
      <footer className="py-6 text-center text-slate-500 text-sm bg-[#0a0c10] border-t border-slate-800">
        &copy; 2026 Tide Protocol. Built on Sui. <span className="mx-2">|</span> <a href="https://x.com/0x158_" target="_blank" rel="noopener noreferrer" className="text-green-500 hover:text-green-400 transition-colors font-semibold">Built by Killua</a>
      </footer>
    </div>
  );
}

