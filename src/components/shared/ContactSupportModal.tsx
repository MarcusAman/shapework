import React, { useState } from 'react';
import { Mail, Phone, Copy, Check, X, Shield, Clock } from 'lucide-react';

interface ContactSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ContactSupportModal({ isOpen, onClose }: ContactSupportModalProps) {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  if (!isOpen) return null;

  const email = 'AskNestOps@nestrealty.com';
  const phone = '+1 (910) 507-2047';

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6 text-left animate-fadeIn">
      {/* Blurred Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 z-0"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-[#012a23] border border-white/15 rounded-3xl max-w-md w-full shadow-2xl flex flex-col z-10 text-white overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#00211b] shrink-0 select-none">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#00635C]/30 border border-[#00635C]/50 rounded-xl text-emerald-300">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans">Contact Operations Support</h3>
              <p className="text-[10px] text-[#D0D6BB]/60 font-sans">Nest Realty Brokerage Operations & Technical Triage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-xl text-[#D0D6BB] hover:text-white transition-colors cursor-pointer border-none bg-transparent"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-sans">
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-4">
            {/* Email block */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-mono text-[#D0D6BB]/50 uppercase tracking-wider block">Email Support</span>
                  <a href={`mailto:${email}`} className="text-xs font-bold text-white hover:text-emerald-300 underline truncate block">
                    {email}
                  </a>
                </div>
              </div>
              <button
                onClick={handleCopyEmail}
                className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono text-[#D0D6BB] rounded-lg flex items-center gap-1 cursor-pointer transition-colors shrink-0"
              >
                {copiedEmail ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedEmail ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="border-t border-white/5" />

            {/* Phone block */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-mono text-[#D0D6BB]/50 uppercase tracking-wider block">Call Support</span>
                  <a href={`tel:${phone.replace(/[^0-9+]/g, '')}`} className="text-xs font-bold text-white hover:text-emerald-300 underline truncate block">
                    {phone}
                  </a>
                </div>
              </div>
              <button
                onClick={handleCopyPhone}
                className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono text-[#D0D6BB] rounded-lg flex items-center gap-1 cursor-pointer transition-colors shrink-0"
              >
                {copiedPhone ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedPhone ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-[#D0D6BB]/60 bg-emerald-950/20 border border-emerald-500/15 p-3 rounded-xl">
            <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Mon–Fri 8:00 AM – 6:00 PM EST. Urgent after-hours requests are routed automatically to the Broker-in-Charge on call.</span>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <a
              href={`mailto:${email}`}
              className="py-2.5 px-4 bg-[#00635C] hover:bg-[#007c73] text-white text-xs font-bold rounded-xl transition-colors text-center flex items-center justify-center gap-2 cursor-pointer no-underline shadow-md"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email Support</span>
            </a>
            <a
              href={`tel:${phone.replace(/[^0-9+]/g, '')}`}
              className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors text-center flex items-center justify-center gap-2 cursor-pointer no-underline shadow-md"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call Support</span>
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#00211b] border-t border-white/10 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer border-none"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
