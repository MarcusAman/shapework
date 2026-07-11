import React, { useRef, useEffect } from 'react';

export default function HeroOrb() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let animationFrameId: number;

    // High-precision frame polling to loop exactly between 0.0s and 6.5s at 60fps
    const checkLoopBounds = () => {
      if (video.currentTime >= 6.5) {
        video.currentTime = 0;
      }
      animationFrameId = requestAnimationFrame(checkLoopBounds);
    };

    // Slow down playback by 10%
    video.playbackRate = 0.9;

    video.currentTime = 0;
    animationFrameId = requestAnimationFrame(checkLoopBounds);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div 
      className="relative w-full max-w-[1100px] aspect-video mx-auto flex items-center justify-center md:translate-x-[5%] md:translate-y-[5%] bg-stone-950 border border-border-soft rounded-[28px] overflow-hidden shadow-card pointer-events-none transition-transform duration-500 ease-out"
    >
      <video
        ref={videoRef}
        src="/Shapework_AI_real_estate_operations_202606291902.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="w-full h-full object-cover select-none rounded-[28px]"
      />
    </div>
  );
}
