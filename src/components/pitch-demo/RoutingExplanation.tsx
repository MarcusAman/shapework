import React from 'react';
import { HelpCircle } from 'lucide-react';

interface RoutingExplanationProps {
  requestType: string;
  routingRule: string;
  responsiblePosition: string;
  assignedPerson: string;
  procedure: string;
  escalationPolicy: string;
}

export default function RoutingExplanation({
  requestType,
  routingRule,
  responsiblePosition,
  assignedPerson,
  procedure,
  escalationPolicy
}: RoutingExplanationProps) {
  return (
    <div className="p-5 bg-[#F6F7F1] border border-[#01362D]/10 rounded-2xl space-y-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-[#01362D]">
        <HelpCircle className="w-4 h-4 text-[#00635C]" />
        <span>Why Shapework routed this here</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
        <div>
          <span className="text-[#01362D]/50 block text-[11px]">Request type</span>
          <span className="font-medium text-[#01362D]">{requestType}</span>
        </div>
        <div>
          <span className="text-[#01362D]/50 block text-[11px]">Routing rule</span>
          <span className="font-medium text-[#01362D]">{routingRule}</span>
        </div>
        <div>
          <span className="text-[#01362D]/50 block text-[11px]">Responsible position</span>
          <span className="font-medium text-[#01362D]">{responsiblePosition}</span>
        </div>
        <div>
          <span className="text-[#01362D]/50 block text-[11px]">Assigned person</span>
          <span className="font-medium text-[#01362D]">{assignedPerson}</span>
        </div>
        <div>
          <span className="text-[#01362D]/50 block text-[11px]">Procedure</span>
          <span className="font-medium text-[#01362D]">{procedure}</span>
        </div>
        <div>
          <span className="text-[#01362D]/50 block text-[11px]">Escalation policy</span>
          <span className="font-medium text-[#01362D]">{escalationPolicy}</span>
        </div>
      </div>
    </div>
  );
}
