import React, { useState } from 'react';
import { Mail, Copy, Check, X, Shield, Clock, Phone } from 'lucide-react';

interface ContactSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ContactSupportModal({ isOpen, onClose }: ContactSupportModalProps) {
  const [copiedEmail, setCopiedEmail] = useState(false);

  if (!isOpen) return null;

  const email = 'AskNestOps@nestrealty.com';

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6 text-left animate-fadeIn">
      {/* Blurred Backdrop */}
      <div 
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity duration-300 z-0"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-white border border-stone-200 rounded-3xl max-w-md w-full shadow-2xl flex flex-col z-10 text-stone-900 overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-[#F7F8F5] shrink-0 select-none">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#E5EFEA] border border-[#00635C]/20 rounded-xl text-[#00635C]">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-serif font-bold text-stone-900">Contact Operations Support</h3>
              <p className="text-[11px] text-stone-500 font-sans">Nest Realty Brokerage Operations & Technical Triage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-stone-200/80 rounded-xl text-stone-400 hover:text-stone-700 transition-colors cursor-pointer border-none bg-transparent"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 font-sans text-xs">
          <div className="p-4 bg-[#F7F8F5] border border-stone-200/80 rounded-2xl space-y-3">
            {/* Email block */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-[#00635C] flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block">Email Support</span>
                  <a href={`mailto:${email}`} className="text-xs font-bold text-stone-900 hover:text-[#00635C] underline truncate block">
                    {email}
                  </a>
                </div>
              </div>
              <button
                onClick={handleCopyEmail}
                className="px-2.5 py-1.5 bg-white hover:bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-700 rounded-lg flex items-center gap-1 cursor-pointer transition-colors shrink-0 shadow-2xs"
              >
                {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-500" />}
                <span>{copiedEmail ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-stone-600 bg-emerald-50/70 border border-emerald-200/70 p-3 rounded-xl">
            <Clock className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Mon–Fri 8:00 AM – 6:00 PM EST. Urgent after-hours requests are routed automatically to the Broker-in-Charge on call.</span>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <a
              href={`mailto:${email}`}
              className="py-2.5 px-4 bg-white hover:bg-stone-50 border border-stone-200 text-stone-800 text-xs font-semibold rounded-xl transition-colors text-center flex items-center justify-center gap-2 cursor-pointer no-underline shadow-xs"
            >
              <Mail className="w-3.5 h-3.5 text-stone-600" />
              <span>Email Support</span>
            </a>
            <a
              href="tel:+19105072047"
              className="py-2.5 px-4 bg-[#00635C] hover:bg-[#00514B] text-white text-xs font-semibold rounded-xl transition-colors text-center flex items-center justify-center gap-2 cursor-pointer shadow-sm no-underline"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-200" />
              <span>Call 910-507-2047</span>
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#F7F8F5] border-t border-stone-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-900 hover:bg-black text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
