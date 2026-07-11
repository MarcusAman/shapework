/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface LegalPageLayoutProps {
  title: string;
  effectiveDate: string;
  content: string;
  onNavigate: (path: string) => void;
}

export default function LegalPageLayout({ title, effectiveDate, content, onNavigate }: LegalPageLayoutProps) {
  // Helper to parse basic markdown elements (h1, h2, p, ul/li) into React elements
  const parseContent = (rawText: string) => {
    const lines = rawText.split('\n');
    const elements: React.ReactNode[] = [];
    let inList = false;
    let listItems: React.ReactNode[] = [];

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      // Handle list items
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        if (!inList) {
          inList = true;
          listItems = [];
        }
        listItems.push(
          <li key={`li-${idx}`} className="text-xs md:text-sm text-[#3E4A41] leading-relaxed mb-2 font-light">
            {trimmed.slice(2)}
          </li>
        );
        return;
      }

      // Close list container if leaving list block
      if (inList && !trimmed.startsWith('- ') && !trimmed.startsWith('* ')) {
        inList = false;
        elements.push(
          <ul key={`ul-${idx}`} className="list-disc pl-5 my-4 space-y-1">
            {listItems}
          </ul>
        );
      }

      if (trimmed.startsWith('# ')) {
        // H1 header (Skip if it's the main page title rendered separately)
        if (idx > 5) {
          elements.push(
            <h1 key={idx} className="font-serif font-bold text-xl md:text-2xl text-[#18382B] mt-8 mb-4 border-b border-[#E4DCCB] pb-2">
              {trimmed.slice(2)}
            </h1>
          );
        }
      } else if (trimmed.startsWith('## ')) {
        // H2 header
        elements.push(
          <h2 key={idx} className="font-serif font-bold text-sm md:text-base text-[#18382B] mt-6 mb-3 font-semibold">
            {trimmed.slice(3)}
          </h2>
        );
      } else if (trimmed === '') {
        // Empty space
        elements.push(<div key={idx} className="h-1" />);
      } else {
        // Paragraph text
        elements.push(
          <p key={idx} className="text-xs md:text-sm text-[#3E4A41] leading-relaxed mb-4 font-light text-justify">
            {line}
          </p>
        );
      }
    });

    // Clean up trailing list blocks
    if (inList) {
      elements.push(
        <ul key="ul-trailing" className="list-disc pl-5 my-4 space-y-1">
          {listItems}
        </ul>
      );
    }

    return elements;
  };

  return (
    <div className="min-h-screen bg-[#FBF8F0] text-[#18382B] font-sans antialiased pb-20 select-text">
      {/* Top Brand Banner */}
      <header className="border-b border-[#E4DCCB] bg-[#FFFDF7]/65 backdrop-blur-md sticky top-0 z-30 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => onNavigate('/')}
            className="font-serif font-black text-lg tracking-tight text-[#18382B] hover:text-[#2F5D46] transition-colors cursor-pointer bg-transparent border-none p-0 focus:outline-none"
          >
            shapework<span className="text-brand-primary">.</span>
          </button>
          
          <button
            onClick={() => onNavigate('/')}
            className="text-[10px] uppercase font-bold tracking-wider text-[#68736A] hover:text-[#18382B] transition-colors cursor-pointer"
          >
            ← Back to homepage
          </button>
        </div>
      </header>

      {/* Main Prose Canvas */}
      <main className="max-w-3xl mx-auto px-6 pt-12 md:pt-16">
        <div className="space-y-6">
          <div>
            <h1 className="font-serif font-black text-2xl md:text-3xl lg:text-4xl text-[#18382B] leading-tight tracking-tight">
              {title}
            </h1>
            <p className="text-[10px] md:text-xs text-[#68736A] mt-2 font-mono uppercase tracking-wider">
              Last Updated: {effectiveDate}
            </p>
          </div>

          {/* Parsed legal clauses */}
          <div className="pt-6 border-t border-[#E4DCCB]/60 prose prose-stone max-w-none">
            {parseContent(content)}
          </div>

          {/* Bottom Back Button */}
          <div className="pt-8 border-t border-[#E4DCCB]/60 flex justify-center">
            <button
              onClick={() => onNavigate('/')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2F5D46] hover:text-[#18382B] transition-colors cursor-pointer bg-transparent border-none focus:outline-none"
            >
              <span>← Back to homepage</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
