/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Demo Control Dropdown — Phase 4A.4 Developer Demo Menu
 * Renders a subtle `Demo ▾` dropdown menu in non-production environments when
 * CONTRACT_COPILOT_DEMO_MODE=true is enabled. Keeps demo scenario triggers strictly
 * hidden from the normal broker UI.
 */

import React, { useState } from 'react';
import { Play, ChevronDown, Sparkles } from 'lucide-react';

interface DemoControlDropdownProps {
  workspaceId?: string;
  onTriggerSuccess: () => void;
}

export const DemoControlDropdown: React.FC<DemoControlDropdownProps> = ({
  workspaceId = 'nest-realty-wilmington',
  onTriggerSuccess
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Gating: Only render if in demo mode
  const isDemoAllowed = process.env.NODE_ENV !== 'production';

  if (!isDemoAllowed) return null;

  const handleTrigger = async (scenario: string) => {
    setLoading(true);
    setIsOpen(false);
    try {
      const res = await fetch('/api/contracts/demo/fixtures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario, workspaceId })
      });
      const data = await res.json();
      if (data.success) {
        onTriggerSuccess();
      } else {
        alert(`Demo Fixture Error: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Demo Fixture Exception: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="px-3 py-1.5 bg-[#F6F7F1] hover:bg-stone-200 border border-stone-300 text-[#01362D] rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
        title="Developer Demo Fixture Menu"
      >
        <Sparkles className="w-3.5 h-3.5 text-[#00635C]" />
        <span>Demo</span>
        <ChevronDown className="w-3 h-3 text-stone-500" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white border border-stone-200 rounded-xl shadow-xl z-50 py-1 font-sans text-xs text-[#17231F] animate-in fade-in duration-150">
          <div className="px-3 py-1.5 border-b border-stone-100 text-[10px] font-bold text-[#52605B] uppercase tracking-wider">
            Simulate Channel Intakes
          </div>

          <button
            onClick={() => handleTrigger('scenario_a_sms')}
            className="w-full text-left px-3 py-2 hover:bg-stone-50 flex items-center justify-between text-xs text-[#17231F] cursor-pointer"
          >
            <span>Simulate SMS Offer</span>
            <Play className="w-3 h-3 text-[#00635C]" />
          </button>

          <button
            onClick={() => handleTrigger('scenario_b_phone')}
            className="w-full text-left px-3 py-2 hover:bg-stone-50 flex items-center justify-between text-xs text-[#17231F] cursor-pointer"
          >
            <span>Simulate Phone Intake</span>
            <Play className="w-3 h-3 text-[#00635C]" />
          </button>

          <button
            onClick={() => handleTrigger('scenario_c_bic')}
            className="w-full text-left px-3 py-2 hover:bg-stone-50 flex items-center justify-between text-xs text-[#17231F] cursor-pointer"
          >
            <span>Simulate BIC Review</span>
            <Play className="w-3 h-3 text-amber-600" />
          </button>

          <button
            onClick={() => handleTrigger('scenario_d_hoa')}
            className="w-full text-left px-3 py-2 hover:bg-stone-50 flex items-center justify-between text-xs text-[#17231F] cursor-pointer"
          >
            <span>Simulate HOA Conflict</span>
            <Play className="w-3 h-3 text-amber-600" />
          </button>

          <button
            onClick={() => handleTrigger('scenario_e_sensitive')}
            className="w-full text-left px-3 py-2 hover:bg-stone-50 flex items-center justify-between text-xs text-[#17231F] cursor-pointer"
          >
            <span>Simulate Sensitive Data Guard</span>
            <Play className="w-3 h-3 text-rose-600" />
          </button>
        </div>
      )}
    </div>
  );
};
