import React, { useState, useRef, useEffect } from 'react';

export interface NestOrbVisualizerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'responsive';
  customSize?: number;
  state?: 'idle' | 'listening' | 'speaking' | 'processing' | 'error';
  videoSrc?: string;
  onClick?: () => void;
  interactive?: boolean;
  className?: string;
  testId?: string;
  ariaLabel?: string;
}

export function NestOrbVisualizer({
  size = 'lg',
  customSize,
  state = 'idle',
  videoSrc = '/nest_orb_2.mp4',
  onClick,
  interactive = false,
  className = '',
  testId = 'ask-nest-ops-orb',
  ariaLabel = 'Talk to Ask Nest Ops'
}: NestOrbVisualizerProps) {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);

  // Dual-layer crossfade state for seamless looping
  const [activeLayer, setActiveLayer] = useState<'A' | 'B'>('A');
  const videoRefA = useRef<HTMLVideoElement>(null);
  const videoRefB = useRef<HTMLVideoElement>(null);
  const isCrossfading = useRef(false);

  // Guarantee inline autoplay kicks in without user interaction restrictions
  useEffect(() => {
    if (videoRefA.current) {
      videoRefA.current.play().catch(() => {});
    }
  }, [videoSrc]);

  // Size classes
  const isResponsive = size === 'responsive';
  const sizeClass = isResponsive
    ? 'w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48'
    : size === 'xs' ? 'w-6 h-6'
    : size === 'sm' ? 'w-7 h-7'
    : size === 'md' ? 'w-14 h-14'
    : size === 'lg' ? 'w-36 h-36'
    : 'w-48 h-48';

  const isSmall = size === 'xs' || size === 'sm';

  // Seamless crossfade loop synchronization
  const handleTimeUpdateA = () => {
    const vA = videoRefA.current;
    const vB = videoRefB.current;
    if (!vA || !vB || !vA.duration) return;

    // When approaching the final 0.75s of the video, start crossfading to B
    const timeLeft = vA.duration - vA.currentTime;
    if (timeLeft <= 0.75 && activeLayer === 'A' && !isCrossfading.current) {
      isCrossfading.current = true;
      vB.currentTime = 0;
      vB.play().catch(() => {});
      setActiveLayer('B');
      setTimeout(() => {
        isCrossfading.current = false;
      }, 700);
    }
  };

  const handleTimeUpdateB = () => {
    const vA = videoRefA.current;
    const vB = videoRefB.current;
    if (!vA || !vB || !vB.duration) return;

    // When approaching the final 0.75s of video B, start crossfading back to A
    const timeLeft = vB.duration - vB.currentTime;
    if (timeLeft <= 0.75 && activeLayer === 'B' && !isCrossfading.current) {
      isCrossfading.current = true;
      vA.currentTime = 0;
      vA.play().catch(() => {});
      setActiveLayer('A');
      setTimeout(() => {
        isCrossfading.current = false;
      }, 700);
    }
  };

  // Ring & aura classes based on state
  const stateAura = 
    state === 'listening'
      ? 'ring-8 ring-[var(--brand-primary)]/40 scale-105 shadow-[0_0_56px_rgba(0,99,92,0.55)]'
      : state === 'processing'
        ? 'ring-6 ring-[var(--brand-primary)]/30 duration-1000 scale-[1.03] shadow-[0_0_42px_rgba(0,99,92,0.4)]'
        : state === 'speaking'
          ? 'ring-8 ring-emerald-500/45 scale-105 shadow-[0_0_60px_rgba(16,185,129,0.55)]'
          : state === 'error'
            ? 'ring-2 ring-stone-300 shadow-sm'
            : interactive
              ? 'ring-2 ring-[var(--brand-primary)]/20 hover:ring-[var(--brand-primary)]/45 hover:scale-[1.04] shadow-[0_0_40px_rgba(0,99,92,0.22)]'
              : 'shadow-md shadow-emerald-950/15';

  const breathingClass = (state === 'listening' || state === 'speaking' || state === 'processing')
    ? 'animate-orb-breathe-active'
    : 'animate-orb-breathe';

  const styleProp = customSize ? { width: `${customSize}px`, height: `${customSize}px` } : undefined;

  const Tag = interactive ? 'button' : 'div';

  return (
    <Tag
      data-testid={testId}
      type={interactive ? 'button' : undefined}
      aria-label={interactive ? ariaLabel : undefined}
      onClick={interactive && onClick ? onClick : undefined}
      style={styleProp}
      className={`relative rounded-full shrink-0 select-none overflow-hidden transition-all duration-500 flex items-center justify-center ${sizeClass} ${stateAura} ${breathingClass} ${
        interactive ? 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2' : 'pointer-events-none'
      } ${className}`}
    >
      {/* 1. Primary Looping Video Element (A) */}
      {!videoError && videoSrc && (
        <video
          ref={videoRefA}
          src={videoSrc}
          poster="/nest_n_green.png"
          autoPlay
          muted
          loop
          playsInline
          data-testid="orb-video-element"
          onTimeUpdate={handleTimeUpdateA}
          onLoadedData={() => setVideoLoaded(true)}
          onError={() => setVideoError(true)}
          className={`absolute inset-0 w-full h-full object-cover rounded-full pointer-events-none motion-reduce:animate-none transition-opacity duration-700 ease-in-out ${
            activeLayer === 'A' ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {/* 2. Secondary Crossfader Video Layer (B) */}
      {!videoError && videoSrc && (
        <video
          ref={videoRefB}
          src={videoSrc}
          poster="/nest_n_green.png"
          muted
          loop
          playsInline
          onTimeUpdate={handleTimeUpdateB}
          className={`absolute inset-0 w-full h-full object-cover rounded-full pointer-events-none motion-reduce:animate-none transition-opacity duration-700 ease-in-out ${
            activeLayer === 'B' ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {/* 3. Underlying Bioluminescent Radial Core */}
      <div 
        className={`absolute inset-0 rounded-full bg-gradient-to-tr from-[#01221c] via-[#00473f] to-[#0d6e5d] pointer-events-none z-0 transition-opacity duration-700 animate-orb-core-pulse ${
          videoLoaded ? 'opacity-40' : 'opacity-100'
        }`}
        style={{
          boxShadow: 'inset 0 0 28px rgba(0, 0, 0, 0.6)'
        }}
      />

      {/* 3. Soft Atmospheric Feathering & Edge Blend Vignette */}
      <div 
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, transparent 65%, rgba(0, 45, 38, 0.45) 90%, rgba(0, 30, 25, 0.75) 100%)',
          boxShadow: 'inset 0 0 16px rgba(0, 0, 0, 0.35)'
        }}
      />

      {/* 4. Rotating Glass Sheen & Refraction Aurora */}
      <div 
        className="absolute inset-0 rounded-full pointer-events-none animate-orb-sheen"
        style={{
          background: 'conic-gradient(from 180deg at 50% 50%, rgba(255,255,255,0) 0deg, rgba(52, 211, 153, 0.15) 120deg, rgba(255,255,255,0) 240deg, rgba(20, 184, 166, 0.2) 360deg)',
          mixBlendMode: 'screen'
        }}
      />

      {/* 5. Dynamic State Glow Pulse */}
      <div 
        className={`absolute inset-0 rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-400/35 via-teal-500/15 to-transparent pointer-events-none transition-opacity duration-500 ${
          state === 'listening' || state === 'speaking' || state === 'processing' ? 'opacity-100 animate-pulse' : 'opacity-40'
        }`}
      />

      {/* 6. Nest Realty "N" & Brand Monogram Overlay */}
      <div 
        className={`absolute inset-0 rounded-full flex items-center justify-center pointer-events-none transition-opacity duration-500 ${
          videoLoaded && !isSmall ? 'opacity-25 hover:opacity-50' : 'opacity-100'
        }`}
      >
        {isSmall ? (
          <div className="w-full h-full rounded-full bg-teal-900/30 flex items-center justify-center border border-white/20">
            <span className="font-serif font-black text-white text-[11px] leading-none tracking-tight drop-shadow-sm">N</span>
          </div>
        ) : (
          <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-emerald-950/50 backdrop-blur-xs border border-white/20 flex items-center justify-center shadow-lg">
            <span className="font-serif font-black text-white text-base md:text-xl leading-none tracking-tight drop-shadow-sm">N</span>
          </div>
        )}
      </div>

      {/* 7. Highlight Glass Bevel & Top Reflection Rim */}
      <div className="absolute inset-0 rounded-full border border-white/30 pointer-events-none shadow-[inset_0_1.5px_4px_rgba(255,255,255,0.45)]" />
    </Tag>
  );
}

export default NestOrbVisualizer;
