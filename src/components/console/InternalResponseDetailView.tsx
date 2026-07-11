import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Sparkles, 
  Save, 
  CheckCircle2, 
  AlertTriangle,
  Building,
  User,
  Shield,
  Layout,
  Layers,
  Activity,
  Award
} from 'lucide-react';

interface InternalResponseDetailViewProps {
  responseId: string;
  onBack: () => void;
}

export default function InternalResponseDetailView({ 
  responseId, 
  onBack 
}: InternalResponseDetailViewProps) {
  const [response, setResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Classification Edit State
  const [classification, setClassification] = useState<any>({
    primaryPainCategory: '',
    secondaryPainCategory: '',
    frequency: '',
    financialImpact: '',
    urgency: '',
    repeatability: '',
    willingnessToPay: '',
    implementationComplexity: '',
    existingToolCoverage: '',
    productOpportunityScore: 50,
    notes: '',
    status: 'new',
    assignedOwner: 'usr_sarah'
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchDetail = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/assessments/${responseId}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to load assessment detail.');
      }
      setResponse(data.response);
      if (data.response.internalClassification) {
        setClassification({
          ...classification,
          ...data.response.internalClassification
        });
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred loading the survey data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (responseId) {
      fetchDetail();
    }
  }, [responseId]);

  const handleClassifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch(`/api/assessments/${responseId}/classify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(classification)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update classification details.');
      }
      setResponse(data.response);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClassifyChange = (field: string, val: any) => {
    setClassification((prev: any) => ({ ...prev, [field]: val }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-24 bg-stone-200 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-white border border-stone-200 rounded-2xl" />
          <div className="h-96 bg-white border border-stone-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !response) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-left space-y-4">
        <div className="flex items-center gap-2 text-rose-800 font-bold">
          <AlertTriangle className="w-5 h-5 text-rose-600" />
          <span>Error Loading Detail</span>
        </div>
        <p className="text-xs text-rose-700">{error || 'Response not found.'}</p>
        <button 
          onClick={onBack}
          className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold hover:bg-stone-850 cursor-pointer"
        >
          Return to List
        </button>
      </div>
    );
  }

  const answers = response.answers || {};
  const scores = response.scores || {};

  // Form options mapping
  const painCategories = ['Commission Processing', 'Listing Management', 'Transaction Coordination', 'Marketing Requests', 'Agent Onboarding', 'Compliance', 'Property Signs', 'Accounting', 'Other'];
  const statusOptions = ['new', 'under_review', 'review_completed', 'archived'];

  return (
    <div className="space-y-6 text-left">
      
      {/* Back button */}
      <div>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Assessments</span>
        </button>
      </div>

      {/* Main Grid: Detail + Sidebar Classify */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Survey Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Summary profile card */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-start justify-between border-b border-stone-150 pb-3">
              <div>
                <h2 className="text-lg font-bold text-stone-950 font-serif leading-snug">{response.brokerageName}</h2>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-stone-500 font-mono mt-1">
                  <span className="flex items-center gap-1"><Building className="w-3.5 h-3.5" />{response.numberOfAgents} agents</span>
                  <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{response.respondentName} ({response.role})</span>
                  <span>{response.emailAddress}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest font-mono block">IQ SCORE</span>
                <span className="text-3xl font-extrabold text-emerald-700 font-mono leading-none block">{scores.overallScore || 0}</span>
              </div>
            </div>

            {/* Scorecard grids */}
            <div className="space-y-3">
              <label className="text-[9px] font-bold uppercase tracking-widest font-mono text-stone-400 block">Category index scores</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {scores.categoryScores && Object.entries(scores.categoryScores).map(([cat, val]: any) => (
                  <div key={cat} className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-center space-y-1">
                    <span className="text-[9px] font-bold text-stone-500 uppercase tracking-wider block font-mono leading-none truncate" title={cat}>
                      {cat.replace(/([A-Z])/g, ' $1')}
                    </span>
                    <span className="text-base font-extrabold text-emerald-750 font-mono block leading-none">{val}/100</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Detailed survey question list */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-6">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider font-mono border-b border-stone-150 pb-2">Full Assessment Answers</h3>
            
            {/* Section 2: Operational Health */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 font-mono block">Section 2: Operational health (1-5 frequency rating)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex justify-between p-2 border-b border-stone-100">
                  <span className="text-stone-600">Leadership pulled into issues:</span>
                  <span className="font-bold font-mono text-stone-900">{answers.pulledIntoIssues || 'N/A'}</span>
                </div>
                <div className="flex justify-between p-2 border-b border-stone-100">
                  <span className="text-stone-600">Work falls through cracks:</span>
                  <span className="font-bold font-mono text-stone-900">{answers.workFallsThroughCracks || 'N/A'}</span>
                </div>
                <div className="flex justify-between p-2 border-b border-stone-100">
                  <span className="text-stone-600">Information silos (text/memory):</span>
                  <span className="font-bold font-mono text-stone-900">{answers.infoInSilos || 'N/A'}</span>
                </div>
                <div className="flex justify-between p-2 border-b border-stone-100">
                  <span className="text-stone-600">Processes change by person:</span>
                  <span className="font-bold font-mono text-stone-900">{answers.processesChange || 'N/A'}</span>
                </div>
                <div className="flex justify-between p-2 border-b border-stone-100">
                  <span className="text-stone-600">Waiting on approvals:</span>
                  <span className="font-bold font-mono text-stone-900">{answers.waitingOnApprovals || 'N/A'}</span>
                </div>
                <div className="flex justify-between p-2 border-b border-stone-100">
                  <span className="text-stone-600">Repeated operational questions:</span>
                  <span className="font-bold font-mono text-stone-900">{answers.repeatedQuestions || 'N/A'}</span>
                </div>
                <div className="flex justify-between p-2 border-b border-stone-100">
                  <span className="text-stone-600">Agents struggle to locate info:</span>
                  <span className="font-bold font-mono text-stone-900">{answers.struggleFindInfo || 'N/A'}</span>
                </div>
                <div className="flex justify-between p-2 border-b border-stone-100">
                  <span className="text-stone-600">Side conversations workflow:</span>
                  <span className="font-bold font-mono text-stone-900">{answers.sideConversations || 'N/A'}</span>
                </div>
                <div className="flex justify-between p-2 border-b border-stone-100">
                  <span className="text-stone-600">Bottleneck person:</span>
                  <span className="font-bold font-mono text-stone-900">{answers.bottleneckPerson || 'N/A'}</span>
                </div>
                <div className="flex justify-between p-2 border-b border-stone-100">
                  <span className="text-stone-600">No operating audit records:</span>
                  <span className="font-bold font-mono text-stone-900">{answers.noOperatingRecord || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Section 3: Ownership */}
            <div className="space-y-3 pt-3 border-t border-stone-100">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 font-mono block">Section 3: Operational ownership & leadership dependencies</h4>
              <div className="space-y-2.5 text-xs">
                <div>
                  <span className="text-[10px] font-mono text-stone-400 uppercase block leading-none mb-1">Weekly Leadership Interruptions</span>
                  <p className="text-stone-800 leading-relaxed font-sans">{answers.interruptionsParagraph || 'None entered.'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-stone-400 uppercase block leading-none mb-1">Bottleneck Person & Single Point of Failure</span>
                  <p className="text-stone-800 leading-relaxed font-sans">{answers.singlePersonDependence || 'None entered.'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-stone-400 uppercase block leading-none mb-1">Result of 2-Week Unavailability</span>
                  <p className="text-stone-850 leading-relaxed font-sans font-semibold">{answers.unavailabilityBreak || 'None entered.'}</p>
                </div>
              </div>
            </div>

            {/* Section 4 & 5: Pain Points & Tech */}
            <div className="space-y-3 pt-3 border-t border-stone-100">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 font-mono block">Section 4 & 5: Friction & Technology Stack</h4>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] font-mono text-stone-400 uppercase block mb-1.5">Friction Areas selected</span>
                  <div className="flex flex-wrap gap-1.5">
                    {answers.frictionAreas?.map((area: string) => (
                      <span key={area} className="px-2.5 py-1 bg-stone-50 border border-stone-200 rounded-lg text-stone-750 font-bold uppercase text-[9px] font-mono">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-mono text-stone-400 uppercase block mb-1">Systems Used</span>
                    <span className="font-semibold text-stone-800">{answers.systemsUsed?.join(', ') || 'None entered'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-stone-400 uppercase block mb-1">Manual Duplicate Data Entries</span>
                    <p className="text-stone-800 font-mono text-[10px]">{answers.duplicateDataFlows || 'None'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 6 & 7: Leadership Load & AI Readiness */}
            <div className="space-y-3 pt-3 border-t border-stone-100">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 font-mono block">Section 6 & 7: Leadership load & AI Automation state</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] font-mono text-stone-400 uppercase block mb-1">Weekly hours lost to operational fire drills</span>
                  <span className="font-bold text-stone-900 font-mono">{answers.leadershipHoursLost || '0-5'} hours</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-stone-400 uppercase block mb-1">AI/Automation implementation phase</span>
                  <span className="font-bold text-stone-900 font-mono uppercase">{answers.aiImplemented || 'None'}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-[10px] font-mono text-stone-400 uppercase block mb-1">High potential AI automation workflow target</span>
                  <p className="text-stone-800 font-sans">{answers.aiTimeSavingWorkflow || 'None listed.'}</p>
                </div>
              </div>
            </div>

            {/* Section 8 & 9: Growth & Priorities */}
            <div className="space-y-3 pt-3 border-t border-stone-100">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 font-mono block">Section 8 & 9: Scalability & Strategic Priorities</h4>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] font-mono text-stone-400 uppercase block mb-1">Strategic Scale Break Point (What breaks if size doubled?)</span>
                  <p className="text-stone-850 leading-relaxed font-sans font-semibold">{answers.scaleBreakPoints || 'None listed.'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-stone-400 uppercase block mb-1">If Shapework could solve exactly one problem</span>
                  <p className="text-emerald-800 leading-relaxed font-sans font-bold">{answers.oneSolveThisYear || 'None listed.'}</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Side: Shapework Classification */}
        <div className="space-y-6">
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider font-mono border-b border-stone-150 pb-2 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-650" />
              <span>Shapework Classification</span>
            </h3>

            {saveSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-[10px] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-650" />
                <span>Classification updated successfully.</span>
              </div>
            )}

            <form onSubmit={handleClassifySubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block font-mono">Assigned Owner</label>
                <select
                  value={classification.assignedOwner}
                  onChange={(e) => handleClassifyChange('assignedOwner', e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                >
                  <option value="usr_sarah">Sarah Jenkins</option>
                  <option value="usr_developer">Developer Account</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block font-mono">Triage Status</label>
                <select
                  value={classification.status}
                  onChange={(e) => handleClassifyChange('status', e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold capitalize"
                >
                  {statusOptions.map(opt => <option key={opt} value={opt}>{opt.replace('_', ' ')}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block font-mono">Primary Pain Category</label>
                <select
                  value={classification.primaryPainCategory}
                  onChange={(e) => handleClassifyChange('primaryPainCategory', e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                >
                  <option value="">Select...</option>
                  {painCategories.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block font-mono">Secondary Pain Category</label>
                <select
                  value={classification.secondaryPainCategory}
                  onChange={(e) => handleClassifyChange('secondaryPainCategory', e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                >
                  <option value="">Select...</option>
                  {painCategories.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-stone-500 uppercase tracking-wider block font-mono">Frequency</label>
                  <select
                    value={classification.frequency}
                    onChange={(e) => handleClassifyChange('frequency', e.target.value)}
                    className="w-full px-2 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-[11px]"
                  >
                    <option value="">Select...</option>
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-stone-500 uppercase tracking-wider block font-mono">Urgency</label>
                  <select
                    value={classification.urgency}
                    onChange={(e) => handleClassifyChange('urgency', e.target.value)}
                    className="w-full px-2 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-[11px]"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block font-mono">Estimated Financial Impact</label>
                <input
                  type="text"
                  value={classification.financialImpact}
                  onChange={(e) => handleClassifyChange('financialImpact', e.target.value)}
                  placeholder="e.g. $10,000/year"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-stone-500 uppercase tracking-wider block font-mono">Willingness to Pay</label>
                  <select
                    value={classification.willingnessToPay}
                    onChange={(e) => handleClassifyChange('willingnessToPay', e.target.value)}
                    className="w-full px-2 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-[11px]"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-stone-500 uppercase tracking-wider block font-mono">Complexity</label>
                  <select
                    value={classification.implementationComplexity}
                    onChange={(e) => handleClassifyChange('implementationComplexity', e.target.value)}
                    className="w-full px-2 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-[11px]"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-stone-500 uppercase tracking-wider block font-mono">Existing Tools</label>
                  <select
                    value={classification.existingToolCoverage}
                    onChange={(e) => handleClassifyChange('existingToolCoverage', e.target.value)}
                    className="w-full px-2 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-[11px]"
                  >
                    <option value="None">None</option>
                    <option value="Partial">Partial</option>
                    <option value="Full">Full</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-stone-500 uppercase tracking-wider block font-mono">Opportunity Score (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={classification.productOpportunityScore}
                    onChange={(e) => handleClassifyChange('productOpportunityScore', Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-[11px] font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block font-mono">Internal Operation Notes</label>
                <textarea
                  value={classification.notes}
                  onChange={(e) => handleClassifyChange('notes', e.target.value)}
                  placeholder="Record call summaries or custom pilot notes..."
                  rows={4}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:bg-white"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50 select-none"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving Notes...' : 'Save Classification'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
