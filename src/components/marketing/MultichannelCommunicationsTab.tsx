import React from 'react';
import { OriginalCommunicationRecord } from '../../shared/marketingStateModel';

interface MultichannelCommunicationsTabProps {
  campaign?: any;
  originalCommunication?: OriginalCommunicationRecord;
  onSendMessage?: (msg: string) => void;
}

export const MultichannelCommunicationsTab: React.FC<MultichannelCommunicationsTabProps> = ({
  campaign,
  originalCommunication,
  onSendMessage,
}) => {
  const req = campaign?.request;
  const channel = req?.channel === 'phone' ? 'Phone call' : 'Manual intake';
  const requesterName = req?.requestedByName || 'Ryan Crecelius';
  const primaryContactName = campaign?.listingSnapshot?.listingAgentName || 'Eric Anderson';
  const capturedByName = req?.capturedByAgentName || 'Ann Smith';

  return (
    <div className="space-y-6 text-left font-sans" data-testid="multichannel-communications-tab">
      {/* Header */}
      <div className="bg-[#01251f] border border-[#176457]/50 rounded-2xl p-5 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Multichannel Intake & Campaign Communication Thread</span>
          <h2 className="text-xl font-serif font-bold text-[#fffdf8] mt-0.5">Explicit Communication Log & Related Actions</h2>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
            Source Channel: {channel}
          </span>
        </div>
      </div>

      {/* Main Timeline Stream */}
      <div className="space-y-4">
        {/* Entry 1: Original Intake Request */}
        <div className="bg-[#062f28] border border-[#176457]/50 rounded-2xl p-5 space-y-3 shadow-md" data-testid="comm-entry-intake">
          <div className="flex items-center justify-between text-xs text-slate-400 border-b border-[#176457]/40 pb-2">
            <span className="font-bold text-emerald-300 flex items-center gap-1.5">
              <span>📩</span> Inbound Request ({channel})
            </span>
            <span className="font-mono text-slate-300">August 2, 2026 · 08:42 AM</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300">
            <div><strong>From:</strong> <span className="text-white">{requesterName}</span> (Requester / Owner)</div>
            <div><strong>To:</strong> <span className="text-white">HQ Operations</span></div>
            <div><strong>Captured by:</strong> <span className="text-[#d0d6bb]">{capturedByName}</span> ({channel})</div>
            <div><strong>Related Action:</strong> <span className="text-emerald-300">Campaign Request Intake</span></div>
          </div>

          <div className="bg-[#01251f] border border-[#176457]/40 rounded-xl p-4 text-xs text-slate-200 font-mono whitespace-pre-wrap">
            {originalCommunication?.rawText || `Hi Operations,\n\nWe just signed 990 Inspiration Drive in Wrightsville Beach! Please create our luxury listing package (Property Flyer, Social Package, Postcard, Sign Rider, Email).\n\nListing Agent / Primary Contact: ${primaryContactName}.\n\nSpecs: 4 BD, 4.5 BA, $2,450,000.\n\nThanks,\nRyan`}
          </div>
        </div>

        {/* Entry 2: SMS Quote Approval Thread */}
        <div className="bg-[#062f28] border border-[#176457]/50 rounded-2xl p-5 space-y-3 shadow-md" data-testid="comm-entry-sms-quote">
          <div className="flex items-center justify-between text-xs text-slate-400 border-b border-[#176457]/40 pb-2">
            <span className="font-bold text-amber-300 flex items-center gap-1.5">
              <span>📱</span> SMS Quote Approval Thread
            </span>
            <span className="font-mono text-slate-300">August 2, 2026 · 09:20 AM</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300">
            <div><strong>From:</strong> <span className="text-white">{primaryContactName}</span> (Primary Contact / Quote Approver)</div>
            <div><strong>To:</strong> <span className="text-white">HQ Operations</span></div>
            <div><strong>Channel:</strong> <span className="text-amber-300">SMS</span></div>
            <div><strong>Related Action:</strong> <span className="text-amber-300">Approved Apex Signs quote for $185.00</span></div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="bg-[#01251f] border border-[#176457]/40 rounded-xl p-3 text-slate-200">
              <span className="text-amber-400 font-bold">Outbound SMS (Apex Signs Quote):</span>
              <p className="mt-1 font-mono">"Hi Eric, Apex Signs quote for 2 custom 36x24 yard signs with QR code is $185.00 total. Please reply YES to approve for production."</p>
            </div>

            <div className="bg-[#062f28] border border-emerald-500/40 rounded-xl p-3 text-slate-200">
              <span className="text-emerald-400 font-bold">Inbound SMS Reply ({primaryContactName} · Quote Approver):</span>
              <p className="mt-1 font-mono">"YES! Approved. Thanks."</p>
            </div>
          </div>
        </div>

        {/* Entry 3: Outbound Proof Delivery Email Record */}
        <div className="bg-[#062f28] border border-[#176457]/50 rounded-2xl p-5 space-y-3 shadow-md" data-testid="comm-entry-proof">
          <div className="flex items-center justify-between text-xs text-slate-400 border-b border-[#176457]/40 pb-2">
            <span className="font-bold text-cyan-300 flex items-center gap-1.5">
              <span>✉️</span> Outbound Proof Delivery Email Record
            </span>
            <span className="font-mono text-slate-300">Status: Sent · August 2, 2026</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300">
            <div><strong>From:</strong> <span className="text-white">HQ Operations</span></div>
            <div><strong>To:</strong> <span className="text-white">{primaryContactName}</span> (Listing Agent) & <span className="text-white">{requesterName}</span></div>
            <div><strong>Channel:</strong> <span className="text-cyan-300">Email</span></div>
            <div><strong>Related Action:</strong> <span className="text-cyan-300">Delivered Package Proof v1</span></div>
          </div>

          <div className="bg-[#01251f] border border-[#176457]/40 rounded-xl p-4 text-xs text-slate-200 font-sans space-y-2">
            <p>Hi Eric & Ryan,</p>
            <p>Your listing flyer PDF, social media graphics, and e-blast proof are ready for final review. Your custom 36x24 yard sign has been approved and sent to Apex Print for production.</p>
            <p>Best regards,<br/><strong>HQ Operations · Nest Realty Marketing</strong></p>
          </div>
        </div>
      </div>
    </div>
  );
};
