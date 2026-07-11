import React from 'react';
import { MessageSquare, ArrowRightLeft, BrainCircuit, RefreshCw, AlertCircle, FileSpreadsheet } from 'lucide-react';

interface FrictionItem {
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  example: string;
}

export default function FrictionGrid() {
  const frictionPatterns: FrictionItem[] = [
    {
      icon: MessageSquare,
      title: "Multi-channel intake",
      description: "Requests arrive through texts, group chats, personal emails, phone calls, and verbal asks. No single record captures what has been promised.",
      example: "An agent texts a lockbox request to the admin while emailing marketing photos to another."
    },
    {
      icon: ArrowRightLeft,
      title: "Owner as middleware",
      description: "Founders spend their days forwarding emails, chasing updates from staff, and acting as the human network switch between departments.",
      example: "You spend hours copying title details into spreadsheets so coordinators know what to audit."
    },
    {
      icon: BrainCircuit,
      title: "Mental-only workflows",
      description: "Critical operational knowledge—what to check, who to notify, and how to format a split—lives entirely inside one person's head.",
      example: "If your lead compliance admin is out sick for a week, transaction reviews grind to a complete halt."
    },
    {
      icon: RefreshCw,
      title: "Manual data rebuilding",
      description: "Staff spends hours copying the exact same client names, addresses, and commission details across three or four separate databases.",
      example: "Re-entering contract details from raw emails into a CRM, then SkySlope, and then QuickBooks."
    },
    {
      icon: AlertCircle,
      title: "Reactive compliance chasing",
      description: "Missing files, disclosures, and wire receipts are identified at the last minute, forcing a stressful rush during closing week.",
      example: "Realizing a Lead Paint Disclosure lacks seller signatures three days before a scheduled closing."
    },
    {
      icon: FileSpreadsheet,
      title: "Sunday night reporting",
      description: "Because business data is scattered across multiple siloed software tools, reporting requires hours of exporting CSVs and manual cleanup.",
      example: "The operations manager staying late to construct a basic split revenue chart in Excel."
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
      {frictionPatterns.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div 
            key={idx}
            className="p-6 md:p-8 bg-surface border border-border-soft hover:border-brand-primary/45 rounded-[20px] shadow-soft transition-all duration-300 group flex flex-col justify-between text-left"
          >
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-brand-soft flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors duration-300">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-serif font-bold text-text-primary">
                {item.title}
              </h3>
              <p className="text-xs md:text-sm text-text-secondary leading-relaxed font-sans font-light">
                {item.description}
              </p>
            </div>
            
            <div className="mt-6 pt-4 border-t border-border-soft/60">
              <span className="text-[10px] uppercase font-semibold text-text-tertiary block mb-1">
                Friction in practice:
              </span>
              <p className="text-[11px] md:text-xs text-brand-primary italic font-serif leading-relaxed">
                "{item.example}"
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
