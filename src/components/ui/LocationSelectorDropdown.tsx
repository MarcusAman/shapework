import React, { useState, useEffect } from 'react';
import { MapPin, ChevronDown, Check, Building2, Users, Shield, Zap } from 'lucide-react';

export interface BrokerageLocation {
  id: string;
  name: string;
  shortName: string;
  cityState: string;
  address: string;
  managingBroker: string;
  agentCount: number;
  activePipelineVolume: string;
  activeTransactionsCount: number;
  activeFeatures: string[];
}

export const BROKERAGE_LOCATIONS: BrokerageLocation[] = [
  {
    id: 'all_locations',
    name: 'All Locations (Mayfaire & Carolina Beach)',
    shortName: 'All Locations',
    cityState: 'Wilmington & Carolina Beach System',
    address: 'Aggregate Portfolio View (74 Agents)',
    managingBroker: 'Ryan Crecelius (Broker / Owner)',
    agentCount: 74,
    activePipelineVolume: '$42.5M',
    activeTransactionsCount: 142,
    activeFeatures: [
      'Ask Nest Ops AI Console',
      'Ryan Shield Escalations',
      'Pre-MLS Board',
      'Vendor Dispatch Desk',
      'SOP Library & Checklist Runs',
      'Directory Roster (74 Agents)',
      'Owner Weekly Briefing',
      'Integrations & Connections'
    ]
  },
  {
    id: 'wilmington_nc',
    name: 'Wilmington, NC (Mayfaire Office)',
    shortName: 'Mayfaire Office',
    cityState: 'Wilmington, NC',
    address: '6800 Wrightsville Ave, Wilmington, NC 28403',
    managingBroker: 'Jessica Keenan (Managing BIC)',
    agentCount: 42,
    activePipelineVolume: '$26.2M',
    activeTransactionsCount: 90,
    activeFeatures: [
      'Ask Nest Ops AI Console',
      'Ryan Shield Guardrails',
      'Pre-MLS Board',
      'Vendor Dispatch Desk',
      'SOP Runs & Checklists',
      'Signs Room Camera Relay'
    ]
  },
  {
    id: 'carolina_beach_nc',
    name: 'Carolina Beach, NC (Coastal Office)',
    shortName: 'Carolina Beach',
    cityState: 'Carolina Beach, NC',
    address: '1001 N Lake Park Blvd, Carolina Beach, NC 28428',
    managingBroker: 'Ryan Crecelius (Managing BIC / Owner)',
    agentCount: 32,
    activePipelineVolume: '$16.3M',
    activeTransactionsCount: 52,
    activeFeatures: [
      'Ask Nest Ops AI Console',
      'Ryan Shield Escalations',
      'Pre-MLS Board',
      'Vendor Dispatch Desk',
      'SOP Library & Checklist Runs'
    ]
  }
];

export function getStoredLocation(): BrokerageLocation {
  if (typeof window === 'undefined') return BROKERAGE_LOCATIONS[0];
  const savedId = localStorage.getItem('shapework_active_location');
  const found = BROKERAGE_LOCATIONS.find(l => l.id === savedId);
  return found || BROKERAGE_LOCATIONS[0];
}

interface LocationSelectorDropdownProps {
  variant?: 'header' | 'inline' | 'compact';
  onLocationChange?: (location: BrokerageLocation) => void;
}

export default function LocationSelectorDropdown({
  variant = 'header',
  onLocationChange
}: LocationSelectorDropdownProps) {
  const [selectedLocation, setSelectedLocation] = useState<BrokerageLocation>(getStoredLocation);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleStorage = (e: CustomEvent | StorageEvent) => {
      setSelectedLocation(getStoredLocation());
    };
    window.addEventListener('shapework_location_changed' as any, handleStorage);
    return () => {
      window.removeEventListener('shapework_location_changed' as any, handleStorage);
    };
  }, []);

  const handleSelect = (loc: BrokerageLocation) => {
    setSelectedLocation(loc);
    localStorage.setItem('shapework_active_location', loc.id);
    setIsOpen(false);
    
    // Determine targetTab if selecting Wilmington / Mayfaire vs other locations
    const targetTab = loc.id === 'wilmington_nc' ? 'Ryan Shield' : 'Workboard';

    // Notify all listeners with location, targetTab and isUserClick flag
    try {
      window.dispatchEvent(new CustomEvent('shapework_location_changed', { detail: { location: loc, targetTab, isUserClick: true } }));
    } catch (err) {
      if (typeof document !== 'undefined' && document.createEvent) {
        const evt = document.createEvent('CustomEvent');
        evt.initCustomEvent('shapework_location_changed', true, true, { location: loc, targetTab, isUserClick: true });
        window.dispatchEvent(evt);
      }
    }
    if (onLocationChange) onLocationChange(loc);
  };

  return (
    <div className="relative inline-block text-left select-none z-40">
      {/* Selector Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-sans text-xs transition-all cursor-pointer shadow-sm ${
          variant === 'compact'
            ? 'bg-black/40 border-white/15 text-[#F6F7F1] hover:border-emerald-400/50'
            : 'bg-[#00635C]/40 border-[rgba(246,247,241,0.18)] text-[#F6F7F1] hover:bg-[#00635C]/60 hover:border-emerald-300/40 backdrop-blur-md'
        }`}
        title="Select Location to filter dashboard and available features"
      >
        <MapPin className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
        <div className="flex items-center gap-1.5 text-left">
          <span className="font-bold text-white tracking-tight">{selectedLocation.shortName}</span>
          <span className="hidden sm:inline-block text-[10px] text-emerald-200/80 font-sans font-medium px-1.5 py-0.2 bg-emerald-950/60 border border-emerald-500/30 rounded-md">
            {selectedLocation.agentCount} Agents
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-[#D0D6BB] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Location Dropdown Modal */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 sm:left-0 mt-2 w-80 sm:w-96 bg-[#012822] border border-[rgba(246,247,241,0.18)] rounded-2xl p-3 shadow-2xl z-50 animate-fade-in backdrop-blur-xl text-left">
            <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-300" />
                <span className="text-xs font-sans font-bold text-white tracking-wide">Select Brokerage Location</span>
              </div>
              <span className="text-[10px] text-emerald-200 font-sans font-semibold">
                {BROKERAGE_LOCATIONS.length} Offices Available
              </span>
            </div>

            <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
              {BROKERAGE_LOCATIONS.map(loc => {
                const isSelected = loc.id === selectedLocation.id;
                return (
                  <button
                    key={loc.id}
                    onClick={() => handleSelect(loc)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer group ${
                      isSelected
                        ? 'bg-[#00635C] border-emerald-400 text-white shadow-md'
                        : 'bg-white/5 border-white/5 text-[#D0D6BB] hover:bg-white/10 hover:text-white hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-white block truncate">{loc.name}</span>
                          {isSelected && (
                            <span className="px-2 py-0.5 bg-emerald-400 text-black text-[9px] font-black uppercase rounded-full shrink-0 font-sans">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-[#D0D6BB]/80 truncate font-sans">{loc.address}</p>
                        
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] font-sans">
                          <span className="text-emerald-300 font-medium">BIC: {loc.managingBroker.split(' ')[0]}</span>
                          <span className="text-[#D0D6BB]/40">•</span>
                          <span className="text-emerald-200 font-semibold">{loc.agentCount} Agents</span>
                          <span className="text-[#D0D6BB]/40">•</span>
                          <span className="text-amber-300 font-bold">{loc.activePipelineVolume} Pipeline</span>
                        </div>

                        <div className="pt-1.5 flex flex-wrap gap-1">
                          {loc.activeFeatures.slice(0, 3).map((feat, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-black/40 text-emerald-200/90 rounded text-[9px] font-sans border border-emerald-500/20">
                              {feat}
                            </span>
                          ))}
                          {loc.activeFeatures.length > 3 && (
                            <span className="px-1 py-0.5 text-[9px] text-[#D0D6BB]/70 font-sans">
                              +{loc.activeFeatures.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>

                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-emerald-400 text-black flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-3 pt-2.5 border-t border-white/10 px-2 flex items-center justify-between text-[10px] text-[#D0D6BB]/70 font-sans">
              <span>Selected view updates metrics & active features</span>
              <span className="text-emerald-300 font-bold">100% Synced</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
