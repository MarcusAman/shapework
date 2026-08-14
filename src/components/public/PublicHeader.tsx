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
    { name: 'The Method', path: '/method' },
    { name: 'Beliefs', path: '/#beliefs' },
    { name: 'About', path: '/about' },
  ];

  const handleLinkClick = (path: string) => {
    setIsMobileMenuOpen(false);
    if (path.startsWith('/#')) {
      const elementId = path.substring(2);
      const element = document.getElementById(elementId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        return;
      }
      onNavigate('/');
      setTimeout(() => {
        document.getElementById(elementId)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return;
    }
    onNavigate(path);
  };

  const isLoginPage = currentPath.startsWith('/login') || currentPath.startsWith('/forgot-password') || currentPath.startsWith('/reset-password');

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

        {/* Desktop Navigation Links - hidden on login pages */}
        {!isLoginPage && (
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = currentPath === link.path;
              return (
                <button
                  key={link.path}
                  onClick={() => handleLinkClick(link.path)}
                  className={`text-xs font-semibold tracking-wide transition-all cursor-pointer bg-transparent border-none p-0 ${
                    isActive ? 'text-brand-primary font-bold' : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {link.name}
                </button>
              );
            })}
          </div>
        )}

        {/* Right Actions - Login & Discovery Buttons */}
        <div className="hidden lg:flex items-center gap-3">
          <button
            onClick={() => handleLinkClick('/login')}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-stone-900 hover:text-[#00635C] bg-white hover:bg-stone-50 border border-stone-800 rounded-full transition-all cursor-pointer shadow-xs"
          >
            <LogIn className="w-3.5 h-3.5 text-[#00635C]" />
            <span>Login</span>
          </button>
          {!isLoginPage && (
            <button
              onClick={() => handleLinkClick('/discovery')}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-stone-900 hover:text-white bg-transparent hover:bg-stone-900 border border-stone-800 rounded-full transition-all cursor-pointer shadow-xs"
            >
              <span>Request Workflow Discovery</span>
            </button>
          )}
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
          {!isLoginPage && (
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
          )}

          <div className="space-y-3 pt-6 border-t border-border-soft mt-auto">
            <button
              onClick={() => handleLinkClick('/login')}
              className="w-full py-3 bg-white border border-stone-800 text-stone-900 font-bold text-xs rounded-full flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <LogIn className="w-4 h-4 text-[#00635C]" />
              <span>Login</span>
            </button>
            {!isLoginPage && (
              <button
                onClick={() => handleLinkClick('/discovery')}
                className="w-full py-3 bg-stone-900 text-white font-bold text-xs rounded-full flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span>Request Workflow Discovery</span>
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
