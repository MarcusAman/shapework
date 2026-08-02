import React, { useState, useEffect } from 'react';
import { 
  Building, 
  User, 
  Mail, 
  Check, 
  ArrowLeft, 
  ArrowRight, 
  AlertTriangle,
  Award,
  Zap,
  TrendingUp,
  Target,
  ArrowRightCircle
} from 'lucide-react';

interface PublicSurveyRendererProps {
  slug: string;
  onNavigate: (path: string) => void;
}

export default function PublicSurveyRenderer({ 
  slug, 
  onNavigate 
}: PublicSurveyRendererProps) {
  const [survey, setSurvey] = useState<any>(null);
  const [version, setVersion] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form step tracking
  const [currentStep, setCurrentStep] = useState(0); // 0-based index for pages
  const [answers, setAnswers] = useState<Record<string, any>>({});
  
  // Submission response
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedScores, setCompletedScores] = useState<any>(null);
  const [completedId, setCompletedId] = useState<string | null>(null);

  const fetchSurvey = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/public/surveys/${slug}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Survey could not be loaded.');
      }
      setSurvey(data.survey);
      setVersion(data.version);
      
      // Initialize answer fields
      const initialAnswers: Record<string, any> = {};
      data.version.schema.pages?.forEach((p: any) => {
        p.blocks?.forEach((b: any) => {
          if (b.type === 'checkboxes') {
            initialAnswers[b.id] = [];
          } else {
            initialAnswers[b.id] = '';
          }
        });
      });
      setAnswers(initialAnswers);
    } catch (err: any) {
      setError(err.message || 'An error occurred loading this survey.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSurvey();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#01362D] flex items-center justify-center font-sans text-xs text-[#D0D6BB] animate-pulse">
        Loading survey configuration...
      </div>
    );
  }

  if (error || !survey || !version) {
    return (
      <div className="min-h-screen bg-[#01362D] flex items-center justify-center font-sans p-6">
        <div className="max-w-md w-full bg-stone-900 border border-stone-800 rounded-xl p-8 shadow-2xl space-y-4 text-left">
          <div className="flex items-center gap-2 text-rose-400 font-bold">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            <span>Survey Load Failed</span>
          </div>
          <p className="text-xs text-stone-300 leading-relaxed">{error}</p>
          <button 
            onClick={() => onNavigate('/')}
            className="w-full py-2 bg-stone-800 hover:bg-stone-750 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Return to Homepage
          </button>
        </div>
      </div>
    );
  }

  const pages = version.schema.pages || [];
  const activePage = pages[currentStep];
  const theme = survey.theme || {};

  // Form change inputs
  const handleTextChange = (blockId: string, val: string) => {
    setAnswers(prev => ({
      ...prev,
      [blockId]: val
    }));
  };

  const handleCheckboxChange = (blockId: string, option: string, checked: boolean) => {
    setAnswers(prev => {
      const current = prev[blockId] || [];
      const updated = checked 
        ? [...current, option]
        : current.filter((o: string) => o !== option);
      return {
        ...prev,
        [blockId]: updated
      };
    });
  };

  const validatePage = () => {
    if (!activePage) return true;
    for (const block of activePage.blocks) {
      if (block.required) {
        const val = answers[block.id];
        if (block.type === 'checkboxes') {
          if (!val || val.length === 0) {
            alert(`"${block.title}" is required.`);
            return false;
          }
        } else {
          if (val === undefined || val === null || String(val).trim() === '') {
            alert(`"${block.title}" is required.`);
            return false;
          }
        }
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validatePage()) {
      if (currentStep < pages.length - 1) {
        setCurrentStep(prev => prev + 1);
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePage()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/public/surveys/${slug}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answers)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCompletedId(data.id);
        setCompletedScores(data.scores);
      } else {
        alert(data.message || 'Submission failed. Please try again.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render Completed Scorecard View
  if (completedScores) {
    return (
      <div 
        className="min-h-screen font-sans py-12 px-6 flex items-center justify-center text-left transition-all"
        style={{ backgroundColor: theme.pageBg || '#F5F5F0' }}
      >
        <div 
          className="max-w-2xl w-full border border-stone-200 rounded-2xl p-8 shadow-2xl space-y-6"
          style={{ backgroundColor: theme.cardBg || '#ffffff', color: theme.primaryText || '#1E2520' }}
        >
          {/* Confirmed title */}
          <div className="flex items-center gap-3 border-b border-stone-150 pb-4">
            <div className="w-10 h-10 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-500/25 shrink-0">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest block font-mono">Submission Confirmed</span>
              <h1 className="text-base font-serif font-bold leading-tight" style={{ color: theme.primaryText }}>
                {survey.publicTitle}
              </h1>
            </div>
          </div>

          <p className="text-xs leading-relaxed" style={{ color: theme.secondaryText }}>
            Thank you for completing the operational evaluation. Based on your answers, we have calculated your brokerage intelligence indices.
          </p>

          {/* Scores breakdown layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-[#E9F1EC]/30 border border-stone-200/50 p-6 rounded-xl">
            {/* Overall Score */}
            <div className="text-center md:border-r border-stone-200/60 md:pr-4 py-2 space-y-1">
              <Award className="w-8 h-8 text-emerald-600 mx-auto opacity-80" />
              <span className="text-[9px] font-bold uppercase tracking-widest font-mono block" style={{ color: theme.secondaryText }}>Overall Score</span>
              <span className="text-4xl font-extrabold text-emerald-700 font-mono block leading-none">{completedScores.overallScore}/100</span>
            </div>

            {/* Category index scores */}
            <div className="md:col-span-2 space-y-2">
              <span className="text-[8px] font-bold uppercase tracking-wider font-mono block" style={{ color: theme.secondaryText }}>Category break-downs</span>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                {completedScores.categoryScores && Object.entries(completedScores.categoryScores).map(([cat, val]: any) => (
                  <div key={cat} className="flex justify-between border-b border-stone-150/60 pb-1">
                    <span className="font-semibold text-stone-500 truncate mr-2 capitalize">{cat.replace(/([A-Z])/g, ' $1')}:</span>
                    <span className="font-bold font-mono text-emerald-700">{val}/100</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Strategic Opportunities */}
          {completedScores.topOpportunities?.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-serif font-bold text-xs flex items-center gap-1.5" style={{ color: theme.primaryText }}>
                <Zap className="w-4 h-4 text-emerald-600" />
                <span>Next Strategic Priorities</span>
              </h3>
              <div className="space-y-2.5">
                {completedScores.topOpportunities.map((opp: string, i: number) => (
                  <div key={i} className="flex items-start gap-2.5 bg-stone-50 border border-stone-200/55 p-3 rounded-xl">
                    <div className="w-5 h-5 bg-emerald-500/10 border border-emerald-500/25 rounded-full flex items-center justify-center font-mono text-[10px] font-bold text-emerald-700 shrink-0">
                      {i + 1}
                    </div>
                    <p className="text-[11px] leading-relaxed text-stone-600 font-medium">{opp}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Exit actions */}
          <div className="pt-4 border-t border-stone-150">
            <button
              onClick={() => onNavigate('/')}
              className="px-4 py-2 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 mx-auto cursor-pointer select-none"
              style={{ backgroundColor: theme.buttonBg || '#01362D' }}
            >
              <span>Finish & Return</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    );
  }

  // Active step blocks list
  return (
    <div 
      className="min-h-screen font-sans py-12 px-6 flex items-center justify-center text-left transition-all"
      style={{ backgroundColor: theme.pageBg || '#fafafa' }}
    >
      <div 
        className="max-w-xl w-full border border-stone-200/80 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6"
        style={{ backgroundColor: theme.cardBg || '#ffffff', color: theme.primaryText || '#1E2520' }}
      >
        
        {/* Survey Title & Progress Bar */}
        <div className="space-y-4">
          <div className="flex justify-between items-start gap-4">
            <h1 className="text-base font-bold font-serif leading-tight" style={{ color: theme.primaryText }}>
              {survey.publicTitle}
            </h1>
            <span className="font-mono text-[9px] font-bold text-stone-400 shrink-0 uppercase tracking-widest">
              Step {currentStep + 1} of {pages.length}
            </span>
          </div>

          {/* Progress bar line */}
          <div className="w-full h-1 bg-stone-100 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-300"
              style={{ 
                backgroundColor: theme.accentColor || '#00635C',
                width: `${((currentStep + 1) / pages.length) * 100}%` 
              }}
            />
          </div>
        </div>

        {/* Page Description instructions */}
        {activePage && (
          <div className="space-y-2">
            <span className="text-[10px] font-bold font-mono uppercase tracking-widest text-stone-400 block">
              {activePage.title}
            </span>
            {activePage.description && (
              <p className="text-[11px] leading-relaxed" style={{ color: theme.secondaryText }}>
                {activePage.description}
              </p>
            )}
          </div>
        )}

        {/* Dynamic Blocks renderer */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {activePage?.blocks?.map((block: any) => {
            const answerVal = answers[block.id];

            return (
              <div key={block.id} className="space-y-2">
                <label className="text-xs font-bold leading-relaxed block" style={{ color: theme.primaryText }}>
                  {block.title}
                  {block.required && <span className="text-rose-500 ml-0.5">*</span>}
                </label>

                {/* Short text input */}
                {block.type === 'short_text' && (
                  <input 
                    type="text"
                    required={block.required}
                    value={answerVal || ''}
                    onChange={(e) => handleTextChange(block.id, e.target.value)}
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500/50"
                    placeholder="Enter answer details..."
                  />
                )}

                {/* Long text / textarea */}
                {block.type === 'long_text' && (
                  <textarea 
                    required={block.required}
                    value={answerVal || ''}
                    onChange={(e) => handleTextChange(block.id, e.target.value)}
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs h-24 resize-none focus:outline-none focus:border-emerald-500/50 leading-relaxed"
                    placeholder="Provide details..."
                  />
                )}

                {/* Email address validation */}
                {block.type === 'email' && (
                  <input 
                    type="email"
                    required={block.required}
                    value={answerVal || ''}
                    onChange={(e) => handleTextChange(block.id, e.target.value)}
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500/50"
                    placeholder="you@brokerage.com"
                  />
                )}

                {/* Dropdown pick lists */}
                {block.type === 'dropdown' && (
                  <select
                    required={block.required}
                    value={answerVal || ''}
                    onChange={(e) => handleTextChange(block.id, e.target.value)}
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none"
                  >
                    <option value="">Select Option...</option>
                    {block.options?.map((opt: string) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                )}

                {/* Checkboxes lists */}
                {block.type === 'checkboxes' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {block.options?.map((opt: string) => {
                      const isChecked = Array.isArray(answerVal) && answerVal.includes(opt);
                      return (
                        <label 
                          key={opt}
                          className={`flex items-center gap-2.5 p-2.5 bg-stone-50 border rounded-xl cursor-pointer select-none transition-all ${
                            isChecked ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-stone-200 hover:border-stone-300'
                          }`}
                        >
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => handleCheckboxChange(block.id, opt, e.target.checked)}
                            className="accent-emerald-600 rounded"
                          />
                          <span className="font-semibold text-stone-600 truncate">{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* 1-5 rating widgets */}
                {block.type === 'rating' && (
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(num => {
                      const isSelected = Number(answerVal) === num;
                      return (
                        <button
                          key={num}
                          type="button"
                          onClick={() => handleTextChange(block.id, String(num))}
                          className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            isSelected 
                              ? 'text-white border-transparent' 
                              : 'bg-stone-50 border-stone-200 text-stone-600 hover:border-stone-300'
                          }`}
                          style={isSelected ? { backgroundColor: theme.accentColor || '#00635C' } : {}}
                        >
                          {num}
                        </button>
                      );
                    })}
                  </div>
                )}

              </div>
            );
          })}

          {/* Form Actions Footer */}
          <div className="flex items-center justify-between pt-6 border-t border-stone-150">
            {currentStep > 0 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-stone-200 hover:bg-stone-50 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {currentStep < pages.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1.5 px-4 py-1.5 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer select-none"
                style={{ backgroundColor: theme.buttonBg || '#01362D' }}
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-4 py-1.5 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer select-none"
                style={{ backgroundColor: theme.buttonBg || '#01362D' }}
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Submitting answers...' : 'Submit Evaluation'}</span>
              </button>
            )}
          </div>
        </form>

      </div>
    </div>
  );
}
