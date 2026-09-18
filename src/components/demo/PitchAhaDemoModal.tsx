/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  CheckCircle, MessageSquare, Phone, Shield, FileText,
  TrendingUp, DollarSign, X, Smartphone, RefreshCw, Zap, ArrowRight,
  Building2, Layers, Cpu, AlertTriangle, Clock, Volume2, VolumeX,
  Camera, ArrowLeft, Check, Download, Eye, Award, Info, ChevronRight,
  PhoneCall, Copy, Mic
} from 'lucide-react';

import PitchDemoHeader from '../pitch-demo/PitchDemoHeader';
import PitchDemoNavigation, { PitchStep } from '../pitch-demo/PitchDemoNavigation';
import LiveDemoIntro from '../pitch-demo/LiveDemoIntro';
import ScenarioSelector, { ScenarioId } from '../pitch-demo/ScenarioSelector';
import AgentRequestPanel from '../pitch-demo/AgentRequestPanel';
import OperatingTimeline from '../pitch-demo/OperatingTimeline';
import ApprovalCard from '../pitch-demo/ApprovalCard';
import RoutingExplanation from '../pitch-demo/RoutingExplanation';
import OutcomeSummary from '../pitch-demo/OutcomeSummary';

interface PitchAhaDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab?: (tab: string) => void;
}

// Apple-Grade Web Audio Sound Synthesizer
const playAppleSFX = (type: 'tap' | 'message_sent' | 'message_received' | 'approval_chime') => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'tap') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(340, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } else if (type === 'message_sent') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(550, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(950, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else if (type === 'message_received') {
      [1046.50, 1318.51].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.07);
        gain.gain.setValueAtTime(0.05, ctx.currentTime + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.07 + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.07);
        osc.stop(ctx.currentTime + idx * 0.07 + 0.22);
      });
    } else if (type === 'approval_chime') {
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.05);
        gain.gain.setValueAtTime(0.06, ctx.currentTime + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.05 + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.05);
        osc.stop(ctx.currentTime + idx * 0.05 + 0.45);
      });
    }
  } catch (e) {
    // Ignore audio context errors
  }
};

const PROMPT_CHIPS = [
  {
    id: 'disclosure' as const,
    title: 'Lead paint disclosure',
    question: '"Hey NestOps, I\'m at 104 Main St with a buyer right now. Can you text me the signed Lead-Based Paint Disclosure PDF?"',
    logs: [
      { time: '00:00.6s', text: 'Voice request received via NORA Voice Agent', type: 'info' as const },
      { time: '00:01.2s', text: 'Request parsed: Lead Paint Disclosure for 104 Main St', type: 'intent' as const },
      { time: '00:01.9s', text: 'Document found in file vault (#DL-104MAIN-LBP)', type: 'query' as const },
      { time: '00:02.7s', text: 'Governance check: Requires Broker approval', type: 'governance' as const },
      { time: '00:03.4s', text: 'Approval card sent to Broker Eric Knight', type: 'route' as const }
    ]
  },
  {
    id: 'emd' as const,
    title: 'Earnest-money deposit',
    question: '"Just collected the $5,000 earnest money check for 312 Mayfaire Town Center Way. Check photo attached."',
    logs: [
      { time: '00:00.5s', text: 'Text & check image received via NORA Inbound Channel', type: 'info' as const },
      { time: '00:01.1s', text: 'Parsed check: $5,000.00 deposit from John Smith', type: 'intent' as const },
      { time: '00:01.8s', text: 'Matched transaction: 312 Mayfaire Town Center Way', type: 'query' as const },
      { time: '00:02.5s', text: 'Escrow audit record prepared', type: 'governance' as const },
      { time: '00:03.2s', text: 'Verification card sent to Broker Eric Knight', type: 'route' as const }
    ]
  },
  {
    id: 'camera' as const,
    title: 'Lockbox access',
    question: '"Storage Room Sensor: Detected Lockbox #LB-902 pickup for 1204 Wrightsville Ave."',
    logs: [
      { time: '00:00.4s', text: 'Sensor detected lockbox checkout in Storage Bay #4', type: 'info' as const },
      { time: '00:01.0s', text: 'Recognized Lockbox #LB-902 checked out by Jessica Miller', type: 'intent' as const },
      { time: '00:01.7s', text: 'Linked to listing: 1204 Wrightsville Ave', type: 'query' as const },
      { time: '00:02.3s', text: 'Equipment checkout recorded automatically', type: 'governance' as const },
      { time: '00:03.0s', text: 'Asset registry updated', type: 'success' as const }
    ]
  },
  {
    id: 'repair' as const,
    title: 'Emergency repair',
    question: '"Buyer inspection found an active water heater leak at 104 Main St. Can an approved plumber be dispatched now?"',
    logs: [
      { time: '00:00.6s', text: 'Voice request received: Emergency Plumbing Repair', type: 'info' as const },
      { time: '00:01.3s', text: 'Request parsed: Dispatch plumber to 104 Main St', type: 'intent' as const },
      { time: '00:02.0s', text: 'Matched vendor: Cape Fear Plumbing ($1,450 rate)', type: 'query' as const },
      { time: '00:02.8s', text: 'Routing rule: Repairs over $250 require Broker approval', type: 'governance' as const },
      { time: '00:03.5s', text: 'Dispatch approval card sent to Broker Eric Knight', type: 'route' as const }
    ]
  }
];

const SCENARIO_ROUTING_DETAILS: Record<string, {
  requestType: string;
  routingRule: string;
  responsiblePosition: string;
  assignedPerson: string;
  procedure: string;
  escalationPolicy: string;
  title: string;
  property: string;
  agent: string;
  reason: string;
  refLabel: string;
  refValue: string;
  deliveredTitle: string;
  deliveredText: string;
  summaryItems: string[];
}> = {
  disclosure: {
    requestType: 'Compliance Document Request',
    routingRule: 'Lead Paint Disclosure Protocol',
    responsiblePosition: 'Broker-in-Charge',
    assignedPerson: 'Eric Knight',
    procedure: 'Disclosure Verification & Dispatch',
    escalationPolicy: '15-Minute Response Backup',
    title: 'Lead-Based Paint Disclosure Approval',
    property: '104 Main St',
    agent: 'Jessica Keenan',
    reason: 'Active buyer walkthrough requires signed Lead-Based Paint disclosure',
    refLabel: 'File Reference',
    refValue: '#DL-104MAIN-LBP',
    deliveredTitle: 'Disclosure Dispatched to Agent',
    deliveredText: '"Here is your 104 Main St Lead-Based Paint Disclosure PDF: https://shapework.app/ephemeral/lbp-104main.pdf (Single-use link)."',
    summaryItems: [
      'Agent Jessica Keenan received document via SMS',
      'Broker Eric Knight approval recorded',
      'Audit log filed to compliance vault',
      'No secondary follow-up required'
    ]
  },
  emd: {
    requestType: 'Escrow Deposit Intake',
    routingRule: 'Earnest Money Deposit Verification',
    responsiblePosition: 'Broker-in-Charge',
    assignedPerson: 'Eric Knight',
    procedure: 'Trust Account Logging',
    escalationPolicy: 'Same-Day Escrow Due Time',
    title: '$5,000 Earnest Money Deposit Verification',
    property: '312 Mayfaire Town Center Way',
    agent: 'Marcus Vance',
    reason: 'Submitted $5,000 check photo from buyer closing deposit',
    refLabel: 'Ledger Reference',
    refValue: '#EMD-CHECK-312MAYFAIRE',
    deliveredTitle: 'Trust Deposit Logged & Receipt Issued',
    deliveredText: '"Received $5,000 check for 312 Mayfaire. Logged to Trust Ledger #TL-2026-088. Receipt SMS sent to Marcus Vance."',
    summaryItems: [
      '$5,000 EMD verified with First National Bank',
      'Trust ledger entry #TL-2026-088 generated',
      'Receipt issued to buyer agent',
      'Zero trust account audit discrepancies'
    ]
  },
  camera: {
    requestType: 'Asset Custody Checkout',
    routingRule: 'Storage Bay Equipment Tracking',
    responsiblePosition: 'Operations Coordinator',
    assignedPerson: 'Auto-Logged System Rule',
    procedure: 'Lockbox Physical Checkout',
    escalationPolicy: '24-Hour Unreturned Alert',
    title: 'Storage Unit Lockbox Custody Log',
    property: '1204 Wrightsville Ave',
    agent: 'Jessica Miller',
    reason: 'Motion sensor camera detected lockbox #LB-902 pickup at Storage Bay #4',
    refLabel: 'Sensor Reference',
    refValue: '#BAY4-CAM-LOCKBOX902',
    deliveredTitle: 'Asset Custody Logged',
    deliveredText: '"Logged Lockbox #LB-902 checkout to Jessica Miller for 1204 Wrightsville Ave in physical asset registry."',
    summaryItems: [
      'Lockbox #LB-902 assigned to Jessica Miller',
      'Listing record updated automatically',
      'Zero manual data entry needed',
      'Equipment log reconciled'
    ]
  },
  repair: {
    requestType: 'Emergency Repair Request',
    routingRule: 'Property Repair Request ($250+ Threshold)',
    responsiblePosition: 'Broker-in-Charge',
    assignedPerson: 'Eric Knight',
    procedure: 'Emergency Repair Response',
    escalationPolicy: 'Urgent Property Issue (15-Min Response)',
    title: 'Emergency Plumbing Repair ($1,450)',
    property: '104 Main St',
    agent: 'Marcus Vance',
    reason: 'Buyer inspection identified an active water-heater leak requiring urgent dispatch',
    refLabel: 'Work Order Reference',
    refValue: '#REPAIR-PLUMBING-104MAIN',
    deliveredTitle: 'Plumber Dispatched & PO Generated',
    deliveredText: '"Cape Fear Plumbing dispatched to 104 Main St ($1,450 PO #PO-9921). Dispatch notification sent to Agent Marcus Vance."',
    summaryItems: [
      'Cape Fear Plumbing dispatched to property',
      'Purchase Order #PO-9921 issued',
      'Broker Eric Knight approval timestamped',
      'Agent Marcus Vance confirmed via SMS'
    ]
  }
};

export default function PitchAhaDemoModal({ isOpen, onClose }: PitchAhaDemoModalProps) {
  const [activeStep, setActiveStep] = useState<PitchStep>('pitch');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Scenario State
  const [selectedScenario, setSelectedScenario] = useState<ScenarioId>('repair');
  const [ahaStage, setAhaStage] = useState<'initial' | 'texted' | 'routed' | 'escalated' | 'approved' | 'delivered'>('initial');
  const [isProcessing, setIsProcessing] = useState(false);
  const [simulatedTime, setSimulatedTime] = useState<string | null>(null);

  // Typewriter & Timeline State
  const [typedText, setTypedText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [processingLogs, setProcessingLogs] = useState<Array<{ time: string; text: string; type: 'info' | 'intent' | 'query' | 'governance' | 'route' | 'success' }>>([]);

  // Pricing State
  const [agentCount, setAgentCount] = useState<number>(74);
  const baseRetainer = 2500;
  const pricePerAgent = 15;
  const totalMonthlyPrice = baseRetainer + agentCount * pricePerAgent;
  const hoursSavedPerMonth = Math.round(agentCount * 18.5);

  if (!isOpen) return null;

  const triggerSound = (type: 'tap' | 'message_sent' | 'message_received' | 'approval_chime') => {
    if (soundEnabled) playAppleSFX(type);
  };

  const runTypewriterScenario = (chip: typeof PROMPT_CHIPS[number]) => {
    triggerSound('tap');
    setSelectedScenario(chip.id as ScenarioId);
    setAhaStage('texted');
    setIsProcessing(true);
    setIsTyping(true);
    setTypedText('');
    setProcessingLogs([]);
    setSimulatedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

    const textToType = chip.question.replace(/^"/, '').replace(/"$/, '');
    let charIndex = 0;

    const interval = setInterval(() => {
      charIndex += 2;
      if (charIndex > textToType.length) charIndex = textToType.length;
      setTypedText(`"${textToType.slice(0, charIndex)}"`);
      if (soundEnabled && charIndex % 4 === 0) playAppleSFX('tap');

      if (charIndex >= textToType.length) {
        clearInterval(interval);
        setIsTyping(false);

        chip.logs.forEach((log, idx) => {
          setTimeout(() => {
            setProcessingLogs(prev => [...prev, log]);
            if (soundEnabled) playAppleSFX('message_received');
            if (idx === chip.logs.length - 1) {
              setIsProcessing(false);
              setAhaStage('routed');
            }
          }, (idx + 1) * 400);
        });
      }
    }, 16);
  };

  const handleSimulateAction = () => {
    const matchedChip = PROMPT_CHIPS.find(c => c.id === selectedScenario) || PROMPT_CHIPS[3];
    runTypewriterScenario(matchedChip);
  };

  const handleBicApprove = () => {
    triggerSound('approval_chime');
    setIsProcessing(true);

    const detail = SCENARIO_ROUTING_DETAILS[selectedScenario] || SCENARIO_ROUTING_DETAILS.repair;
    const approveLog = {
      time: '00:04.2s',
      text: `Approved by Broker Eric Knight. ${detail.deliveredTitle}`,
      type: 'success' as const
    };

    setProcessingLogs(prev => [...prev, approveLog]);

    setTimeout(() => {
      setAhaStage('approved');
      setTimeout(() => {
        triggerSound('message_received');
        setAhaStage('delivered');
        setIsProcessing(false);
      }, 500);
    }, 500);
  };

  const handleResetAha = () => {
    triggerSound('tap');
    setAhaStage('initial');
    setIsProcessing(false);
    setTypedText('');
    setProcessingLogs([]);
  };

  const handleScenarioChange = (scenario: ScenarioId) => {
    triggerSound('tap');
    setSelectedScenario(scenario);
    setAhaStage('initial');
    setIsProcessing(false);
    const matchedChip = PROMPT_CHIPS.find(c => c.id === scenario) || PROMPT_CHIPS[3];
    runTypewriterScenario(matchedChip);
  };

  const currentDetails = SCENARIO_ROUTING_DETAILS[selectedScenario] || SCENARIO_ROUTING_DETAILS.repair;
  const currentChip = PROMPT_CHIPS.find(c => c.id === selectedScenario) || PROMPT_CHIPS[3];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#F6F7F1] text-[#01362D] font-sans overflow-hidden animate-fadeIn">
      
      {/* Container Wrap */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-[1360px] mx-auto w-full flex flex-col justify-between space-y-6">
        
        {/* Header */}
        <PitchDemoHeader
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
          onClose={onClose}
        />

        {/* Segmented Step Navigation */}
        <PitchDemoNavigation
          activeStep={activeStep}
          onSelectStep={(step) => {
            triggerSound('tap');
            setActiveStep(step);
          }}
        />

        {/* STEP 1: THE PROBLEM */}
        {activeStep === 'pitch' && (
          <div className="space-y-6 animate-fadeIn">
            
            <div className="p-4 bg-[#FFFDF8] border border-[#01362D]/15 rounded-2xl flex items-center gap-3 text-xs text-[#01362D]">
              <Info className="w-4 h-4 text-[#00635C] shrink-0" />
              <span>
                <strong>Demonstration Note:</strong> Shapework connects existing systems into a unified operational loop without forcing agents onto another portal.
              </span>
            </div>

            {/* Master Vision Card */}
            <div className="p-8 md:p-10 bg-[#FFFDF8] border border-[#01362D]/15 rounded-3xl shadow-sm space-y-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#00635C] block">
                The Executive Thesis
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-[#01362D] leading-tight tracking-tight">
                "Traditional tools build dashboards for everyone. Shapework delivers clear role alignment: high-density oversight for operators, and zero-dashboard voice & messaging for agents."
              </h2>
              <p className="text-sm md:text-base text-[#01362D]/80 leading-relaxed">
                Most platforms fail because mobile agents ignore portals that require passwords and apps, while brokers waste hours tracking down updates across email, text, and disconnected forms. Shapework operates cleanly between your existing tools.
              </p>
            </div>

            {/* Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="p-7 bg-[#FFFDF8] border border-rose-200 rounded-3xl space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-rose-100 pb-3">
                  <div className="flex items-center gap-2.5 text-rose-700">
                    <AlertTriangle className="w-5 h-5" />
                    <h3 className="font-bold text-base text-[#01362D]">Traditional Platforms</h3>
                  </div>
                  <span className="text-xs text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full font-semibold border border-rose-200">
                    High Friction
                  </span>
                </div>
                <ul className="space-y-3 text-xs text-[#01362D]/80 leading-relaxed">
                  <li className="flex items-start gap-2.5">
                    <span className="text-rose-600 font-bold">✕</span>
                    <span>Requires mobile agents to log into complex web portals during active client meetings.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-rose-600 font-bold">✕</span>
                    <span>Forces BICs to manually check multiple disconnected systems to verify simple compliance requests.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-rose-600 font-bold">✕</span>
                    <span>Agent adoption drops significantly within the first 90 days.</span>
                  </li>
                </ul>
              </div>

              <div className="p-7 bg-[#FFFDF8] border border-[#00635C]/30 rounded-3xl space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-[#01362D]/10 pb-3">
                  <div className="flex items-center gap-2.5 text-[#00635C]">
                    <CheckCircle className="w-5 h-5" />
                    <h3 className="font-bold text-base text-[#01362D]">Shapework Operating Layer</h3>
                  </div>
                  <span className="text-xs text-[#00635C] bg-[#EAECE1] px-2.5 py-0.5 rounded-full font-semibold border border-[#00635C]/20">
                    Zero Disruption
                  </span>
                </div>
                <ul className="space-y-3 text-xs text-[#01362D]/80 leading-relaxed">
                  <li className="flex items-start gap-2.5">
                    <span className="text-[#00635C] font-bold">✓</span>
                    <span><strong>Operators & BICs</strong> receive clear decision queues with 1-click approvals.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-[#00635C] font-bold">✓</span>
                    <span><strong>74 Roster Agents</strong> interact via phone and SMS without app downloads or logins.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-[#00635C] font-bold">✓</span>
                    <span>Background automation keeps your existing software in sync.</span>
                  </li>
                </ul>
              </div>

            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => {
                  triggerSound('tap');
                  setActiveStep('aha');
                }}
                className="px-7 py-3 bg-[#00635C] hover:bg-[#01362D] text-white font-semibold rounded-full text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <span>Proceed to Step 2: Live Operating Loop</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: LIVE OPERATING LOOP */}
        {activeStep === 'aha' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Live Demo Hero Intro */}
            <LiveDemoIntro
              onSimulate={handleSimulateAction}
              onCopySuccess={() => triggerSound('tap')}
            />

            {/* Compact Scenario Selector */}
            <ScenarioSelector
              selectedScenario={selectedScenario}
              onSelectScenario={handleScenarioChange}
            />

            {/* Main Operating Sequence Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              
              {/* Left: Agent Request Panel */}
              <AgentRequestPanel
                channel="NORA Live Voice Assistant"
                agentName={currentDetails.agent}
                property={currentDetails.property}
                question={currentChip.question}
                typedText={typedText}
                isTyping={isTyping}
                isProcessing={isProcessing}
                ahaStage={ahaStage}
                simulatedTime={simulatedTime}
                deliveredText={currentDetails.deliveredText}
                onSimulate={handleSimulateAction}
                onReset={handleResetAha}
              />

              {/* Right: Shapework Response Timeline */}
              <div className="space-y-6">
                <OperatingTimeline
                  logs={processingLogs}
                  isProcessing={isProcessing}
                />

                {/* Focal Approval Card */}
                {(ahaStage === 'routed' || ahaStage === 'escalated' || ahaStage === 'approved' || ahaStage === 'delivered') && (
                  <ApprovalCard
                    title={currentDetails.title}
                    property={currentDetails.property}
                    requestedBy={currentDetails.agent}
                    assignedReviewer={currentDetails.assignedPerson}
                    reason={currentDetails.reason}
                    expectedResponse="Within 15 minutes"
                    refLabel={currentDetails.refLabel}
                    refValue={currentDetails.refValue}
                    buttonLabel="Approve dispatch"
                    ahaStage={ahaStage}
                    onApprove={handleBicApprove}
                  />
                )}

                {/* Routing Rule Rationale */}
                {(ahaStage === 'routed' || ahaStage === 'approved' || ahaStage === 'delivered') && (
                  <RoutingExplanation
                    requestType={currentDetails.requestType}
                    routingRule={currentDetails.routingRule}
                    responsiblePosition={currentDetails.responsiblePosition}
                    assignedPerson={currentDetails.assignedPerson}
                    procedure={currentDetails.procedure}
                    escalationPolicy={currentDetails.escalationPolicy}
                  />
                )}
              </div>

            </div>

            {/* Outcome Summary */}
            {(ahaStage === 'approved' || ahaStage === 'delivered') && (
              <OutcomeSummary
                summaryItems={currentDetails.summaryItems}
                onNextScenario={() => {
                  triggerSound('tap');
                  setActiveStep('pricing');
                }}
              />
            )}

            {/* Navigation Footer */}
            <div className="flex justify-between items-center pt-4 border-t border-[#01362D]/10">
              <button
                onClick={() => {
                  triggerSound('tap');
                  setActiveStep('pitch');
                }}
                className="px-4 py-2 bg-[#FFFDF8] hover:bg-white text-[#01362D] rounded-full text-xs font-medium border border-[#01362D]/15 flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Problem Thesis</span>
              </button>
              <button
                onClick={() => {
                  triggerSound('tap');
                  setActiveStep('pricing');
                }}
                className="px-7 py-3 bg-[#00635C] hover:bg-[#01362D] text-white font-semibold rounded-full text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <span>Proceed to Step 3: Commercial Model</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: COMMERCIAL MODEL */}
        {activeStep === 'pricing' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-8 bg-[#FFFDF8] border border-[#01362D]/15 rounded-3xl space-y-2 shadow-sm">
              <span className="text-xs font-semibold uppercase text-[#00635C] tracking-wider block">
                Transparent Operating Investment
              </span>
              <h2 className="text-2xl font-bold text-[#01362D]">
                Commercial Model: Base Retainer + Active Agent Tier
              </h2>
              <p className="text-sm text-[#01362D]/70">
                Predictable pricing with zero hidden fees. Only pay for agents who actively use the operating line during the month.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <div className="p-7 bg-[#FFFDF8] border border-[#01362D]/15 rounded-3xl space-y-5 shadow-xs">
                <h3 className="font-bold text-base text-[#01362D]">Pricing Components</h3>
                
                <div className="space-y-4 text-xs">
                  <div className="p-4 bg-[#F6F7F1] border border-[#01362D]/10 rounded-2xl space-y-1.5">
                    <div className="flex justify-between items-center">
                      <strong className="text-[#01362D] text-sm font-bold">1. Base Operating Retainer</strong>
                      <span className="text-[#00635C] font-semibold text-base">$2,500 / mo</span>
                    </div>
                    <p className="text-xs text-[#01362D]/70 leading-relaxed">
                      Covers custom SOP library setup, tool maintenance, & dedicated Customer Success Operator.
                    </p>
                  </div>

                  <div className="p-4 bg-[#F6F7F1] border border-[#01362D]/10 rounded-2xl space-y-1.5">
                    <div className="flex justify-between items-center">
                      <strong className="text-[#01362D] text-sm font-bold">2. Active Agent Tier</strong>
                      <span className="text-[#00635C] font-semibold text-base">$15 / agent / mo</span>
                    </div>
                    <p className="text-xs text-[#01362D]/70 leading-relaxed">
                      Billed strictly for active roster agents who call or text the Shapework line during the month.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-7 bg-[#FFFDF8] border border-[#00635C]/30 rounded-3xl space-y-5 flex flex-col justify-between shadow-xs">
                <div>
                  <h3 className="font-bold text-base text-[#01362D] mb-0.5">Interactive Roster Calculator</h3>
                  <p className="text-xs text-[#01362D]/70">
                    Adjust agent count to calculate monthly investment and estimated time savings.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-[#01362D]/70">Active Roster Size:</span>
                    <strong className="text-[#00635C] text-sm font-bold">{agentCount} Active Agents</strong>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={200}
                    value={agentCount}
                    onChange={(e) => {
                      triggerSound('tap');
                      setAgentCount(parseInt(e.target.value));
                    }}
                    className="w-full h-2 bg-[#F6F7F1] rounded-lg appearance-none cursor-pointer accent-[#00635C]"
                  />
                  <div className="flex justify-between text-[10px] text-[#01362D]/50">
                    <span>10 agents</span>
                    <span>74 (Nest Roster)</span>
                    <span>200 agents</span>
                  </div>
                </div>

                <div className="p-4 bg-[#F6F7F1] border border-[#01362D]/10 rounded-2xl space-y-2 text-xs">
                  <div className="flex justify-between text-[#01362D]/70">
                    <span>Base Retainer:</span>
                    <span>$2,500 / mo</span>
                  </div>
                  <div className="flex justify-between text-[#01362D]/70">
                    <span>Agent Tier ({agentCount} x $15):</span>
                    <span>${agentCount * pricePerAgent} / mo</span>
                  </div>
                  <div className="border-t border-[#01362D]/10 pt-2 flex justify-between items-center text-[#01362D]">
                    <span className="font-bold uppercase text-xs">Total Monthly Investment:</span>
                    <strong className="text-xl text-[#00635C] font-bold">${totalMonthlyPrice.toLocaleString()} / mo</strong>
                  </div>
                  <div className="pt-1 flex items-center justify-between text-xs text-[#01362D]/80">
                    <span>Estimated Hours Saved:</span>
                    <strong className="text-[#01362D] font-bold">{hoursSavedPerMonth.toLocaleString()} hrs / mo</strong>
                  </div>
                </div>
              </div>

            </div>

            <div className="flex justify-between items-center pt-4 border-t border-[#01362D]/10">
              <button
                onClick={() => {
                  triggerSound('tap');
                  setActiveStep('aha');
                }}
                className="px-4 py-2 bg-[#FFFDF8] hover:bg-white text-[#01362D] rounded-full text-xs font-medium border border-[#01362D]/15 flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Operating Loop</span>
              </button>
              <button
                onClick={() => {
                  triggerSound('tap');
                  setActiveStep('retention');
                }}
                className="px-7 py-3 bg-[#00635C] hover:bg-[#01362D] text-white font-semibold rounded-full text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <span>Proceed to Step 4: Owner ROI</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: OWNER ROI */}
        {activeStep === 'retention' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-8 bg-[#FFFDF8] border border-[#01362D]/15 rounded-3xl space-y-2 shadow-sm">
              <span className="text-xs font-semibold uppercase text-[#00635C] tracking-wider block">
                Sustained Operational Value
              </span>
              <h2 className="text-2xl font-bold text-[#01362D]">
                Executive Briefing: Monthly ROI Summary
              </h2>
              <p className="text-sm text-[#01362D]/70">
                How brokerage leadership verifies ROI every month without searching through raw software activity logs.
              </p>
            </div>

            <div className="p-8 bg-[#FFFDF8] border border-[#01362D]/15 rounded-3xl space-y-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#01362D]/10 pb-4">
                <div>
                  <h3 className="text-base font-bold text-[#01362D]">Nest Realty Monthly Executive Briefing</h3>
                  <p className="text-xs text-[#01362D]/60">Period: Current Month • Roster: 74 Active Agents</p>
                </div>
                <span className="px-3 py-1 bg-[#EAECE1] text-[#00635C] text-xs font-semibold rounded-full border border-[#00635C]/20 self-start sm:self-center">
                  98.4% Retention Rate
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-center">
                <div className="p-5 bg-[#F6F7F1] border border-[#01362D]/10 rounded-2xl space-y-1">
                  <span className="text-xs text-[#01362D]/60 uppercase font-semibold block">Cycle Time</span>
                  <strong className="text-2xl text-[#00635C] block font-bold">1.8 hrs</strong>
                  <span className="text-xs text-[#01362D]/70 block">Down from 48 hrs (96% faster)</span>
                </div>

                <div className="p-5 bg-[#F6F7F1] border border-[#01362D]/10 rounded-2xl space-y-1">
                  <span className="text-xs text-[#01362D]/60 uppercase font-semibold block">Same-Day Sign-Offs</span>
                  <strong className="text-2xl text-[#00635C] block font-bold">96.4%</strong>
                  <span className="text-xs text-[#01362D]/70 block">Zero audit flags</span>
                </div>

                <div className="p-5 bg-[#F6F7F1] border border-[#01362D]/10 rounded-2xl space-y-1">
                  <span className="text-xs text-[#01362D]/60 uppercase font-semibold block">Agent Adoption</span>
                  <strong className="text-2xl text-[#00635C] block font-bold">94.8%</strong>
                  <span className="text-xs text-[#01362D]/70 block">Active weekly line usage</span>
                </div>
              </div>

              <div className="p-5 bg-[#F6F7F1] rounded-2xl border border-[#01362D]/10 space-y-2 text-xs text-[#01362D]">
                <h4 className="font-bold text-[#01362D] uppercase text-xs">Executive Summary</h4>
                <ul className="space-y-2 list-disc pl-4 leading-relaxed text-[#01362D]/80">
                  <li><strong>Hours Saved:</strong> 1,350 total operational staff hours saved across Wilmington &amp; Mayfaire offices.</li>
                  <li><strong>On-Time Response:</strong> BICs Eric Knight &amp; Jessica Keenan resolved 100% of escalations on time.</li>
                  <li><strong>Agent Engagement:</strong> 94.8% of roster agents use the voice/SMS line weekly without password friction.</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-[#01362D]/10">
              <button
                onClick={() => {
                  triggerSound('tap');
                  setActiveStep('pricing');
                }}
                className="px-4 py-2 bg-[#FFFDF8] hover:bg-white text-[#01362D] rounded-full text-xs font-medium border border-[#01362D]/15 flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Commercial Model</span>
              </button>
              <button
                onClick={() => {
                  triggerSound('tap');
                  setActiveStep('architecture');
                }}
                className="px-7 py-3 bg-[#00635C] hover:bg-[#01362D] text-white font-semibold rounded-full text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <span>Proceed to Step 5: Platform</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: PLATFORM */}
        {activeStep === 'architecture' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-8 bg-[#FFFDF8] border border-[#01362D]/15 rounded-3xl space-y-2 shadow-sm">
              <span className="text-xs font-semibold uppercase text-[#00635C] tracking-wider block">
                System Architecture
              </span>
              <h2 className="text-2xl font-bold text-[#01362D]">
                Platform Architecture & Operational Pillars
              </h2>
              <p className="text-sm text-[#01362D]/70">
                The technical foundation ensuring fast response times, zero hallucination risk, and complete audit readiness.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              
              <div className="p-6 bg-[#FFFDF8] border border-[#01362D]/15 rounded-3xl space-y-2 shadow-xs">
                <div className="flex items-center gap-2 text-[#00635C]">
                  <Phone className="w-4 h-4" />
                  <h3 className="font-bold text-sm text-[#01362D]">1. Multi-Channel Gateway</h3>
                </div>
                <p className="text-xs text-[#01362D]/70 leading-relaxed">
                  Fast voice processing with multi-lingual detection and automatic SMS failover.
                </p>
              </div>

              <div className="p-6 bg-[#FFFDF8] border border-[#01362D]/15 rounded-3xl space-y-2 shadow-xs">
                <div className="flex items-center gap-2 text-[#00635C]">
                  <Shield className="w-4 h-4" />
                  <h3 className="font-bold text-sm text-[#01362D]">2. Strict SOP Grounding</h3>
                </div>
                <p className="text-xs text-[#01362D]/70 leading-relaxed">
                  Automated responses are strictly grounded in NCREC statutes & verified SOPs. Low confidence queries auto-route to the BIC.
                </p>
              </div>

              <div className="p-6 bg-[#FFFDF8] border border-[#01362D]/15 rounded-3xl space-y-2 shadow-xs">
                <div className="flex items-center gap-2 text-[#00635C]">
                  <Eye className="w-4 h-4" />
                  <h3 className="font-bold text-sm text-[#01362D]">3. Camera Vision Tracking</h3>
                </div>
                <p className="text-xs text-[#01362D]/70 leading-relaxed">
                  Storage room edge sensors run OCR on sign riders and lockboxes, auto-logging physical checkouts.
                </p>
              </div>

              <div className="p-6 bg-[#FFFDF8] border border-[#01362D]/15 rounded-3xl space-y-2 shadow-xs">
                <div className="flex items-center gap-2 text-[#00635C]">
                  <FileText className="w-4 h-4" />
                  <h3 className="font-bold text-sm text-[#01362D]">4. Auto CDA Dispatch</h3>
                </div>
                <p className="text-xs text-[#01362D]/70 leading-relaxed">
                  Generates signed CDA PDFs upon BIC approval and emails closing attorneys directly.
                </p>
              </div>

              <div className="p-6 bg-[#FFFDF8] border border-[#01362D]/15 rounded-3xl space-y-2 shadow-xs">
                <div className="flex items-center gap-2 text-[#00635C]">
                  <CheckCircle className="w-4 h-4" />
                  <h3 className="font-bold text-sm text-[#01362D]">5. Monthly NCREC Audit</h3>
                </div>
                <p className="text-xs text-[#01362D]/70 leading-relaxed">
                  Auto-generates signed Monthly Escrow Reconciliation Packages for brokerage leadership.
                </p>
              </div>

              <div className="p-6 bg-[#FFFDF8] border border-[#01362D]/15 rounded-3xl space-y-2 shadow-xs">
                <div className="flex items-center gap-2 text-[#00635C]">
                  <Smartphone className="w-4 h-4" />
                  <h3 className="font-bold text-sm text-[#01362D]">6. Zero-Dashboard Onboarding</h3>
                </div>
                <p className="text-xs text-[#01362D]/70 leading-relaxed">
                  Provisions accounts and provisions welcome SMS instructions automatically for new roster agents.
                </p>
              </div>

            </div>

            <div className="p-8 bg-[#FFFDF8] border border-[#00635C]/30 rounded-3xl text-center space-y-4 shadow-sm">
              <div>
                <h3 className="text-lg font-bold text-[#01362D]">Ready to Explore the Shapework Workspace?</h3>
                <p className="text-xs text-[#01362D]/70 mt-0.5">
                  Inspect active directory members, SOP procedures, and live operational workboards.
                </p>
              </div>

              <button
                onClick={() => {
                  triggerSound('tap');
                  onClose();
                }}
                className="px-8 py-3 bg-[#00635C] hover:bg-[#01362D] text-white font-semibold rounded-full text-xs transition-all cursor-pointer shadow-xs"
              >
                Close Tour & Open Workspace
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Presentation Footer */}
      <footer className="px-6 py-3 bg-[#FFFDF8] border-t border-[#01362D]/10 flex items-center justify-between text-xs text-[#01362D]/60 shrink-0">
        <span>Shapework Operating System • Product Demonstration</span>
        <span>Verified Roster: 74 Active Roster Members</span>
      </footer>

    </div>
  );
}
