import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ListChecks,
  Plus,
  Sparkles,
  Upload,
} from 'lucide-react';
import {
  LISTING_LAUNCH_INTERVIEW_EXAMPLE,
  SOP_INTERVIEW_TOOLS,
  SOP_INTERVIEW_TYPES,
  buildSopFormFromInterview,
  listingLaunchExampleStepLines,
  listingLaunchExampleSystemsUsed,
  type SopInterviewAnswers,
  type SopInterviewTypeId,
} from '../../lib/sopInterview';

type InterviewPhase =
  | 'example'
  | 'type'
  | 'basics'
  | 'tools'
  | 'steps'
  | 'evidence'
  | 'review';

const PHASES: InterviewPhase[] = ['example', 'type', 'basics', 'tools', 'steps', 'evidence', 'review'];

const OWNER_OPTIONS = [
  { id: 'transaction_coordinator', label: 'Transaction Coordinator' },
  { id: 'marketing_coordinator', label: 'Marketing Coordinator' },
  { id: 'operations_lead', label: 'Operations Lead' },
  { id: 'admin_coordinator', label: 'Admin Coordinator' },
  { id: 'listing_agent', label: 'Listing Agent' },
  { id: 'broker_in_charge', label: 'Broker-in-Charge' },
  { id: 'owner', label: 'Owner / Managing Broker' },
];

const DEFAULT_OWNER_BY_TYPE: Record<SopInterviewTypeId, string> = {
  Marketing: 'marketing_coordinator',
  Operations: 'operations_lead',
  Transaction: 'transaction_coordinator',
  Compliance: 'broker_in_charge',
  Other: 'operations_lead',
};

const PHASE_COPY: Record<
  InterviewPhase,
  { eyebrow: string; title: string; subtitle: string }
> = {
  example: {
    eyebrow: 'Interview',
    title: 'How should we start?',
    subtitle: 'Borrow Nest’s Listing Launch pattern, or build a different process from scratch.',
  },
  type: {
    eyebrow: 'Interview',
    title: 'What kind of process is this?',
    subtitle: 'Pick the Nest team that owns this checklist.',
  },
  basics: {
    eyebrow: 'Interview',
    title: 'Name it — and say when it starts',
    subtitle: 'A clear title and trigger make this usable for Melissa, Ann, and Nora.',
  },
  tools: {
    eyebrow: 'Interview',
    title: 'What tools does this run on?',
    subtitle: 'Dotloop, Maxa, MLS, Supra… Nora and the checklist use these later. Skip if it is pure people-work.',
  },
  steps: {
    eyebrow: 'Interview',
    title: 'What are the checklist steps?',
    subtitle: 'One step per line, in order. You can assign roles and evidence in the builder after.',
  },
  evidence: {
    eyebrow: 'Interview',
    title: 'How do you know it is done?',
    subtitle: 'What should someone be able to point at when the run is finished?',
  },
  review: {
    eyebrow: 'Draft ready',
    title: 'Looks good — what’s next?',
    subtitle: 'Save a draft, open the builder to polish and test a run, or submit for approval.',
  },
};

const STEP_EXAMPLES_BY_TYPE: Record<SopInterviewTypeId, string[]> = {
  Marketing: [
    'Confirm listing photos are approved',
    'Draft Just Listed flyer in Maxa',
    'Send eblast for Melissa review',
    'Schedule social posts',
  ],
  Operations: [
    'Confirm install vs pickup with agent',
    'Dispatch yard post work order',
    'Verify address on site',
    'Upload photo proof',
  ],
  Transaction: [
    'Validate executed agreement in Dotloop',
    'Collect disclosures',
    'Submit MLS draft to BIC',
    'Confirm MLS Active',
  ],
  Compliance: [
    'Review MLS draft for compliance',
    'Flag WWREA / disclosure gaps',
    'Approve or return to TC',
    'Log approval in Dotloop',
  ],
  Other: ['Step one', 'Step two', 'Step three'],
};

export interface SOPInterviewWizardProps {
  workspaceId: string;
  onBack: () => void;
  onOpenUpload: () => void;
  onOpenBlank: () => void;
  onComplete: (sopForm: Record<string, unknown>, next: 'draft' | 'wizard' | 'review') => void;
}

export default function SOPInterviewWizard({
  workspaceId,
  onBack,
  onOpenUpload,
  onOpenBlank,
  onComplete,
}: SOPInterviewWizardProps) {
  const [phase, setPhase] = useState<InterviewPhase>('example');
  const [usedExample, setUsedExample] = useState(false);
  const [department, setDepartment] = useState<SopInterviewTypeId>('Marketing');
  const [title, setTitle] = useState('');
  const [purpose, setPurpose] = useState('');
  const [trigger, setTrigger] = useState('');
  const [ownerRole, setOwnerRole] = useState(DEFAULT_OWNER_BY_TYPE.Marketing);
  const [ownerTouched, setOwnerTouched] = useState(false);
  const [stepText, setStepText] = useState('');
  const [completionEvidence, setCompletionEvidence] = useState('');
  const [systemsUsed, setSystemsUsed] = useState<string[]>([]);
  const [customTool, setCustomTool] = useState('');
  const [toolsTouched, setToolsTouched] = useState(false);

  const phaseIndex = PHASES.indexOf(phase);
  const progressPct = Math.round(((phaseIndex + 1) / PHASES.length) * 100);
  const copy = PHASE_COPY[phase];

  const stepLines = useMemo(
    () =>
      stepText
        .split('\n')
        .map((l) => l.replace(/^\s*[-*\d.]+\s*/, '').trim())
        .filter(Boolean),
    [stepText]
  );

  useEffect(() => {
    if (!ownerTouched) {
      setOwnerRole(DEFAULT_OWNER_BY_TYPE[department]);
    }
  }, [department, ownerTouched]);

  const answers: SopInterviewAnswers = {
    department,
    title,
    purpose,
    trigger,
    ownerRole,
    systemsUsed: [
      ...systemsUsed,
      ...customTool
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    ],
    stepLines,
    completionEvidence,
    usedListingLaunchExample: usedExample,
  };

  const canNext = (): boolean => {
    if (phase === 'example') return true;
    if (phase === 'type') return Boolean(department);
    if (phase === 'basics') return title.trim().length > 2 && purpose.trim().length > 8;
    if (phase === 'tools') return true;
    if (phase === 'steps') return stepLines.length >= 2 || usedExample;
    if (phase === 'evidence') return completionEvidence.trim().length > 4;
    return true;
  };

  const goNext = () => {
    const i = PHASES.indexOf(phase);
    if (i < PHASES.length - 1) setPhase(PHASES[i + 1]);
  };

  const goBack = () => {
    const i = PHASES.indexOf(phase);
    if (i <= 0) onBack();
    else setPhase(PHASES[i - 1]);
  };

  const seedFromListingLaunch = () => {
    setUsedExample(true);
    setOwnerTouched(true);
    setDepartment(LISTING_LAUNCH_INTERVIEW_EXAMPLE.department);
    setTitle(LISTING_LAUNCH_INTERVIEW_EXAMPLE.title);
    setPurpose(LISTING_LAUNCH_INTERVIEW_EXAMPLE.purpose);
    setTrigger(LISTING_LAUNCH_INTERVIEW_EXAMPLE.trigger);
    setOwnerRole(LISTING_LAUNCH_INTERVIEW_EXAMPLE.ownerRole);
    setStepText(listingLaunchExampleStepLines().join('\n'));
    setCompletionEvidence(LISTING_LAUNCH_INTERVIEW_EXAMPLE.completionEvidence);
    setSystemsUsed(listingLaunchExampleSystemsUsed());
    setCustomTool('');
    setToolsTouched(true);
    setPhase('review');
  };

  const startFresh = () => {
    setUsedExample(false);
    setPhase('type');
  };

  const insertExampleSteps = () => {
    setUsedExample(false);
    setStepText(STEP_EXAMPLES_BY_TYPE[department].join('\n'));
  };

  const finish = (next: 'draft' | 'wizard' | 'review') => {
    const form = buildSopFormFromInterview(answers, workspaceId);
    if (next === 'review') {
      form.status = 'in_review';
      form.changeSummary = `${String(form.changeSummary || '')} · submitted for approval`;
    }
    onComplete(form, next);
  };

  const ownerLabel =
    OWNER_OPTIONS.find((o) => o.id === ownerRole)?.label || ownerRole;

  return (
    <div
      className="flex-grow p-4 sm:p-8 bg-[#F7F8F5] text-left select-none relative overflow-y-auto font-sans min-h-[calc(100vh-8rem)]"
      data-testid="sop-interview-wizard"
    >
      <div className="max-w-2xl mx-auto">
        <div className="bg-white border border-stone-200/90 rounded-3xl shadow-sm overflow-hidden">
          <div className="px-5 sm:px-7 pt-5 pb-4 border-b border-stone-100 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={goBack}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-stone-50 rounded-xl text-xs font-semibold text-stone-600 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{phaseIndex === 0 ? 'Knowledge Library' : 'Back'}</span>
              </button>
              <span className="text-[11px] font-semibold text-stone-400 tabular-nums">
                {phaseIndex + 1} / {PHASES.length}
              </span>
            </div>
            <div className="h-1 rounded-full bg-stone-100 overflow-hidden">
              <div
                className="h-full bg-[#00635C] transition-all duration-300 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#00635C]" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#00635C]">
                  {copy.eyebrow}
                </span>
              </div>
              <h1 className="font-serif font-bold text-xl sm:text-2xl text-stone-900 tracking-tight">
                {copy.title}
              </h1>
              <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">{copy.subtitle}</p>
            </div>
          </div>

          <div className="px-5 sm:px-7 py-6 space-y-5">
            {phase === 'example' && (
              <div className="space-y-4">
                <div className="p-5 rounded-2xl border border-[#00635C]/20 bg-[#F7F8F5] space-y-3">
                  <div className="flex items-center gap-2">
                    <ListChecks className="w-4 h-4 text-[#00635C]" />
                    <h2 className="font-semibold text-sm text-stone-900">
                      Nest example · Listing Launch
                    </h2>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Signed agreement → photos, yard sign, BIC MLS approval, Maxa Just Listed. Twelve
                    real checklist steps with owners already filled in.
                  </p>
                  <ol className="text-xs text-stone-700 space-y-1.5 list-decimal pl-4">
                    {listingLaunchExampleStepLines()
                      .slice(0, 4)
                      .map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                  </ol>
                  <p className="text-[11px] text-stone-500">
                    + {Math.max(0, listingLaunchExampleStepLines().length - 4)} more steps in the
                    full draft
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={seedFromListingLaunch}
                    className="p-4 rounded-2xl bg-[#00635C] hover:bg-[#00514B] text-white text-left cursor-pointer shadow-xs transition-colors"
                    data-testid="sop-interview-use-listing-example"
                  >
                    <div className="font-semibold text-sm">Use Listing Launch</div>
                    <div className="text-[11px] text-emerald-100/90 mt-1 leading-snug">
                      Jump to a ready draft with the 12-step Nest checklist
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={startFresh}
                    className="p-4 rounded-2xl bg-white border border-stone-200 hover:border-[#00635C] text-left cursor-pointer transition-colors"
                    data-testid="sop-interview-start-fresh"
                  >
                    <div className="font-semibold text-sm text-stone-900">Start a different process</div>
                    <div className="text-[11px] text-stone-500 mt-1 leading-snug">
                      Answer a few short questions for marketing, ops, or transactions
                    </div>
                  </button>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1 text-[11px] text-stone-500">
                  <button
                    type="button"
                    onClick={onOpenBlank}
                    className="hover:text-stone-800 underline-offset-2 hover:underline cursor-pointer"
                  >
                    Advanced · blank form
                  </button>
                  <button
                    type="button"
                    onClick={onOpenUpload}
                    className="inline-flex items-center gap-1 hover:text-stone-800 underline-offset-2 hover:underline cursor-pointer"
                  >
                    <Upload className="w-3 h-3" />
                    Import PDF / Word
                  </button>
                </div>
              </div>
            )}

            {phase === 'type' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SOP_INTERVIEW_TYPES.map((t) => {
                  const selected = department === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setDepartment(t.id);
                        setOwnerTouched(false);
                      }}
                      className={`p-4 rounded-2xl border-2 text-left cursor-pointer transition-all ${
                        selected
                          ? 'border-[#00635C] bg-[#E5EFEA]/60 shadow-2xs'
                          : 'border-stone-200 hover:border-[#00635C]/35 bg-white'
                      }`}
                      data-testid={`sop-interview-type-${t.id}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-semibold text-sm text-stone-900">{t.label}</div>
                        {selected && (
                          <span className="w-5 h-5 rounded-full bg-[#00635C] text-white flex items-center justify-center">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-stone-500 mt-1.5 leading-snug">{t.hint}</div>
                    </button>
                  );
                })}
              </div>
            )}

            {phase === 'basics' && (
              <div className="space-y-4">
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-stone-700">Title</span>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={
                      department === 'Marketing'
                        ? 'e.g. Just Listed flyer + eblast'
                        : 'e.g. Yard sign install vs pickup'
                    }
                    className="w-full px-3.5 py-2.5 bg-[#F7F8F5] border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C]"
                    data-testid="sop-interview-title"
                    autoFocus
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-stone-700">Purpose</span>
                  <textarea
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="What does a good run of this process accomplish for the agent or client?"
                    rows={3}
                    className="w-full px-3.5 py-2.5 bg-[#F7F8F5] border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C]"
                    data-testid="sop-interview-purpose"
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-stone-700">Trigger</span>
                  <textarea
                    value={trigger}
                    onChange={(e) => setTrigger(e.target.value)}
                    placeholder="What event starts this checklist? (call, task, email, Dotloop status…)"
                    rows={2}
                    className="w-full px-3.5 py-2.5 bg-[#F7F8F5] border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C]"
                    data-testid="sop-interview-trigger"
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-stone-700">Process owner</span>
                  <select
                    value={ownerRole}
                    onChange={(e) => {
                      setOwnerTouched(true);
                      setOwnerRole(e.target.value);
                    }}
                    className="w-full px-3.5 py-2.5 bg-[#F7F8F5] border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C]"
                    data-testid="sop-interview-owner"
                  >
                    {OWNER_OPTIONS.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <span className="text-[11px] text-stone-400">
                    Defaulted from {department}. Change if someone else owns the run.
                  </span>
                </label>
              </div>
            )}


            {phase === 'tools' && (
              <div className="space-y-4" data-testid="sop-interview-tools">
                <div className="flex flex-wrap gap-2">
                  {SOP_INTERVIEW_TOOLS.map((tool) => {
                    const suggested = (tool.types as readonly string[]).includes(department);
                    const selected = systemsUsed.includes(tool.id);
                    return (
                      <button
                        key={tool.id}
                        type="button"
                        onClick={() => {
                          setToolsTouched(true);
                          setSystemsUsed((prev) =>
                            prev.includes(tool.id)
                              ? prev.filter((x) => x !== tool.id)
                              : [...prev, tool.id]
                          );
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          selected
                            ? 'bg-[#00635C] border-[#00635C] text-white'
                            : suggested
                              ? 'bg-[#E5EFEA]/70 border-[#00635C]/35 text-stone-800 hover:border-[#00635C]'
                              : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
                        }`}
                        data-testid={`sop-interview-tool-${tool.id.replace(/\s+/g, '-').toLowerCase()}`}
                      >
                        {tool.label}
                        {suggested && !selected ? (
                          <span className="ml-1 text-[10px] font-medium opacity-70">for {department}</span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-stone-700">Other tool (optional)</span>
                  <input
                    value={customTool}
                    onChange={(e) => {
                      setToolsTouched(true);
                      setCustomTool(e.target.value);
                    }}
                    placeholder="e.g. Canva, SkySlope, vendor portal — comma-separated"
                    className="w-full px-3.5 py-2.5 bg-[#F7F8F5] border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C]"
                    data-testid="sop-interview-tool-custom"
                  />
                </label>
                <p className="text-[11px] text-stone-500">
                  {systemsUsed.length === 0 && !customTool.trim()
                    ? 'Optional — continue if this is people-only. You can still add tools in the builder.'
                    : `${systemsUsed.length + (customTool.trim() ? customTool.split(',').filter(Boolean).length : 0)} tool(s) selected`}
                </p>
              </div>
            )}

            {phase === 'steps' && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px] text-stone-500">
                    Tip: paste from a notes doc, or start from a Nest-shaped sample.
                  </p>
                  <button
                    type="button"
                    onClick={insertExampleSteps}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-200 text-[11px] font-semibold text-stone-700 hover:border-[#00635C] hover:text-[#00635C] cursor-pointer"
                    data-testid="sop-interview-insert-sample-steps"
                  >
                    <Plus className="w-3 h-3" />
                    Insert {department} sample
                  </button>
                </div>
                <textarea
                  value={stepText}
                  onChange={(e) => {
                    setUsedExample(false);
                    setStepText(e.target.value);
                  }}
                  rows={11}
                  placeholder={`Confirm request details\nDo the work\nSend proof to the requester\nMark complete`}
                  className="w-full px-3.5 py-3 bg-[#F7F8F5] border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C]"
                  data-testid="sop-interview-steps"
                  autoFocus
                />
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={`text-[11px] font-medium ${
                      stepLines.length >= 2 ? 'text-[#00635C]' : 'text-stone-400'
                    }`}
                  >
                    {stepLines.length === 0
                      ? 'Add at least 2 steps to continue'
                      : `${stepLines.length} step${stepLines.length === 1 ? '' : 's'}`}
                  </p>
                  {stepLines.length > 0 && (
                    <ol className="hidden sm:flex flex-wrap gap-1.5 max-w-[70%] justify-end">
                      {stepLines.slice(0, 3).map((line, i) => (
                        <li
                          key={`${i}-${line}`}
                          className="px-2 py-0.5 rounded-md bg-stone-100 text-[10px] text-stone-600 max-w-[9rem] truncate"
                        >
                          {i + 1}. {line}
                        </li>
                      ))}
                      {stepLines.length > 3 && (
                        <li className="px-2 py-0.5 rounded-md bg-stone-100 text-[10px] text-stone-500">
                          +{stepLines.length - 3}
                        </li>
                      )}
                    </ol>
                  )}
                </div>
              </div>
            )}

            {phase === 'evidence' && (
              <div className="space-y-3">
                <textarea
                  value={completionEvidence}
                  onChange={(e) => setCompletionEvidence(e.target.value)}
                  rows={4}
                  placeholder={
                    department === 'Marketing'
                      ? 'e.g. Flyer approved + eblast sent + Maxa folder link in the task'
                      : 'e.g. Photo of installed sign, or pickup confirmation from the agent'
                  }
                  className="w-full px-3.5 py-3 bg-[#F7F8F5] border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C]"
                  data-testid="sop-interview-evidence"
                  autoFocus
                />
                <p className="text-[11px] text-stone-500">
                  This becomes the completion evidence on the published SOP — keep it concrete.
                </p>
              </div>
            )}

            {phase === 'review' && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-stone-200 bg-[#F7F8F5] overflow-hidden">
                  <div className="px-4 py-3 border-b border-stone-200/80 flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-[#00635C]">
                        {department}
                      </div>
                      <h2 className="font-serif font-bold text-base text-stone-900 mt-0.5">
                        {title || 'Untitled SOP'}
                      </h2>
                    </div>
                    <span className="shrink-0 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-semibold">
                      Draft
                    </span>
                  </div>
                  <div className="px-4 py-3 space-y-3 text-xs text-stone-700">
                    <div>
                      <span className="font-semibold text-stone-500">Owner · </span>
                      {ownerLabel}
                    </div>
                    <div>
                      <span className="font-semibold text-stone-500">Tools · </span>
                      {answers.systemsUsed.length
                        ? answers.systemsUsed.join(', ')
                        : 'None listed'}
                    </div>
                    <div>
                      <span className="font-semibold text-stone-500">Trigger · </span>
                      {trigger || '—'}
                    </div>
                    <div>
                      <span className="font-semibold text-stone-500">Done when · </span>
                      {completionEvidence || '—'}
                    </div>
                    <div>
                      <div className="font-semibold text-stone-500 mb-1.5">
                        Checklist · {stepLines.length} steps
                      </div>
                      <ol className="space-y-1 list-decimal pl-4 text-stone-700">
                        {stepLines.slice(0, 5).map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ol>
                      {stepLines.length > 5 && (
                        <p className="text-[11px] text-stone-500 mt-1.5 pl-1">
                          + {stepLines.length - 5} more in the builder
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  <button
                    type="button"
                    onClick={() => finish('wizard')}
                    className="w-full px-4 py-3.5 rounded-xl bg-[#00635C] hover:bg-[#00514B] text-sm font-semibold text-white cursor-pointer shadow-xs"
                    data-testid="sop-interview-open-builder"
                  >
                    Open builder to polish &amp; test
                  </button>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => finish('draft')}
                      className="px-4 py-3 rounded-xl bg-white border border-stone-200 hover:border-stone-300 text-xs font-semibold text-stone-800 cursor-pointer"
                      data-testid="sop-interview-save-draft"
                    >
                      Save draft
                    </button>
                    <button
                      type="button"
                      onClick={() => finish('review')}
                      className="px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 hover:border-amber-300 text-xs font-semibold text-amber-950 cursor-pointer inline-flex items-center justify-center gap-1.5"
                      data-testid="sop-interview-submit-review"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Submit for approval
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {phase !== 'example' && phase !== 'review' && (
            <div className="px-5 sm:px-7 py-4 border-t border-stone-100 flex justify-end bg-white">
              <button
                type="button"
                disabled={!canNext()}
                onClick={goNext}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#00635C] hover:bg-[#00514B] disabled:opacity-35 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl cursor-pointer shadow-xs"
                data-testid="sop-interview-next"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
