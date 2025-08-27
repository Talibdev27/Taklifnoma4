import React, { useEffect, useRef } from 'react';

interface BirthdayCakeProps {
  age?: number;
  primaryColor?: string;
  accentColor?: string;
  isAnimated?: boolean;
}

export function BirthdayCake({ 
  age = 25, 
  primaryColor = '#FF6B9D', 
  accentColor = '#FFB6C1',
  isAnimated = true 
}: BirthdayCakeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Candle flame animation
  useEffect(() => {
    if (!isAnimated) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 200;
    canvas.height = 200;

    let animationId: number;
    let time = 0;

    const drawFlame = (x: number, y: number, size: number) => {
      ctx.save();
      ctx.translate(x, y);
      
      // Flame gradient
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
      gradient.addColorStop(0, '#FFFF00'); // Yellow center
      gradient.addColorStop(0.3, '#FFA500'); // Orange
      gradient.addColorStop(0.7, '#FF4500'); // Red-orange
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      
      // Animated flame shape
      const wobble = Math.sin(time * 0.1) * 2;
      const height = size + Math.sin(time * 0.15) * 3;
      
      ctx.beginPath();
      ctx.moveTo(-size/2 + wobble, height);
      ctx.quadraticCurveTo(-size/3, height/2, 0, 0);
      ctx.quadraticCurveTo(size/3, height/2, size/2 - wobble, height);
      ctx.closePath();
      ctx.fill();
      
      ctx.restore();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time++;

      // Draw multiple candle flames
      const candles = Math.min(age, 10); // Max 10 candles for performance
      const spacing = 160 / candles;
      
      for (let i = 0; i < candles; i++) {
        const x = 20 + i * spacing;
        const y = 80 + Math.sin(time * 0.05 + i) * 2;
        drawFlame(x, y, 8 + Math.sin(time * 0.1 + i) * 2);
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [age, isAnimated]);

  return (
    <div className="relative inline-block">
      {/* Cake SVG */}
      <svg width="200" height="200" viewBox="0 0 200 200" className="relative z-10">
        {/* Cake base */}
        <rect x="20" y="120" width="160" height="40" rx="8" fill={primaryColor} />
        
        {/* Cake layers */}
        <rect x="30" y="100" width="140" height="30" rx="6" fill={accentColor} />
        <rect x="40" y="80" width="120" height="25" rx="4" fill={primaryColor} />
        
        {/* Cake decorations */}
        <circle cx="50" cy="130" r="3" fill="#FFD700" />
        <circle cx="70" cy="130" r="3" fill="#FF69B4" />
        <circle cx="90" cy="130" r="3" fill="#87CEEB" />
        <circle cx="110" cy="130" r="3" fill="#98FB98" />
        <circle cx="130" cy="130" r="3" fill="#FFD700" />
        <circle cx="150" cy="130" r="3" fill="#FF69B4" />
        
        {/* Candle bases */}
        {Array.from({ length: Math.min(age, 10) }).map((_, i) => {
          const x = 25 + i * (150 / Math.min(age, 10));
          return (
            <rect 
              key={i} 
              x={x} 
              y="70" 
              width="3" 
              height="20" 
              fill="#8B4513" 
              rx="1"
            />
          );
        })}
        
        {/* Cake plate */}
        <ellipse cx="100" cy="165" rx="90" ry="8" fill="#E0E0E0" />
      </svg>
      
      {/* Animated candle flames canvas */}
      {isAnimated && (
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 pointer-events-none"
          style={{ zIndex: 20 }}
        />
      )}
      
      {/* Age text */}
      <div 
        className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-center"
        style={{ color: primaryColor }}
      >
        <div className="text-sm font-bold">{age}</div>
        <div className="text-xs opacity-80">years</div>
      </div>
    </div>
  );
}
