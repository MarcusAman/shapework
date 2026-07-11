import React from 'react';
import { Mail, Calendar, Folder, MessageSquare, Phone, Globe, FileText, Settings, Shield } from 'lucide-react';

interface ConnectorLogoProps {
  provider: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  connected?: boolean;
  disabled?: boolean;
}

export default function ConnectorLogo({
  provider,
  size = 'md',
  className = '',
  connected = false,
  disabled = false
}: ConnectorLogoProps) {
  const normProvider = provider.toLowerCase().trim().replace(/[\s_-]+/g, '');

  // Determine size classes
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10'
  };
  const sizeClass = sizeMap[size] || sizeMap.md;

  // Render official SVG logos or premium fallback badges
  const renderLogo = () => {
    switch (normProvider) {
      case 'gmail':
        return (
          <svg viewBox="0 0 24 24" className="w-full h-full object-contain">
            <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z" fill="#F6F7F1" opacity="0.15" />
            <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="#D96B5F" />
          </svg>
        );
      case 'googledrive':
      case 'drive':
        return (
          <svg viewBox="0 0 24 24" className="w-full h-full object-contain">
            <path d="M9.12 4.25h5.76l6.87 12-2.88 5H4.87l-2.62-4.5z" fill="#F6F7F1" opacity="0.1" />
            <path d="M2.25 16.75L4.87 22.25h14.26l2.62-5.5z" fill="#4B8BF5" />
            <path d="M9.12 4.25L14.88 4.25l6.87 12.0L18.87 21.25z" fill="#2AA850" />
            <path d="M9.12 4.25L2.25 16.75l2.62 5.5l6.88-12.0z" fill="#FFC107" />
          </svg>
        );
      case 'googlecalendar':
      case 'calendar':
        return (
          <svg viewBox="0 0 24 24" className="w-full h-full object-contain">
            <rect x="3" y="4" width="18" height="16" rx="2" fill="#F6F7F1" opacity="0.1" />
            <path d="M19 4H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-7 15c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm6-10H6V7h12v2z" fill="#4B8BF5" />
            <text x="12" y="18" fill="#F6F7F1" fontSize="8" fontWeight="bold" textAnchor="middle">31</text>
          </svg>
        );
      case 'slack':
        return (
          <svg viewBox="0 0 24 24" className="w-full h-full object-contain">
            <rect x="2" y="2" width="20" height="20" rx="4" fill="#E01E5A" opacity="0.1" />
            <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523 2.528 2.528 0 0 1-2.522-2.523 2.528 2.528 0 0 1 2.522-2.52h2.52v2.52zm1.261 0a2.528 2.528 0 0 1 2.52-2.52h5.043a2.528 2.528 0 0 1 2.522 2.52v5.042a2.528 2.528 0 0 1-2.522 2.52H8.823a2.528 2.528 0 0 1-2.52-2.52v-5.042z" fill="#36C5F0" />
            <path d="M8.823 5.043A2.528 2.528 0 0 1 6.303 2.52a2.528 2.528 0 0 1 2.52-2.52c1.394 0 2.52 1.128 2.52 2.52v2.523h-2.52zm0 1.261a2.528 2.528 0 0 1 2.52 2.52v5.043a2.528 2.528 0 0 1-2.52 2.52H3.78a2.528 2.528 0 0 1-2.52-2.52V8.824a2.528 2.528 0 0 1 2.52-2.52h5.043z" fill="#2EB67D" />
            <path d="M18.958 8.824a2.528 2.528 0 0 1 2.52-2.52 2.528 2.528 0 0 1 2.522 2.52 2.528 2.528 0 0 1-2.522 2.52h-2.52v-2.52zm-1.261 0a2.528 2.528 0 0 1-2.52 2.52h-5.043a2.528 2.528 0 0 1-2.522-2.52V3.782a2.528 2.528 0 0 1 2.522-2.52h5.043a2.528 2.528 0 0 1 2.52 2.52v5.042z" fill="#ECB22E" />
            <path d="M15.177 18.957a2.528 2.528 0 0 1 2.52 2.523 2.528 2.528 0 0 1-2.52 2.52 2.528 2.528 0 0 1-2.52-2.52v-2.523h2.52zm0-1.261a2.528 2.528 0 0 1-2.52-2.52v-5.043a2.528 2.528 0 0 1 2.52-2.52h5.043a2.528 2.528 0 0 1 2.52 2.52v5.043a2.528 2.528 0 0 1-2.52 2.52h-5.043z" fill="#E01E5A" />
          </svg>
        );
      case 'microsoftteams':
      case 'teams':
        return (
          <svg viewBox="0 0 24 24" className="w-full h-full object-contain">
            <rect x="2" y="2" width="20" height="20" rx="4" fill="#4B5563" opacity="0.1" />
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="#5C5B95" />
            <circle cx="17" cy="8" r="3" fill="#7B83EB" />
            <path d="M17 14c-1.2 0-3.2.5-4.1 1.2.9.8 1.1 1.8 1.1 2.8v2h6v-2c0-2.67-5-4-3-4z" fill="#7B83EB" />
          </svg>
        );
      case 'twilio':
      case 'smsphone':
      case 'sms':
      case 'phone':
        return (
          <div className="w-full h-full flex items-center justify-center bg-[rgba(208,214,187,0.08)] border border-[rgba(208,214,187,0.22)] rounded-lg text-[#D0D6BB]">
            <MessageSquare className="w-4 h-4" />
          </div>
        );
      case 'rechat':
        return (
          <div className="w-full h-full flex items-center justify-center bg-[rgba(0,99,92,0.15)] border border-[rgba(0,99,92,0.3)] rounded-lg text-white font-serif font-black text-xs leading-none shadow-sm">
            R
          </div>
        );
      case 'dotloop':
      case 'dotloopskyslopebrokermint':
        return (
          <div className="w-full h-full flex items-center justify-center bg-blue-950/30 border border-blue-500/30 rounded-lg text-[#4B8BF5] font-sans font-bold text-xs leading-none shadow-sm">
            d
          </div>
        );
      case 'basecamp':
        return (
          <div className="w-full h-full flex items-center justify-center bg-amber-950/30 border border-amber-500/30 rounded-lg text-amber-200 font-sans font-bold text-xs leading-none shadow-sm">
            B
          </div>
        );
      case 'quickbooks':
        return (
          <div className="w-full h-full flex items-center justify-center bg-emerald-950/30 border border-emerald-500/30 rounded-lg text-emerald-300 font-sans font-bold text-xs leading-none shadow-sm">
            Q
          </div>
        );
      case 'marketingsystems':
        return (
          <div className="w-full h-full flex items-center justify-center bg-teal-950/30 border border-teal-500/30 rounded-lg text-[#D0D6BB] font-sans font-bold text-xs leading-none shadow-sm">
            M
          </div>
        );
      case 'outlookmail':
      case 'outlook':
        return (
          <svg viewBox="0 0 24 24" className="w-full h-full object-contain">
            <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z" fill="#0072C6" opacity="0.1" />
            <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="#0072C6" />
          </svg>
        );
      case 'outlookcalendar':
        return (
          <svg viewBox="0 0 24 24" className="w-full h-full object-contain">
            <rect x="3" y="4" width="18" height="16" rx="2" fill="#0072C6" opacity="0.1" />
            <path d="M19 4H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-7 15c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm6-10H6V7h12v2z" fill="#0072C6" />
          </svg>
        );
      case 'googleworkspace':
        return (
          <svg viewBox="0 0 24 24" className="w-full h-full object-contain">
            <circle cx="12" cy="12" r="9" fill="#F6F7F1" opacity="0.08" />
            <path d="M12 2A10 10 0 1 0 22 12A10 10 0 0 0 12 2zm1 17.93V13h5.93a8 8 0 0 1-5.93 5.93zM11 19.93A8 8 0 0 1 5.07 14H11v5.93zm-5.93-7.93A8 8 0 0 1 11 6.07V12H5.07zm12.93 0H13V6.07a8 8 0 0 1 5.93 5.93z" fill="#4B8BF5" />
          </svg>
        );
      case 'microsoft365':
      case 'm365':
        return (
          <svg viewBox="0 0 24 24" className="w-full h-full object-contain">
            <g fill="none" fillRule="evenodd">
              <path d="M2 2h9v9H2z" fill="#F25022" />
              <path d="M13 2h9v9h-9z" fill="#7FBA00" />
              <path d="M2 13h9v9H2z" fill="#01A6F0" />
              <path d="M13 13h9v9h-9z" fill="#FFB900" />
            </g>
          </svg>
        );
      case 'transactionsystems':
      case 'skyslope':
      case 'brokermint':
      case 'mls':
      default:
        return (
          <div className="w-full h-full flex items-center justify-center bg-[rgba(246,247,241,0.06)] border border-[rgba(246,247,241,0.14)] rounded-lg text-[#D0D6BB]">
            <Globe className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-lg overflow-hidden select-none transition-all duration-200 ${sizeClass} ${
        disabled ? 'opacity-40 filter grayscale' : ''
      } ${className}`}
    >
      {renderLogo()}
      {connected && (
        <span className="absolute bottom-0 right-0 w-2 h-2 bg-[#00635C] border border-[#01362D] rounded-full shadow-sm" />
      )}
    </div>
  );
}
