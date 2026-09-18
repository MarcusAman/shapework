import React, { useState } from 'react';
import { Lock, ArrowLeft, Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

interface PublicResetPasswordProps {
  onNavigate: (path: string) => void;
}

export default function PublicResetPassword({ onNavigate }: PublicResetPasswordProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const shouldReduceMotion = useReducedMotion();

  // Extract token from query-string
  const queryParams = new URLSearchParams(window.location.search);
  const token = queryParams.get('token') || '';
  const isSetupMode = queryParams.get('setup') === 'true';
  const targetEmail = queryParams.get('email') || '';

  // Simple password strength calculation
  const getPasswordStrength = () => {
    if (!password) return { label: 'Empty', color: 'bg-stone-200', text: 'text-stone-400', score: 0 };
    let score = 0;
    if (password.length >= 12) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (password.length < 12) {
      return { label: 'Too short (min 12 chars)', color: 'bg-red-400', text: 'text-red-500', score };
    }
    if (score <= 2) return { label: 'Weak', color: 'bg-yellow-400', text: 'text-yellow-600', score };
    if (score === 3) return { label: 'Medium', color: 'bg-blue-400', text: 'text-blue-600', score };
    return { label: 'Strong', color: 'bg-green-500', text: 'text-green-600', score };
  };

  const strength = getPasswordStrength();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setErrorMsg('Reset token is missing or invalid. Please request a new link.');
      return;
    }
    if (!password || !confirmPassword) {
      setErrorMsg('Please enter both password fields.');
      return;
    }
    if (password.length < 12) {
      setErrorMsg('Password must be at least 12 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'The reset link is invalid or has expired.');
      }

      setSuccess(true);
    } catch (err: any) {
      console.error('[ResetPwd] Error:', err);
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
              {isSetupMode ? 'Set up your password.' : 'Create a new password.'}
            </h1>
            <p className="text-xs text-[#68736A] font-light">
              {isSetupMode 
                ? (targetEmail ? `Welcome! Choose your personal password for ${targetEmail}.` : 'Welcome to Nest Ops! Choose your personal password.') 
                : 'Choose a secure password for your Shapework account.'}
            </p>
          </motion.div>

          {success ? (
            <motion.div
              variants={itemVariants}
              className="space-y-6 py-4 flex flex-col items-center text-center"
            >
              <div className="w-12 h-12 rounded-full bg-[#DDEBDD]/35 flex items-center justify-center text-[#2F5D46]">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#1E2520]">Password Updated</p>
                <p className="text-xs text-[#68736A] leading-relaxed">
                  Your password has been updated. You can now log in.
                </p>
              </div>
              <button
                onClick={() => onNavigate('/login')}
                className="w-full py-3 bg-[#18382B] hover:bg-[#2F5D46] text-[#FFFDF7] text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Log In
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

              {/* Password */}
              <motion.div variants={itemVariants} className="space-y-1.5 text-left">
                <label className="text-[9px] font-bold text-[#68736A] uppercase tracking-wider block">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
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
                
                {/* Strength helper */}
                {password && (
                  <div className="flex items-center gap-2 pt-1">
                    <div className="flex-1 h-1 bg-stone-100 rounded-full overflow-hidden">
                      <div className={`h-full ${strength.color} transition-all duration-300`} style={{ width: `${(strength.score + 1) * 20}%` }} />
                    </div>
                    <span className={`text-[9px] font-bold ${strength.text}`}>{strength.label}</span>
                  </div>
                )}
              </motion.div>

              {/* Confirm Password */}
              <motion.div variants={itemVariants} className="space-y-1.5 text-left">
                <label className="text-[9px] font-bold text-[#68736A] uppercase tracking-wider block">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-[#FBF8F0] border border-[#E4DCCB] rounded-xl text-xs text-[#1E2520] placeholder:text-[#68736A]/55 focus:bg-[#FFFDF7] focus:outline-none focus:border-[#2F5D46] focus:ring-1 focus:ring-[#2F5D46] transition-all"
                  required
                />
              </motion.div>

              {/* Submit button */}
              <motion.div variants={itemVariants} className="pt-2">
                <motion.button
                  type="submit"
                  disabled={isLoading || !token}
                  whileHover={shouldReduceMotion ? {} : { y: -1 }}
                  whileTap={shouldReduceMotion ? {} : { y: 1 }}
                  className="w-full py-3.5 bg-[#18382B] hover:bg-[#2F5D46] disabled:bg-[#18382B]/60 text-[#FFFDF7] text-xs font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Update password</span>
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
