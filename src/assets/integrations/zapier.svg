import React from 'react';
import BrandIcon from '../ui/BrandIcon';

interface IntegrationLogoProps {
  logoKey: string;
  displayName: string;
  className?: string;
}

export default function IntegrationLogo({
  logoKey,
  displayName,
  className = 'w-10 h-10'
}: IntegrationLogoProps) {
  // Gracefully normalize keys
  const normalizedKey = logoKey.toLowerCase().replace('connector_', '').replace('i_', '');

  // We can map these directly to the BrandIcon or custom SVGs
  switch (normalizedKey) {
    case 'google-workspace':
    case 'google_workspace':
    case 'gworkspace':
    case 'google':
      return <BrandIcon name="google" className={className} />;
    case 'gmail':
      return <BrandIcon name="gmail" className={className} />;
    case 'google-calendar':
    case 'google_calendar':
    case 'gcal':
      return <BrandIcon name="gcal" className={className} />;
    case 'google-drive':
    case 'google_drive':
    case 'gdrive':
      return <BrandIcon name="gdrive" className={className} />;
    case 'microsoft-365':
    case 'microsoft_365':
    case 'm365':
    case 'microsoft':
      return <BrandIcon name="microsoft" className={className} />;
    case 'outlook':
    case 'outlook_mail':
    case 'outlook-mail':
      return <BrandIcon name="outlook" className={className} />;
    case 'outlook_calendar':
    case 'outlook-calendar':
      return <BrandIcon name="outlook" className={className} />;
    case 'microsoft-teams':
    case 'microsoft_teams':
    case 'teams':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} role="img" aria-label={`${displayName} Logo`}>
          <rect width="24" height="24" rx="4" fill="#6264A7" />
          <text x="12" y="16" fontFamily="sans-serif" fontWeight="bold" fontSize="12" fill="white" textAnchor="middle">T</text>
        </svg>
      );
    case 'quickbooks':
    case 'quickbooks_online':
    case 'qbo':
      return <BrandIcon name="quickbooks" className={className} />;
    case 'basecamp':
      return <BrandIcon name="basecamp" className={className} />;
    case 'rechat':
      return (
        <div className={`flex items-center justify-center font-serif text-[11px] font-bold tracking-tight bg-stone-100/90 text-stone-850 px-1 py-0.5 rounded border border-stone-250 select-none ${className}`} role="img" aria-label={`${displayName} Logo`}>
          rechat.
        </div>
      );
    case 'dotloop':
      return <BrandIcon name="dotloop" className={className} />;
    case 'plaid':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} role="img" aria-label={`${displayName} Logo`}>
          <rect width="24" height="24" rx="4" fill="#000000" />
          <text x="12" y="16" fontFamily="sans-serif" fontWeight="bold" fontSize="12" fill="white" textAnchor="middle">P</text>
        </svg>
      );
    case 'api-nation':
    case 'apination':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} role="img" aria-label={`${displayName} Logo`}>
          <rect width="24" height="24" rx="4" fill="#3B82F6" />
          <text x="12" y="16" fontFamily="sans-serif" fontWeight="bold" fontSize="10" fill="white" textAnchor="middle">AN</text>
        </svg>
      );
    case 'zapier':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} role="img" aria-label={`${displayName} Logo`}>
          <rect width="24" height="24" rx="4" fill="#FF4F00" />
          <text x="12" y="16" fontFamily="sans-serif" fontWeight="bold" fontSize="12" fill="white" textAnchor="middle">Z</text>
        </svg>
      );
    case 'google-business-profile':
    case 'google_business_profile':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} role="img" aria-label={`${displayName} Logo`}>
          <rect width="24" height="24" rx="4" fill="#4285F4" />
          <text x="12" y="16" fontFamily="sans-serif" fontWeight="bold" fontSize="10" fill="white" textAnchor="middle">GBP</text>
        </svg>
      );
    case 'smtp-email':
    case 'smtp_email':
    case 'email':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} fill="none" stroke="#4C00FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label={`${displayName} Logo`}>
          <title>{displayName}</title>
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      );
    case 'sms':
    case 'sms_provider':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label={`${displayName} Logo`}>
          <title>{displayName}</title>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      );
    case 'resend':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} role="img" aria-label={`${displayName} Logo`}>
          <rect width="24" height="24" rx="4" fill="#000000" />
          <text x="12" y="16" fontFamily="sans-serif" fontWeight="bold" fontSize="12" fill="#FFFFFF" textAnchor="middle">R</text>
        </svg>
      );
    default:
      // Polished fallback placeholder
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label={`${displayName} Fallback Logo`}>
          <circle cx="12" cy="12" r="10" />
          <path d="m10 15 5-3-5-3v6Z" />
        </svg>
      );
  }
}
