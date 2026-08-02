/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  FileText, Zap, Settings, Play, CheckCircle, Clock, Trash2, 
  Eye, RefreshCw, Layers, Tag, ExternalLink, ChevronDown, ChevronRight, Copy, Globe, Share2, Code
} from 'lucide-react';
import { blogService, BlogPost, BlogAutomationSettings, ContentBrief } from '../../services/blogService';

interface AutoBlogGeneratorConsoleProps {
  state: any;
}

export default function AutoBlogGeneratorConsole({ state }: AutoBlogGeneratorConsoleProps) {
  const workspaceId = state.workspaceId || 'nest-realty-demo';

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [settings, setSettings] = useState<BlogAutomationSettings>(blogService.getBlogAutomationSettings(workspaceId));
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  // Content Brief Form State
  const [topic, setTopic] = useState<string>('Navigating Pre-MLS Listings in Coastal NC');
  const [primaryKeyword, setPrimaryKeyword] = useState<string>('pre-mls listings wilmington nc');
  const [secondaryKeywords, setSecondaryKeywords] = useState<string>('off-market homes, coastal real estate, ncrec compliance');
  const [category, setCategory] = useState<string>('Market Intelligence');
  const [tone, setTone] = useState<string>('Professional, Empathetic, Authoritative');
  const [localTarget, setLocalTarget] = useState<string>('Wilmington, NC');
  const [wordCountTarget, setWordCountTarget] = useState<number>(1200);
  const [ctaGoal, setCtaGoal] = useState<string>('Schedule a Private Market Consultation');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isRunningCron, setIsRunningCron] = useState<boolean>(false);

  // Topic input for settings
  const [newTopicInput, setNewTopicInput] = useState<string>('');

  const loadData = () => {
    setPosts(blogService.getBlogPosts(workspaceId));
    setSettings(blogService.getBlogAutomationSettings(workspaceId));
  };

  useEffect(() => {
    loadData();
  }, [workspaceId]);

  const handleGeneratePost = async () => {
    setIsGenerating(true);
    try {
      const brief: ContentBrief = {
        topic,
        primaryKeyword,
        secondaryKeywords: secondaryKeywords.split(',').map(s => s.trim()).filter(Boolean),
        category,
        tone,
        localTarget,
        wordCountTarget,
        ctaGoal
      };

      const generated = await blogService.generateBlogPost(brief);

      const images = [
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80'
      ];
      const featuredImage = images[Math.floor(Math.random() * images.length)];

      const newPost: BlogPost = {
        id: `post_${Date.now()}`,
        workspaceId,
        title: generated.titles[0],
        slug: generated.slug,
        content: generated.content,
        excerpt: generated.excerpt,
        featured_image: featuredImage,
        featured_image_alt: generated.imageAlt,
        author_name: 'Shapework AI Editorial System',
        category,
        tags: generated.tags,
        published: settings.auto_publish,
        published_at: settings.auto_publish ? new Date().toISOString() : undefined,
        meta_title: generated.metaTitle,
        meta_description: generated.metaDescription,
        primary_keyword: primaryKeyword,
        seo_score: 94,
        faq_content: generated.faqContent,
        social_captions: generated.socialCaptions,
        reading_time_minutes: Math.ceil(wordCountTarget / 250),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      blogService.saveBlogPost(workspaceId, newPost);
      loadData();
      setSelectedPost(newPost);
    } catch (err) {
      console.error('Error generating blog post:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRunCronJob = async () => {
    setIsRunningCron(true);
    try {
      const created = await blogService.runAutoBlogGenerationJob(workspaceId);
      loadData();
      setSelectedPost(created);
    } catch (err) {
      console.error('Error running cron job:', err);
    } finally {
      setIsRunningCron(false);
    }
  };

  const handleTogglePublish = (postId: string) => {
    blogService.togglePublishBlogPost(workspaceId, postId);
    loadData();
    if (selectedPost && selectedPost.id === postId) {
      const updated = posts.find(p => p.id === postId);
      if (updated) setSelectedPost({ ...updated, published: !updated.published });
    }
  };

  const handleDeletePost = (postId: string) => {
    blogService.deleteBlogPost(workspaceId, postId);
    loadData();
    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost(null);
    }
  };

  const handleSaveSettings = (updated: BlogAutomationSettings) => {
    const saved = blogService.saveBlogAutomationSettings(workspaceId, updated);
    setSettings(saved);
  };

  const handleAddTargetTopic = () => {
    if (!newTopicInput.trim()) return;
    const topics = [...settings.target_topics, newTopicInput.trim()];
    handleSaveSettings({ ...settings, target_topics: topics });
    setNewTopicInput('');
  };

  const handleRemoveTargetTopic = (index: number) => {
    const topics = settings.target_topics.filter((_, i) => i !== index);
    handleSaveSettings({ ...settings, target_topics: topics });
  };

  return (
    <div className="space-y-6 text-left font-sans text-xs text-slate-800 animate-fade-in">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 text-[9px] font-mono font-bold uppercase rounded-full">Internal Operator Tool</span>
              <span className="text-[10px] text-slate-500 font-mono">Scope: {workspaceId}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1 flex items-center gap-2">
              <Zap className="w-5 h-5 text-slate-700" />
              Automated Blog & News Content Manager
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated AI content research, Markdown post generation, local SEO optimization, FAQ schema injection, and background cron scheduling.
            </p>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <button
              onClick={handleRunCronJob}
              disabled={isRunningCron}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunningCron ? 'animate-spin' : ''}`} />
              <span>{isRunningCron ? 'Generating...' : 'Run Auto Cron Job Now'}</span>
            </button>
          </div>
        </div>

        {/* 3-Column Control Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Column 1: AI Content Brief Generator Form (6 Cols) */}
          <div className="lg:col-span-6 space-y-4 bg-slate-50 border border-slate-200 rounded-2xl p-5">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-700" />
                AI Content Brief & Generator
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">Gemini 2.5 Flash Engine</span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-[10px] text-slate-600 uppercase font-bold block mb-1">Blog Post Topic</label>
                <input
                  type="text"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  placeholder="e.g. Navigating Pre-MLS Listings in Coastal NC"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800 font-sans shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-600 uppercase font-bold block mb-1">Primary Keyword</label>
                  <input
                    type="text"
                    value={primaryKeyword}
                    onChange={e => setPrimaryKeyword(e.target.value)}
                    placeholder="pre-mls listings wilmington nc"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800 font-sans shadow-2xs"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-600 uppercase font-bold block mb-1">Target City / Market</label>
                  <input
                    type="text"
                    value={localTarget}
                    onChange={e => setLocalTarget(e.target.value)}
                    placeholder="Wilmington, NC"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-slate-800 font-sans shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-600 uppercase font-bold block mb-1">Secondary Keywords (Comma Separated)</label>
                <input
                  type="text"
                  value={secondaryKeywords}
                  onChange={e => setSecondaryKeywords(e.target.value)}
                  placeholder="off-market homes, coastal real estate"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-slate-800 font-sans shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-600 uppercase font-bold block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-slate-800 font-sans shadow-2xs"
                  >
                    <option value="Market Intelligence">Market Intelligence</option>
                    <option value="Contract Strategy">Contract Strategy</option>
                    <option value="Coastal Living">Coastal Living</option>
                    <option value="BIC Compliance">BIC Compliance</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-600 uppercase font-bold block mb-1">Tone of Voice</label>
                  <input
                    type="text"
                    value={tone}
                    onChange={e => setTone(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-slate-800 font-sans shadow-2xs"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleGeneratePost}
                  disabled={isGenerating}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 font-mono disabled:opacity-50"
                >
                  <Zap className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>{isGenerating ? 'Synthesizing & Generating Post...' : 'Generate Blog Post Now'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Column 2: Automation Cron Settings (6 Cols) */}
          <div className="lg:col-span-6 space-y-4 bg-slate-50 border border-slate-200 rounded-2xl p-5">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2">
                <Settings className="w-4 h-4 text-slate-700" />
                Automated Scheduling & Background Cron
              </h3>
              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[9px] font-mono font-bold">
                {settings.auto_generate_enabled ? 'CRON ACTIVE' : 'CRON PAUSED'}
              </span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
                <div>
                  <strong className="text-slate-900 block font-sans">Auto-Generation Engine</strong>
                  <span className="text-[10px] text-slate-500 font-sans">Automatically generates new posts periodically</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.auto_generate_enabled}
                  onChange={e => handleSaveSettings({ ...settings, auto_generate_enabled: e.target.checked })}
                  className="accent-slate-900 w-5 h-5 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-600 uppercase font-bold block mb-1">Frequency</label>
                  <select
                    value={settings.frequency}
                    onChange={e => handleSaveSettings({ ...settings, frequency: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-sans shadow-2xs"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl mt-5 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-900 uppercase font-sans">Auto-Publish</span>
                  <input
                    type="checkbox"
                    checked={settings.auto_publish}
                    onChange={e => handleSaveSettings({ ...settings, auto_publish: e.target.checked })}
                    className="accent-slate-900 w-4 h-4 cursor-pointer"
                  />
                </div>
              </div>

              {/* Target Topics Manager */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <label className="text-[10px] text-slate-600 uppercase font-bold block">Target Topic Queue</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTopicInput}
                    onChange={e => setNewTopicInput(e.target.value)}
                    placeholder="Add topic (e.g. Staging Tips in Wilmington)..."
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-xs font-sans shadow-2xs"
                  />
                  <button
                    onClick={handleAddTargetTopic}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer transition-all shadow-xs"
                  >
                    Add
                  </button>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {settings.target_topics.map((t, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-white border border-slate-200 rounded-xl text-[11px] font-sans shadow-2xs">
                      <span className="text-slate-800 truncate font-medium">{t}</span>
                      <button
                        onClick={() => handleRemoveTargetTopic(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Ledger & Post Reader Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Posts Table (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col">
          <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">Blog Posts Ledger</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">{posts.length} generated posts in workspace catalog</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs select-none">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] text-slate-500 uppercase font-mono">
                  <th className="p-3.5 font-bold">Title / Slug</th>
                  <th className="p-3.5 font-bold">Category</th>
                  <th className="p-3.5 font-bold">SEO</th>
                  <th className="p-3.5 font-bold">Status</th>
                  <th className="p-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-sans">
                {posts.map(post => {
                  const isSelected = selectedPost?.id === post.id;
                  return (
                    <tr
                      key={post.id}
                      onClick={() => setSelectedPost(post)}
                      className={`cursor-pointer transition-colors ${isSelected ? 'bg-slate-100/90 font-medium' : 'hover:bg-slate-50'}`}
                    >
                      <td className="p-3.5">
                        <strong className="text-slate-900 block line-clamp-1">{post.title}</strong>
                        <span className="text-[10px] text-slate-500 font-mono block">/{post.slug}</span>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded text-[10px] font-mono">
                          {post.category}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[10px] font-bold">
                          {post.seo_score}/100
                        </span>
                      </td>
                      <td className="p-3.5 font-mono">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                          post.published
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {post.published ? 'PUBLISHED' : 'DRAFT'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-mono" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleTogglePublish(post.id)}
                            className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded text-[10px] text-slate-800 cursor-pointer font-bold transition-colors"
                          >
                            {post.published ? 'Unpublish' : 'Publish'}
                          </button>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {posts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 font-mono">
                      No blog posts generated yet. Click "Generate Blog Post Now" above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Column 3: Live Post Preview & Reader (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col">
          {selectedPost ? (
            <div className="space-y-4 text-left animate-fadeIn">
              <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                <span className="text-[10px] font-mono font-bold text-slate-900 uppercase tracking-wider">Post Preview & Schema Inspector</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${selectedPost.published ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
                  {selectedPost.published ? 'PUBLISHED' : 'DRAFT'}
                </span>
              </div>

              {/* Featured Image */}
              {selectedPost.featured_image && (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-2xs">
                  <img
                    src={selectedPost.featured_image}
                    alt={selectedPost.featured_image_alt || selectedPost.title}
                    className="w-full h-44 object-cover"
                  />
                  <div className="absolute bottom-2 left-2 px-2.5 py-1 bg-white/90 backdrop-blur-md border border-slate-200 rounded-lg text-[9px] font-mono text-slate-700">
                    Prompt: {selectedPost.featured_image_alt}
                  </div>
                </div>
              )}

              {/* Title & Metadata */}
              <div>
                <h3 className="text-base font-extrabold text-slate-900 leading-tight">{selectedPost.title}</h3>
                <div className="text-[10px] text-slate-500 font-mono mt-1 flex items-center gap-3">
                  <span>Author: {selectedPost.author_name}</span>
                  <span>•</span>
                  <span>{selectedPost.reading_time_minutes} min read</span>
                </div>
              </div>

              {/* Content Preview Box */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 leading-relaxed max-h-64 overflow-y-auto space-y-2 font-sans">
                {selectedPost.content.split('\n\n').map((paragraph, i) => {
                  if (paragraph.startsWith('## ')) {
                    return <h4 key={i} className="font-bold text-slate-900 text-sm pt-2">{paragraph.replace('## ', '')}</h4>;
                  }
                  if (paragraph.startsWith('### ')) {
                    return <h5 key={i} className="font-bold text-slate-800 text-xs pt-1">{paragraph.replace('### ', '')}</h5>;
                  }
                  return <p key={i} className="text-slate-600 text-[11px]">{paragraph}</p>;
                })}
              </div>

              {/* FAQ Accordion Section */}
              {selectedPost.faq_content && selectedPost.faq_content.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-200 font-mono text-xs">
                  <strong className="text-slate-900 text-[10px] uppercase block">Injected FAQ Schema ({selectedPost.faq_content.length} Items)</strong>
                  <div className="space-y-2">
                    {selectedPost.faq_content.map((faq, i) => (
                      <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-left font-sans">
                        <strong className="text-slate-900 text-xs block">{faq.question}</strong>
                        <p className="text-[11px] text-slate-600 mt-1">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* JSON-LD Schema Code Drawer */}
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1 font-mono text-[9px] text-emerald-400">
                <strong className="text-white block font-bold">SEO & Schema.org JSON-LD Output:</strong>
                <pre className="overflow-x-auto text-[8.5px] leading-tight text-slate-300">
{JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": selectedPost.title,
  "description": selectedPost.meta_description,
  "author": { "@type": "Person", "name": selectedPost.author_name }
}, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center text-slate-400 font-mono">
              <Eye className="w-8 h-8 mb-2 opacity-40" />
              <p>Select a blog post from the ledger to inspect its preview, FAQs, and JSON-LD schema.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
