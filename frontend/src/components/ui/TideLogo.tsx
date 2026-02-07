import React, { useEffect, useState } from 'react';

interface TideLogoProps {
  size?: number;
  className?: string;
}

export const TideLogo: React.FC<TideLogoProps> = ({ size = 40, className = '' }) => {
  const [level, setLevel] = useState(50);
  useEffect(() => {
    // Initialize level from localStorage
    const savedQuantity = localStorage.getItem('itemquantity');
    if (savedQuantity) {
      setLevel(parseInt(savedQuantity));
    } else {
      localStorage.setItem('itemquantity', '50');
      setLevel(50);
    }
    
    // Using setInterval for the game loop logic as per original snippet logic
    const intervalId = setInterval(() => {
      setLevel((prevLevel) => {
        let newLevel = prevLevel - 1; // Drain speed (now faster due to interval)
        
        // Reset condition
        if (newLevel <= -55) {
          newLevel = 50;
        }
        
        localStorage.setItem('itemquantity', newLevel.toString());
        return newLevel;
      });
    }, 100); // Increased speed from 500ms to 100ms

    return () => clearInterval(intervalId);
  }, []);

  // Calculate dynamic styles
  // The original used: .wave:before { top: val% }
  // We need to pass this dynamic value to the style.
  // Since we can't easily inject dynamic keyframes/classes for pseudo-elements from inline styles in React without CSS variables,
  // we will use CSS variables.
  
  const containerStyle = {
    width: `${size}px`,
    height: `${size}px`,
    '--wave-top': `${level}%`,
  } as React.CSSProperties;

  return (
    <div className={`relative rounded-full overflow-hidden border-2 border-white box-border bg-white ${className}`} style={containerStyle}>
      {/* Wave Container */}
      <div className="absolute w-full h-full bg-[#4973ff] rounded-full shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">
        {/* Wave Elements (Pseudo-element replacements) */}
        {/* We use real divs instead of pseudo-elements to easily control the 'top' property via inline styles or CSS vars */}
        
        {/* Wave Before (Front) */}
        <div 
          className="absolute w-[200%] h-[200%] top-1/2 left-1/2 bg-white/100 rounded-[45%]"
          style={{
            transform: 'translate(-50%, -75%)',
            top: `var(--wave-top)`,
            animation: 'tide-rotate 3s linear infinite',
            transition: 'top 0.1s linear' // match the update interval
          }}
        />
        
        {/* Wave After (Back) */}
        <div 
          className="absolute w-[200%] h-[200%] top-1/2 left-1/2 bg-white/50 rounded-[40%]"
          style={{
            transform: 'translate(-50%, -75%)',
            top: `var(--wave-top)`,
            animation: 'tide-rotate 7s linear infinite',
             transition: 'top 0.1s linear'
          }}
        />
      </div>
    </div>
  );
};
