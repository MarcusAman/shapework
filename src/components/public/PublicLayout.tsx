import React from 'react';
import PublicHeader from './PublicHeader';
import PublicFooter from './PublicFooter';

interface PublicLayoutProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  children: React.ReactNode;
}

export default function PublicLayout({ currentPath, onNavigate, children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-canvas text-text-primary flex flex-col font-sans select-none antialiased">
      {/* Header Navigation */}
      <PublicHeader currentPath={currentPath} onNavigate={onNavigate} />

      {/* Main Page Area */}
      <main className="flex-1 pt-20">
        <div className="w-full">
          {children}
        </div>
      </main>

      {/* Footer Details */}
      <PublicFooter onNavigate={onNavigate} />
    </div>
  );
}
