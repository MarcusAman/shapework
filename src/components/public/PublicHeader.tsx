import React from 'react';
import { Menu, X, ArrowUpRight, LogIn } from 'lucide-react';

interface PublicHeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export default function PublicHeader({ currentPath, onNavigate }: PublicHeaderProps) {
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Method', path: '/method' },
    { name: 'Brokerages', path: '/brokerages' },
    { name: 'Operational Intelligence', path: '/operational-intelligence' },
    { name: 'Field Notes', path: '/field-notes' },
    { name: 'Discovery', path: '/discovery' },
    { name: 'About', path: '/about' },
  ];

  const handleLinkClick = (path: string) => {
    setIsMobileMenuOpen(false);
    onNavigate(path);
  };

  return (
    <>
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 font-sans select-none px-6 md:px-12 py-5 flex items-center justify-between ${
          isScrolled 
            ? 'bg-canvas/90 backdrop-blur-md border-b border-border-soft py-4 shadow-sm' 
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        {/* Brand Wordmark */}
        <button 
          onClick={() => handleLinkClick('/')}
          className="flex items-center gap-1 cursor-pointer bg-transparent border-none p-0 focus:outline-none"
        >
          <span className="font-serif font-bold text-xl md:text-2xl text-text-primary tracking-tight">
            shapework<span className="text-brand-primary">.</span>
          </span>
        </button>

        {/* Center Desktop Links */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = currentPath === link.path;
            return (
              <button
                key={link.path}
                onClick={() => handleLinkClick(link.path)}
                className={`text-xs font-medium uppercase tracking-wider transition-colors cursor-pointer bg-transparent border-none p-0 focus:outline-none ${
                  isActive 
                    ? 'text-brand-primary font-bold' 
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {link.name}
              </button>
            );
          })}
        </div>

        {/* Right Actions */}
        <div className="hidden lg:flex items-center gap-4">
          <button
            onClick={() => handleLinkClick('/login')}
            className="flex items-center gap-1 px-3.5 py-2 text-xs font-semibold text-text-secondary hover:text-text-primary bg-surface border border-border-soft hover:border-brand-primary/45 rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Login</span>
          </button>
          
          <button
            onClick={() => handleLinkClick('/discovery')}
            className="px-4 py-2 text-xs font-bold text-white bg-brand-primary hover:bg-brand-primary-hover rounded-lg shadow-sm transition-all cursor-pointer"
          >
            Request Discovery
          </button>
        </div>

        {/* Mobile Menu Toggle Button */}
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden text-text-primary p-1 bg-surface border border-border-soft rounded-lg focus:outline-none cursor-pointer"
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile Menu Panel */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-canvas pt-24 px-6 pb-8 flex flex-col justify-between lg:hidden animate-fade-in font-sans">
          <div className="space-y-6">
            {navLinks.map((link) => {
              const isActive = currentPath === link.path;
              return (
                <button
                  key={link.path}
                  onClick={() => handleLinkClick(link.path)}
                  className={`w-full text-left py-3 text-lg font-serif font-bold border-b border-border-soft/60 block bg-transparent border-t-none border-x-none focus:outline-none ${
                    isActive 
                      ? 'text-brand-primary border-brand-primary' 
                      : 'text-text-secondary border-b border-border-soft/40'
                  }`}
                >
                  {link.name}
                </button>
              );
            })}
          </div>

          <div className="space-y-3 pt-6 border-t border-border-soft">
            <button
              onClick={() => handleLinkClick('/login')}
              className="w-full py-3 bg-surface border border-border-soft text-text-primary font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <LogIn className="w-4 h-4" />
              <span>Login</span>
            </button>
            <button
              onClick={() => handleLinkClick('/discovery')}
              className="w-full py-3 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <span>Request Discovery</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
