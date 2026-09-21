import React, { useState, useEffect, useRef } from 'react';
import { Copy, Check } from 'lucide-react';

export interface MlsNumberBadgeProps {
  mlsNumber?: string | null;
  className?: string;
  size?: 'xs' | 'sm' | 'md';
  isLive?: boolean;
  status?: 'live' | 'supplied' | 'pre_mls' | 'unknown' | string;
  showStatus?: boolean;
}

export const MlsNumberBadge: React.FC<MlsNumberBadgeProps> = ({
  mlsNumber,
  className = '',
  size = 'sm',
  isLive,
  status,
  showStatus = false,
}) => {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!mlsNumber || !mlsNumber.trim()) {
    return null;
  }

  const cleanMls = mlsNumber.trim();

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    let success = false;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(cleanMls);
        success = true;
      } catch (err) {
        console.warn('navigator.clipboard failed, attempting execCommand fallback:', err);
      }
    }

    if (!success) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = cleanMls;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        success = document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch (fallbackErr) {
        console.error('Failed to copy MLS number via execCommand fallback:', fallbackErr);
      }
    }

    setCopied(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5 gap-1',
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-sm px-2.5 py-1 gap-2',
  }[size];

  const iconSizes = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
  }[size];

  return (
    <span
      data-mls-copy="true"
      tabIndex={0}
      aria-label={copied ? 'MLS number copied' : `Copy MLS number ${cleanMls}`}
      className={`inline-flex items-center font-mono font-medium rounded border transition-colors select-none cursor-pointer ${
        copied
          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
      } ${sizeClasses} ${className}`}
      title={copied ? 'Copied!' : `Click to copy MLS# ${cleanMls}`}
      onClick={handleCopy}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCopy(e as any);
        }
      }}
    >
      <span className="font-sans font-semibold text-slate-500 text-[10px] tracking-wider uppercase">
        MLS#
      </span>
      <span className="text-slate-800 font-semibold tracking-tight">{cleanMls}</span>
      {(showStatus || isLive !== undefined || status !== undefined) && (
        <span className={`font-sans text-[10px] font-semibold px-1 py-0.2 rounded ${
          (isLive === true || status === 'live' || status === 'flex_live')
            ? 'text-emerald-700 bg-emerald-100'
            : 'text-slate-600 bg-slate-200'
        }`}>
          {(isLive === true || status === 'live' || status === 'flex_live') ? 'Live' : 'Supplied'}
        </span>
      )}
      <span
        className={`inline-flex items-center justify-center rounded p-0.5 transition-colors ${
          copied ? 'text-emerald-600' : 'text-slate-400'
        }`}
        aria-hidden="true"
      >
        {copied ? (
          <span className="inline-flex items-center gap-0.5 text-emerald-600 text-[10px] font-sans font-semibold">
            <Check className={`${iconSizes} stroke-[2.5]`} />
            <span>Copied</span>
          </span>
        ) : (
          <Copy className={iconSizes} />
        )}
      </span>
    </span>
  );
};
