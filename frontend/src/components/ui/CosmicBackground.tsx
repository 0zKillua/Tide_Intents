import { useEffect, useRef } from 'react';

export function CosmicBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const stars: { x: number; y: number; radius: number; alpha: number; speed: number }[] = [];
    const numStars = 150;

    for (let i = 0; i < numStars; i++) {
        stars.push({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: Math.random() * 1.5,
            alpha: Math.random(),
            speed: Math.random() * 0.05
        });
    }

    const animate = () => {
        ctx.clearRect(0, 0, width, height);

        // Draw stars
        stars.forEach(star => {
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
            ctx.fill();

            // Twinkle effect
            star.alpha += (Math.random() - 0.5) * 0.05;
            if (star.alpha < 0.1) star.alpha = 0.1;
            if (star.alpha > 1) star.alpha = 1;

            // Movement
            star.y -= star.speed;
            if (star.y < 0) star.y = height;
        });

        requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);

  }, []);

  return (
    <div className="absolute inset-0 -z-20 overflow-hidden bg-black">
      {/* Deep Space Gradient Base */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900/50 via-[#0a0a0a] to-black" />
      
      {/* Nebula Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px] animate-pulse duration-[8000ms]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-900/10 rounded-full blur-[120px] animate-pulse duration-[10000ms]" />
      <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] bg-indigo-900/20 rounded-full blur-[100px] animate-pulse duration-[12000ms]" />

      {/* Star Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-80" />
      
      {/* Vignette Overlay for Depth */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)] opacity-40 mix-blend-multiply" />
    </div>
  );
}
