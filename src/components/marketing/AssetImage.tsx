import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';

interface AssetImageProps {
  src?: string;
  alt: string;
  className?: string;
  /** Thumbnails can be inside buttons, so their fallback contains no controls. */
  compact?: boolean;
}

export function AssetImage(props: AssetImageProps) {
  // A different asset gets a fresh load state, including when switching lightbox slides.
  return <AssetImageAttempt key={props.src} {...props} />;
}

function AssetImageAttempt({ src, alt, className, compact = true }: AssetImageProps) {
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  if (!src || failed) {
    if (compact) {
      return (
        <span
          role="img"
          aria-label={`Preview unavailable for ${alt}`}
          className="w-full h-full min-h-12 flex flex-col items-center justify-center gap-1 p-1 bg-slate-100 text-slate-600 text-center"
        >
          <ImageOff className="w-5 h-5 shrink-0" aria-hidden="true" />
          <span className="text-[10px] font-semibold leading-tight">Preview unavailable</span>
        </span>
      );
    }
    return (
      <div className="max-w-sm rounded-xl border border-slate-700 bg-slate-900 p-6 text-center text-white" role="status">
        <ImageOff className="w-8 h-8 mx-auto text-slate-400" aria-hidden="true" />
        <p className="mt-3 text-sm font-semibold">Preview unavailable</p>
        <p className="mt-1 text-xs text-slate-300">This image could not be loaded. Try again or use Download to open the file.</p>
        {src && (
          <button
            type="button"
            className="mt-4 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-100"
            onClick={() => { setFailed(false); setAttempt(previous => previous + 1); }}
          >Try again</button>
        )}
      </div>
    );
  }

  return <img key={attempt} src={src} alt={alt} className={className} onError={() => setFailed(true)} />;
}
