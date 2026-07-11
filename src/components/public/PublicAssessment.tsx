import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  User,
  ShieldCheck,
  TrendingUp,
  Cpu,
  HelpCircle,
  Sparkles
} from 'lucide-react';

interface PublicAssessmentProps {
  onNavigate: (path: string) => void;
}

export default function PublicAssessment({ onNavigate }: PublicAssessmentProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [completedResponseId, setCompletedResponseId] = useState<string | null>(null);
  const [calculatedScores, setCalculatedScores] = useState<any>(null);

  // Initial empty form state
  const [formData, setFormData] = useState<any>({
    // Section 1
    brokerageName: '',
    respondentName: '',
    emailAddress: '',
    role: '',
    numberOfAgents: '',
    numberOfOfficeStaff: 0,
    numberOfLocations: 0,
    primaryMarket: '',

    // Section 2
    pulledIntoIssues: 3,
    workFallsThroughCracks: 3,
    infoInSilos: 3,
    processesChange: 3,
    waitingOnApprovals: 3,
    repeatedQuestions: 3,
    struggleFindInfo: 3,
    sideConversations: 3,
    bottleneckPerson: 3,
    noOperatingRecord: 3,

    // Section 3
    ownershipClarity: 3,
    recurringIssueOwner: '',
    escalationFrequency: '',
    interruptionsParagraph: '',
    singlePersonDependence: '',
    unavailabilityBreak: '',

    // Section 4
    frictionAreas: [] as string[],
    greatestCostArea: '',
    greatestFrustrationArea: '',
    payToSolveFirstArea: '',
    frictionFrequency: '',
    currentWorkaround: '',

    // Section 5
    systemsUsed: [] as string[],
    frustratingSystem: '',
    underutilizedSystem: '',
    duplicateDataFlows: '',
    spreadsheetDependencies: '',
    systemsConfidence: 3,

    // Section 6
    leadershipHoursLost: '',
    leadershipInterrupts: '',
    leadershipApprovals: '',
    leadershipHandsOff: '',

    // Section 7
    aiImplemented: '',
    aiTimeSavingWorkflow: '',
    aiDreamWorkflow: '',
    aiConcerns: [] as string[],
    aiAdoptionReady: 3,

    // Section 8
    scaleBreakPoints: '',
    growthLimitWorkflow: '',
    growthCostMoney: '',
    agentFrustrations: '',
    leadershipFrustrations: '',
    locationScaleEase: 3,

    // Section 9
    oneSolveThisYear: '',
    pilotInterest: '',
    reportConsent: '',
    followUpConsent: ''
  });

  // Load progress from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('shapework_assessment_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormData((prev: any) => ({ ...prev, ...parsed }));
        const savedStep = localStorage.getItem('shapework_assessment_step');
        if (savedStep) {
          setCurrentStep(Number(savedStep));
        }
      }
    } catch (e) {
      console.warn('Failed to load local storage draft', e);
    }
  }, []);

  // Save progress to localStorage when state updates
  const saveProgress = (updatedData: any, step: number) => {
    try {
      localStorage.setItem('shapework_assessment_draft', JSON.stringify(updatedData));
      localStorage.setItem('shapework_assessment_step', String(step));
    } catch (e) {
      console.warn('Failed to write local storage draft', e);
    }
  };

  const handleInputChange = (field: string, val: any) => {
    const updated = { ...formData, [field]: val };
    setFormData(updated);
    saveProgress(updated, currentStep);
  };

  const handleCheckboxChange = (field: string, option: string, maxLimit?: number) => {
    let list = [...(formData[field] || [])];
    if (list.includes(option)) {
      list = list.filter(item => item !== option);
    } else {
      if (maxLimit && list.length >= maxLimit) {
        return; // Enforce selection limit
      }
      list.push(option);
    }
    handleInputChange(field, list);
  };

  const validateStep = (step: number): string | null => {
    if (step === 1) {
      if (!formData.brokerageName?.trim()) return 'Brokerage Name is required.';
      if (!formData.respondentName?.trim()) return 'Respondent Name is required.';
      if (!formData.emailAddress?.trim() || !formData.emailAddress.includes('@')) return 'A valid Email Address is required.';
      if (!formData.role) return 'Your operational role is required.';
      if (!formData.numberOfAgents) return 'Number of agents range is required.';
    }
    if (step === 4) {
      if ((formData.frictionAreas || []).length === 0) return 'Please select at least one friction area.';
      if ((formData.frictionAreas || []).length > 5) return 'You can select a maximum of 5 friction areas.';
    }
    if (step === 9) {
      if (!formData.pilotInterest) return 'Please indicate your pilot interest.';
      if (!formData.reportConsent) return 'Please indicate if you wish to receive the intelligence report.';
    }
    return null;
  };

  const handleNext = () => {
    const error = validateStep(currentStep);
    if (error) {
      alert(error);
      return;
    }
    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);
    saveProgress(formData, nextStep);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      saveProgress(formData, prevStep);
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateStep(currentStep);
    if (error) {
      alert(error);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/public/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Submission failed. Please try again.');
      }

      setCompletedResponseId(data.id);
      setCalculatedScores(data.scores);
      
      // Clear local storage draft upon successful completion
      localStorage.removeItem('shapework_assessment_draft');
      localStorage.removeItem('shapework_assessment_step');
    } catch (err: any) {
      setSubmitError(err.message || 'Network error occurred. Please verify connections.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sections Definitions
  const totalSteps = 9;
  const progressPercent = Math.round((currentStep / totalSteps) * 100);

  // Options Definitions
  const roleOptions = ['Owner', 'Brokerage Principal', 'Broker-in-Charge', 'Operations Director', 'Accounting', 'Marketing', 'Transaction Coordinator', 'Agent', 'Other'];
  const agentRangeOptions = ['1–25', '26–50', '51–100', '101–250', '251–500', '500+'];
  const ownerClarityOptions = ['Yes', 'Mostly', 'Sometimes', 'Rarely', 'No'];
  const frequencyOptions = ['Never', 'Rarely', 'Monthly', 'Weekly', 'Daily'];
  const leadershipLostOptions = ['0–5', '6–10', '11–20', '21–30', '30+'];
  const aiImplementedOptions = ['Yes, broadly', 'Yes, in a few areas', 'Testing', 'Planning', 'No'];
  const yesMaybeNo = ['Yes', 'Maybe', 'No'];
  const yesNo = ['Yes', 'No'];

  const frictionAreasOptions = [
    'Commission Processing', 'Listing Management', 'Transaction Coordination',
    'Marketing Requests', 'Agent Onboarding', 'Compliance', 'Lockboxes',
    'Property Signs', 'Vendor Management', 'Recruiting', 'Lead Routing',
    'Escalations', 'Accounting', 'Reporting', 'Technology Adoption',
    'Training', 'Internal Communication', 'Document Management',
    'Office Support', 'Agent Support', 'Other'
  ];

  const systemsOptions = [
    'Dotloop', 'SkySlope', 'Lone Wolf', 'BrokerMint', 'Follow Up Boss',
    'MoxiWorks', 'Google Workspace', 'Microsoft 365', 'Slack',
    'Monday.com', 'Asana', 'Trello', 'Zapier', 'OpenAI', 'Claude',
    'Gemini', 'QuickBooks', 'Other'
  ];

  const aiConcernsOptions = [
    'Data privacy', 'Accuracy', 'Compliance', 'Cost',
    'Employee adoption', 'Integration complexity',
    'Lack of internal expertise', 'Client trust', 'Other'
  ];

  const renderScaleField = (field: string, labelLeft: string, labelRight: string) => {
    const val = formData[field] || 3;
    return (
      <div className="space-y-3">
        <div className="flex justify-between items-center text-[10px] font-mono text-stone-500 uppercase tracking-wider">
          <span>{labelLeft}</span>
          <span className="text-stone-850 font-bold">Selected: {val} / 5</span>
          <span>{labelRight}</span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map(num => (
            <button
              type="button"
              key={num}
              onClick={() => handleInputChange(field, num)}
              className={`py-3 border rounded-xl text-xs font-bold transition-all ${
                val === num
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm scale-[1.03]'
                  : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
              }`}
            >
              {num}
            </button>
          ))}
        </div>
      </div>
    );
  };

  if (completedResponseId) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] py-12 px-6 flex items-center justify-center font-sans">
        <div className="max-w-2xl w-full bg-white border border-stone-200 rounded-3xl p-8 md:p-10 shadow-xl space-y-8 text-left">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl font-bold font-serif text-stone-900 leading-tight">Assessment Completed!</h1>
            <p className="text-xs text-stone-600 leading-relaxed">
              Thank you for submitting the Brokerage Operational Intelligence Assessment. Your responses have been securely logged and analyzed.
            </p>
          </div>

          {calculatedScores && (
            <div className="p-6 bg-stone-50 border border-stone-200 rounded-2xl space-y-5">
              <div className="flex justify-between items-center border-b border-stone-200 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500 font-mono">Overall Intelligence Score</span>
                <span className="text-2xl font-extrabold text-emerald-700 font-mono">{calculatedScores.overallScore}/100</span>
              </div>

              <div className="space-y-2.5">
                <label className="text-[10px] font-bold uppercase tracking-widest font-mono text-stone-400 block">Top Focus Recommendations</label>
                <ul className="space-y-2">
                  {calculatedScores.topOpportunities?.map((opp: string, i: number) => (
                    <li key={i} className="text-xs text-stone-700 flex items-start gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{opp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="text-xs text-stone-500 leading-relaxed border-t border-stone-150 pt-4">
            If you opted-in to receive the complimentary **Operational Intelligence Report**, our team will compile the structured gap analysis and dispatch it to <strong className="text-stone-700">{formData.emailAddress}</strong> shortly.
          </div>

          <div>
            <button
              onClick={() => onNavigate('/')}
              className="px-5 py-2.5 bg-stone-900 hover:bg-stone-850 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Return to Website
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0] py-12 px-6 flex flex-col justify-between font-sans text-left">
      <div className="max-w-3xl w-full mx-auto bg-white border border-stone-200 rounded-3xl p-6 md:p-10 shadow-xl space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-stone-150 pb-4 gap-4">
          <div className="space-y-1">
            <h1 className="text-lg font-bold font-serif text-stone-900">Brokerage Operational Intelligence Assessment</h1>
            <p className="text-[11px] text-stone-500">
              Identify workflow bottlenecks, operational leaks, and AI integration readiness. (Completion: 8-10 min)
            </p>
          </div>
          <div className="flex flex-col items-end shrink-0 select-none">
            <span className="text-xs font-mono font-bold text-emerald-700">Section {currentStep} of {totalSteps}</span>
            <span className="text-[10px] text-stone-400 font-mono mt-0.5">{progressPercent}% complete</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
          <div 
            className="bg-emerald-600 h-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {submitError && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 text-xs flex items-start gap-2 leading-relaxed">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{submitError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* SECTION 1 - PROFILE */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div className="border-b border-stone-100 pb-2 mb-4">
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-emerald-650" />
                  <span>Section 1: Brokerage Profile</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">Brokerage Name *</label>
                  <input
                    type="text"
                    value={formData.brokerageName}
                    onChange={(e) => handleInputChange('brokerageName', e.target.value)}
                    placeholder="e.g. Nest Realty"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">Respondent Name *</label>
                  <input
                    type="text"
                    value={formData.respondentName}
                    onChange={(e) => handleInputChange('respondentName', e.target.value)}
                    placeholder="Your name"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">Email Address *</label>
                  <input
                    type="email"
                    value={formData.emailAddress}
                    onChange={(e) => handleInputChange('emailAddress', e.target.value)}
                    placeholder="you@nestrealty.com"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-emerald-600 font-semibold"
                  >
                    <option value="">Select Role...</option>
                    {roleOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">Number of Agents *</label>
                  <select
                    value={formData.numberOfAgents}
                    onChange={(e) => handleInputChange('numberOfAgents', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-emerald-600 font-semibold"
                  >
                    <option value="">Select Size...</option>
                    {agentRangeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">Number of Office Staff</label>
                  <input
                    type="number"
                    value={formData.numberOfOfficeStaff || ''}
                    onChange={(e) => handleInputChange('numberOfOfficeStaff', Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">Number of Locations</label>
                  <input
                    type="number"
                    value={formData.numberOfLocations || ''}
                    onChange={(e) => handleInputChange('numberOfLocations', Number(e.target.value))}
                    placeholder="1"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">Primary Market or Region</label>
                  <input
                    type="text"
                    value={formData.primaryMarket}
                    onChange={(e) => handleInputChange('primaryMarket', e.target.value)}
                    placeholder="e.g. Wilmington, NC"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2 - OPERATIONAL HEALTH */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="border-b border-stone-100 pb-2">
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-emerald-650" />
                  <span>Section 2: Operational Health Diagnosis</span>
                </h3>
                <p className="text-[10px] text-stone-500 mt-1">Rate the frequency of each scenario inside your brokerage (1 = Never, 5 = Daily)</p>
              </div>

              <div className="space-y-6 divide-y divide-stone-100">
                <div className="pt-2">
                  <label className="text-xs font-bold text-stone-800 block mb-2">1. Leadership gets pulled into local operational/agent issues that should be owned elsewhere.</label>
                  {renderScaleField('pulledIntoIssues', 'Never', 'Daily')}
                </div>
                <div className="pt-4">
                  <label className="text-xs font-bold text-stone-800 block mb-2">2. Important work falls through the cracks because ownership between teams is unclear.</label>
                  {renderScaleField('workFallsThroughCracks', 'Never', 'Daily')}
                </div>
                <div className="pt-4">
                  <label className="text-xs font-bold text-stone-800 block mb-2">3. Important information lives in scattered text messages, emails, or personal memory.</label>
                  {renderScaleField('infoInSilos', 'Never', 'Daily')}
                </div>
                <div className="pt-4">
                  <label className="text-xs font-bold text-stone-800 block mb-2">4. Standard processes change depending on which staff member or admin is working.</label>
                  {renderScaleField('processesChange', 'Never', 'Daily')}
                </div>
                <div className="pt-4">
                  <label className="text-xs font-bold text-stone-800 block mb-2">5. Staff or agents wait on approvals before continuing simple deal/marketing tasks.</label>
                  {renderScaleField('waitingOnApprovals', 'Never', 'Daily')}
                </div>
                <div className="pt-4">
                  <label className="text-xs font-bold text-stone-800 block mb-2">6. Agents repeatedly ask staff/leadership the same operational or resource questions.</label>
                  {renderScaleField('repeatedQuestions', 'Never', 'Daily')}
                </div>
                <div className="pt-4">
                  <label className="text-xs font-bold text-stone-800 block mb-2">7. Agents struggle to know where to find tools, signups, or procedural details.</label>
                  {renderScaleField('struggleFindInfo', 'Never', 'Daily')}
                </div>
                <div className="pt-4">
                  <label className="text-xs font-bold text-stone-800 block mb-2">8. Critical issues are handled through side conversations instead of a logged workflow.</label>
                  {renderScaleField('sideConversations', 'Never', 'Daily')}
                </div>
                <div className="pt-4">
                  <label className="text-xs font-bold text-stone-800 block mb-2">9. One specific person becomes the bottleneck for multiple departments or locations.</label>
                  {renderScaleField('bottleneckPerson', 'Never', 'Daily')}
                </div>
                <div className="pt-4">
                  <label className="text-xs font-bold text-stone-800 block mb-2">10. Operations/compliance tasks are completed without generating a reliable audit record.</label>
                  {renderScaleField('noOperatingRecord', 'Never', 'Daily')}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3 - OPERATIONAL OWNERSHIP */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div className="border-b border-stone-100 pb-2">
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <User className="w-4 h-4 text-emerald-650" />
                  <span>Section 3: Operational Ownership & Escalation</span>
                </h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-800 block">How clear is operational ownership across your departments? (1 = Unclear/Siloed, 5 = Highly Structured)</label>
                  {renderScaleField('ownershipClarity', 'Confused', 'Fully Defined')}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">Does every recurring issue or task have a clearly defined staff owner?</label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {ownerClarityOptions.map(opt => (
                      <button
                        type="button"
                        key={opt}
                        onClick={() => handleInputChange('recurringIssueOwner', opt)}
                        className={`py-2 border rounded-xl text-xs font-semibold ${
                          formData.recurringIssueOwner === opt
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                            : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">How often do local issues escalate to senior leadership unnecessarily?</label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {frequencyOptions.map(opt => (
                      <button
                        type="button"
                        key={opt}
                        onClick={() => handleInputChange('escalationFrequency', opt)}
                        className={`py-2 border rounded-xl text-xs font-semibold ${
                          formData.escalationFrequency === opt
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                            : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">What specific types of issues interrupt leadership most often?</label>
                  <textarea
                    value={formData.interruptionsParagraph}
                    onChange={(e) => handleInputChange('interruptionsParagraph', e.target.value)}
                    placeholder="e.g. Agent commission payout disputes, missing escrow files..."
                    rows={3}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">What critical decisions or processes depend heavily on one specific person?</label>
                  <textarea
                    value={formData.singlePersonDependence}
                    onChange={(e) => handleInputChange('singlePersonDependence', e.target.value)}
                    placeholder="e.g. Only the Operations Director can authorize sign installations..."
                    rows={3}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">If that person were unavailable for two weeks, what would break first?</label>
                  <textarea
                    value={formData.unavailabilityBreak}
                    onChange={(e) => handleInputChange('unavailabilityBreak', e.target.value)}
                    placeholder="Describe bottlenecks or blocked tasks..."
                    rows={3}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4 - FRICTION POINTS */}
          {currentStep === 4 && (
            <div className="space-y-5">
              <div className="border-b border-stone-100 pb-2">
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-emerald-650" />
                  <span>Section 4: Key Operational Pain Points</span>
                </h3>
                <p className="text-[10px] text-stone-500 mt-1">Select up to five operational areas creating the most friction in your brokerage.</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                  {frictionAreasOptions.map(opt => {
                    const selected = (formData.frictionAreas || []).includes(opt);
                    return (
                      <button
                        type="button"
                        key={opt}
                        onClick={() => handleCheckboxChange('frictionAreas', opt, 5)}
                        className={`px-3 py-2.5 border rounded-xl text-[11px] font-semibold text-left transition-all ${
                          selected
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold shadow-sm'
                            : 'bg-stone-50 border-stone-200 text-stone-750 hover:bg-stone-100'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">Which one creates the greatest cost?</label>
                    <select
                      value={formData.greatestCostArea}
                      onChange={(e) => handleInputChange('greatestCostArea', e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white"
                    >
                      <option value="">Select Area...</option>
                      {(formData.frictionAreas || []).map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">Which one creates the greatest frustration?</label>
                    <select
                      value={formData.greatestFrustrationArea}
                      onChange={(e) => handleInputChange('greatestFrustrationArea', e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white"
                    >
                      <option value="">Select Area...</option>
                      {(formData.frictionAreas || []).map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">Which one would you pay to solve first?</label>
                    <select
                      value={formData.payToSolveFirstArea}
                      onChange={(e) => handleInputChange('payToSolveFirstArea', e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white"
                    >
                      <option value="">Select Area...</option>
                      {(formData.frictionAreas || []).map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">How frequently does that primary issue occur?</label>
                  <select
                    value={formData.frictionFrequency}
                    onChange={(e) => handleInputChange('frictionFrequency', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white"
                  >
                    <option value="">Select Frequency...</option>
                    {frequencyOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">What is the current manual workaround?</label>
                  <textarea
                    value={formData.currentWorkaround}
                    onChange={(e) => handleInputChange('currentWorkaround', e.target.value)}
                    placeholder="Describe staff/Excel workarounds..."
                    rows={3}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5 - TECH & SYSTEMS */}
          {currentStep === 5 && (
            <div className="space-y-5">
              <div className="border-b border-stone-100 pb-2">
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-650" />
                  <span>Section 5: Technology & Systems</span>
                </h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">Which systems/tools do you currently use?</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {systemsOptions.map(opt => {
                      const selected = (formData.systemsUsed || []).includes(opt);
                      return (
                        <button
                          type="button"
                          key={opt}
                          onClick={() => handleCheckboxChange('systemsUsed', opt)}
                          className={`px-3 py-2 border rounded-xl text-[11px] font-semibold text-left transition-all ${
                            selected
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold shadow-sm'
                              : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">Which system creates the most frustration?</label>
                    <input
                      type="text"
                      value={formData.frustratingSystem}
                      onChange={(e) => handleInputChange('frustratingSystem', e.target.value)}
                      placeholder="e.g. Dotloop, SkySlope"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">Which system is most underutilized?</label>
                    <input
                      type="text"
                      value={formData.underutilizedSystem}
                      onChange={(e) => handleInputChange('underutilizedSystem', e.target.value)}
                      placeholder="e.g. Asana, Slack"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">Where do employees duplicate data between systems manually?</label>
                  <textarea
                    value={formData.duplicateDataFlows}
                    onChange={(e) => handleInputChange('duplicateDataFlows', e.target.value)}
                    placeholder="e.g. Copying listings from Dotloop into our accounting spreadsheet..."
                    rows={3}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">Which operational processes still depend primarily on spreadsheets?</label>
                  <textarea
                    value={formData.spreadsheetDependencies}
                    onChange={(e) => handleInputChange('spreadsheetDependencies', e.target.value)}
                    placeholder="e.g. Agent onboarding milestones, commission payouts tracker..."
                    rows={3}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white"
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-xs font-bold text-stone-800 block">How confident are you that your systems accurately reflect what is happening operationally?</label>
                  {renderScaleField('systemsConfidence', 'Not Confident', 'Fully Confident')}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 6 - LEADERSHIP LOAD */}
          {currentStep === 6 && (
            <div className="space-y-5">
              <div className="border-b border-stone-100 pb-2">
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-650" />
                  <span>Section 6: Leadership Load</span>
                </h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">How many hours per week does leadership spend on issues that should be owned elsewhere?</label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {leadershipLostOptions.map(opt => (
                      <button
                        type="button"
                        key={opt}
                        onClick={() => handleInputChange('leadershipHoursLost', opt)}
                        className={`py-2 border rounded-xl text-xs font-semibold ${
                          formData.leadershipHoursLost === opt
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                            : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        {opt} hours
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">What interrupts leadership the most?</label>
                  <textarea
                    value={formData.leadershipInterrupts}
                    onChange={(e) => handleInputChange('leadershipInterrupts', e.target.value)}
                    placeholder="List the common fire drills..."
                    rows={3}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">What decisions repeatedly require leadership approval?</label>
                  <textarea
                    value={formData.leadershipApprovals}
                    onChange={(e) => handleInputChange('leadershipApprovals', e.target.value)}
                    placeholder="List standard workflows waiting on approvals..."
                    rows={3}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">What should leadership no longer have to touch?</label>
                  <textarea
                    value={formData.leadershipHandsOff}
                    onChange={(e) => handleInputChange('leadershipHandsOff', e.target.value)}
                    placeholder="List processes you want automated or delegated..."
                    rows={3}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 7 - AI & AUTOMATION READINESS */}
          {currentStep === 7 && (
            <div className="space-y-5">
              <div className="border-b border-stone-100 pb-2">
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-emerald-650" />
                  <span>Section 7: AI & Automation Readiness</span>
                </h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">Have you implemented AI or automation in your brokerage operations?</label>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                    {aiImplementedOptions.map(opt => (
                      <button
                        type="button"
                        key={opt}
                        onClick={() => handleInputChange('aiImplemented', opt)}
                        className={`py-2 border rounded-xl text-xs font-semibold ${
                          formData.aiImplemented === opt
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                            : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">Where could automation or AI save your staff the most time today?</label>
                  <textarea
                    value={formData.aiTimeSavingWorkflow}
                    onChange={(e) => handleInputChange('aiTimeSavingWorkflow', e.target.value)}
                    placeholder="Identify high-friction copy-paste work..."
                    rows={3}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">If one workflow disappeared because AI handled it perfectly, what would it be?</label>
                  <textarea
                    value={formData.aiDreamWorkflow}
                    onChange={(e) => handleInputChange('aiDreamWorkflow', e.target.value)}
                    placeholder="Imagine a flawless operational automation..."
                    rows={3}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">What concerns or roadblocks do you have about AI?</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {aiConcernsOptions.map(opt => {
                      const selected = (formData.aiConcerns || []).includes(opt);
                      return (
                        <button
                          type="button"
                          key={opt}
                          onClick={() => handleCheckboxChange('aiConcerns', opt)}
                          className={`px-3 py-2 border rounded-xl text-[11px] font-semibold text-left transition-all ${
                            selected
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold shadow-sm'
                              : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-xs font-bold text-stone-800 block">How ready is your brokerage to adopt additional AI-enabled workflows?</label>
                  {renderScaleField('aiAdoptionReady', 'Not Ready', 'Ready to Deploy')}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 8 - GROWTH & SCALABILITY */}
          {currentStep === 8 && (
            <div className="space-y-5">
              <div className="border-b border-stone-100 pb-2">
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-emerald-650" />
                  <span>Section 8: Growth & Scalability</span>
                </h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">If your brokerage doubled in size tomorrow, what would break first?</label>
                  <textarea
                    value={formData.scaleBreakPoints}
                    onChange={(e) => handleInputChange('scaleBreakPoints', e.target.value)}
                    placeholder="Identify the most fragile operational workflow..."
                    rows={3}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">Which workflow currently limits your brokerage's growth the most?</label>
                  <textarea
                    value={formData.growthLimitWorkflow}
                    onChange={(e) => handleInputChange('growthLimitWorkflow', e.target.value)}
                    placeholder="e.g. New location launching, agent onboarding queue..."
                    rows={3}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">What operational problem currently costs your brokerage the most money?</label>
                  <textarea
                    value={formData.growthCostMoney}
                    onChange={(e) => handleInputChange('growthCostMoney', e.target.value)}
                    placeholder="Estimate costs, labor leakage, or lost files..."
                    rows={3}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">What frustrates agents the most?</label>
                    <input
                      type="text"
                      value={formData.agentFrustrations}
                      onChange={(e) => handleInputChange('agentFrustrations', e.target.value)}
                      placeholder="e.g. Delayed commission check approvals"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">What frustrates leadership the most?</label>
                    <input
                      type="text"
                      value={formData.leadershipFrustrations}
                      onChange={(e) => handleInputChange('leadershipFrustrations', e.target.value)}
                      placeholder="e.g. Chasing agents to submit compliance files"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-xs font-bold text-stone-800 block">How easy would it be to open another office location using your current operational structure?</label>
                  {renderScaleField('locationScaleEase', 'Impossible', 'Seamlessly Easy')}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 9 - PRIORITIES & PILOT CONSENTS */}
          {currentStep === 9 && (
            <div className="space-y-5">
              <div className="border-b border-stone-100 pb-2">
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-650" />
                  <span>Section 9: Final Priorities</span>
                </h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">If Shapework could solve exactly one operational problem this year, what would you choose?</label>
                  <textarea
                    value={formData.oneSolveThisYear}
                    onChange={(e) => handleInputChange('oneSolveThisYear', e.target.value)}
                    placeholder="e.g. Automating our commission check calculation and signature pipeline..."
                    rows={3}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">Would you be interested in participating in a Shapework private pilot?</label>
                  <div className="grid grid-cols-3 gap-2">
                    {yesMaybeNo.map(opt => (
                      <button
                        type="button"
                        key={opt}
                        onClick={() => handleInputChange('pilotInterest', opt)}
                        className={`py-2.5 border rounded-xl text-xs font-bold ${
                          formData.pilotInterest === opt
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                            : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">Would you like to receive a complimentary custom Operational Intelligence Report?</label>
                  <div className="grid grid-cols-2 gap-2">
                    {yesNo.map(opt => (
                      <button
                        type="button"
                        key={opt}
                        onClick={() => handleInputChange('reportConsent', opt)}
                        className={`py-2.5 border rounded-xl text-xs font-bold ${
                          formData.reportConsent === opt
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                            : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">May we contact you for a brief 20-minute follow-up call to review results?</label>
                  <div className="grid grid-cols-2 gap-2">
                    {yesNo.map(opt => (
                      <button
                        type="button"
                        key={opt}
                        onClick={() => handleInputChange('followUpConsent', opt)}
                        className={`py-2.5 border rounded-xl text-xs font-bold ${
                          formData.followUpConsent === opt
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                            : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Buttons Footer */}
          <div className="flex justify-between items-center border-t border-stone-150 pt-5">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentStep === 1 || isSubmitting}
              className={`flex items-center gap-1.5 px-4 py-2 border border-stone-200 text-stone-600 rounded-xl text-xs font-bold hover:bg-stone-50 transition-all ${
                currentStep === 1 ? 'opacity-50 pointer-events-none' : 'cursor-pointer'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-6 py-2.5 bg-emerald-650 hover:bg-emerald-750 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-md select-none disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting Responses...' : 'Submit Assessment'}
              </button>
            )}
          </div>

        </form>
      </div>
    </div>
  );
}
