import React from 'react';

interface PublicFooterProps {
  onNavigate: (path: string) => void;
}

export default function PublicFooter({ onNavigate }: PublicFooterProps) {
  const footerLinks = [
    {
      title: "Legal",
      items: [
        { label: "Terms", path: "/terms" },
        { label: "Privacy", path: "/privacy" },
      ]
    }
  ];

  return (
    <footer className="border-t border-border-soft bg-surface py-16 px-6 md:px-12 font-sans select-none text-left">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-12">
        {/* Column 1: Brand Wordmark */}
        <div className="space-y-4 md:col-span-2">
          <span className="font-serif font-bold text-xl text-text-primary tracking-tight block">
            shapework<span className="text-brand-primary">.</span>
          </span>
          <p className="text-xs md:text-sm text-text-secondary leading-relaxed max-w-sm font-light">
            We map how work actually moves, redesign high-friction handoffs, and build the operating layer that turns scattered requests, documents, and deadlines into structured work.
          </p>
          <div className="pt-2">
            <span className="text-[10px] uppercase font-bold text-text-tertiary block mb-1">
              Contact
            </span>
            <a 
              href="mailto:hello@shapework.co" 
              className="text-xs text-brand-primary hover:underline font-medium"
            >
              hello@shapework.co
            </a>
          </div>
        </div>

        {/* Dynamic footer link grids */}
        {footerLinks.map((col, idx) => (
          <div key={idx} className="space-y-4">
            <span className="text-[10px] uppercase font-bold tracking-wider text-text-tertiary block">
              {col.title}
            </span>
            <ul className="space-y-2">
              {col.items.map((item, linkIdx) => (
                <li key={linkIdx}>
                  <button
                    onClick={() => onNavigate(item.path)}
                    className="text-xs text-text-secondary hover:text-text-primary transition-colors cursor-pointer bg-transparent border-none p-0 focus:outline-none"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Copyright metadata row */}
      <div className="max-w-6xl mx-auto border-t border-border-soft/60 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-text-tertiary font-light">
        <p>
          &copy; {new Date().getFullYear()} shapework. All rights reserved.
        </p>
        <p className="flex items-center gap-1.5">
          <span>Born in Wilmington, NC</span>
          <span className="w-1.5 h-1.5 rounded-full bg-brand-primary/50" />
          <span>Serving operators worldwide</span>
        </p>
      </div>
    </footer>
  );
}
