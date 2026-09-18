import React, { useState } from 'react';
import { Send, CheckCircle2, RefreshCw, Shield, AlertCircle, Clock } from 'lucide-react';

interface VendorSimulatorPanelProps {
  workItemId: string;
  campaignId: string;
  currentStatus: string;
  onWebhookTriggered: () => void;
}

export const VendorSimulatorPanel: React.FC<VendorSimulatorPanelProps> = ({
  workItemId,
  campaignId,
  currentStatus,
  onWebhookTriggered
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastEvent, setLastEvent] = useState<string | null>(null);

  const triggerVendorWebhook = async (status: string, details: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/marketing/print/vendor-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workItemId,
          campaignId,
          vendorName: 'Apex Signs & Print',
          status,
          details
        })
      });
      const data = await res.json();
      if (data.success) {
        setLastEvent(`Webhook [${status}] delivered successfully`);
        onWebhookTriggered();
      }
    } catch (e: any) {
      setLastEvent(`Error: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#041F1A] border border-emerald-500/30 rounded-2xl p-4 md:p-5 space-y-4 text-left font-sans shadow-lg">
      <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <h3 className="font-bold text-sm text-[#FFFDF8]">Apex Signs & Print — Vendor Simulator</h3>
        </div>
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 uppercase">
          {currentStatus.replace(/_/g, ' ')}
        </span>
      </div>

      <p className="text-xs text-slate-300">
        Simulate real-time Apex Signs print production webhook callbacks and physical delivery events.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => triggerVendorWebhook('sent_to_vendor', 'Files sent to Apex Print queue')}
          className="px-3 py-2 bg-[#073F35] hover:bg-[#095246] disabled:opacity-50 text-emerald-200 text-xs font-bold rounded-xl border border-emerald-500/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>1. Submit Order</span>
        </button>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => triggerVendorWebhook('printing', 'Heavy aluminum sign rider printing in progress')}
          className="px-3 py-2 bg-[#073F35] hover:bg-[#095246] disabled:opacity-50 text-amber-200 text-xs font-bold rounded-xl border border-amber-500/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>2. Start Printing</span>
        </button>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => triggerVendorWebhook('ready_for_pickup', 'Physical sign ready for pickup at Nest HQ Front Desk')}
          className="px-3 py-2 bg-[#073F35] hover:bg-[#095246] disabled:opacity-50 text-cyan-200 text-xs font-bold rounded-xl border border-cyan-500/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Clock className="w-3.5 h-3.5" />
          <span>3. Ready Pickup</span>
        </button>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => triggerVendorWebhook('physically_delivered', 'Sign rider delivered and mounted at 990 Inspiration Drive')}
          className="px-3 py-2 bg-[#073F35] hover:bg-[#095246] disabled:opacity-50 text-emerald-300 text-xs font-bold rounded-xl border border-emerald-400/50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>4. Confirm Delivered</span>
        </button>
      </div>

      {lastEvent && (
        <div className="bg-[#011713] p-2.5 rounded-xl border border-emerald-500/20 text-xs font-mono text-emerald-300 flex items-center justify-between">
          <span>{lastEvent}</span>
          <span className="text-[10px] text-slate-400">{new Date().toLocaleTimeString()}</span>
        </div>
      )}
    </div>
  );
};
