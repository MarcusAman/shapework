import React from 'react';

export interface KineticGlassCausticsProps {
  /** Variant adjusts refraction scale */
  variant?: 'hero' | 'drawer' | 'full';
  /** Custom additional wrapper class */
  className?: string;
}

/**
 * KineticGlassCaustics
 * 
 * Renders full-bleed, organic coastal morning sunlight refractions and frosted glass caustics.
 * Uses bounded inset-0 overflow-hidden container with internal scaled SVG to guarantee
 * zero scrollbars and zero rectangular clipping borders across any screen size.
 */
export const KineticGlassCaustics: React.FC<KineticGlassCausticsProps> = ({
  variant = 'hero',
  className = ''
}) => {
  return (
    <div 
      className={`pointer-events-none select-none absolute inset-0 overflow-hidden z-0 ${className}`}
      aria-hidden="true"
      data-testid="kinetic-glass-caustics"
      style={{
        maskImage: 'radial-gradient(circle at 50% 45%, black 45%, rgba(0,0,0,0.6) 75%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(circle at 50% 45%, black 45%, rgba(0,0,0,0.6) 75%, transparent 100%)'
      }}
    >
      <style>{`
        @keyframes causticDrift1 {
          0%, 100% {
            transform: translate3d(0, 0, 0) scale(1) rotate(0deg);
            opacity: 0.55;
          }
          50% {
            transform: translate3d(-30px, 20px, 0) scale(1.12) rotate(3deg);
            opacity: 0.85;
          }
        }

        @keyframes causticDrift2 {
          0%, 100% {
            transform: translate3d(0, 0, 0) scale(1) rotate(0deg);
            opacity: 0.60;
          }
          50% {
            transform: translate3d(35px, -25px, 0) scale(1.14) rotate(-4deg);
            opacity: 0.90;
          }
        }

        @keyframes causticDrift3 {
          0%, 100% {
            transform: translate3d(0, 0, 0) scale(0.95);
            opacity: 0.45;
          }
          50% {
            transform: translate3d(-20px, -20px, 0) scale(1.08);
            opacity: 0.80;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .caustic-layer {
            animation: none !important;
            opacity: 0.65 !important;
          }
        }
      `}</style>

      <svg 
        className="w-[120%] h-[120%] -left-[10%] -top-[10%] absolute filter blur-[60px]"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1600 900"
        preserveAspectRatio="none"
      >
        <defs>
          {/* Prismatic Sea Glass Teal Gradient */}
          <linearGradient id="causticTeal" x1="0%" y1="0%" x2="100%" y2="80%">
            <stop offset="0%" stopColor="#00635C" stopOpacity="0.14" />
            <stop offset="50%" stopColor="#A4D4CB" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#01362D" stopOpacity="0" />
          </linearGradient>

          {/* Morning Sunlight Sand Gold Gradient */}
          <linearGradient id="causticGold" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F3D299" stopOpacity="0.16" />
            <stop offset="60%" stopColor="#E8C48F" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>

          {/* Frosted Aqua Refraction Gradient */}
          <linearGradient id="causticAqua" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#4E7A65" stopOpacity="0.12" />
            <stop offset="70%" stopColor="#8AC6B8" stopOpacity="0.07" />
            <stop offset="100%" stopColor="#00635C" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Caustic Beam 1: Diagonal Morning Sunlight Refraction */}
        <g
          className="caustic-layer"
          style={{
            animation: 'causticDrift1 24s ease-in-out infinite alternate',
            transformOrigin: 'top right',
            willChange: 'transform, opacity'
          }}
        >
          <path
            d="M 200 -80 C 600 120, 850 40, 1200 240 S 1400 480, 1600 320 L 1700 -100 Z"
            fill="url(#causticGold)"
          />
        </g>

        {/* Caustic Beam 2: Coastal Sea Glass Undulation */}
        <g
          className="caustic-layer"
          style={{
            animation: 'causticDrift2 28s ease-in-out infinite alternate',
            transformOrigin: 'bottom left',
            willChange: 'transform, opacity'
          }}
        >
          <path
            d="M -120 400 C 180 260, 420 540, 780 380 S 1120 580, 1420 420 L 1500 900 L -120 900 Z"
            fill="url(#causticTeal)"
          />
        </g>

        {/* Caustic Beam 3: Central Frosted Glass Highlight */}
        <g
          className="caustic-layer"
          style={{
            animation: 'causticDrift3 22s ease-in-out infinite alternate',
            transformOrigin: 'center center',
            willChange: 'transform, opacity'
          }}
        >
          <path
            d="M 300 200 C 550 140, 750 320, 980 220 S 1250 340, 1400 260 L 1200 650 L 450 580 Z"
            fill="url(#causticAqua)"
          />
        </g>
      </svg>
    </div>
  );
};

export default KineticGlassCaustics;
