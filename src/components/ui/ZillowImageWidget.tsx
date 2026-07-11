/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Home } from 'lucide-react';

interface ZillowImageWidgetProps {
  address: string;
  height?: string;
}

export default function ZillowImageWidget({ address, height = '150px' }: ZillowImageWidgetProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!address) return;
    
    setLoading(true);
    setError(false);
    
    // Call the backend Zillow scraper proxy to retrieve listing image safely
    const fetchZillowImage = async () => {
      try {
        const res = await fetch(`/api/zillow/scrape-image?address=${encodeURIComponent(address)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.imageUrl) {
            setImageUrl(data.imageUrl);
          } else {
            setError(true);
          }
        } else {
          setError(true);
        }
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchZillowImage();
  }, [address]);

  if (!address) return null;

  return (
    <div 
      className="w-full border border-border-strong overflow-hidden bg-secondary-surface mt-2 shadow-sm flex items-center justify-center relative select-none"
      style={{ height }}
    >
      {loading ? (
        <div className="flex flex-col items-center gap-1.5 text-text-tertiary font-mono text-[9px]">
          <span className="w-4 h-4 rounded-full border-2 border-brand-green border-t-transparent animate-spin" />
          <span>CONNECTING ZILLOW...</span>
        </div>
      ) : error || !imageUrl ? (
        <div className="flex flex-col items-center gap-1 text-text-tertiary font-mono text-[9px] p-4 text-center">
          <Home className="w-5 h-5 text-text-tertiary" />
          <span>NO ZILLOW PHOTOS FOUND</span>
        </div>
      ) : (
        <>
          <img 
            src={imageUrl} 
            alt={`Zillow photo for ${address}`}
            className="w-full h-full object-cover filter brightness-95 contrast-[1.02]"
            loading="lazy"
          />
          <div className="absolute bottom-2 right-2.5 bg-black/75 px-1.5 py-0.5 border border-zinc-700 text-[8px] font-mono text-zinc-300 font-bold uppercase tracking-wider">
            Zillow Verified
          </div>
        </>
      )}
    </div>
  );
}
