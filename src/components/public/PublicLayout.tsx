/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import PublicHeader from './PublicHeader';
import PublicFooter from './PublicFooter';

interface PublicLayoutProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  children: React.ReactNode;
}

export default function PublicLayout({ currentPath, onNavigate, children }: PublicLayoutProps) {
  const isHomePage = currentPath === '/' || currentPath === '' || currentPath === '/home' || currentPath === '/practice';

  return (
    <div className="min-h-screen bg-[#f5f2ec] text-[#14140f] flex flex-col font-sans select-none antialiased">
      {/* Header Navigation */}
      <PublicHeader currentPath={currentPath} onNavigate={onNavigate} />

      {/* Main Page Area */}
      <main className={`flex-1 ${isHomePage ? 'pt-0' : 'pt-20'}`}>
        <div className="w-full">
          {children}
        </div>
      </main>

      {/* Footer Details (rendered on subpages; PublicHome has its own matching footer) */}
      {!isHomePage && <PublicFooter onNavigate={onNavigate} />}
    </div>
  );
}
