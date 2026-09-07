import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  BookOpen,
  Award,
  ChevronRight,
  ShieldCheck,
  Send,
  HelpCircle,
  TrendingUp
} from 'lucide-react';

interface RoleplayScenario {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  description: string;
  counterpartPersona: string;
  initialCounterpartStatement: string;
  keyLearningObjectives: string[];
}

interface RoleplayEvaluation {
  scenarioId: string;
  overallScore: number;
  passed: boolean;
  scoreBreakdown: {
    reframingAndEmpathy: number;
    ncrecLegalCompliance: number;
    valueProposition: number;
    callToActionPower: number;
  };
  counterpartResponse: string;
  coachingFeedback: {
    strengths: string[];
    improvements: string[];
    recommendedSop: string;
  };
}

interface OnboardingModule {
  week: number;
  title: string;
  status: 'completed' | 'in_progress' | 'upcoming';
  milestones: { id: string; title: string; completed: boolean }[];
}

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  statutoryRule: string;
  category: string;
}

export const NoraTrainingAcademy: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'roleplay' | 'onboarding' | 'flashcards'>('roleplay');
  const [scenarios, setScenarios] = useState<RoleplayScenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<RoleplayScenario | null>(null);
  const [agentUtterance, setAgentUtterance] = useState('');
  const [evaluation, setEvaluation] = useState<RoleplayEvaluation | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Onboarding & Flashcard States
  const [onboardingModules, setOnboardingModules] = useState<OnboardingModule[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    fetchScenarios();
    fetchOnboarding();
    fetchFlashcards();
  }, []);

  const fetchScenarios = async () => {
    try {
      const res = await fetch('/api/nora/training/scenarios');
      const data = await res.json();
      if (data.success && data.scenarios.length > 0) {
        setScenarios(data.scenarios);
        setSelectedScenario(data.scenarios[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchOnboarding = async () => {
    try {
      const res = await fetch('/api/nora/training/onboarding-roadmap');
      const data = await res.json();
      if (data.success) setOnboardingModules(data.roadmap || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchFlashcards = async () => {
    try {
      const res = await fetch('/api/nora/training/flashcards');
      const data = await res.json();
      if (data.success) setFlashcards(data.flashcards || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleEvaluateTurn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScenario || !agentUtterance) return;
    setIsEvaluating(true);
    try {
      const res = await fetch('/api/nora/training/roleplay-turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: selectedScenario.id,
          agentUtterance
        })
      });
      const data = await res.json();
      if (data.success) setEvaluation(data.evaluation);
    } catch (e) {
      console.error(e);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleToggleMilestone = (weekIdx: number, milestoneIdx: number) => {
    setOnboardingModules(prev => {
      const copy = [...prev];
      copy[weekIdx].milestones[milestoneIdx].completed = !copy[weekIdx].milestones[milestoneIdx].completed;
      return copy;
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Subtab Navigation (Apple Light Mode) */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('roleplay')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'roleplay'
                ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/60'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#00635C]" />
            Objection Roleplay Simulator ({scenarios.length})
          </button>
          <button
            onClick={() => setActiveTab('onboarding')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'onboarding'
                ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/60'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-blue-600" />
            30-Day Provisional Broker Track
          </button>
          <button
            onClick={() => setActiveTab('flashcards')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'flashcards'
                ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/60'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-600" />
            NCREC License Law & CE Flashcards ({flashcards.length})
          </button>
        </div>
      </div>

      {/* 1. Objection Simulator View */}
      {activeTab === 'roleplay' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Scenario Selector */}
          <div className="bg-white rounded-xl border border-stone-200/80 p-4 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-stone-900 pb-2 border-b border-stone-100">
              Select Practice Scenario
            </h4>
            <div className="space-y-2">
              {scenarios.map(scen => (
                <div
                  key={scen.id}
                  onClick={() => {
                    setSelectedScenario(scen);
                    setEvaluation(null);
                    setAgentUtterance('');
                  }}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                    selectedScenario?.id === scen.id
                      ? 'border-[#00635C] bg-emerald-50/40 shadow-xs'
                      : 'border-stone-200/80 bg-white hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-stone-900">{scen.title}</span>
                    <span className="text-[10px] font-semibold text-stone-600 px-1.5 py-0.5 bg-stone-100 rounded">
                      {scen.difficulty}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 line-clamp-2">{scen.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Roleplay Arena & Live Evaluation */}
          <div className="lg:col-span-2 space-y-4">
            {selectedScenario && (
              <div className="bg-white rounded-xl border border-stone-200/80 p-5 shadow-sm space-y-4">
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-stone-100">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-emerald-800 tracking-wider">
                      Interactive Roleplay Simulation
                    </span>
                    <h3 className="text-sm font-bold text-stone-900">{selectedScenario.title}</h3>
                    <p className="text-xs text-stone-600 mt-0.5">{selectedScenario.counterpartPersona}</p>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-bold bg-stone-100 text-stone-700 rounded-lg">
                    {selectedScenario.difficulty} Level
                  </span>
                </div>

                {/* Counterpart Opening Statement */}
                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200/70 space-y-1.5">
                  <span className="text-[10px] font-bold text-stone-600 uppercase block">
                    🗣️ Client Objection / Statement:
                  </span>
                  <p className="text-xs font-medium text-stone-900 italic">
                    "{selectedScenario.initialCounterpartStatement}"
                  </p>
                </div>

                {/* Agent Response Input Form */}
                <form onSubmit={handleEvaluateTurn} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-stone-700 block mb-1">
                      Your Response (Speak or Type Objection Reframing):
                    </label>
                    <textarea
                      rows={3}
                      value={agentUtterance}
                      onChange={e => setAgentUtterance(e.target.value)}
                      placeholder="e.g. I completely understand your focus on net proceeds. In North Carolina, our 300 DPI Maxa marketing and listing presentation achieves a 98.6% list-to-sale price ratio..."
                      className="w-full p-3 text-xs rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#00635C]"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setAgentUtterance("I completely understand your concern about costs. However, our comprehensive staging, 300 DPI Maxa marketing, and professional negotiation yield a 98.6% list-to-sale ratio, putting significantly more net cash in your pocket. Let's review our seller net sheet tomorrow at 2:00 PM.")}
                      className="text-[11px] text-[#00635C] hover:underline font-medium"
                    >
                      💡 Insert High-Performing Answer
                    </button>
                    <button
                      type="submit"
                      disabled={isEvaluating || !agentUtterance}
                      className="flex items-center gap-1.5 px-4 py-2 bg-[#00635C] hover:bg-[#00524C] text-white text-xs font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {isEvaluating ? 'Evaluating Objection...' : 'Grade & Counter'}
                    </button>
                  </div>
                </form>

                {/* Real-Time AI Scorecard */}
                {evaluation && (
                  <div className="mt-4 pt-4 border-t border-stone-100 space-y-4">
                    <div className="flex items-center justify-between bg-emerald-50/80 p-4 rounded-xl border border-emerald-200/60">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase text-emerald-800 tracking-wider">
                          Nora AI Scorecard
                        </span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-extrabold text-emerald-900">
                            {evaluation.overallScore} / 100
                          </span>
                          <span className={`text-xs font-bold ${evaluation.passed ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {evaluation.passed ? '🟢 PASSED' : '🟡 PRACTICE RECOMMENDED'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Score Breakdown Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                        <span className="text-[10px] text-stone-600 block">Empathy & Reframing</span>
                        <span className="font-bold text-stone-900">{evaluation.scoreBreakdown.reframingAndEmpathy}%</span>
                      </div>
                      <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                        <span className="text-[10px] text-stone-600 block">NCREC Compliance</span>
                        <span className="font-bold text-stone-900">{evaluation.scoreBreakdown.ncrecLegalCompliance}%</span>
                      </div>
                      <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                        <span className="text-[10px] text-stone-600 block">Value Proposition</span>
                        <span className="font-bold text-stone-900">{evaluation.scoreBreakdown.valueProposition}%</span>
                      </div>
                      <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                        <span className="text-[10px] text-stone-600 block">Call to Action</span>
                        <span className="font-bold text-stone-900">{evaluation.scoreBreakdown.callToActionPower}%</span>
                      </div>
                    </div>

                    {/* Counterpart Response */}
                    <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-100 text-xs">
                      <span className="text-[10px] font-bold text-stone-600 uppercase block mb-1">
                        Client Follow-up Reaction:
                      </span>
                      <p className="italic text-stone-800">"{evaluation.counterpartResponse}"</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. 30-Day Onboarding Roadmap */}
      {activeTab === 'onboarding' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {onboardingModules.map((module, weekIdx) => (
            <div key={module.week} className="bg-white rounded-xl border border-stone-200/80 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <h4 className="text-xs font-bold text-stone-900">{module.title}</h4>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                  module.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : module.status === 'in_progress' ? 'bg-amber-100 text-amber-800' : 'bg-stone-100 text-stone-600'
                }`}>
                  {module.status.replace('_', ' ')}
                </span>
              </div>
              <div className="space-y-2">
                {module.milestones.map((m, mIdx) => (
                  <div
                    key={m.id}
                    onClick={() => handleToggleMilestone(weekIdx, mIdx)}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-stone-50 cursor-pointer text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={m.completed}
                      onChange={() => {}}
                      className="rounded border-stone-300 text-[#00635C] focus:ring-[#00635C]"
                    />
                    <span className={`flex-1 ${m.completed ? 'line-through text-stone-600' : 'font-medium text-stone-800'}`}>
                      {m.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. NCREC Flashcard Deck */}
      {activeTab === 'flashcards' && flashcards.length > 0 && (
        <div className="max-w-xl mx-auto space-y-4">
          <div className="flex items-center justify-between text-xs text-stone-600">
            <span>Card {activeCardIndex + 1} of {flashcards.length}</span>
            <span className="font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full">
              {flashcards[activeCardIndex].category}
            </span>
          </div>

          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="h-56 bg-white rounded-2xl border border-stone-200/80 p-6 shadow-sm flex flex-col justify-between cursor-pointer hover:shadow-md transition-all text-center"
          >
            <div className="flex justify-end text-[10px] text-stone-600">Click card to flip</div>
            <div className="my-auto">
              {!isFlipped ? (
                <div>
                  <span className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block mb-2">Question</span>
                  <p className="text-sm font-bold text-stone-900 leading-relaxed">
                    {flashcards[activeCardIndex].question}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Official Answer & Statute</span>
                  <p className="text-xs font-semibold text-stone-800 leading-relaxed">
                    {flashcards[activeCardIndex].answer}
                  </p>
                  <span className="text-[11px] font-mono text-emerald-700 block font-bold">
                    📜 {flashcards[activeCardIndex].statutoryRule}
                  </span>
                </div>
              )}
            </div>
            <div className="text-[10px] text-stone-600">
              {isFlipped ? '🟢 Verified NCREC Rulebook' : 'Tap to Reveal Answer'}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setActiveCardIndex(prev => Math.max(0, prev - 1));
                setIsFlipped(false);
              }}
              disabled={activeCardIndex === 0}
              className="px-4 py-2 text-xs font-semibold text-stone-700 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 disabled:opacity-50"
            >
              Previous Card
            </button>
            <button
              onClick={() => {
                setActiveCardIndex(prev => Math.min(flashcards.length - 1, prev + 1));
                setIsFlipped(false);
              }}
              disabled={activeCardIndex === flashcards.length - 1}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#00635C] hover:bg-[#00524C] rounded-xl shadow-sm disabled:opacity-50"
            >
              Next Card
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
