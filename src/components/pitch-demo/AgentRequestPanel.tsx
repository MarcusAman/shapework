import React from 'react';
import { Smartphone, Mic, CheckCircle, RefreshCw, MessageSquare } from 'lucide-react';

interface AgentRequestPanelProps {
  channel: string;
  agentName: string;
  property: string;
  question: string;
  typedText: string;
  isTyping: boolean;
  isProcessing: boolean;
  ahaStage: 'initial' | 'texted' | 'routed' | 'escalated' | 'approved' | 'delivered';
  simulatedTime: string | null;
  deliveredText?: string;
  onSimulate: () => void;
  onReset: () => void;
}

export default function AgentRequestPanel({
  channel,
  agentName,
  property,
  question,
  typedText,
  isTyping,
  isProcessing,
  ahaStage,
  simulatedTime,
  deliveredText,
  onSimulate,
  onReset
}: AgentRequestPanelProps) {
  return (
    <div className="bg-[#FFFDF8] border border-[#01362D]/15 rounded-3xl p-6 flex flex-col justify-between space-y-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-[#01362D]/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#F6F7F1] border border-[#01362D]/10 flex items-center justify-center text-[#00635C]">
            <Smartphone className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#01362D]">Agent request</h3>
            <p className="text-xs text-[#01362D]/60">{channel}</p>
          </div>
        </div>

        {isTyping ? (
          <span className="flex items-center gap-1.5 text-xs text-[#00635C] bg-[#F6F7F1] px-3 py-1 rounded-full border border-[#00635C]/20 font-medium">
            <span className="w-2 h-2 rounded-full bg-[#00635C] animate-ping"></span>
            <span>Listening...</span>
          </span>
        ) : (
          <span className="text-xs text-[#01362D]/70 bg-[#F6F7F1] px-3 py-1 rounded-full border border-[#01362D]/10 font-medium">
            Active channel
          </span>
        )}
      </div>

      {/* Details Bar */}
      <div className="grid grid-cols-2 gap-3 p-3 bg-[#F6F7F1] rounded-2xl text-xs">
        <div>
          <span className="text-[#01362D]/50 block font-medium">Agent</span>
          <span className="font-semibold text-[#01362D]">{agentName}</span>
        </div>
        <div>
          <span className="text-[#01362D]/50 block font-medium">Property</span>
          <span className="font-semibold text-[#01362D]">{property}</span>
        </div>
      </div>

      {/* Transcript & Message Box */}
      <div className="space-y-4 text-xs min-h-[220px] flex flex-col justify-end">
        {ahaStage === 'initial' && !typedText && (
          <div className="p-6 bg-[#F6F7F1] border border-dashed border-[#01362D]/20 rounded-2xl text-center space-y-2">
            <Mic className="w-5 h-5 text-[#00635C] mx-auto opacity-70" />
            <p className="text-xs text-[#01362D]/70 leading-relaxed">
              Select a scenario above or speak directly with NORA to stream live speech.
            </p>
          </div>
        )}

        {(ahaStage !== 'initial' || typedText) && (
          <div className="bg-[#01362D] text-white p-4.5 rounded-2xl rounded-tr-none max-w-[96%] ml-auto shadow-sm space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-[#D0D6BB] font-medium mb-1">
              <Mic className="w-3.5 h-3.5 text-[#D0D6BB]" />
              <span>Voice request transcript</span>
            </div>
            <p className="text-xs leading-relaxed text-white font-normal">
              {typedText || question}
              {isTyping && <span className="inline-block w-1.5 h-3.5 bg-[#D0D6BB] ml-1 animate-pulse"></span>}
            </p>
            <span className="text-[10px] text-[#D0D6BB]/70 block text-right font-mono">{simulatedTime || '12:04 PM'}</span>
          </div>
        )}

        {isProcessing && (
          <div className="bg-[#F6F7F1] text-[#01362D] p-3.5 rounded-2xl text-xs flex items-center gap-2.5 border border-[#01362D]/10">
            <RefreshCw className="w-4 h-4 animate-spin text-[#00635C]" />
            <span>Shapework is parsing request and evaluating governance rules...</span>
          </div>
        )}

        {ahaStage === 'delivered' && deliveredText && (
          <div className="bg-[#F6F7F1] border border-[#00635C]/30 text-[#01362D] p-4 rounded-2xl shadow-2xs space-y-2">
            <div className="flex items-center gap-2 text-[#00635C] font-semibold text-xs">
              <CheckCircle className="w-4 h-4 text-[#00635C]" />
              <span>Response delivered to agent</span>
            </div>
            <p className="text-xs text-[#01362D]/80 leading-relaxed font-mono">
              {deliveredText}
            </p>
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="pt-2">
        {ahaStage === 'initial' && (
          <button
            onClick={onSimulate}
            className="w-full py-3 bg-[#00635C] hover:bg-[#01362D] text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <MessageSquare className="w-4 h-4 fill-white" />
            <span>Simulate request</span>
          </button>
        )}

        {ahaStage === 'texted' && (
          <div className="p-3 bg-[#F6F7F1] border border-[#01362D]/10 rounded-xl text-center text-xs text-[#01362D]/70 flex items-center justify-center gap-2 font-medium">
            <RefreshCw className="w-4 h-4 animate-spin text-[#00635C]" />
            <span>Processing request...</span>
          </div>
        )}

        {(ahaStage === 'routed' || ahaStage === 'escalated' || ahaStage === 'approved' || ahaStage === 'delivered') && (
          <button
            onClick={onReset}
            className="w-full py-2.5 bg-[#F6F7F1] hover:bg-[#EAECE1] text-[#01362D] border border-[#01362D]/15 text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer font-medium"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#00635C]" />
            <span>Reset and test another scenario</span>
          </button>
        )}
      </div>
    </div>
  );
}
