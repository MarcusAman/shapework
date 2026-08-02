import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Search, 
  Plus, 
  Trash2, 
  Globe, 
  FileText, 
  BarChart3, 
  Calendar, 
  Folder, 
  MoreVertical, 
  Copy, 
  Lock, 
  Layers,
  CheckCircle,
  ExternalLink,
  Loader
} from 'lucide-react';

interface InternalSurveyLibraryViewProps {
  onNavigateToBuilder: (id: string, mode?: 'builder' | 'responses' | 'analytics') => void;
}

export default function InternalSurveyLibraryView({ 
  onNavigateToBuilder 
}: InternalSurveyLibraryViewProps) {
  const [surveys, setSurveys] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);

  // Create form states
  const [newSurveyName, setNewSurveyName] = useState('');
  const [newSurveyDesc, setNewSurveyDesc] = useState('');
  const [newSurveyCategory, setNewSurveyCategory] = useState('Operational Intelligence');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // AI prompt states
  const [aiTopic, setAiTopic] = useState('');
  const [aiDesc, setAiDesc] = useState('');
  const [aiCategories, setAiCategories] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchSurveys = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/surveys');
      const data = await res.json();
      if (res.ok && data.success) {
        setSurveys(data.list);
        
        // Find published surveys to offer as templates
        const templatesList = data.list.filter((s: any) => s.id === 'survey_brokerage_operational_intelligence' || s.status === 'Published');
        setTemplates(templatesList);
      }
    } catch (e) {
      console.error('Failed to load surveys:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveys();
  }, []);

  const handleCreateSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSurveyName) return;

    setIsCreating(true);
    try {
      const res = await fetch('/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSurveyName,
          internalDescription: newSurveyDesc,
          category: newSurveyCategory,
          templateId: selectedTemplateId || undefined
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowCreateModal(false);
        setNewSurveyName('');
        setNewSurveyDesc('');
        setSelectedTemplateId('');
        // Navigate to the builder of the newly created survey
        onNavigateToBuilder(data.survey.id, 'builder');
      } else {
        alert(data.message || 'Failed to create survey');
      }
    } catch (err) {
      console.error(err);
      alert('Network error occurred.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleGenerateWithAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiTopic) return;

    setIsGenerating(true);
    try {
      // 1. Generate schema
      const genRes = await fetch('/api/surveys/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: aiTopic,
          description: aiDesc,
          categories: aiCategories
        })
      });
      const genData = await genRes.json();
      if (!genRes.ok || !genData.success) {
        throw new Error(genData.message || 'AI Schema Generation failed.');
      }

      // 2. Create survey with generated schema
      const createRes = await fetch('/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: aiTopic,
          internalDescription: aiDesc || `AI Generated survey for topic: ${aiTopic}`,
          category: 'AI Generated'
        })
      });
      const createData = await createRes.json();
      if (!createRes.ok || !createData.success) {
        throw new Error(createData.message || 'Failed to create survey envelope.');
      }

      // 3. Save generated schema to the newly created survey
      const updateRes = await fetch(`/api/surveys/${createData.survey.id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schema: genData.schema
        })
      });

      if (updateRes.ok) {
        setShowAiModal(false);
        setAiTopic('');
        setAiDesc('');
        setAiCategories('');
        onNavigateToBuilder(createData.survey.id, 'builder');
      } else {
        alert('Failed to save generated schema to survey draft.');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error occurred generating survey.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = (slug: string) => {
    const link = `${window.location.origin}/survey/${slug}`;
    navigator.clipboard.writeText(link);
    alert('Public link copied to clipboard!');
  };

  const filteredSurveys = surveys.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (s.category && s.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 text-left font-sans text-xs text-slate-800 animate-fade-in">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white border border-slate-200 rounded-3xl p-6 gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900">
              <FileText className="w-4 h-4 text-slate-900" />
            </div>
            <h2 className="font-bold text-base text-slate-900 font-sans">Customer Survey & Feedback Studio</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Create internal Shapework surveys, collect pilot feedback, conduct Broker-in-Charge SLA audits, and generate new questionnaires.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 select-none">
          <button 
            onClick={() => setShowAiModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200/80 text-slate-900 border border-slate-200 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <Zap className="w-3.5 h-3.5 text-slate-700" />
            <span>Generate with AI</span>
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create New Survey</span>
          </button>
        </div>
      </div>

      {/* Library main card list */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        
        {/* Search & Filter header */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search surveys by name or category..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-[var(--sw-bg-soft)] border border-[var(--sw-border)] rounded-xl text-xs text-[var(--sw-text)] focus:outline-none focus:border-emerald-500/50"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-[var(--sw-muted)] space-y-2">
            <Loader className="w-6 h-6 animate-spin mx-auto text-emerald-400" />
            <p>Loading Survey Library...</p>
          </div>
        ) : filteredSurveys.length === 0 ? (
          <div className="p-12 text-center text-xs text-[var(--sw-muted)] space-y-2">
            <Folder className="w-8 h-8 mx-auto opacity-30 text-emerald-300" />
            <p className="font-bold text-[var(--sw-text)]">No surveys found</p>
            <p className="text-[10px]">Create your first custom survey to get started collecting back-office data.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--sw-border)]">
            {filteredSurveys.map((survey) => (
              <div 
                key={survey.id} 
                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[var(--sw-bg-soft)]/20 transition-all"
              >
                {/* Title + Metadata */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 
                      onClick={() => onNavigateToBuilder(survey.id, 'builder')}
                      className="font-bold text-xs text-[var(--sw-text)] hover:text-emerald-400 transition-colors cursor-pointer"
                    >
                      {survey.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[var(--sw-muted)] mt-1 font-medium font-sans">
                      <span className="px-1.5 py-0.5 rounded bg-[var(--sw-bg-soft)] border border-[var(--sw-border)] font-mono uppercase text-[9px]">{survey.category}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(survey.createdAt).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1 font-mono text-emerald-400">{survey.responseCount || 0} response(s)</span>
                    </div>
                  </div>
                </div>

                {/* Status Badge & Actions */}
                <div className="flex items-center justify-between md:justify-end gap-4">
                  {/* Status indicator */}
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${
                      survey.status === 'Published' ? 'bg-emerald-400' : 'bg-stone-400 animate-pulse'
                    }`} />
                    <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-[var(--sw-muted)]">{survey.status}</span>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => onNavigateToBuilder(survey.id, 'builder')}
                      className="px-2.5 py-1 bg-white border border-[var(--sw-border)] hover:bg-[var(--sw-bg-soft)] text-[var(--sw-text)] rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                      title="Edit Canvas questions & settings"
                    >
                      Builder
                    </button>
                    <button 
                      onClick={() => onNavigateToBuilder(survey.id, 'responses')}
                      className="px-2.5 py-1 bg-white border border-[var(--sw-border)] hover:bg-[var(--sw-bg-soft)] text-[var(--sw-text)] rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                      title="View submission details list"
                    >
                      Responses
                    </button>
                    <button 
                      onClick={() => onNavigateToBuilder(survey.id, 'analytics')}
                      className="px-2.5 py-1 bg-white border border-[var(--sw-border)] hover:bg-[var(--sw-bg-soft)] text-[var(--sw-text)] rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                      title="View aggregated charts & NPS index"
                    >
                      Analytics
                    </button>
                    {survey.status === 'Published' && (
                      <button 
                        onClick={() => handleCopyLink(survey.slug)}
                        className="p-1 hover:bg-emerald-500/10 text-emerald-300 hover:text-white rounded-lg transition-all cursor-pointer"
                        title="Copy Public Link"
                      >
                        <Globe className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE SURVEY MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <form 
            onSubmit={handleCreateSurvey}
            className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4 text-xs text-slate-800 text-left animate-scale-in font-sans"
          >
            <div>
              <h3 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-200">Create New Custom Survey</h3>
              <p className="text-xs text-slate-500 mt-1">Choose a template or design one from scratch for your team.</p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold block text-[10px] uppercase tracking-wider text-slate-500 font-mono">Survey Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. 2026 Brokerage Technology & Operations Survey" 
                  value={newSurveyName}
                  onChange={(e) => setNewSurveyName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-slate-400 font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold block text-[10px] uppercase tracking-wider text-slate-500 font-mono">Internal Description</label>
                <textarea 
                  placeholder="What is this survey for? (visible to internal team)" 
                  value={newSurveyDesc}
                  onChange={(e) => setNewSurveyDesc(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 h-16 resize-none focus:bg-white focus:outline-none focus:border-slate-400 font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold block text-[10px] uppercase tracking-wider text-slate-500 font-mono">Category</label>
                  <select 
                    value={newSurveyCategory}
                    onChange={(e) => setNewSurveyCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-400 font-sans"
                  >
                    <option value="Operational Intelligence">Operational Intelligence</option>
                    <option value="Agent Feedback">Agent Feedback</option>
                    <option value="Compliance Diagnostics">Compliance Diagnostics</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold block text-[10px] uppercase tracking-wider text-slate-500 font-mono">Base Template</label>
                  <select 
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-400 font-sans"
                  >
                    <option value="">Blank Survey (Scratch)</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button 
                type="button" 
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all cursor-pointer font-sans"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isCreating}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer font-sans"
              >
                {isCreating ? 'Creating...' : 'Create Survey Envelope'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* GENERATE WITH AI MODAL */}
      {showAiModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <form 
            onSubmit={handleGenerateWithAi}
            className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4 text-xs text-slate-800 text-left animate-scale-in font-sans"
          >
            <div>
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <Zap className="w-4 h-4 text-slate-900" />
                <h3 className="font-bold text-sm text-slate-900">AI Survey Generator</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">Describe your target research goal, and Gemini will compile custom survey questions for real estate operations.</p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold block text-[10px] uppercase tracking-wider text-slate-500 font-mono">Survey Topic *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Annual Brokerage Commission Split Survey" 
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-slate-400 font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold block text-[10px] uppercase tracking-wider text-slate-500 font-mono">Research Goal / Description</label>
                <textarea 
                  placeholder="e.g. Gather feedback from agents about split structures, processing delays, and QuickBooks integrations..." 
                  value={aiDesc}
                  onChange={(e) => setAiDesc(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 h-16 resize-none focus:bg-white focus:outline-none focus:border-slate-400 font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold block text-[10px] uppercase tracking-wider text-slate-500 font-mono">Target categories (optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. SPLITS, ADMIN FEES, AUDIT SPEED, COMPLIANCE" 
                  value={aiCategories}
                  onChange={(e) => setAiCategories(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-slate-400 font-sans"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button 
                type="button" 
                onClick={() => setShowAiModal(false)}
                className="px-4 py-2 border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all cursor-pointer font-sans"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isGenerating}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer font-sans"
              >
                {isGenerating ? 'Compiling schema with AI...' : 'Generate with Gemini'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
