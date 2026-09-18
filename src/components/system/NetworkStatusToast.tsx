/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Network Status Toast Component
 * Real-time offline and online awareness banner for brokers in low-signal field environments.
 */

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export const NetworkStatusToast: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [showRestoredNotice, setShowRestoredNotice] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkConnectivity = async () => {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        setIsOnline(true);
        return;
      }
      // If browser reports offline (e.g. during dev server restart or simulated mode), probe local server
      try {
        const res = await fetch('/api/health', { method: 'GET', cache: 'no-store' });
        if (res.ok) {
          setIsOnline(true);
          return;
        }
      } catch {
        // Genuine network disconnect
      }
      setIsOnline(false);
    };

    const handleOnline = () => {
      setIsOnline(true);
      setShowRestoredNotice(true);
      const timer = setTimeout(() => {
        setShowRestoredNotice(false);
      }, 3500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      checkConnectivity();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    checkConnectivity();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showRestoredNotice) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-full shadow-lg backdrop-blur-md text-xs font-medium transition-all duration-300 animate-fade-in"
      style={{
        backgroundColor: isOnline ? 'rgba(16, 185, 129, 0.92)' : 'rgba(239, 68, 68, 0.92)',
        color: '#FFFFFF'
      }}
    >
      {isOnline ? (
        <>
          <Wifi className="w-3.5 h-3.5 animate-pulse" />
          <span>Back online — connection restored</span>
        </>
      ) : (
        <>
          <WifiOff className="w-3.5 h-3.5 animate-bounce" />
          <span>Offline mode — updates will sync once connection returns</span>
        </>
      )}
    </div>
  );
};

export default NetworkStatusToast;
