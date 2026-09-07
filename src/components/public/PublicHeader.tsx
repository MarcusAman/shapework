/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Menu, X, ChevronDown } from 'lucide-react';

interface PublicHeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export default function PublicHeader({ currentPath, onNavigate }: PublicHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isPastHero, setIsPastHero] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [whatWeDoOpen, setWhatWeDoOpen] = useState(false);
  const [industriesOpen, setIndustriesOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 40;
      const pastHero = window.scrollY > 400 || currentPath !== '/';
      setIsScrolled(scrolled);
      setIsPastHero(pastHero);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentPath]);

  const handleLinkClick = (path: string) => {
    setIsMobileMenuOpen(false);
    setWhatWeDoOpen(false);
    setIndustriesOpen(false);
    onNavigate(path);
  };

  const isLoginPage = currentPath.startsWith('/login') || currentPath.startsWith('/forgot-password') || currentPath.startsWith('/reset-password');

  return (
    <>
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 font-sans select-none px-6 md:px-14 py-6 flex items-center justify-between ${
          isScrolled 
            ? 'bg-[#f5f2ec]/90 backdrop-blur-md border-b border-[#d6d0c2] py-4 shadow-xs' 
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        {/* Brand Wordmark (fades in on scroll past hero, or always visible on subpages) */}
        <button 
          onClick={() => handleLinkClick('/')}
          className={`flex items-center gap-0.5 cursor-pointer bg-transparent border-none p-0 focus:outline-none transition-opacity duration-300 ${
            isPastHero || currentPath !== '/' ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <span className="font-serif font-medium text-[22px] md:text-[24px] text-[#14140f] tracking-[-0.03em]">
            shapework<span className="text-[#1f3a2e]">.</span>
          </span>
        </button>

        {/* Desktop Navigation Links */}
        {!isLoginPage && (
          <div className="hidden lg:flex items-center gap-7">
            {/* What We Do Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setWhatWeDoOpen(true)}
              onMouseLeave={() => setWhatWeDoOpen(false)}
            >
              <button
                type="button"
                className="text-[14px] text-[#4a4a44] hover:text-[#14140f] flex items-center gap-1.5 transition-colors cursor-pointer bg-transparent border-none py-2"
              >
                <span>What We Do</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </button>

              {whatWeDoOpen && (
                <div className="absolute top-[calc(100%+4px)] left-0 w-72 bg-[#f5f2ec] border border-[#d6d0c2] rounded-2xl p-2.5 shadow-xl flex flex-col gap-1 animate-fadeIn">
                  <button
                    onClick={() => handleLinkClick('/discovery')}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-[#ebe6dc] transition cursor-pointer"
                  >
                    <div className="text-[13px] font-semibold text-[#14140f]">Workflow Discovery</div>
                    <div className="text-[11px] text-[#8a8a82]">The diagnostic. Find the friction.</div>
                  </button>
                  <button
                    onClick={() => handleLinkClick('/method')}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-[#ebe6dc] transition cursor-pointer"
                  >
                    <div className="text-[13px] font-semibold text-[#14140f]">Workflow Design</div>
                    <div className="text-[11px] text-[#8a8a82]">Redesign how the work moves.</div>
                  </button>
                  <button
                    onClick={() => handleLinkClick('/discovery')}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-[#ebe6dc] transition cursor-pointer"
                  >
                    <div className="text-[13px] font-semibold text-[#14140f]">Systems &amp; Automation</div>
                    <div className="text-[11px] text-[#8a8a82]">Build the solution. Remove busywork.</div>
                  </button>
                  <button
                    onClick={() => handleLinkClick('/operational-intelligence')}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-[#ebe6dc] transition cursor-pointer"
                  >
                    <div className="text-[13px] font-semibold text-[#14140f]">AI Implementation</div>
                    <div className="text-[11px] text-[#8a8a82]">AI where it earns its place.</div>
                  </button>
                </div>
              )}
            </div>

            {/* Industries Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setIndustriesOpen(true)}
              onMouseLeave={() => setIndustriesOpen(false)}
            >
              <button
                type="button"
                className="text-[14px] text-[#4a4a44] hover:text-[#14140f] flex items-center gap-1.5 transition-colors cursor-pointer bg-transparent border-none py-2"
              >
                <span>Industries</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </button>

              {industriesOpen && (
                <div className="absolute top-[calc(100%+4px)] left-0 w-80 bg-[#f5f2ec] border border-[#d6d0c2] rounded-2xl p-2.5 shadow-xl flex flex-col gap-1 animate-fadeIn">
                  <button
                    onClick={() => handleLinkClick('/brokerages')}
                    className="w-full text-left p-2.5 rounded-xl bg-[#1f3a2e] text-[#f5f2ec] hover:bg-[#16281f] transition cursor-pointer"
                  >
                    <div className="text-[13px] font-semibold text-[#f5f2ec]">Real Estate Brokerages</div>
                    <div className="text-[11px] text-[#8fb09f]">Our first specialty. Deepest domain knowledge.</div>
                  </button>
                  <button
                    onClick={() => handleLinkClick('/discovery')}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-[#ebe6dc] transition cursor-pointer"
                  >
                    <div className="text-[13px] font-semibold text-[#14140f]">Professional Services</div>
                    <div className="text-[11px] text-[#8a8a82]">Consistent delivery, scale without chaos.</div>
                  </button>
                  <button
                    onClick={() => handleLinkClick('/discovery')}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-[#ebe6dc] transition cursor-pointer"
                  >
                    <div className="text-[13px] font-semibold text-[#14140f]">Healthcare Practices</div>
                    <div className="text-[11px] text-[#8a8a82]">Patient experience, less admin burden.</div>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => handleLinkClick('/method')}
              className="text-[14px] text-[#4a4a44] hover:text-[#14140f] transition-colors cursor-pointer bg-transparent border-none"
            >
              The Method
            </button>

            <button
              onClick={() => handleLinkClick('/operational-intelligence')}
              className="text-[14px] text-[#4a4a44] hover:text-[#14140f] transition-colors cursor-pointer bg-transparent border-none"
            >
              Operational Intelligence
            </button>

            <button
              onClick={() => handleLinkClick('/about')}
              className="text-[14px] text-[#4a4a44] hover:text-[#14140f] transition-colors cursor-pointer bg-transparent border-none"
            >
              About
            </button>

            <button
              onClick={() => handleLinkClick('/login')}
              className="text-[14px] font-medium text-[#14140f] hover:text-[#1f3a2e] transition-colors cursor-pointer bg-transparent border-none mr-1"
            >
              Login
            </button>

            <button
              onClick={() => handleLinkClick('/discovery')}
              className="px-5 py-2.5 text-[13px] font-medium text-[#14140f] hover:text-[#f5f2ec] bg-transparent hover:bg-[#14140f] border border-[#14140f] rounded-full transition-all cursor-pointer shadow-xs whitespace-nowrap"
            >
              Request Workflow Discovery
            </button>
          </div>
        )}

        {/* Mobile Menu Hamburger Button */}
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden text-[#14140f] p-2 rounded-lg hover:bg-[#ebe6dc] focus:outline-none cursor-pointer"
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-[#f5f2ec] pt-24 px-8 pb-10 flex flex-col justify-between lg:hidden animate-fadeIn font-sans overflow-y-auto">
          <div className="space-y-4">
            <button onClick={() => handleLinkClick('/discovery')} className="w-full text-left font-serif text-[26px] text-[#14140f] py-2 border-b border-[#d6d0c2]/60">Workflow Discovery</button>
            <button onClick={() => handleLinkClick('/method')} className="w-full text-left font-serif text-[26px] text-[#14140f] py-2 border-b border-[#d6d0c2]/60">Workflow Design</button>
            <button onClick={() => handleLinkClick('/brokerages')} className="w-full text-left font-serif text-[26px] text-[#14140f] py-2 border-b border-[#d6d0c2]/60">Real Estate Brokerages</button>
            <button onClick={() => handleLinkClick('/operational-intelligence')} className="w-full text-left font-serif text-[26px] text-[#14140f] py-2 border-b border-[#d6d0c2]/60">Operational Intelligence</button>
            <button onClick={() => handleLinkClick('/about')} className="w-full text-left font-serif text-[26px] text-[#14140f] py-2 border-b border-[#d6d0c2]/60">About</button>
            <button onClick={() => handleLinkClick('/login')} className="w-full text-left font-serif text-[26px] text-[#14140f] py-2 border-b border-[#d6d0c2]/60">Login</button>
          </div>

          <div className="space-y-4 pt-8 border-t border-[#d6d0c2] mt-8">
            <button
              onClick={() => handleLinkClick('/discovery')}
              className="w-full py-4 bg-[#1f3a2e] text-[#f5f2ec] font-medium text-[15px] rounded-full shadow-md"
            >
              Request Workflow Discovery
            </button>
            <div className="text-center text-xs text-[#8a8a82]">
              hello@shapework.co
            </div>
          </div>
        </div>
      )}
    </>
  );
}
