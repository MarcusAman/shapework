import React from 'react';
import { CheckCircle2, Clock, ShieldCheck, UserCheck, FileCheck, ArrowRightCheck } from 'lucide-react';

export interface TimelineLogItem {
  time: string;
  text: string;
  type: 'info' | 'intent' | 'query' | 'governance' | 'route' | 'success';
}

interface OperatingTimelineProps {
  logs: TimelineLogItem[];
  isProcessing: boolean;
}

export default function OperatingTimeline({ logs, isProcessing }: OperatingTimelineProps) {
  const getStepIcon = (type: string) => {
    switch (type) {
      case 'info':
        return Clock;
      case 'intent':
        return FileCheck;
      case 'query':
        return ShieldCheck;
      case 'governance':
        return UserCheck;
      case 'route':
        return CheckCircle2;
      case 'success':
        return CheckCircle2;
      default:
        return CheckCircle2;
    }
  };

  return (
    <div className="bg-[#FFFDF8] border border-[#01362D]/15 rounded-3xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-[#01362D]/10 pb-4">
        <div>
          <h3 className="text-base font-bold text-[#01362D]">Shapework response</h3>
          <p className="text-xs text-[#01362D]/60">Operating sequence timeline</p>
        </div>
        {isProcessing && (
          <span className="text-xs font-semibold text-[#00635C] bg-[#F6F7F1] px-3 py-1 rounded-full border border-[#00635C]/20 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#00635C] animate-pulse"></span>
            <span>Active processing</span>
          </span>
        )}
      </div>

      {/* Timeline Stream */}
      <div className="min-h-[160px] max-h-[220px] overflow-y-auto pr-1">
        {logs.length === 0 ? (
          <div className="p-8 text-center bg-[#F6F7F1] border border-dashed border-[#01362D]/15 rounded-2xl text-xs text-[#01362D]/50 italic">
            Waiting for request to initiate sequence...
          </div>
        ) : (
          <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#01362D]/10">
            {logs.map((log, idx) => {
              const Icon = getStepIcon(log.type);
              return (
                <div key={idx} className="relative flex items-start gap-3 text-xs animate-fadeIn">
                  <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-[#FFFDF8] border-2 border-[#00635C] flex items-center justify-center text-[#00635C] shrink-0 z-10">
                    <Icon className="w-3 h-3" />
                  </div>

                  <div className="flex-1 bg-[#F6F7F1] p-3 rounded-xl border border-[#01362D]/10 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#01362D] text-xs">{log.text}</span>
                      <span className="text-[10px] text-[#01362D]/50 font-mono ml-2 shrink-0">{log.time}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
