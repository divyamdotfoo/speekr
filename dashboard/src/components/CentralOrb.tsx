import { useEffect, useState } from "react";

interface Particle {
  id: number;
  angle: number;
  distance: number;
  delay: number;
}

export function CentralOrb() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const particleArray = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      angle: (i / 8) * Math.PI * 2,
      distance: 50 + Math.random() * 15,
      delay: i * 0.3,
    }));
    setParticles(particleArray);
  }, []);

  return (
    <div className="relative flex items-center justify-center" style={{ width: 128, height: 128 }}>
      {/* Main orb with rotation */}
      <div
        className="absolute rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 animate-rotate-slow"
        style={{
          width: 96,
          height: 96,
          boxShadow: "0 8px 32px rgba(16, 185, 129, 0.3), inset 0 0 24px rgba(255, 255, 255, 0.2)",
        }}
      >
        {/* Glow overlay */}
        <div
          className="absolute inset-0 rounded-full bg-gradient-to-tl from-amber-400/30 to-transparent animate-glow"
        />
      </div>

      {/* Particles */}
      {particles.map((particle) => {
        const baseX = Math.cos(particle.angle) * particle.distance;
        const baseY = Math.sin(particle.angle) * particle.distance;
        const endX = Math.cos(particle.angle + 0.3) * (particle.distance + 8);
        const endY = Math.sin(particle.angle + 0.3) * (particle.distance + 8);
        
        return (
          <div
            key={particle.id}
            className="absolute w-1.5 h-1.5 rounded-full bg-amber-400"
            style={{
              boxShadow: "0 0 8px rgba(251, 191, 36, 0.6)",
              left: "50%",
              top: "50%",
              marginLeft: -3,
              marginTop: -3,
              animation: `particle-orbit-${particle.id} ${5 + particle.delay}s ease-in-out infinite`,
              animationDelay: `${particle.delay}s`,
            }}
          />
        );
      })}

      {/* Icon */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          className="text-white animate-pulse"
        >
          <path
            d="M12 2L2 7L12 12L22 7L12 2Z"
            fill="currentColor"
            opacity="0.9"
          />
          <path
            d="M2 17L12 22L22 17"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M2 12L12 17L22 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Generate keyframes for each particle */}
      <style>{`
        ${particles.map((particle) => {
          const baseX = Math.cos(particle.angle) * particle.distance;
          const baseY = Math.sin(particle.angle) * particle.distance;
          const endX = Math.cos(particle.angle + 0.3) * (particle.distance + 8);
          const endY = Math.sin(particle.angle + 0.3) * (particle.distance + 8);
          
          return `
            @keyframes particle-orbit-${particle.id} {
              0%, 100% {
                transform: translate(${baseX}px, ${baseY}px);
                opacity: 0.3;
              }
              50% {
                transform: translate(${endX}px, ${endY}px);
                opacity: 0.6;
              }
            }
          `;
        }).join('\n')}
      `}</style>
    </div>
  );
}
