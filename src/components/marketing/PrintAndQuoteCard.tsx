import React from 'react';
import { MarketingWorkItem, PrintWorkflowStatus } from '../../shared/marketingStateModel';
import { PRINT_TRANSITIONS } from '../../shared/marketingProjection';

interface PrintAndQuoteCardProps {
  item: MarketingWorkItem;
  onApproveQuote: (item: MarketingWorkItem) => void;
  onUpdatePrintStatus: (item: MarketingWorkItem, status: string, nextAction?: string) => void;
}

export const PrintAndQuoteCard: React.FC<PrintAndQuoteCardProps> = ({
  item,
  onApproveQuote,
  onUpdatePrintStatus
}) => {
  if (!item.printRequired && !item.quoteRequired && !item.quote) {
    return null;
  }

  const quote = item.quote;
  const printSpecs = item.printSpecs;
  const currentStatus: PrintWorkflowStatus = item.printWorkflowStatus || 'waiting_for_quote_approval';
  const allowedTransitions = PRINT_TRANSITIONS[currentStatus] || [];

  return (
    <div className="bg-[#062f28] border border-amber-500/40 rounded-2xl p-5 space-y-4 shadow-md text-left font-sans" data-testid="print-and-quote-card">
      <div className="flex items-center justify-between border-b border-[#176457]/50 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">🖨️</span>
          <div>
            <h3 className="font-bold text-sm text-[#fffdf8]">Physical Print & Vendor Price Quote</h3>
            <p className="text-xs text-slate-300">Tracks print specifications, client quote approvals, printer status, and physical handoff.</p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          Status: {(currentStatus || 'waiting_for_quote_approval').replace(/_/g, ' ')}
        </span>
      </div>

      {/* Grid of Specifications & Quote Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Left: Print Specs */}
        <div className="bg-[#01251f] border border-[#176457]/50 rounded-xl p-4 space-y-2">
          <h4 className="font-bold text-emerald-400 uppercase tracking-wider text-[11px]">Print Specifications</h4>
          <div className="space-y-1 text-slate-300">
            <div>Dimensions: <strong className="text-white">{printSpecs?.dimensions || '36" x 24"'}</strong></div>
            <div>Paper/Stock: <strong className="text-white">{printSpecs?.paperStock || '3mm Dibond Aluminum'}</strong></div>
            <div>Quantity: <strong className="text-white">{printSpecs?.quantity || 2} units</strong></div>
            <div>Finish: <strong className="text-white">{printSpecs?.finish || 'UV Gloss Weatherproof'}</strong></div>
            <div>Vendor: <strong className="text-amber-300">{printSpecs?.vendorName || 'Apex Print & Signs'}</strong></div>
            <div>Pickup Location: <strong className="text-white">{printSpecs?.pickupLocation || 'Nest HQ Front Desk'}</strong></div>
          </div>
        </div>

        {/* Right: Price Quote Details */}
        <div className="bg-[#01251f] border border-[#176457]/50 rounded-xl p-4 space-y-2">
          <h4 className="font-bold text-amber-400 uppercase tracking-wider text-[11px]">Price Quote & Approval Record</h4>
          {quote ? (
            <div className="space-y-1 text-slate-300">
              <div>Quote Amount: <strong className="text-xl font-bold text-amber-300">${quote.amount.toFixed(2)} {quote.currency}</strong></div>
              <div>Vendor: <strong className="text-white">{quote.vendorName}</strong></div>
              <div>Status: <strong className="text-emerald-400 uppercase">{quote.status}</strong></div>
              <div>Sent Via: <span className="text-slate-300">{quote.sentVia || 'SMS Text to Eric Anderson (Primary Contact)'}</span></div>
              {quote.approvedBy && (
                <div className="text-emerald-300 font-bold pt-1">
                  ✓ Approved by {quote.approvedBy} at {new Date(quote.approvedAt || '').toLocaleTimeString()}
                </div>
              )}
            </div>
          ) : (
            <div className="text-slate-400 italic">Quote pending from print vendor.</div>
          )}
        </div>
      </div>

      {/* Action Toolbar with Strict State Transition Guard */}
      <div className="bg-[#01251f] border border-[#176457]/40 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="text-slate-300 font-bold">Print Action Lifecycle:</span>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Step 1: Approve Quote (Active if waiting for quote approval) */}
          <button
            type="button"
            data-testid="print-action-approve-quote"
            disabled={!allowedTransitions.includes('approved_for_print') && currentStatus !== 'waiting_for_quote_approval'}
            onClick={() => onApproveQuote(item)}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs shadow-sm transition-all ${
              currentStatus === 'waiting_for_quote_approval' || allowedTransitions.includes('approved_for_print')
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer border border-emerald-400/30'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700 opacity-60'
            }`}
          >
            ✓ Approve ${quote?.amount || 185} Quote
          </button>

          {/* Step 2: Send Files to Vendor */}
          <button
            type="button"
            data-testid="print-action-send-to-vendor"
            disabled={!allowedTransitions.includes('sent_to_vendor')}
            onClick={() => {
              fetch('/api/marketing/print/submit-vendor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ workItemId: item.id, campaignId: item.campaignId })
              }).catch(() => {});
              onUpdatePrintStatus(item, 'sent_to_vendor', 'Sent high-res PDF print files to Apex Print');
            }}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
              allowedTransitions.includes('sent_to_vendor')
                ? 'bg-cyan-700 hover:bg-cyan-600 text-white cursor-pointer border border-cyan-400/30'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700 opacity-60'
            }`}
          >
            Send Files to Vendor
          </button>

          {/* Step 3: Ready for Pickup */}
          <button
            type="button"
            data-testid="print-action-ready-pickup"
            disabled={!allowedTransitions.includes('ready_for_pickup') && !allowedTransitions.includes('printing')}
            onClick={() => {
              fetch('/api/marketing/print/vendor-webhook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ workItemId: item.id, campaignId: item.campaignId, status: 'ready_for_pickup', details: 'Physical sign ready for pickup at Nest HQ Front Desk' })
              }).catch(() => {});
              onUpdatePrintStatus(item, 'ready_for_pickup', 'Physical sign ready for pickup at Nest HQ Front Desk');
            }}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
              allowedTransitions.includes('ready_for_pickup') || allowedTransitions.includes('printing')
                ? 'bg-purple-700 hover:bg-purple-600 text-white cursor-pointer border border-purple-400/30'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700 opacity-60'
            }`}
          >
            Ready for Pickup
          </button>

          {/* Step 4: Physically Delivered */}
          <button
            type="button"
            data-testid="print-action-confirm-delivery"
            disabled={!allowedTransitions.includes('physically_delivered') && !allowedTransitions.includes('picked_up')}
            onClick={() => {
              fetch('/api/marketing/print/vendor-webhook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ workItemId: item.id, campaignId: item.campaignId, status: 'physically_delivered', details: 'Sign delivered to site' })
              }).catch(() => {});
              onUpdatePrintStatus(item, 'physically_delivered', 'Sign delivered to site');
            }}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
              allowedTransitions.includes('physically_delivered') || allowedTransitions.includes('picked_up')
                ? 'bg-emerald-700 hover:bg-emerald-600 text-white cursor-pointer border border-emerald-400/30'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700 opacity-60'
            }`}
          >
            Confirm Delivery
          </button>
        </div>
      </div>
    </div>
  );
};
