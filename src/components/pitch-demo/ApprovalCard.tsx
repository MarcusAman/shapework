import React from 'react';
import { CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react';

interface ApprovalCardProps {
  title: string;
  property: string;
  requestedBy: string;
  assignedReviewer: string;
  reason: string;
  expectedResponse: string;
  refLabel: string;
  refValue: string;
  buttonLabel: string;
  ahaStage: 'initial' | 'texted' | 'routed' | 'escalated' | 'approved' | 'delivered';
  onApprove: () => void;
}

export default function ApprovalCard({
  title,
  property,
  requestedBy,
  assignedReviewer,
  reason,
  expectedResponse,
  refLabel,
  refValue,
  buttonLabel,
  ahaStage,
  onApprove
}: ApprovalCardProps) {
  const isApproved = ahaStage === 'approved' || ahaStage === 'delivered';

  return (
    <div className={`p-6 bg-[#FFFDF8] border-2 ${
      isApproved ? 'border-[#00635C]' : 'border-[#01362D]/20'
    } rounded-3xl space-y-5 shadow-sm relative transition-all`}>
      
      {/* Header Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          <span className="text-xs font-semibold text-[#01362D] uppercase tracking-wider">
            {isApproved ? 'Approval recorded' : 'Approval requested'}
          </span>
        </div>
        <span className="text-xs text-[#01362D]/60 font-medium">
          Expected response: {expectedResponse}
        </span>
      </div>

      {/* Main Title & Reason */}
      <div className="space-y-1">
        <h4 className="text-lg font-bold text-[#01362D] tracking-tight">{title}</h4>
        <p className="text-xs text-[#01362D]/70 leading-relaxed">
          Requested by <strong className="text-[#01362D]">{requestedBy}</strong> — {reason}
        </p>
      </div>

      {/* Info Grid */}
      <div className="p-4 bg-[#F6F7F1] rounded-2xl border border-[#01362D]/10 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-[#01362D]/50 block font-medium">Property</span>
          <span className="font-semibold text-[#01362D]">{property}</span>
        </div>
        <div>
          <span className="text-[#01362D]/50 block font-medium">Assigned reviewer</span>
          <span className="font-semibold text-[#01362D]">{assignedReviewer}</span>
        </div>
        <div>
          <span className="text-[#01362D]/50 block font-medium">{refLabel}</span>
          <span className="font-mono font-semibold text-[#00635C]">{refValue}</span>
        </div>
        <div>
          <span className="text-[#01362D]/50 block font-medium">Due time status</span>
          <span className="font-semibold text-[#01362D]">On schedule</span>
        </div>
      </div>

      {/* Actions Hierarchy */}
      {!isApproved ? (
        <div className="space-y-2.5 pt-1">
          <button
            onClick={onApprove}
            className="w-full py-3 bg-[#00635C] hover:bg-[#01362D] text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <ShieldCheck className="w-4 h-4 text-white" />
            <span>Approve action</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onApprove}
              className="py-2 bg-[#F6F7F1] hover:bg-[#EAECE1] text-[#01362D] rounded-xl text-xs font-medium border border-[#01362D]/10 transition-all cursor-pointer text-center"
            >
              Review details
            </button>
            <button
              onClick={onApprove}
              className="py-2 bg-[#F6F7F1] hover:bg-[#EAECE1] text-[#01362D]/70 hover:text-[#01362D] rounded-xl text-xs font-medium border border-[#01362D]/10 transition-all cursor-pointer text-center"
            >
              Request info
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3.5 bg-[#EAECE1] border border-[#00635C]/30 rounded-2xl text-center text-xs text-[#00635C] font-semibold flex items-center justify-center gap-2">
          <CheckCircle className="w-4 h-4 text-[#00635C]" />
          <span>Approval recorded by Broker • Action executed</span>
        </div>
      )}
    </div>
  );
}
