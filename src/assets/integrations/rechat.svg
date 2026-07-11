import React from 'react';
import { safeLower } from '../../utils/string';

// BRAND MARKS LICENSE NOTICE:
// Brand marks are for demo connector identification only. Verify brand usage before production.
// All icons below are local inline SVG paths. No external requests are executed.

interface BrandIconProps {
  name: 'gmail' | 'outlook' | 'gcal' | 'gdrive' | 'docusign' | 'rechat' | string;
  className?: string;
  colorClass?: string;
}

export default function BrandIcon({ name, className = 'w-5 h-5', colorClass = 'text-text-tertiary' }: BrandIconProps) {
  const iconName = safeLower(name).replace('connector_', '').replace('i_', '');

  switch (iconName) {
    case 'gmail':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" role="img" aria-label="Gmail Logo">
          <title>Gmail</title>
          <path fill="#EA4335" d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
        </svg>
      );
    case 'outlook':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 14 14" role="img" focusable="false" aria-label="Microsoft Outlook Logo">
          <title>Microsoft Outlook</title>
          <path fill="#0078D4" d="m 13,4.69375 0,5.239 c 0,0.115 -0.04,0.212 -0.119,0.288 -0.079,0.077 -0.176,0.115 -0.29,0.115 l -4.2735,0 0,-3.4795 0.8,0.6145 c 0.051,0.0425 0.1145,0.063 0.1895,0.063 0.074,0 0.1385,-0.0205 0.1945,-0.0635 L 13,4.69375 Z m -4.6825,-1.0105 4.2735,0 c 0.1055,0 0.1965,0.0315 0.2715,0.096 0.075,0.064 0.117,0.15 0.124,0.255 l -3.6845,2.938 -0.9845,-0.7745 0,-2.5145 z m -0.6155,-2.251 0,11.1355 -6.702,-1.158 0,-8.7875 6.703,-1.19 -0.001,0 z m -2.0245,5.59 c -0.01,-0.5665 -0.1565,-1.036 -0.4395,-1.407 -0.2775,-0.37 -0.6375,-0.5655 -1.0655,-0.582 -0.412,0.0165 -0.7645,0.2115 -1.05,0.582 -0.285,0.371 -0.4275,0.841 -0.435,1.407 0.0075,0.5585 0.1575,1.0235 0.4425,1.3955 0.2855,0.37 0.637,0.5665 1.0505,0.588 0.4275,-0.0175 0.787,-0.212 1.0725,-0.585 0.285,-0.374 0.435,-0.84 0.4425,-1.3985 l -0.018,0 z m -1.56,-1.241 c 0.2155,0.01 0.397,0.128 0.5415,0.3585 0.1425,0.2305 0.2175,0.5225 0.2175,0.876 0,0.3605 -0.0745,0.6535 -0.2175,0.8855 -0.1505,0.232 -0.33,0.352 -0.548,0.352 -0.218,0 -0.3975,-0.113 -0.5475,-0.345 -0.15,-0.232 -0.2175,-0.525 -0.2175,-0.877 0,-0.3525 0.0675,-0.6455 0.2175,-0.87 0.142,-0.225 0.323,-0.345 0.5405,-0.3605 l 0.0135,-0.0195 z"/>
        </svg>
      );
    case 'gcal':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" role="img" aria-label="Google Calendar Logo">
          <title>Google Calendar</title>
          <path fill="#4285F4" d="M18.316 5.684H24v12.632h-5.684V5.684zM5.684 24h12.632v-5.684H5.684V24zM18.316 5.684V0H1.895A1.894 1.894 0 0 0 0 1.895v16.421h5.684V5.684h12.632zm-7.207 6.25v-.065c.272-.144.5-.349.687-.617s.279-.595.279-.982c0-.379-.099-.72-.3-1.025a2.05 2.05 0 0 0-.832-.714 2.703 2.703 0 0 0-1.197-.257c-.6 0-1.094.156-1.481.467-.386.311-.65.671-.793 1.078l1.085.452c.086-.249.224-.461.413-.633.189-.172.445-.257.767-.257.33 0 .602.088.816.264a.86.86 0 0 1 .322.703c0 .33-.12.589-.36.778-.24.19-.535.284-.886.284h-.567v1.085h.633c.407 0 .748.109 1.02.327.272.218.407.499.407.843 0 .336-.129.614-.387.832s-.565.327-.924.327c-.351 0-.651-.103-.897-.311-.248-.208-.422-.502-.521-.881l-1.096.452c.178.616.505 1.082.977 1.401.472.319.984.478 1.538.477a2.84 2.84 0 0 0 1.293-.291c.382-.193.684-.458.902-.794.218-.336.327-.72.327-1.149 0-.429-.115-.797-.344-1.105a2.067 2.067 0 0 0-.881-.689zm2.093-1.931.602.913L15 10.045v5.744h1.187V8.446h-.827l-2.158 1.557zM22.105 0h-3.289v5.184H24V1.895A1.894 1.894 0 0 0 22.105 0zm-3.289 23.5 4.684-4.684h-4.684V23.5zM0 22.105C0 23.152.848 24 1.895 24h3.289v-5.184H0v3.289z"/>
        </svg>
      );
    case 'gdrive':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 32 32" fill="none" role="img" aria-label="Google Drive Logo">
          <title>Google Drive</title>
          <path d="M16.0019 12.4507L12.541 6.34297C12.6559 6.22598 12.7881 6.14924 12.9203 6.09766C11.8998 6.43355 11.4315 7.57961 11.4315 7.57961L5.10895 18.7345C5.01999 19.0843 4.99528 19.4 5.0064 19.6781H11.9072L16.0019 12.4507Z" fill="#34A853"/>
          <path d="M16.002 12.4507L20.0967 19.6781H26.9975C27.0086 19.4 26.9839 19.0843 26.8949 18.7345L20.5724 7.57961C20.5724 7.57961 20.1029 6.43355 19.0835 6.09766C19.2145 6.14924 19.3479 6.22598 19.4628 6.34297L16.002 12.4507Z" fill="#FBBC05"/>
          <path d="M16.0019 12.4514L19.4628 6.34371C19.3479 6.22671 19.2144 6.14997 19.0835 6.09839C18.9327 6.04933 18.7709 6.01662 18.5954 6.00781H18.4125H13.5913H13.4084C13.2342 6.01536 13.0711 6.04807 12.9203 6.09839C12.7894 6.14997 12.6559 6.22671 12.541 6.34371L16.0019 12.4514Z" fill="#188038"/>
          <path d="M11.9082 19.6782L8.48687 25.7168C8.48687 25.7168 8.3732 25.6614 8.21875 25.5469C8.70434 25.9206 9.17633 25.9998 9.17633 25.9998H22.6134C23.3547 25.9998 23.5092 25.7168 23.5092 25.7168C23.5116 25.7155 23.5129 25.7142 23.5153 25.713L20.0965 19.6782H11.9082Z" fill="#4285F4"/>
          <path d="M11.9086 19.6782H5.00781C5.04241 20.4985 5.39826 20.9778 5.39826 20.9778L5.65773 21.4281C5.67627 21.4546 5.68739 21.4697 5.68739 21.4697L6.25205 22.461L7.51976 24.6676C7.55683 24.7569 7.60008 24.8386 7.6458 24.9166C7.66309 24.9431 7.67915 24.972 7.69769 24.9972C7.70263 25.0047 7.70757 25.0123 7.71252 25.0198C7.86944 25.2412 8.04489 25.4123 8.22034 25.5469C8.37479 25.6627 8.48847 25.7168 8.48847 25.7168L11.9086 19.6782Z" fill="#1967D2"/>
          <path d="M20.0967 19.6782H26.9974C26.9628 20.4985 26.607 20.9778 26.607 20.9778L26.3475 21.4281C26.329 21.4546 26.3179 21.4697 26.3179 21.4697L25.7532 22.461L24.4855 24.6676C24.4484 24.7569 24.4052 24.8386 24.3595 24.9166C24.3422 24.9431 24.3261 24.972 24.3076 24.9972C24.3026 25.0047 24.2977 25.0123 24.2927 25.0198C24.1358 25.2412 23.9604 25.4123 23.7849 25.5469C23.6305 25.6627 23.5168 25.7168 23.5168 25.7168L20.0967 19.6782Z" fill="#EA4335"/>
        </svg>
      );
    case 'docusign':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" role="img" aria-label="DocuSign Logo">
          <title>DocuSign</title>
          <path fill="#4C00FF" d="M9.517 3.31h4.966v6.621h3.31L12 16.552 6.207 9.931h3.31V3.31zM0 19.034h24v1.655H0v-1.655z"/>
        </svg>
      );
    case 'rechat':
      // Embedded SVG placeholder representation for Rechat platform
      return (
        <div className={`flex items-center justify-center font-serif text-[10px] font-bold tracking-tight bg-stone-100/80 text-stone-700 px-1 py-0.5 rounded border border-stone-200 select-none ${className}`}>
          rechat.
        </div>
      );
    case 'google':
    case 'google_workspace':
    case 'gworkspace':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} role="img" aria-label="Google Workspace Logo">
          <title>Google Workspace</title>
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
        </svg>
      );
    case 'microsoft':
    case 'microsoft_365':
    case 'm365':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 23 23" className={className} role="img" aria-label="Microsoft 365 Logo">
          <title>Microsoft 365</title>
          <path fill="#F25022" d="M0 0h11v11H0z"/>
          <path fill="#7FBA00" d="M12 0h11v11H12z"/>
          <path fill="#01A6F0" d="M0 12h11v11H0z"/>
          <path fill="#FFB900" d="M12 12h11v11H12z"/>
        </svg>
      );
    case 'dotloop':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} role="img" aria-label="Dotloop Logo">
          <title>Dotloop</title>
          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
          <path d="M12 6v6l4 2" />
          <circle cx="12" cy="12" r="1.5" fill="#6366F1" />
        </svg>
      );
    case 'quickbooks':
    case 'quickbooks_online':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#82C341" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} role="img" aria-label="QuickBooks Logo">
          <title>QuickBooks</title>
          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
          <circle cx="12" cy="12" r="4" fill="#82C341" />
        </svg>
      );
    case 'basecamp':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#FF6B00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} role="img" aria-label="Basecamp Logo">
          <title>Basecamp</title>
          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
          <path d="M17 10H7v4h10v-4z" fill="#FF6B00" />
        </svg>
      );
    default:
      // Generic Webhook / CSV Connector representation
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className={`${className} ${colorClass}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label="Generic Connector Logo">
          <circle cx="12" cy="12" r="10" />
          <path d="m10 15 5-3-5-3v6Z" />
        </svg>
      );
  }
}
