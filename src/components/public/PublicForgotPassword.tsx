import React, { useState } from 'react';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

interface PublicForgotPasswordProps {
  onNavigate: (path: string) => void;
}

export default function PublicForgotPassword({ onNavigate }: PublicForgotPasswordProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const shouldReduceMotion = useReducedMotion();

  const [resetLink, setResetLink] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong. Please try again.');
      }

      if (data.resetLink) {
        setResetLink(data.resetLink);
      }
      setSuccess(true);
    } catch (err: any) {
      console.error('[ForgotPwd] Error:', err);
      setErrorMsg(err.message || 'Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
      
      {/* Left Panel: Cover Background */}
      <div className="hidden lg:block lg:col-span-5 relative overflow-hidden bg-gradient-to-br from-[#01362D] via-[#00635C] to-[#01251F]">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#A4D4CB]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#000000]/25 rounded-full blur-2xl pointer-events-none" />
        
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
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#DDEBDD]/20 rounded-full blur-2xl pointer-events-none" />

          {/* Logo & Headline */}
          <motion.div variants={itemVariants} className="space-y-2">
            <div className="lg:hidden font-serif font-bold text-lg text-[#1E2520] tracking-tight mb-2">
              shapework<span className="text-[#2F5D46]">.</span>
            </div>
            <h1 className="text-xl font-bold text-[#1E2520] tracking-tight">
              Reset your password.
            </h1>
            <p className="text-xs text-[#68736A] font-light">
              Enter your email and we’ll send reset instructions.
            </p>
          </motion.div>

          {success ? (
            <motion.div
              variants={itemVariants}
              className="space-y-5 py-2 flex flex-col items-center text-center"
            >
              <div className="w-12 h-12 rounded-full bg-[#DDEBDD]/35 flex items-center justify-center text-[#2F5D46]">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-[#1E2520]">Instructions Dispatched</p>
                <p className="text-xs text-[#68736A] leading-relaxed">
                  If an account exists for that email, reset instructions have been prepared.
                </p>
              </div>

              {resetLink && (
                <div className="w-full p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-2 text-left animate-fade-in">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-900">
                    <span>⚡ Pilot Mode: Instant Reset Link</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 leading-tight">
                    For zero-friction testing, click below to set your new password directly:
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate(resetLink)}
                    className="w-full py-2 bg-[#00635C] hover:bg-[#004d48] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Proceed to Set New Password →
                  </button>
                </div>
              )}

              <button
                onClick={() => onNavigate('/login')}
                className="w-full py-2.5 bg-[#FBF8F0] hover:bg-[#EDE7DA] border border-[#E4DCCB] text-[#1E2520] text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Return to Login
              </button>
            </motion.div>
          ) : (
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
                      <span>Sending link...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-3.5 h-3.5" />
                      <span>Send reset link</span>
                    </>
                  )}
                </motion.button>
              </motion.div>
            </form>
          )}

          {/* Links and Footer info */}
          <motion.div variants={itemVariants} className="pt-4 border-t border-[#E4DCCB]/60 flex flex-col items-center space-y-3">
            <button
              onClick={() => onNavigate('/login')}
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#2F5D46] hover:text-[#18382B] transition-colors cursor-pointer bg-transparent border-none p-0 focus:outline-none"
            >
              ← Back to login
            </button>
            <button
              onClick={() => onNavigate('/')}
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#68736A] hover:text-[#1E2520] transition-colors cursor-pointer bg-transparent border-none p-0 focus:outline-none hover:-translate-x-0.5 duration-200"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Back to homepage</span>
            </button>
            
            <div className="text-[10px] text-[#68736A]/60 pt-1 flex items-center gap-3">
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
