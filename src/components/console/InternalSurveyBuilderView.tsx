import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Zap, 
  Settings, 
  Eye, 
  Play, 
  Check, 
  AlertTriangle, 
  Download, 
  Plus, 
  Trash2, 
  Copy, 
  ChevronUp, 
  ChevronDown, 
  Clock, 
  User, 
  Mail, 
  Tag, 
  CheckCircle,
  HelpCircle,
  FileText,
  BarChart3,
  Moon,
  Sun,
  Palette
} from 'lucide-react';

interface InternalSurveyBuilderViewProps {
  surveyId: string;
  initialMode: 'builder' | 'responses' | 'analytics';
  onBack: () => void;
}

export default function InternalSurveyBuilderView({ 
  surveyId, 
  initialMode, 
  onBack 
}: InternalSurveyBuilderViewProps) {
  const [activeMode, setActiveMode] = useState<'builder' | 'responses' | 'analytics'>(initialMode);
  const [survey, setSurvey] = useState<any>(null);
  const [schema, setSchema] = useState<any>({ pages: [] });
  const [versions, setVersions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Builder active state
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const [activeInspectorTab, setActiveInspectorTab] = useState<'theme' | 'logic' | 'scoring'>('theme');

  // Responses active state
  const [responses, setResponses] = useState<any[]>([]);
  const [selectedResponse, setSelectedResponse] = useState<any>(null);
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [followUpStatus, setFollowUpStatus] = useState('new');
  
  // Analytics state
  const [analytics, setAnalytics] = useState<any>(null);

  // Load all survey data
  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const sRes = await fetch(`/api/surveys/${surveyId}`);
      const sData = await sRes.json();
      if (sRes.ok && sData.success) {
        setSurvey(sData.survey);
        setVersions(sData.versions || []);
        
        // Load schema from the latest version draft
        const latestVersion = sData.versions?.[0];
        if (latestVersion && latestVersion.schema) {
          setSchema(latestVersion.schema);
        }
      }

      // Load responses
      const rRes = await fetch(`/api/surveys/${surveyId}/responses`);
      const rData = await rRes.json();
      if (rRes.ok && rData.success) {
        setResponses(rData.list || []);
      }

      // Load analytics
      const aRes = await fetch(`/api/surveys/${surveyId}/analytics`);
      const aData = await aRes.json();
      if (aRes.ok && aData.success) {
        setAnalytics(aData.metrics);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [surveyId]);

  // Sync sub-navigation URLs on mode click
  const handleModeChange = (mode: 'builder' | 'responses' | 'analytics') => {
    setActiveMode(mode);
    window.history.pushState({}, '', `/internal/market-intelligence/surveys/${surveyId}/${mode}`);
    try {
      window.dispatchEvent(new Event('pushstate_navigation'));
    } catch (e) {
      if (typeof document !== 'undefined' && document.createEvent) {
        const evt = document.createEvent('Event');
        evt.initEvent('pushstate_navigation', true, true);
        window.dispatchEvent(evt);
      }
    }
  };

  // Canvas builder actions
  const handleSaveSchema = async (updatedSchema: any = schema) => {
    setIsSaving(true);
    setSaveMessage('');
    try {
      const res = await fetch(`/api/surveys/${surveyId}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schema: updatedSchema,
          theme: survey.theme,
          settings: survey.settings
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSaveMessage('Draft auto-saved successfully.');
        setTimeout(() => setSaveMessage(''), 2000);
      }
    } catch (e) {
      setSaveMessage('Auto-save failed.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!confirm('Are you sure you want to publish these changes? This will increment the survey version and go live immediately.')) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/surveys/${surveyId}/publish`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Survey published successfully! Now live.');
        loadAllData();
      } else {
        alert(data.message || 'Publishing failed.');
      }
    } catch (e) {
      alert('Error occurred publishing.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddPage = () => {
    const updated = { ...schema };
    const newPage = {
      id: `page_${Date.now()}`,
      title: `Page ${updated.pages.length + 1}`,
      blocks: []
    };
    updated.pages.push(newPage);
    setSchema(updated);
    setSelectedPageIndex(updated.pages.length - 1);
    handleSaveSchema(updated);
  };

  const handleDeletePage = (index: number) => {
    if (schema.pages.length <= 1) {
      alert('Surveys must contain at least one page.');
      return;
    }
    if (!confirm('Delete this page and all questions inside?')) return;
    const updated = { ...schema };
    updated.pages.splice(index, 1);
    setSchema(updated);
    setSelectedPageIndex(Math.max(0, index - 1));
    handleSaveSchema(updated);
  };

  const handleAddBlock = (type: string) => {
    const updated = { ...schema };
    if (!updated.pages || updated.pages.length === 0) {
      updated.pages = [{
        id: `page_${Date.now()}`,
        title: 'Page 1',
        blocks: []
      }];
    }
    const activePage = updated.pages[selectedPageIndex] || updated.pages[0];
    const newBlock = {
      id: `q_${Date.now()}`,
      type,
      title: 'New Question',
      required: false,
      options: type === 'dropdown' || type === 'checkboxes' ? ['Option 1', 'Option 2'] : undefined,
      min: type === 'rating' ? 1 : undefined,
      max: type === 'rating' ? 5 : undefined
    };
    activePage.blocks = activePage.blocks || [];
    activePage.blocks.push(newBlock);
    setSchema(updated);
    handleSaveSchema(updated);
  };

  const handleUpdateBlock = (blockIndex: number, updates: any) => {
    const updated = { ...schema };
    const activePage = updated.pages[selectedPageIndex];
    activePage.blocks[blockIndex] = {
      ...activePage.blocks[blockIndex],
      ...updates
    };
    setSchema(updated);
    handleSaveSchema(updated);
  };

  const handleDeleteBlock = (blockIndex: number) => {
    const updated = { ...schema };
    const activePage = updated.pages[selectedPageIndex];
    activePage.blocks.splice(blockIndex, 1);
    setSchema(updated);
    handleSaveSchema(updated);
  };

  const handleMoveBlock = (blockIndex: number, direction: 'up' | 'down') => {
    const updated = { ...schema };
    const activePage = updated.pages[selectedPageIndex];
    const blocks = activePage.blocks;
    if (direction === 'up' && blockIndex > 0) {
      const temp = blocks[blockIndex];
      blocks[blockIndex] = blocks[blockIndex - 1];
      blocks[blockIndex - 1] = temp;
    } else if (direction === 'down' && blockIndex < blocks.length - 1) {
      const temp = blocks[blockIndex];
      blocks[blockIndex] = blocks[blockIndex + 1];
      blocks[blockIndex + 1] = temp;
    }
    setSchema(updated);
    handleSaveSchema(updated);
  };

  // Response inspection & note saving
  const handleSelectResponse = (resp: any) => {
    setSelectedResponse(resp);
    setFollowUpStatus(resp.followUpStatus || 'new');
    setFollowUpNotes('');
  };

  const handleSaveNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResponse) return;

    try {
      const res = await fetch(`/api/surveys/${surveyId}/responses/${selectedResponse.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          followUpStatus,
          notes: followUpNotes.trim() || undefined
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Notes and follow-up status updated successfully.');
        setSelectedResponse(data.response);
        // Refresh response table list
        loadAllData();
      }
    } catch (e) {
      alert('Failed to save follow-up notes.');
    }
  };

  // Preset themes configuration
  const themePresets = [
    {
      name: 'Shapework Default',
      headingFont: 'sans',
      bodyFont: 'sans',
      accentColor: '#00635C',
      buttonBg: '#01362D',
      buttonText: '#ffffff',
      pageBg: '#fafafa',
      cardBg: '#ffffff',
      primaryText: '#1E2520',
      secondaryText: '#536A61'
    },
    {
      name: 'Nest Realty',
      headingFont: 'serif',
      bodyFont: 'sans',
      accentColor: '#00635C',
      buttonBg: '#01362D',
      buttonText: '#ffffff',
      pageBg: '#F5F5F0',
      cardBg: '#ffffff',
      primaryText: '#1E2520',
      secondaryText: '#536A61'
    },
    {
      name: 'Modern Minimal',
      headingFont: 'sans',
      bodyFont: 'sans',
      accentColor: '#18181b',
      buttonBg: '#09090b',
      buttonText: '#ffffff',
      pageBg: '#f4f4f5',
      cardBg: '#ffffff',
      primaryText: '#09090b',
      secondaryText: '#71717a'
    },
    {
      name: 'Warm Editorial',
      headingFont: 'serif',
      bodyFont: 'serif',
      accentColor: '#7c2d12',
      buttonBg: '#451a03',
      buttonText: '#ffffff',
      pageBg: '#fdf6e2',
      cardBg: '#fffdf5',
      primaryText: '#27272a',
      secondaryText: '#71717a'
    }
  ];

  const handleApplyTheme = (preset: any) => {
    const updatedSurvey = {
      ...survey,
      theme: {
        ...preset,
        preset: preset.name
      }
    };
    setSurvey(updatedSurvey);
    handleSaveSchema();
  };

  if (isLoading || !survey) {
    return (
      <div className="p-12 text-center text-xs text-[var(--sw-muted)] space-y-2">
        <LoaderSpinner />
        <p>Loading Survey Studio Workspace...</p>
      </div>
    );
  }

  const activePage = schema.pages?.[selectedPageIndex];

  return (
    <div className="flex flex-col h-[calc(100vh-60px)] -mx-8 -my-6 bg-[var(--sw-bg-soft)] text-xs text-[var(--sw-text)] select-none">
      
      {/* Workspace Header Bar */}
      <div className="bg-[var(--sw-card)] border-b border-[var(--sw-border)] px-6 py-3 flex items-center justify-between z-10 shrink-0">
        {/* Back and Title */}
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-1.5 hover:bg-[var(--sw-bg-soft)] text-[var(--sw-muted)] rounded-lg transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            {/* Survey name inline editable */}
            <input 
              type="text" 
              value={survey.name}
              onChange={(e) => {
                setSurvey({ ...survey, name: e.target.value });
                handleSaveSchema();
              }}
              className="font-serif font-bold text-sm bg-transparent border-0 border-b border-transparent hover:border-[var(--sw-border)] focus:border-emerald-500/50 focus:outline-none px-1 text-[var(--sw-text)] leading-none"
            />
            <div className="flex items-center gap-2 mt-0.5 px-1 text-[10px] text-[var(--sw-muted)] font-medium">
              <span>Category: {survey.category}</span>
              <span>•</span>
              <span>Version: {versions[0]?.versionNumber || 1} (Draft)</span>
            </div>
          </div>
        </div>

        {/* Studio Subtabs */}
        <div className="flex items-center bg-[var(--sw-bg-soft)] border border-[var(--sw-border)] rounded-xl p-0.5 gap-1 font-mono text-[9px] font-bold uppercase tracking-wider">
          {[
            { id: 'builder', label: 'Questions' },
            { id: 'responses', label: 'Responses' },
            { id: 'analytics', label: 'Analytics' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => handleModeChange(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeMode === tab.id 
                  ? 'bg-emerald-700/15 text-emerald-300 font-bold border border-emerald-500/25'
                  : 'text-[var(--sw-muted)] hover:text-[var(--sw-text)] border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Publish Action & Status */}
        <div className="flex items-center gap-3">
          {saveMessage && (
            <span className="text-[10px] font-mono text-emerald-400 animate-pulse font-medium">{saveMessage}</span>
          )}
          <button
            onClick={handlePublish}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all shadow-sm cursor-pointer select-none"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Publish Changes</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Body Switcher */}
      <div className="flex-1 overflow-hidden">
        
        {/* ========================================================= */}
        {/* QUESTIONS WORKSPACE (BUILDER CANVAS) */}
        {/* ========================================================= */}
        {activeMode === 'builder' && (
          <div className="h-full flex overflow-hidden">
            {/* Left Block Library */}
            <div className="w-64 bg-[var(--sw-card)] border-r border-[var(--sw-border)] p-4 flex flex-col gap-4 overflow-y-auto shrink-0 text-left">
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--sw-muted)] font-mono">Form Block Library</h4>
                <p className="text-[10px] text-[var(--sw-muted)] mt-1 font-sans">Click to insert question blocks into the center canvas.</p>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {[
                  { type: 'short_text', name: 'Short Answer text', desc: 'Single-line text input fields' },
                  { type: 'long_text', name: 'Long Answer text', desc: 'Multi-line paragraph text areas' },
                  { type: 'email', name: 'Email address', desc: 'Requires email syntax validity' },
                  { type: 'dropdown', name: 'Dropdown picker', desc: 'Select one option from a list' },
                  { type: 'checkboxes', name: 'Multiple selection', desc: 'Select multiple checklist fields' },
                  { type: 'rating', name: '1-5 Rating scale', desc: 'Frequency or value scales' }
                ].map(block => (
                  <button
                    key={block.type}
                    onClick={() => handleAddBlock(block.type)}
                    className="w-full p-2.5 bg-[var(--sw-bg-soft)]/40 hover:bg-[var(--sw-bg-soft)] border border-[var(--sw-border)] rounded-xl text-left transition-all hover:scale-[1.01] hover:border-emerald-500/30 cursor-pointer"
                  >
                    <span className="font-bold block text-[11px] text-[var(--sw-text)]">{block.name}</span>
                    <span className="text-[9px] text-[var(--sw-muted)] mt-0.5 block truncate">{block.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Center Canvas */}
            <div className="flex-1 flex flex-col bg-[var(--sw-bg-soft)] overflow-hidden">
              
              {/* Pages horizontal navigation bar */}
              <div className="px-6 py-2 bg-[var(--sw-card)] border-b border-[var(--sw-border)] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                  {schema.pages?.map((page: any, idx: number) => (
                    <div key={page.id} className="flex items-center shrink-0">
                      <button
                        onClick={() => setSelectedPageIndex(idx)}
                        className={`px-3 py-1 rounded-lg font-mono text-[10px] font-bold transition-all border ${
                          selectedPageIndex === idx
                            ? 'bg-[#00635C] text-white border-emerald-500/25'
                            : 'bg-[var(--sw-bg-soft)] text-[var(--sw-muted)] hover:text-[var(--sw-text)] border-[var(--sw-border)]'
                        }`}
                      >
                        P{idx + 1}: {page.title}
                      </button>
                      {schema.pages.length > 1 && (
                        <button 
                          onClick={() => handleDeletePage(idx)}
                          className="p-1 hover:bg-rose-500/10 text-[var(--sw-muted)] hover:text-rose-400 rounded transition-all cursor-pointer shrink-0 ml-0.5"
                          title="Delete Page"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={handleAddPage}
                    className="p-1 hover:bg-[var(--sw-bg-soft)] text-emerald-400 border border-dashed border-[var(--sw-border)] rounded-lg flex items-center justify-center shrink-0 cursor-pointer ml-2"
                    title="Add Page Break"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Canvas items scroll workspace */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
                {activePage ? (
                  <div className="max-w-2xl mx-auto space-y-4">
                    {/* Page title editor */}
                    <div className="bg-[var(--sw-card)] border border-[var(--sw-border)] p-4 rounded-xl shadow-sm space-y-2">
                      <label className="text-[9px] font-bold uppercase tracking-wider text-[var(--sw-muted)] font-mono">Page Headers</label>
                      <input 
                        type="text"
                        value={activePage.title}
                        onChange={(e) => {
                          const updated = { ...schema };
                          updated.pages[selectedPageIndex].title = e.target.value;
                          setSchema(updated);
                          handleSaveSchema(updated);
                        }}
                        className="w-full text-sm font-bold bg-transparent border-0 border-b border-[var(--sw-border)]/50 focus:border-emerald-500/50 focus:outline-none py-1 text-[var(--sw-text)] font-serif"
                        placeholder="Page Title"
                      />
                      <input 
                        type="text"
                        value={activePage.description || ''}
                        onChange={(e) => {
                          const updated = { ...schema };
                          updated.pages[selectedPageIndex].description = e.target.value;
                          setSchema(updated);
                          handleSaveSchema(updated);
                        }}
                        className="w-full text-[10px] bg-transparent border-0 border-b border-transparent focus:border-emerald-500/50 focus:outline-none py-1 text-[var(--sw-muted)] font-sans"
                        placeholder="Page Description / Instruction subtext (optional)"
                      />
                    </div>

                    {/* Question Blocks list */}
                    {activePage.blocks?.length === 0 ? (
                      <div className="border border-dashed border-[var(--sw-border)] rounded-xl p-12 text-center text-[var(--sw-muted)] space-y-2">
                        <Plus className="w-8 h-8 mx-auto opacity-35 text-emerald-400" />
                        <p className="font-bold text-[var(--sw-text)]">This page is empty</p>
                        <p className="text-[10px]">Add block items from the Left Library list to design your questionnaire.</p>
                      </div>
                    ) : (
                      activePage.blocks.map((block: any, bIdx: number) => (
                        <div 
                          key={block.id} 
                          className="bg-[var(--sw-card)] border border-[var(--sw-border)] rounded-xl p-4 shadow-sm space-y-3 relative group animate-fade-in"
                        >
                          {/* Block Header: Type indicator + Reordering */}
                          <div className="flex justify-between items-center border-b border-[var(--sw-border)] pb-2 text-[10px]">
                            <span className="font-mono font-bold text-emerald-400 uppercase tracking-widest">{block.type.replace('_', ' ')}</span>
                            
                            <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => handleMoveBlock(bIdx, 'up')}
                                disabled={bIdx === 0}
                                className="p-1 hover:bg-[var(--sw-bg-soft)] rounded text-[var(--sw-muted)] disabled:opacity-30 cursor-pointer"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleMoveBlock(bIdx, 'down')}
                                disabled={bIdx === activePage.blocks.length - 1}
                                className="p-1 hover:bg-[var(--sw-bg-soft)] rounded text-[var(--sw-muted)] disabled:opacity-30 cursor-pointer"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => {
                                  const updated = { ...schema };
                                  const active = updated.pages[selectedPageIndex];
                                  const cloned = { ...active.blocks[bIdx], id: `q_${Date.now()}` };
                                  active.blocks.splice(bIdx + 1, 0, cloned);
                                  setSchema(updated);
                                  handleSaveSchema(updated);
                                }}
                                className="p-1 hover:bg-[var(--sw-bg-soft)] rounded text-[var(--sw-muted)] cursor-pointer"
                                title="Duplicate Block"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleDeleteBlock(bIdx)}
                                className="p-1 hover:bg-rose-500/10 hover:text-rose-400 rounded text-[var(--sw-muted)] cursor-pointer"
                                title="Delete Block"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Block Label editor */}
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-[var(--sw-muted)] uppercase tracking-wider block font-mono">Question Label</label>
                            <input 
                              type="text" 
                              value={block.title}
                              onChange={(e) => handleUpdateBlock(bIdx, { title: e.target.value })}
                              className="w-full px-3 py-1.5 bg-[var(--sw-bg-soft)] border border-[var(--sw-border)] rounded-xl focus:outline-none focus:border-emerald-500/40 text-xs font-semibold text-[var(--sw-text)]"
                              placeholder="Describe the question text..."
                            />
                          </div>

                          {/* Options editor for choice list widgets */}
                          {(block.type === 'dropdown' || block.type === 'checkboxes') && (
                            <div className="space-y-1.5 p-3 bg-[var(--sw-bg-soft)]/50 border border-[var(--sw-border)] rounded-xl">
                              <label className="text-[9px] font-bold text-[var(--sw-muted)] uppercase tracking-wider block font-mono">Options Choices</label>
                              {block.options?.map((opt: string, optIdx: number) => (
                                <div key={optIdx} className="flex items-center gap-2">
                                  <input 
                                    type="text" 
                                    value={opt}
                                    onChange={(e) => {
                                      const updatedOpts = [...block.options];
                                      updatedOpts[optIdx] = e.target.value;
                                      handleUpdateBlock(bIdx, { options: updatedOpts });
                                    }}
                                    className="flex-1 px-2.5 py-1 bg-[var(--sw-card)] border border-[var(--sw-border)] rounded-lg text-[11px] focus:outline-none"
                                  />
                                  {block.options.length > 2 && (
                                    <button 
                                      type="button"
                                      onClick={() => {
                                        const updatedOpts = [...block.options];
                                        updatedOpts.splice(optIdx, 1);
                                        handleUpdateBlock(bIdx, { options: updatedOpts });
                                      }}
                                      className="p-1 hover:bg-rose-500/10 text-[var(--sw-muted)] hover:text-rose-400 rounded cursor-pointer"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedOpts = [...(block.options || [])];
                                  updatedOpts.push(`Option ${updatedOpts.length + 1}`);
                                  handleUpdateBlock(bIdx, { options: updatedOpts });
                                }}
                                className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors mt-1 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Add Choice option</span>
                              </button>
                            </div>
                          )}

                          {/* Block Settings Footer */}
                          <div className="flex items-center justify-between border-t border-[var(--sw-border)]/50 pt-2 text-[10px]">
                            {/* Required trigger */}
                            <label className="flex items-center gap-1.5 text-[var(--sw-muted)] cursor-pointer select-none">
                              <input 
                                type="checkbox"
                                checked={block.required || false}
                                onChange={(e) => handleUpdateBlock(bIdx, { required: e.target.checked })}
                                className="accent-emerald-500"
                              />
                              <span>Required Answer field</span>
                            </label>
                            
                            {/* Field key name identifier */}
                            <span className="font-mono text-[9px] text-[var(--sw-muted-light)]">Field ID: {block.id}</span>
                          </div>

                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="text-center p-12 text-[var(--sw-muted)]">No Pages configured.</div>
                )}
              </div>
            </div>

            {/* Right Inspector Sidebar Settings */}
            <div className="w-80 bg-[var(--sw-card)] border-l border-[var(--sw-border)] p-4 flex flex-col gap-4 overflow-y-auto shrink-0 text-left">
              {/* Sidebar Tabs */}
              <div className="flex border-b border-[var(--sw-border)] pb-2 text-[10px] font-mono font-bold uppercase tracking-wider gap-3">
                {[
                  { id: 'theme', label: 'Theme Design', icon: Palette },
                  { id: 'logic', label: 'Logic', icon: Settings },
                  { id: 'scoring', label: 'Scoring', icon: HelpCircle }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveInspectorTab(item.id as any)}
                    className={`pb-1 transition-all cursor-pointer ${
                      activeInspectorTab === item.id 
                        ? 'border-b-2 border-emerald-400 text-white'
                        : 'text-[var(--sw-muted)] hover:text-white border-b-2 border-transparent'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Theme Customizer Panel */}
              {activeInspectorTab === 'theme' && (
                <div className="space-y-4">
                  <div>
                    <h5 className="font-bold text-[11px] text-[var(--sw-text)]">Visual Design Studio</h5>
                    <p className="text-[10px] text-[var(--sw-muted)] mt-1">Apply curated typography and color theme presets.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {themePresets.map(preset => (
                      <button
                        key={preset.name}
                        onClick={() => handleApplyTheme(preset)}
                        className={`p-2 bg-[var(--sw-bg-soft)] border rounded-xl text-left transition-all cursor-pointer ${
                          survey.theme?.preset === preset.name 
                            ? 'border-emerald-500 bg-emerald-700/5' 
                            : 'border-[var(--sw-border)] hover:border-emerald-500/35'
                        }`}
                      >
                        <span className="font-bold block text-[10px] leading-tight text-[var(--sw-text)]">{preset.name}</span>
                        <div className="flex gap-1.5 mt-2">
                          <span className="w-3.5 h-3.5 rounded-full border border-[var(--sw-border)] block" style={{ backgroundColor: preset.pageBg }} />
                          <span className="w-3.5 h-3.5 rounded-full border border-[var(--sw-border)] block" style={{ backgroundColor: preset.accentColor }} />
                          <span className="w-3.5 h-3.5 rounded-full border border-[var(--sw-border)] block" style={{ backgroundColor: preset.cardBg }} />
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-[var(--sw-border)] pt-3 space-y-3">
                    <h6 className="font-bold text-[10px] uppercase text-[var(--sw-muted)] tracking-wider font-mono">Custom overrides</h6>
                    
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-wider block text-[var(--sw-muted)]">Brand Accent / Button BG</label>
                      <div className="flex gap-2">
                        <input 
                          type="color"
                          value={survey.theme?.accentColor || '#00635C'}
                          onChange={(e) => {
                            setSurvey({
                              ...survey,
                              theme: {
                                ...survey.theme,
                                accentColor: e.target.value,
                                buttonBg: e.target.value,
                                preset: 'Custom'
                              }
                            });
                            handleSaveSchema();
                          }}
                          className="w-8 h-8 rounded border border-[var(--sw-border)] bg-transparent cursor-pointer"
                        />
                        <input 
                          type="text" 
                          value={survey.theme?.accentColor || '#00635C'}
                          onChange={(e) => {
                            setSurvey({
                              ...survey,
                              theme: { ...survey.theme, accentColor: e.target.value, buttonBg: e.target.value, preset: 'Custom' }
                            });
                            handleSaveSchema();
                          }}
                          className="flex-1 px-3 bg-[var(--sw-bg-soft)] border border-[var(--sw-border)] rounded-xl font-mono text-[11px]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Logic Triggers Panel */}
              {activeInspectorTab === 'logic' && (
                <div className="space-y-3">
                  <div>
                    <h5 className="font-bold text-[11px] text-[var(--sw-text)]">Conditional Logic Rules</h5>
                    <p className="text-[10px] text-[var(--sw-muted)] mt-1">Configure branching paths depending on respondent answers.</p>
                  </div>
                  
                  <div className="border border-dashed border-[var(--sw-border)] rounded-xl p-4 text-center text-[var(--sw-muted)]">
                    <p className="font-medium text-[var(--sw-text)]">Conditional logic active</p>
                    <p className="text-[9px] mt-1">Logic triggers are evaluated dynamically during respondent page-turns. Edit rules in JSON schema definitions.</p>
                  </div>
                </div>
              )}

              {/* Scoring Configurations Panel */}
              {activeInspectorTab === 'scoring' && (
                <div className="space-y-3">
                  <div>
                    <h5 className="font-bold text-[11px] text-[var(--sw-text)]">Operational Intelligence Models</h5>
                    <p className="text-[10px] text-[var(--sw-muted)] mt-1">Map rating questions to core back-office KPI domains.</p>
                  </div>
                  
                  <div className="p-3 bg-[var(--sw-bg-soft)]/50 border border-[var(--sw-border)] rounded-xl space-y-1.5">
                    <span className="font-bold text-[10px] text-[var(--sw-text)] block font-mono">Mapped Categories</span>
                    <ul className="space-y-1 font-mono text-[9px] text-[var(--sw-muted)]">
                      <li>• **Owner Freedom**: pulledIntoIssues, bottleneckPerson</li>
                      <li>• **Transaction & Compliance**: workFallsThroughCracks, waitingOnApprovals, noOperatingRecord</li>
                      <li>• **Team & People**: infoInSilos, repeatedQuestions</li>
                      <li>• **Office & Operations**: processesChange, struggleFindInfo, sideConversations</li>
                      <li>• **Technology Debt**: systemsUsed count</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* RESPONSES WORKSPACE */}
        {/* ========================================================= */}
        {activeMode === 'responses' && (
          <div className="h-full flex overflow-hidden text-left bg-[var(--sw-bg-soft)]">
            
            {/* Responses List Table Column */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-[var(--sw-border)] bg-[var(--sw-card)] flex items-center justify-between shrink-0">
                <h3 className="font-serif font-bold text-xs text-[var(--sw-text)]">Collected Responses ({responses.length})</h3>
                <a 
                  href={`/api/surveys/${surveyId}/responses?format=csv`}
                  download
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-700/10 hover:bg-emerald-700/20 text-emerald-300 border border-emerald-500/25 rounded-xl text-[10px] font-bold cursor-pointer transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV export</span>
                </a>
              </div>

              <div className="flex-1 overflow-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-[var(--sw-card)] border-b border-[var(--sw-border)] text-[9px] uppercase tracking-wider text-[var(--sw-muted)] font-mono font-bold text-left">
                      <th className="p-3 pl-6">Respondent Profile</th>
                      <th className="p-3">Email Address</th>
                      <th className="p-3">IQ Score</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 pr-6">Submitted Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--sw-border)]">
                    {responses.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-12 text-center text-[var(--sw-muted)]">No submissions received yet.</td>
                      </tr>
                    ) : (
                      responses.map(resp => (
                        <tr 
                          key={resp.id} 
                          onClick={() => handleSelectResponse(resp)}
                          className={`hover:bg-emerald-500/5 transition-colors cursor-pointer ${
                            selectedResponse?.id === resp.id ? 'bg-emerald-500/10 font-bold' : ''
                          }`}
                        >
                          <td className="p-3 pl-6">
                            <span className="font-bold text-[var(--sw-text)] block">{resp.metadata?.brokerageName || 'Anonymous'}</span>
                            <span className="text-[10px] text-[var(--sw-muted)] font-medium font-sans">{resp.metadata?.respondentName || 'N/A'} ({resp.metadata?.role || 'N/A'})</span>
                          </td>
                          <td className="p-3 font-mono text-[10px] text-[var(--sw-muted)]">{resp.respondentEmail || 'anonymous@respondent.com'}</td>
                          <td className="p-3 font-mono font-extrabold text-emerald-400">{resp.calculatedScores?.overallScore !== undefined ? `${resp.calculatedScores.overallScore}/100` : 'N/A'}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded font-mono text-[9px] uppercase font-bold border ${
                              resp.followUpStatus === 'converted' ? 'bg-emerald-50 text-emerald-700 border-emerald-250' :
                              resp.followUpStatus === 'contacted' ? 'bg-amber-50 text-amber-700 border-amber-250' :
                              resp.followUpStatus === 'archived' ? 'bg-stone-100 text-stone-600 border-stone-250' :
                              'bg-rose-50 text-rose-700 border-rose-250'
                            }`}>{resp.followUpStatus || 'new'}</span>
                          </td>
                          <td className="p-3 pr-6 text-[10px] text-[var(--sw-muted)] font-mono">{new Date(resp.submittedAt || resp.createdAt).toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Response Detail Inspector slide-out panel */}
            {selectedResponse && (
              <div className="w-[450px] bg-[var(--sw-card)] border-l border-[var(--sw-border)] flex flex-col overflow-hidden shrink-0 animate-fade-in">
                {/* Panel Header */}
                <div className="p-4 border-b border-[var(--sw-border)] flex items-center justify-between shrink-0">
                  <div>
                    <h4 className="font-serif font-bold text-xs text-[var(--sw-text)]">Inspect Submission details</h4>
                    <span className="text-[9px] font-mono text-[var(--sw-muted)]">ID: {selectedResponse.id}</span>
                  </div>
                  <button 
                    onClick={() => setSelectedResponse(null)}
                    className="p-1 hover:bg-[var(--sw-bg-soft)] rounded-lg text-[var(--sw-muted)] cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 hover:text-rose-400" />
                  </button>
                </div>

                {/* Panel scrollable content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-5">
                  {/* Category Score summary list */}
                  {selectedResponse.calculatedScores?.categoryScores && (
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold uppercase tracking-wider text-[var(--sw-muted)] font-mono">Category index scores</label>
                      <div className="grid grid-cols-2 gap-2 text-center font-mono">
                        {Object.entries(selectedResponse.calculatedScores.categoryScores).map(([cat, val]: any) => (
                          <div key={cat} className="p-2 bg-[var(--sw-bg-soft)] border border-[var(--sw-border)] rounded-xl space-y-0.5">
                            <span className="text-[8px] font-bold text-[var(--sw-muted)] uppercase block leading-none truncate">{cat.replace(/([A-Z])/g, ' $1')}</span>
                            <span className="text-xs font-extrabold text-emerald-400 block">{val}/100</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Answers details */}
                  <div className="space-y-2.5">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-[var(--sw-muted)] font-mono block">Submitted Questionnaire answers</label>
                    <div className="space-y-2 divide-y divide-[var(--sw-border)]/50">
                      {Object.entries(selectedResponse.answers || {}).map(([qId, ans]: any) => {
                        // Find block label from schema
                        let label = qId.replace('q_', '').replace(/([A-Z])/g, ' $1');
                        schema.pages?.forEach((p: any) => {
                          const block = p.blocks?.find((b: any) => b.id === qId);
                          if (block) label = block.title;
                        });

                        return (
                          <div key={qId} className="pt-2 text-xs">
                            <span className="text-[var(--sw-muted)] block font-medium leading-normal">{label}</span>
                            <span className="font-bold text-[var(--sw-text)] block mt-1">
                              {Array.isArray(ans) ? ans.join('; ') : String(ans || 'N/A')}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Operational Notes / Triage details */}
                  <form onSubmit={handleSaveNotes} className="border-t border-[var(--sw-border)] pt-4 space-y-3">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-[var(--sw-muted)] font-mono block">Triage Classification notes</label>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[8px] uppercase tracking-wider block text-[var(--sw-muted)]">Follow-up Triage status</label>
                        <select
                          value={followUpStatus}
                          onChange={(e) => setFollowUpStatus(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-[var(--sw-bg-soft)] border border-[var(--sw-border)] rounded-xl focus:outline-none"
                        >
                          <option value="new">new (leads)</option>
                          <option value="contacted">contacted</option>
                          <option value="converted">converted</option>
                          <option value="archived">archived</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[8px] uppercase tracking-wider block text-[var(--sw-muted)]">Assigned Owner role</label>
                        <select
                          disabled
                          className="w-full px-2.5 py-1.5 bg-[var(--sw-bg-soft)] border border-[var(--sw-border)] rounded-xl opacity-60 cursor-not-allowed"
                        >
                          <option>Sarah Jenkins (usr_sarah)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] uppercase tracking-wider block text-[var(--sw-muted)]">Add Internal Note</label>
                      <textarea
                        value={followUpNotes}
                        onChange={(e) => setFollowUpNotes(e.target.value)}
                        placeholder="Log meeting takeaways, outreach notes, or pilot timeline commitments..."
                        className="w-full px-3 py-1.5 bg-[var(--sw-bg-soft)] border border-[var(--sw-border)] rounded-xl h-20 resize-none focus:outline-none focus:border-emerald-500/40"
                      />
                    </div>

                    {selectedResponse.internalTags?.length > 0 && (
                      <div className="space-y-1.5">
                        <label className="text-[8px] uppercase tracking-wider block text-[var(--sw-muted)]">Historical Note Logs</label>
                        <div className="space-y-2 bg-[var(--sw-bg-soft)]/50 p-2.5 rounded-xl border border-[var(--sw-border)]">
                          {selectedResponse.internalTags.map((tag: string, tIdx: number) => (
                            <div key={tIdx} className="text-[10px] pb-1.5 border-b border-[var(--sw-border)] last:border-b-0 last:pb-0">
                              <span className="text-[var(--sw-muted)] italic block">{tag}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all shadow-sm cursor-pointer"
                    >
                      Update Triage Classification
                    </button>
                  </form>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ========================================================= */}
        {/* ANALYTICS WORKSPACE */}
        {/* ========================================================= */}
        {activeMode === 'analytics' && (
          <div className="h-full overflow-y-auto p-6 bg-[var(--sw-bg-soft)] text-left">
            {!analytics ? (
              <div className="p-12 text-center text-xs text-[var(--sw-muted)]">No analytics available yet. Make sure you submit some surveys.</div>
            ) : (
              <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
                {/* Top overview statistics grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Submissions', val: analytics.totalResponses || 0, desc: 'All incoming response rows' },
                    { label: 'Completed surveys', val: analytics.completedCount || 0, desc: 'Survey forms fully submitted' },
                    { label: 'Completion Rate', val: `${analytics.completionRate || 0}%`, desc: 'Average page transition success' },
                    { label: 'NPS Index Index', val: analytics.npsScore !== null ? `${analytics.npsScore > 0 ? '+' : ''}${analytics.npsScore}` : 'N/A', desc: 'Promoters minus detractors' }
                  ].map((stat, idx) => (
                    <div key={idx} className="bg-[var(--sw-card)] border border-[var(--sw-border)] p-4 rounded-xl shadow-sm space-y-1">
                      <span className="text-[9px] font-bold text-[var(--sw-muted)] uppercase tracking-wider font-mono block leading-none">{stat.label}</span>
                      <span className="text-xl font-extrabold text-white font-mono block">{stat.val}</span>
                      <span className="text-[9px] text-[var(--sw-muted)] font-medium font-sans block">{stat.desc}</span>
                    </div>
                  ))}
                </div>

                {/* Answers Distributions for rating/choices */}
                <div className="bg-[var(--sw-card)] border border-[var(--sw-border)] p-5 rounded-xl shadow-sm space-y-6">
                  <div>
                    <h3 className="font-serif font-bold text-xs text-[var(--sw-text)]">Question Choice Distributions</h3>
                    <p className="text-[10px] text-[var(--sw-muted)] mt-0.5">Aggregated answer values across all active question blocks.</p>
                  </div>

                  <div className="space-y-6 divide-y divide-[var(--sw-border)]/50">
                    {Object.entries(analytics.answersDistribution || {}).map(([qId, dist]: any) => {
                      // Lookup block name
                      let label = qId.replace('q_', '').replace(/([A-Z])/g, ' $1');
                      schema.pages?.forEach((p: any) => {
                        const block = p.blocks?.find((b: any) => b.id === qId);
                        if (block) label = block.title;
                      });

                      const totalSelections = Object.values(dist).reduce((a: any, b: any) => a + b, 0) as number;

                      return (
                        <div key={qId} className="pt-4 first:pt-0 space-y-2">
                          <h4 className="font-semibold text-xs text-[var(--sw-text)] leading-snug">{label}</h4>
                          <div className="space-y-1.5 max-w-xl">
                            {Object.entries(dist).map(([val, count]: any) => {
                              const percent = totalSelections > 0 ? Math.round((count / totalSelections) * 100) : 0;
                              return (
                                <div key={val} className="space-y-1">
                                  <div className="flex justify-between text-[10px] text-[var(--sw-muted)] font-medium">
                                    <span className="text-[var(--sw-text)] font-semibold">{val}</span>
                                    <span>{count} selection(s) ({percent}%)</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-[var(--sw-bg-soft)] rounded-full overflow-hidden border border-[var(--sw-border)]/50">
                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${percent}%` }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

// Subcomponents / loaders
function LoaderSpinner() {
  return (
    <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin mx-auto" />
  );
}
