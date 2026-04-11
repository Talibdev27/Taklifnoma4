import React, { useEffect, useRef } from 'react';

interface BirthdayAnimationsProps {
  isMilestone?: boolean;
  age?: number;
  primaryColor?: string;
  accentColor?: string;
}

export function BirthdayAnimations({ isMilestone = false, age, primaryColor = '#FF6B9D', accentColor = '#FFB6C1' }: BirthdayAnimationsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const balloonsRef = useRef<HTMLDivElement>(null);

  // Confetti animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Confetti pieces
    const confetti: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
      rotation: number;
      rotationSpeed: number;
    }> = [];

    // Create confetti pieces
    const colors = [primaryColor, accentColor, '#FFD700', '#FF69B4', '#87CEEB', '#98FB98'];
    for (let i = 0; i < 150; i++) {
      confetti.push({
        x: Math.random() * canvas.width,
        y: -10,
        vx: (Math.random() - 0.5) * 8,
        vy: Math.random() * 3 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
      });
    }

    // Animation loop
    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      confetti.forEach((piece, index) => {
        // Update position
        piece.x += piece.vx;
        piece.y += piece.vy;
        piece.rotation += piece.rotationSpeed;

        // Add gravity
        piece.vy += 0.1;

        // Draw confetti piece
        ctx.save();
        ctx.translate(piece.x, piece.y);
        ctx.rotate((piece.rotation * Math.PI) / 180);
        ctx.fillStyle = piece.color;
        ctx.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size);
        ctx.restore();

        // Remove pieces that are off screen
        if (piece.y > canvas.height + 20) {
          confetti.splice(index, 1);
        }
      });

      // Continue animation if there are still confetti pieces
      if (confetti.length > 0) {
        animationId = requestAnimationFrame(animate);
      }
    };

    // Start animation after a short delay
    setTimeout(() => {
      animate();
    }, 500);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [primaryColor, accentColor]);

  // Floating balloons animation
  useEffect(() => {
    const balloonsContainer = balloonsRef.current;
    if (!balloonsContainer) return;

    const colors = [primaryColor, accentColor, '#FFD700', '#FF69B4', '#87CEEB', '#98FB98'];
    const balloonCount = isMilestone ? 12 : 8;

    // Create balloons
    for (let i = 0; i < balloonCount; i++) {
      const balloon = document.createElement('div');
      balloon.className = 'balloon';
      balloon.style.cssText = `
        position: fixed;
        width: ${Math.random() * 30 + 20}px;
        height: ${Math.random() * 40 + 30}px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        border-radius: 50%;
        left: ${Math.random() * window.innerWidth}px;
        bottom: -50px;
        animation: float ${Math.random() * 3 + 4}s ease-in-out infinite;
        animation-delay: ${Math.random() * 2}s;
        z-index: 10;
        opacity: 0.8;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      `;

      // Add balloon string
      const string = document.createElement('div');
      string.style.cssText = `
        position: absolute;
        width: 2px;
        height: 60px;
        background: #333;
        bottom: -60px;
        left: 50%;
        transform: translateX(-50%);
      `;
      balloon.appendChild(string);

      balloonsContainer.appendChild(balloon);
    }

    return () => {
      // Clean up balloons
      const balloons = balloonsContainer.querySelectorAll('.balloon');
      balloons.forEach(balloon => balloon.remove());
    };
  }, [isMilestone, primaryColor, accentColor]);

  return (
    <>
      {/* Confetti Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-20"
        style={{ zIndex: 20 }}
      />
      
      {/* Floating Balloons */}
      <div ref={balloonsRef} className="fixed inset-0 pointer-events-none" />
      
      {/* CSS for balloon animation */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          25% {
            transform: translateY(-20px) rotate(2deg);
          }
          50% {
            transform: translateY(-40px) rotate(0deg);
          }
          75% {
            transform: translateY(-20px) rotate(-2deg);
          }
        }
      `}</style>
    </>
  );
}
