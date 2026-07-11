/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  MapPin, 
  Calendar, 
  Clock, 
  FileText, 
  CheckCircle2, 
  Shield, 
  Brain, 
  Sparkles, 
  FolderOpen, 
  ArrowRight, 
  Layers, 
  Lock, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  AlertCircle, 
  HelpCircle, 
  Activity,
  Users,
  Compass,
  Play,
  Briefcase,
  TrendingUp,
  X
} from 'lucide-react';

type OperatingRecordTab = 'overview' | 'operation-map';

interface FrictionPoint {
  title: string;
  description: string;
  severity: 'friction' | 'breakdown';
}

interface WorkflowMap {
  id: string;
  label: string;
  title: string;
  theme: string;
  steps: string[];
  frictionPoints: FrictionPoint[];
  linkedOpportunities: string[];
}

interface Opportunity {
  id: string;
  title: string;
  description: string;
  estimatedAnnualSavings?: string;
  tags: string[];
}

interface OpportunityGroup {
  category: string;
  description: string;
  savings: string;
  opportunities: Opportunity[];
}

export default function OperatingRecordPage() {
  const [activeTab, setActiveTab] = useState<OperatingRecordTab>('overview');
  const [expandedWorkflows, setExpandedWorkflows] = useState<Record<string, boolean>>({
    'wf-1': false,
    'wf-2': false,
    'wf-3': false,
    'wf-4': false,
  });
  
  // Interactive Modal mockup state
  const [activeSprintOpp, setActiveSprintOpp] = useState<Opportunity | null>(null);
  const [isSprintCreated, setIsSprintCreated] = useState<boolean>(false);

  const toggleWorkflow = (id: string) => {
    setExpandedWorkflows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const triggerSprintModal = (opp: Opportunity) => {
    setActiveSprintOpp(opp);
    setIsSprintCreated(false);
  };

  const handleCreateSprint = () => {
    setIsSprintCreated(true);
    setTimeout(() => {
      setActiveSprintOpp(null);
      setIsSprintCreated(false);
      alert(`Shape sprint initiated for "${activeSprintOpp?.title}".`);
    }, 1200);
  };

  // Structured static data
  const metaChips = [
    { label: 'Client', value: 'Nest Realty', icon: BuildingIcon },
    { label: 'Location', value: 'Wilmington, NC', icon: MapPin },
    { label: 'Status', value: 'Map & Shape complete', icon: CheckCircle2 },
    { label: 'Updated', value: 'June 19, 2026', icon: Calendar },
    { label: 'Maintained By', value: 'shapework', icon: Brain }
  ];

  const businessZones = [
    {
      name: 'Owner freedom',
      description: 'Work routing off the owner’s plate.',
      opportunities: 3,
      savings: '$86,250',
      status: 'Ready to build'
    },
    {
      name: 'Transaction & compliance',
      description: 'Faster closings, faster pay.',
      opportunities: 4,
      savings: '$49,900',
      status: 'Ready to build'
    },
    {
      name: 'Team & people',
      description: 'Support desk, training, retention.',
      opportunities: 4,
      savings: '$25,875',
      status: 'Planning wins'
    },
    {
      name: 'Marketing & growth',
      description: 'Reviews, intake, listing launch.',
      opportunities: 5,
      savings: '$19,250',
      status: 'Planning wins'
    },
    {
      name: 'Finance & visibility',
      description: 'Dashboards, cash flow, leakage.',
      opportunities: 2,
      savings: '$22,500',
      status: 'Identified'
    },
    {
      name: 'Office & operations',
      description: 'Signs, vendors, readiness.',
      opportunities: 3,
      savings: '$16,025',
      status: 'Identified'
    }
  ];

  const workflows: WorkflowMap[] = [
    {
      id: 'wf-1',
      label: 'Map 01',
      title: 'Transaction Flow',
      theme: 'How a deal moves from contract to close — and where it stalls, surprises, or costs more than it should.',
      steps: ['Agent gets contract', 'New contract form', 'DotLoop file opened', 'Compliance chase', 'Coast to Close', 'Closing + payment'],
      frictionPoints: [
        {
          title: 'New contract form routinely skipped',
          description: 'Agents do not file when a deal comes in, making incoming pipeline invisible.',
          severity: 'friction'
        },
        {
          title: 'Compliance chase near closing',
          description: 'Documents get collected too late, forcing manual fire drills and delaying agent payouts.',
          severity: 'breakdown'
        },
        {
          title: '$9–10k/month TC spend',
          description: 'External transaction coordination expenses run high without structured compliance templates.',
          severity: 'friction'
        },
        {
          title: 'Commission surprises',
          description: 'Closings sometimes appear on the calendar with little to no pre-closing file visibility.',
          severity: 'breakdown'
        }
      ],
      linkedOpportunities: ['Compliance Chase Engine', 'Commission Surprise Prevention', 'TC Load Reduction', 'Transaction Pre-Check AI']
    },
    {
      id: 'wf-2',
      label: 'Map 02',
      title: 'Agent Request Loop',
      theme: 'How agent requests for marketing, support, and supplies move through the office — and why they keep landing on Ryan.',
      steps: ['Agent has a need', 'Texts / emails', 'No structured intake', 'Melissa or Ann?', 'Clarification loop', 'Group text to Ryan', 'Request completed'],
      frictionPoints: [
        {
          title: 'No request intake standard',
          description: 'Agents contact Melissa ad hoc through personal text, email, or in-person interrupts.',
          severity: 'friction'
        },
        {
          title: 'Ann’s role is undefined',
          description: 'Boundary relative to agent support and Melissa’s marketing tasks is unclear.',
          severity: 'friction'
        },
        {
          title: 'Agents group-text Ryan directly',
          description: 'Ryan gets pulled into minor, low-value requests he should not be handling.',
          severity: 'breakdown'
        },
        {
          title: 'Clarification rework loop',
          description: 'Requests lack necessary details upfront, causing multiple back-and-forth loops.',
          severity: 'friction'
        },
        {
          title: 'Melissa absorbs 25–30 hours/week',
          description: 'Intake triage and follow-up consume a massive percentage of core administrative time.',
          severity: 'breakdown'
        }
      ],
      linkedOpportunities: ['Agent Support Desk / SOP Bot', 'Agent Help Video Library', 'Marketing Request Intake', 'Lead Routing Mini-System']
    },
    {
      id: 'wf-3',
      label: 'Map 03',
      title: 'Ryan’s Day',
      theme: 'Where the owner’s time actually goes — and what should never need him in the first place.',
      steps: ['Agent counsels', 'Vision & financial', 'Interruption', 'Inventory check', 'Gospel audit', 'Sign orders', 'Day ends'],
      frictionPoints: [
        {
          title: '60–70 notifications/hour',
          description: 'Constant interruptions from agent group texts and direct pings prevent deep focus.',
          severity: 'breakdown'
        },
        {
          title: 'No escalation map',
          description: 'Small office and facility issues route directly to Ryan because operational ownership is unclear.',
          severity: 'friction'
        },
        {
          title: 'Sign/supply inventory on memory',
          description: 'Inventory run on memory leads to stock-outs and emergency orders.',
          severity: 'friction'
        },
        {
          title: '$5–9k/month signage line item',
          description: 'High overhead costs incurred without central allocation tracking.',
          severity: 'friction'
        }
      ],
      linkedOpportunities: ['Role & Escalation Map', 'Ryan Shield', 'Owner Weekly Brief', 'Sign / Lockbox / Office Readiness']
    },
    {
      id: 'wf-4',
      label: 'Map 04',
      title: 'New Business',
      theme: 'Everything that has to happen when a new agent joins or a new listing goes live, and what happens when it runs on memory instead of a system.',
      steps: ['Listing active', 'Photography', 'Marketing launch', 'Sign ordered', 'Agent signs', 'Onboarding packet', 'Welcome box'],
      frictionPoints: [
        {
          title: 'Everything runs on memory',
          description: 'New listing and onboarding lifecycles lack consistent checklists, leading to gaps.',
          severity: 'breakdown'
        },
        {
          title: 'No launch checklist coordination',
          description: 'Steps get missed when key coordinators are out or overloaded.',
          severity: 'friction'
        },
        {
          title: '$1,200–1,300 onboarding cost',
          description: 'Manual setup, physical folders, headshots, and welcoming packs cost high per agent.',
          severity: 'friction'
        },
        {
          title: 'Sign availability unpredictable',
          description: 'Signage checks are manual, leading to surprise shortages for listings.',
          severity: 'friction'
        },
        {
          title: 'Google reviews missed',
          description: 'Reviews are not requested consistently after transaction closings.',
          severity: 'friction'
        }
      ],
      linkedOpportunities: ['Listing Launch Checklist', 'Agent Onboarding Machine', 'Google Review Engine', 'Event Follow-Up Engine']
    }
  ];

  const opportunityGroups: OpportunityGroup[] = [
    {
      category: 'Owner freedom',
      description: 'Reclaim owner focus and eliminate low-value operational interruptions.',
      savings: '$86,250',
      opportunities: [
        {
          id: 'opp-1',
          title: 'Role & Escalation Map',
          description: 'Clarify who owns what, who backs them up, and when issues escalate.',
          tags: ['Quick win', 'Your time']
        },
        {
          id: 'opp-2',
          title: 'Ryan Shield',
          description: 'Intercept low-value asks before they reach Ryan using routing, SOP lookup, and escalation gates.',
          tags: ['AI / automation', 'Your time']
        },
        {
          id: 'opp-3',
          title: 'Owner Weekly Brief',
          description: 'Curated weekly digest for cash flow, closings, compliance, marketing, and office issues.',
          tags: ['Quick win', 'Your time']
        }
      ]
    },
    {
      category: 'Transaction & compliance',
      description: 'Streamline the pipeline to get agents paid faster and reduce manual verification.',
      savings: '$49,900',
      opportunities: [
        {
          id: 'opp-4',
          title: 'Compliance Chase Engine',
          description: 'Automated reminders and completeness alerts as closing approaches.',
          tags: ['AI / automation', 'Staff time']
        },
        {
          id: 'opp-5',
          title: 'Commission Surprise Prevention',
          description: 'Flag expected closings, missing docs, and pay readiness earlier.',
          tags: ['Quick win', 'Staff time']
        },
        {
          id: 'opp-6',
          title: 'TC Load Reduction',
          description: 'Reduce avoidable late and missing work before files reach external coordination.',
          tags: ['Policy & Process', 'Hard spend']
        },
        {
          id: 'opp-7',
          title: 'Transaction Pre-Check AI',
          description: 'AI-assisted pre-checks for missing signatures and documents.',
          tags: ['AI / automation', 'Staff time']
        }
      ]
    },
    {
      category: 'Team & people',
      description: 'Provide self-service support paths and structured agent lifecycles.',
      savings: '$25,875',
      opportunities: [
        {
          id: 'opp-8',
          title: 'Agent Support Desk / SOP Bot',
          description: 'AI-assisted support desk trained on SOPs and office standards.',
          tags: ['AI / automation', 'Staff time']
        },
        {
          id: 'opp-9',
          title: 'Agent Help Video Library',
          description: 'Short searchable how-to videos for repeated questions.',
          tags: ['Policy & Process', 'Staff time']
        },
        {
          id: 'opp-10',
          title: 'Agent Onboarding Machine',
          description: 'Standard onboarding workflow for headshots, bio, signage, marketing, and welcome tasks.',
          tags: ['Quick win', 'Policy & Process']
        },
        {
          id: 'opp-11',
          title: 'Agent Happiness Monitor',
          description: 'Light signal list for agents who may need proactive support.',
          tags: ['Policy & Process', 'Your time']
        }
      ]
    },
    {
      category: 'Marketing & growth',
      description: 'Standardize client reviews and transaction marketing pipelines.',
      savings: '$19,250',
      opportunities: [
        {
          id: 'opp-12',
          title: 'Google Review Engine',
          description: 'Automated review asks after closing.',
          tags: ['AI / automation', 'Quick win']
        },
        {
          id: 'opp-13',
          title: 'Marketing Request Intake',
          description: 'Structured request menu for marketing work to reduce clarification loops.',
          tags: ['Quick win', 'Policy & Process']
        },
        {
          id: 'opp-14',
          title: 'Listing Launch Checklist',
          description: 'Repeatable listing launch workflow tied to contract/listing trigger.',
          tags: ['Policy & Process', 'Staff time']
        },
        {
          id: 'opp-15',
          title: 'Event Follow-Up Engine',
          description: 'Automated post-event follow-up and content repurposing.',
          tags: ['AI / automation', 'Quick win']
        },
        {
          id: 'opp-16',
          title: 'Lead Routing Mini-System',
          description: 'Rules for routing occasional office leads.',
          tags: ['Policy & Process', 'Quick win']
        }
      ]
    },
    {
      category: 'Finance & visibility',
      description: 'Enable real-time performance oversight and expense control.',
      savings: '$22,500',
      opportunities: [
        {
          id: 'opp-17',
          title: 'Gospel Executive Dashboard',
          description: 'Simple executive view of the few numbers and exceptions that matter.',
          tags: ['Quick win', 'Your time']
        },
        {
          id: 'opp-18',
          title: 'Cost Leakage Alerts',
          description: 'Quarterly vendor and expense review workflow.',
          tags: ['Policy & Process', 'Hard spend']
        }
      ]
    },
    {
      category: 'Office & operations',
      description: 'Track physical inventory and route office maintenance rule sets.',
      savings: '$16,025',
      opportunities: [
        {
          id: 'opp-19',
          title: 'Sign / Lockbox / Office Readiness',
          description: 'Readiness tracker for signs, lockboxes, and office supplies.',
          tags: ['Quick win', 'Hard spend']
        },
        {
          id: 'opp-20',
          title: 'Vendor Knowledge Base',
          description: 'Searchable vendor directory with owner, use case, and cost notes.',
          tags: ['Policy & Process', 'Hard spend']
        },
        {
          id: 'opp-21',
          title: 'Office Maintenance Routing',
          description: 'Routing rules for supplies, maintenance, vendors, and small office issues.',
          tags: ['Quick win', 'Policy & Process']
        }
      ]
    }
  ];

  return (
    <div className="space-y-6 text-left font-sans text-xs text-[#F6F7F1] pb-10 animate-fade-in">
      
      {/* Page Header */}
      <div className="border-b border-[rgba(246,247,241,0.12)] pb-4 mb-6">
        <span className="font-bold text-[9px] uppercase text-[#D0D6BB] block tracking-widest font-mono select-none">// OPERATING RECORD</span>
        <h1 className="font-serif font-black text-xl text-white tracking-tight mt-1">
          Operating Record
        </h1>
        <p className="text-xs text-[#D0D6BB] mt-1 font-medium leading-relaxed font-sans">
          Workflow Discovery for Nest Realty Wilmington
        </p>

        {/* Metadata chips */}
        <div className="flex flex-wrap gap-2.5 mt-3 select-none">
          {metaChips.map((chip, idx) => {
            const Icon = chip.icon;
            return (
              <span 
                key={idx} 
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-medium"
                style={{
                  background: 'rgba(246, 247, 241, 0.05)',
                  border: '1px solid rgba(246, 247, 241, 0.10)'
                }}
              >
                <Icon className="w-3.5 h-3.5 text-[#D0D6BB]" />
                <span className="text-[#D0D6BB] font-semibold">{chip.label}:</span>
                <span className="text-white font-bold">{chip.value}</span>
              </span>
            );
          })}
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex gap-2 p-1 bg-[rgba(246,247,241,0.03)] border border-[rgba(246,247,241,0.08)] rounded-xl w-fit select-none">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-[#00635C] text-white shadow-md'
              : 'text-[#D0D6BB] hover:text-white hover:bg-[rgba(246,247,241,0.05)]'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('operation-map')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'operation-map'
              ? 'bg-[#00635C] text-white shadow-md'
              : 'text-[#D0D6BB] hover:text-white hover:bg-[rgba(246,247,241,0.05)]'
          }`}
        >
          Operation Map
        </button>
      </div>

      {/* Content Container */}
      <div className="space-y-6">
        
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Executive Summary & Timeline Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              
              {/* Executive Summary */}
              <div 
                className="lg:col-span-2 rounded-2xl p-6 shadow-lg border text-left flex flex-col justify-between"
                style={{
                  background: 'rgba(246, 247, 241, 0.08)',
                  border: '1px solid rgba(246, 247, 241, 0.15)',
                  backdropFilter: 'blur(18px)'
                }}
              >
                <div className="space-y-3">
                  <span className="font-bold text-[9px] uppercase tracking-wider text-[#D0D6BB] font-mono block flex items-center gap-1.5 select-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-450" /> EXECUTIVE SUMMARY
                  </span>
                  <h2 className="font-serif font-black text-base text-white tracking-tight leading-snug">
                    Places where work quietly costs time, money, or sanity. Named, and ranked.
                  </h2>
                  <p className="text-xs text-[#D0D6BB] font-medium leading-relaxed font-sans select-text">
                    Over one week, shapework mapped how work actually moves through the business. The record identifies recurring friction, owner interruptions, undocumented workflows, and quick-win opportunities that can be shaped into operational systems.
                  </p>
                </div>
                
                {/* Activity log */}
                <div 
                  className="mt-6 p-3 rounded-xl border flex gap-3 items-center select-none"
                  style={{
                    background: 'rgba(0, 99, 92, 0.08)',
                    border: '1px solid rgba(0, 99, 92, 0.2)'
                  }}
                >
                  <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="text-[10px] text-[#D0D6BB] font-sans font-medium">
                    <span className="text-white font-bold">June 12, 2026:</span> Workflow Discovery completed. 26 opportunities identified across six operational zones.
                  </div>
                </div>
              </div>

              {/* Process Timeline */}
              <div 
                className="rounded-2xl p-6 shadow-lg border text-left flex flex-col justify-between"
                style={{
                  background: 'rgba(246, 247, 241, 0.08)',
                  border: '1px solid rgba(246, 247, 241, 0.15)',
                  backdropFilter: 'blur(18px)'
                }}
              >
                <div className="space-y-3">
                  <span className="font-bold text-[9px] uppercase tracking-wider text-[#D0D6BB] font-mono block select-none">
                    METHOD TIMELINE
                  </span>
                  
                  {/* Vertical steps */}
                  <div className="space-y-4 pt-1 select-none">
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-500/50 flex items-center justify-center text-[10px] text-emerald-400 font-bold">
                          ✓
                        </div>
                        <div className="w-0.5 h-6 bg-emerald-500/40 my-0.5" />
                      </div>
                      <div>
                        <span className="font-bold text-white block">1. Map</span>
                        <span className="text-[10px] text-[#D0D6BB] leading-tight block mt-0.5 font-medium font-sans">Understand how work actually moves through the business.</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-5 h-5 rounded-full bg-[#00635C] border border-emerald-450 flex items-center justify-center text-[10px] text-white font-bold animate-pulse">
                          2
                        </div>
                        <div className="w-0.5 h-6 bg-[rgba(246,247,241,0.12)] my-0.5" />
                      </div>
                      <div>
                        <span className="font-bold text-emerald-350 block flex items-center gap-1.5">
                          2. Shape <span className="px-1.5 py-0.2 bg-emerald-950 text-emerald-300 text-[8px] rounded uppercase font-mono font-bold tracking-wider">Active</span>
                        </span>
                        <span className="text-[10px] text-[#D0D6BB] leading-tight block mt-0.5 font-medium font-sans">Select a quick win. Design the fix together.</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-5 h-5 rounded-full bg-[rgba(246,247,241,0.06)] border border-[rgba(246,247,241,0.15)] flex items-center justify-center text-[10px] text-[#D0D6BB] font-bold">
                          3
                        </div>
                        <div className="w-0.5 h-6 bg-[rgba(246,247,241,0.12)] my-0.5" />
                      </div>
                      <div>
                        <span className="font-bold text-white/50 block">3. Build</span>
                        <span className="text-[10px] text-[#D0D6BB]/50 leading-tight block mt-0.5 font-medium font-sans">shapework implements the selected improvement.</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-5 h-5 rounded-full bg-[rgba(246,247,241,0.06)] border border-[rgba(246,247,241,0.15)] flex items-center justify-center text-[10px] text-[#D0D6BB] font-bold">
                          4
                        </div>
                      </div>
                      <div>
                        <span className="font-bold text-white/50 block">4. Run</span>
                        <span className="text-[10px] text-[#D0D6BB]/50 leading-tight block mt-0.5 font-medium font-sans">The work holds. Refine, then find the next opportunity.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Zones Glance Grid */}
            <div className="space-y-4">
              <span className="font-bold text-[9px] uppercase tracking-widest text-[#D0D6BB] font-mono block select-none">
                OPERATION AT A GLANCE (SIX BUSINESS ZONES)
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {businessZones.map((zone, idx) => (
                  <div 
                    key={idx}
                    className="rounded-xl p-4 shadow-md border text-left flex flex-col justify-between space-y-4"
                    style={{
                      background: 'rgba(246, 247, 241, 0.06)',
                      border: '1px solid rgba(246, 247, 241, 0.12)'
                    }}
                  >
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <h3 className="font-serif font-black text-xs text-white capitalize">{zone.name}</h3>
                        <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 text-[8px] font-bold rounded uppercase tracking-wider font-sans">
                          {zone.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#D0D6BB] leading-relaxed font-sans font-medium">
                        {zone.description}
                      </p>
                    </div>

                    <div className="border-t border-[rgba(246,247,241,0.08)] pt-2.5 flex items-center justify-between text-[10px] font-mono font-bold select-none text-[#D0D6BB]">
                      <span>{zone.opportunities} OPPORTUNITIES</span>
                      <span className="text-white">EST. SAVINGS: {zone.savings}/YR</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Step / Alert Card & Disclaimer */}
            <div className="flex flex-col gap-4">
              <div 
                className="rounded-2xl p-5 border text-left flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,99,92,0.2) 0%, rgba(0,99,92,0.05) 100%)',
                  border: '1px solid rgba(0, 99, 92, 0.3)'
                }}
              >
                <div className="space-y-1.5 flex-1">
                  <h3 className="font-serif font-black text-sm text-white">Select your first quick win.</h3>
                  <p className="text-xs text-[#D0D6BB] font-sans font-medium">
                    Eight quick wins are ready to start immediately. Choose the first opportunity to shape, then move into Build & Run.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('operation-map')}
                  className="px-4 py-2 bg-[#00635C] hover:bg-[#007c73] text-white font-bold rounded-lg border border-[rgba(246,247,241,0.18)] transition-all flex items-center gap-1.5 shadow-md cursor-pointer select-none font-sans"
                >
                  <span>View Operation Map</span>
                  <ArrowRight className="w-3.5 h-3.5 text-white" />
                </button>
              </div>

              {/* Disclaimer */}
              <div className="text-[10px] text-[#D0D6BB]/50 italic leading-normal select-text">
                Savings figures are conservative estimates from discovery and planning, not guarantees.
              </div>
            </div>

          </div>
        )}

        {activeTab === 'operation-map' && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Intro Header */}
            <div 
              className="rounded-2xl p-5 border text-left"
              style={{
                background: 'rgba(246, 247, 241, 0.08)',
                border: '1px solid rgba(246, 247, 241, 0.15)',
                backdropFilter: 'blur(18px)'
              }}
            >
              <h2 className="font-serif font-black text-base text-white">The operation, mapped.</h2>
              <p className="text-xs text-[#D0D6BB] font-medium leading-relaxed font-sans mt-1.5 select-text">
                Four workflows traced from how they actually run today. Friction points are named, located, and linked to opportunities. Click any card below to expand details.
              </p>
            </div>

            {/* Workflow maps list */}
            <div className="space-y-4">
              {workflows.map((wf) => {
                const isExpanded = !!expandedWorkflows[wf.id];
                return (
                  <div 
                    key={wf.id}
                    className="rounded-2xl border overflow-hidden shadow-lg transition-all"
                    style={{
                      background: 'rgba(246, 247, 241, 0.06)',
                      border: '1px solid rgba(246, 247, 241, 0.12)'
                    }}
                  >
                    {/* Collapsed Header */}
                    <div 
                      onClick={() => toggleWorkflow(wf.id)}
                      className="p-5 flex justify-between items-center gap-4 cursor-pointer hover:bg-[rgba(246,247,241,0.03)] select-none"
                    >
                      <div className="space-y-1 text-left flex-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 text-[9px] font-bold font-mono rounded uppercase tracking-wider">
                            {wf.label}
                          </span>
                          <span className="text-[10px] text-[#D0D6BB] font-mono uppercase font-bold">
                            {wf.frictionPoints.length} friction points detected
                          </span>
                        </div>
                        <h3 className="font-serif font-black text-sm text-white">{wf.title}</h3>
                        <p className="text-xs text-[#D0D6BB] font-medium leading-relaxed font-sans line-clamp-1">
                          {wf.theme}
                        </p>
                      </div>
                      
                      <div className="w-8 h-8 rounded-lg bg-[rgba(246,247,241,0.04)] border border-[rgba(246,247,241,0.1)] flex items-center justify-center text-white shrink-0">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="p-5 border-t border-[rgba(246,247,241,0.08)] space-y-6 text-left animate-slide-down">
                        
                        {/* Interactive flow map visualizer */}
                        <div className="space-y-2">
                          <span className="font-bold text-[9px] uppercase tracking-wider text-[#D0D6BB] font-mono block select-none">
                            WORKFLOW FLOW MAP
                          </span>
                          
                          <div className="flex flex-wrap items-center gap-2 py-3 select-none">
                            {wf.steps.map((step, idx) => (
                              <React.Fragment key={idx}>
                                <div className="px-3 py-2 bg-[rgba(246,247,241,0.04)] border border-[rgba(246,247,241,0.08)] rounded-xl font-mono text-[10px] font-bold text-white text-center shadow-inner">
                                  {step}
                                </div>
                                {idx < wf.steps.length - 1 && (
                                  <ArrowRight className="w-3.5 h-3.5 text-emerald-450 shrink-0" />
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>

                        {/* Friction points list */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {wf.frictionPoints.map((fp, idx) => (
                            <div 
                              key={idx}
                              className="p-4 rounded-xl border flex gap-3 text-left bg-[rgba(0,0,0,0.15)]"
                              style={{
                                border: fp.severity === 'breakdown' ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(246, 247, 241, 0.1)'
                              }}
                            >
                              <div className="shrink-0 mt-0.5">
                                {fp.severity === 'breakdown' ? (
                                  <AlertCircle className="w-4 h-4 text-rose-500" />
                                ) : (
                                  <HelpCircle className="w-4 h-4 text-amber-500" />
                                )}
                              </div>
                              <div className="space-y-1 select-text">
                                <span className="font-bold text-white block">{fp.title}</span>
                                <p className="text-[11px] text-[#D0D6BB] leading-relaxed font-sans font-medium">
                                  {fp.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Linked opportunities in workflow */}
                        <div className="space-y-2 border-t border-[rgba(246,247,241,0.08)] pt-4">
                          <span className="font-bold text-[9px] uppercase tracking-wider text-[#D0D6BB] font-mono block select-none">
                            LINKED SYSTEM OPPORTUNITIES
                          </span>
                          <div className="flex flex-wrap gap-2 pt-1 select-none">
                            {wf.linkedOpportunities.map((oppName, idx) => (
                              <span 
                                key={idx} 
                                className="px-2.5 py-1 bg-[rgba(0,99,92,0.15)] hover:bg-[rgba(0,99,92,0.25)] border border-[rgba(0,99,92,0.3)] text-emerald-300 text-[10px] font-bold rounded-lg cursor-pointer transition-colors"
                                onClick={() => {
                                  const el = document.getElementById('opp-portfolio-header');
                                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                                }}
                              >
                                {oppName}
                              </span>
                            ))}
                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Full Opportunity Portfolio */}
            <div id="opp-portfolio-header" className="space-y-6 pt-4">
              <div className="border-b border-[rgba(246,247,241,0.12)] pb-3 text-left">
                <span className="font-bold text-[9px] uppercase text-[#D0D6BB] block tracking-widest font-mono select-none">// SYSTEM DESIGN</span>
                <h2 className="font-serif font-black text-base text-white tracking-tight mt-0.5">
                  Full Opportunity Portfolio
                </h2>
                <p className="text-xs text-[#D0D6BB] font-medium leading-relaxed font-sans mt-0.5 select-text">
                  21 strategic systems mapped and ranked across the six operational zones.
                </p>
              </div>

              {/* Opportunity groups */}
              <div className="space-y-8">
                {opportunityGroups.map((group, idx) => (
                  <div key={idx} className="space-y-3">
                    
                    {/* Group Header */}
                    <div className="flex justify-between items-end border-b border-[rgba(246,247,241,0.08)] pb-1.5 select-none text-left">
                      <div className="space-y-0.5">
                        <span className="font-bold text-[10px] uppercase text-emerald-450 tracking-wider font-mono">
                          {group.category}
                        </span>
                        <p className="text-[11px] text-[#D0D6BB] font-sans font-medium">
                          {group.description}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold font-mono text-white tracking-wide uppercase shrink-0">
                        EST. SAVINGS: {group.savings}/YR
                      </span>
                    </div>

                    {/* Cards grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {group.opportunities.map((opp) => (
                        <div 
                          key={opp.id}
                          className="rounded-xl p-4.5 shadow-md border text-left flex flex-col justify-between space-y-4"
                          style={{
                            background: 'rgba(246, 247, 241, 0.05)',
                            border: '1px solid rgba(246, 247, 241, 0.10)'
                          }}
                        >
                          <div className="space-y-2">
                            <h4 className="font-bold text-white text-xs">{opp.title}</h4>
                            <p className="text-[11px] text-[#D0D6BB] leading-relaxed font-sans font-medium select-text">
                              {opp.description}
                            </p>
                          </div>

                          <div className="space-y-3 border-t border-[rgba(246,247,241,0.06)] pt-3 select-none">
                            {/* Tags */}
                            <div className="flex flex-wrap gap-1">
                              {opp.tags.map((tag, tagIdx) => (
                                <span 
                                  key={tagIdx}
                                  className={`px-1.5 py-0.5 text-[8px] font-bold font-mono uppercase rounded border ${
                                    tag.includes('win') ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40' :
                                    tag.includes('AI') ? 'bg-purple-950/40 text-purple-300 border-purple-800/40' :
                                    tag.includes('time') ? 'bg-blue-950/40 text-blue-300 border-blue-800/40' :
                                    'bg-stone-850/40 text-[#D0D6BB] border-stone-800/40'
                                  }`}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>

                            {/* Button */}
                            <button
                              onClick={() => triggerSprintModal(opp)}
                              className="w-full py-2 bg-[#00635C]/35 hover:bg-[#00635C]/75 text-white font-bold rounded-lg border border-[rgba(246,247,241,0.12)] hover:border-[rgba(246,247,241,0.25)] transition-all cursor-pointer text-center text-[10px] font-sans"
                            >
                              Shape this opportunity
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Shape Sprint Mockup Modal */}
      {activeSprintOpp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 select-none">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setActiveSprintOpp(null)}
          />
          {/* Modal Card */}
          <div 
            className="relative max-w-md w-full rounded-2xl p-6 shadow-2xl z-[101] border border-[rgba(246,247,241,0.2)] text-left animate-zoom-in"
            style={{
              background: '#01362D',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
          >
            {/* Header */}
            <div className="flex justify-between items-center border-b border-[rgba(246,247,241,0.12)] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-emerald-450" />
                <h3 className="font-serif font-black text-sm text-white">Create Shape Sprint</h3>
              </div>
              <button 
                onClick={() => setActiveSprintOpp(null)}
                className="p-1 rounded-lg hover:bg-[rgba(246,247,241,0.08)] text-[#D0D6BB] hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="space-y-4 text-xs text-[#F6F7F1]">
              <p className="leading-relaxed font-sans font-medium text-[#D0D6BB]">
                This will start a Shape sprint for <strong className="text-white font-bold">"{activeSprintOpp.title}"</strong>.
              </p>
              <p className="leading-relaxed font-sans font-medium text-[#D0D6BB]">
                Our autonomous product architect will spin up a sandbox environment, map the exact system schema, and draft recommended integration logic gates for user review.
              </p>

              {isSprintCreated ? (
                <div 
                  className="p-3.5 rounded-xl border flex gap-3 items-center select-none bg-emerald-950/40 border-emerald-800/40 text-emerald-300"
                >
                  <Clock className="w-4 h-4 text-emerald-400 shrink-0 animate-spin" />
                  <span className="font-bold text-[10px] font-sans">Provisioning Shape sprint environment...</span>
                </div>
              ) : null}
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 border-t border-[rgba(246,247,241,0.12)] pt-4 mt-5">
              <button
                disabled={isSprintCreated}
                onClick={() => setActiveSprintOpp(null)}
                className="px-4 py-2 border border-[rgba(246,247,241,0.18)] hover:bg-[rgba(246,247,241,0.05)] text-[#D0D6BB] hover:text-white font-bold rounded-lg transition-all cursor-pointer font-sans"
              >
                Cancel
              </button>
              <button
                disabled={isSprintCreated}
                onClick={handleCreateSprint}
                className="px-5 py-2 bg-[#00635C] hover:bg-[#007c73] text-white font-bold rounded-lg border border-[rgba(246,247,241,0.18)] transition-all shadow-md cursor-pointer font-sans"
              >
                Create Shape Sprint
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

// Simple custom component icon placeholder
function BuildingIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
      <line x1="9" y1="22" x2="9" y2="16" />
      <line x1="15" y1="22" x2="15" y2="16" />
      <line x1="9" y1="16" x2="15" y2="16" />
      <path d="M9 6h.01" />
      <path d="M15 6h.01" />
      <path d="M9 11h.01" />
      <path d="M15 11h.01" />
    </svg>
  );
}
