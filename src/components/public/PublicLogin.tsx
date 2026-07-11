import React, { useState } from 'react';
import { LogIn, ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

interface PublicLoginProps {
  onNavigate: (path: string) => void;
}

export default function PublicLogin({ onNavigate }: PublicLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const shouldReduceMotion = useReducedMotion();

  React.useEffect(() => {
    fetch('/api/auth/session')
      .then(res => {
        if (res.ok) {
          onNavigate('/app');
        }
      })
      .catch(() => {});
  }, [onNavigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid email or password.');
      }

      onNavigate('/app');
    } catch (err: any) {
      console.error('[Login] Error during authentication:', err);
      setErrorMsg(err.message || 'Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Framer Motion variants that respect reduced motion settings
  const containerVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.05 : 0.45,
        ease: 'easeOut',
        staggerChildren: shouldReduceMotion ? 0 : 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 6 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: shouldReduceMotion ? 0.05 : 0.35, ease: 'easeOut' }
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 font-sans bg-[#F7F3EA] text-[#1E2520] select-none">
      
      {/* Left Panel: Cover Image */}
      <div className="hidden lg:block lg:col-span-5 relative overflow-hidden bg-[#18382B]">
        <motion.div
          initial={{ scale: shouldReduceMotion ? 1 : 1.03 }}
          animate={{ scale: 1 }}
          transition={{ duration: shouldReduceMotion ? 0 : 1.5, ease: 'easeOut' }}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('/nest_background_img.png')` }}
        />
        {/* Subtle dark green gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#18382B]/95 via-[#18382B]/75 to-[#2F5D46]/45" />
        
        {/* Branding on cover image */}
        <div className="absolute inset-0 p-12 flex flex-col justify-between z-10 text-[#FFFDF7]">
          <div 
            onClick={() => onNavigate('/')} 
            className="font-serif font-bold text-xl tracking-tight cursor-pointer"
          >
            shapework<span className="text-[#DDEBDD]">.</span>
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold leading-snug tracking-tight">
              Calm operations for modern brokerages.
            </h2>
            <p className="text-xs text-[#DDEBDD]/80 font-light max-w-sm leading-relaxed">
              We design the operating layer that turns scattered emails, files, and updates into structured, automated work.
            </p>
          </div>
          <div className="text-[10px] text-[#DDEBDD]/40 font-mono">
            EST. 2026 / WILMINGTON, NC
          </div>
        </div>
      </div>

      {/* Right Panel: Content Card */}
      <div className="lg:col-span-7 flex flex-col justify-center items-center p-6 md:p-12 relative">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-[420px] bg-[#FFFDF7] border border-[#E4DCCB]/85 rounded-[28px] p-8 md:p-10 shadow-[18px_18px_44px_rgba(55,47,35,0.11),-12px_-12px_32px_rgba(255,255,255,0.65)] backdrop-blur-md flex flex-col space-y-6 relative overflow-hidden"
        >
          {/* Subtle decoration */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#DDEBDD]/20 rounded-full blur-2xl pointer-events-none" />

          {/* Logo & Headline */}
          <motion.div variants={itemVariants} className="space-y-2">
            <div className="lg:hidden font-serif font-bold text-lg text-[#1E2520] tracking-tight mb-2">
              shapework<span className="text-[#2F5D46]">.</span>
            </div>
            <h1 className="text-xl font-bold text-[#1E2520] tracking-tight">
              Log in to shapework.
            </h1>
            <p className="text-xs text-[#68736A] font-light">
              Access your brokerage operating console.
            </p>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50/50 border border-red-200/60 rounded-xl text-[11px] text-red-600 leading-normal"
              >
                {errorMsg}
              </motion.div>
            )}

            {/* Email Address */}
            <motion.div variants={itemVariants} className="space-y-1.5 text-left">
              <label className="text-[9px] font-bold text-[#68736A] uppercase tracking-wider block">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@shapework.co"
                disabled={isLoading}
                className="w-full px-4 py-3 bg-[#FBF8F0] border border-[#E4DCCB] rounded-xl text-xs text-[#1E2520] placeholder:text-[#68736A]/55 focus:bg-[#FFFDF7] focus:outline-none focus:border-[#2F5D46] focus:ring-1 focus:ring-[#2F5D46] transition-all"
                required
              />
            </motion.div>

            {/* Password */}
            <motion.div variants={itemVariants} className="space-y-1.5 text-left">
              <div className="flex justify-between items-center">
                <label className="text-[9px] font-bold text-[#68736A] uppercase tracking-wider block">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => onNavigate('/forgot-password')}
                  className="text-[9px] font-semibold text-[#2F5D46] hover:text-[#18382B] bg-transparent border-none p-0 cursor-pointer focus:outline-none"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="w-full pl-4 pr-10 py-3 bg-[#FBF8F0] border border-[#E4DCCB] rounded-xl text-xs text-[#1E2520] placeholder:text-[#68736A]/55 focus:bg-[#FFFDF7] focus:outline-none focus:border-[#2F5D46] focus:ring-1 focus:ring-[#2F5D46] transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#68736A]/70 hover:text-[#1E2520] cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>

            {/* Submit button */}
            <motion.div variants={itemVariants} className="pt-2">
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={shouldReduceMotion ? {} : { y: -1 }}
                whileTap={shouldReduceMotion ? {} : { y: 1 }}
                className="w-full py-3.5 bg-[#18382B] hover:bg-[#2F5D46] disabled:bg-[#18382B]/60 text-[#FFFDF7] text-xs font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Log in</span>
                  </>
                )}
              </motion.button>
            </motion.div>
          </form>

          {/* Links and Footer info */}
          <motion.div variants={itemVariants} className="pt-4 border-t border-[#E4DCCB]/60 flex flex-col items-center space-y-4">
            <button
              onClick={() => onNavigate('/')}
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#68736A] hover:text-[#1E2520] transition-colors cursor-pointer bg-transparent border-none p-0 focus:outline-none hover:-translate-x-0.5 duration-200"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Back to homepage</span>
            </button>
            
            <div className="text-[10px] text-[#68736A]/60 flex items-center gap-3">
              <button 
                onClick={() => onNavigate('/privacy')} 
                className="hover:underline cursor-pointer bg-transparent border-none p-0 focus:outline-none"
              >
                Privacy Policy
              </button>
              <span className="w-1 h-1 rounded-full bg-[#68736A]/30" />
              <button 
                onClick={() => onNavigate('/terms')} 
                className="hover:underline cursor-pointer bg-transparent border-none p-0 focus:outline-none"
              >
                Terms
              </button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
