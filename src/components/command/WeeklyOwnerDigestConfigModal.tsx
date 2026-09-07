import React, { useState, useEffect } from 'react';
import { 
  X, Mail, Send, Calendar, Clock, Globe, Shield, CheckCircle2, 
  AlertTriangle, Eye, Settings, RefreshCw, Check
} from 'lucide-react';
import type { OwnerDigestConfig, OwnerDigestData } from '../../../server/notifications/ownerDigestEngine';

interface WeeklyOwnerDigestConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId?: string;
  currentUserEmail?: string;
}

export default function WeeklyOwnerDigestConfigModal({
  isOpen,
  onClose,
  workspaceId = 'nest-realty-demo',
  currentUserEmail
}: WeeklyOwnerDigestConfigModalProps) {
  const [activeTab, setActiveTab] = useState<'config' | 'preview'>('config');
  const [config, setConfig] = useState<OwnerDigestConfig>({
    workspaceId,
    enabled: false,
    recipients: ['ryan@nestrealty.com'],
    dayOfWeek: 'monday',
    deliveryTime: '08:00',
    workspaceTimezone: 'America/New_York',
    includeNeedsAttention: true,
    includeOpenRequests: true,
    includeResolvedLastWeek: true,
    updatedAt: new Date().toISOString(),
    updatedBy: 'system'
  });

  const [recipientInput, setRecipientInput] = useState('ryan@nestrealty.com');
  const [testRecipient, setTestRecipient] = useState(currentUserEmail || 'ryan@nestrealty.com');
  const [previewData, setPreviewData] = useState<{ data: OwnerDigestData; html: string; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    loadConfigAndPreview();
  }, [isOpen, workspaceId]);

  const loadConfigAndPreview = async () => {
    setLoading(true);
    try {
      const [cfgRes, prevRes] = await Promise.all([
        fetch(`/api/owner-digest/config?workspaceId=${encodeURIComponent(workspaceId)}`),
        fetch(`/api/owner-digest/preview?workspaceId=${encodeURIComponent(workspaceId)}`)
      ]);

      if (cfgRes.ok) {
        const cfgData = await cfgRes.json();
        if (cfgData.config) {
          setConfig(cfgData.config);
          setRecipientInput((cfgData.config.recipients || ['ryan@nestrealty.com']).join(', '));
        }
      }

      if (prevRes.ok) {
        const prevData = await prevRes.json();
        setPreviewData(prevData);
      }
    } catch (err: any) {
      console.error('Failed to load owner digest settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    setStatusMsg(null);
    try {
      const recipients = recipientInput
        .split(',')
        .map(s => s.trim().toLowerCase())
        .filter(s => s.includes('@'));

      const res = await fetch('/api/owner-digest/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...config,
          workspaceId,
          recipients: recipients.length > 0 ? recipients : ['ryan@nestrealty.com']
        })
      });

      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
        setStatusMsg({ text: 'Weekly Owner Digest settings saved successfully.', type: 'success' });
      } else {
        const err = await res.json();
        setStatusMsg({ text: err.error || 'Failed to save settings.', type: 'error' });
      }
    } catch (e: any) {
      setStatusMsg({ text: e.message || 'Network error saving configuration.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async () => {
    if (!testRecipient || !testRecipient.includes('@')) {
      setStatusMsg({ text: 'Please enter a valid email address for the test send.', type: 'error' });
      return;
    }
    setSendingTest(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/owner-digest/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          recipientEmail: testRecipient.trim()
        })
      });

      if (res.ok) {
        const data = await res.json();
        setStatusMsg({ 
          text: `Test briefing successfully generated & recorded (Message ID: ${data.messageId}).`, 
          type: 'success' 
        });
      } else {
        const err = await res.json();
        setStatusMsg({ text: err.error || 'Failed to dispatch test digest.', type: 'error' });
      }
    } catch (e: any) {
      setStatusMsg({ text: e.message || 'Error triggering test email.', type: 'error' });
    } finally {
      setSendingTest(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in text-left">
      <div className="bg-[#012a23] border border-white/20 rounded-3xl max-w-4xl w-full shadow-2xl flex flex-col max-h-[90vh] text-white overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#00211b] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#00635C] flex items-center justify-center text-emerald-200">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-serif font-black tracking-tight text-white">Weekly Owner Digest</h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                  config.enabled ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {config.enabled ? 'Active Schedule' : 'Ready for Configuration'}
                </span>
              </div>
              <p className="text-xs text-[#D0D6BB]/70 mt-0.5">
                Automated Monday morning executive briefing summarizing open requests, overdue items, and resolutions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-black/30 p-1 rounded-xl border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('config')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'config' ? 'bg-[#00635C] text-white' : 'text-[#D0D6BB]/60 hover:text-white'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Configuration</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'preview' ? 'bg-[#00635C] text-white' : 'text-[#D0D6BB]/60 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Live Preview</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl text-[#D0D6BB] hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Toast */}
        {statusMsg && (
          <div className={`px-5 py-2.5 text-xs font-mono flex items-center gap-2 ${
            statusMsg.type === 'success' ? 'bg-emerald-950 border-b border-emerald-500/30 text-emerald-200' : 'bg-rose-950 border-b border-rose-500/30 text-rose-200'
          }`}>
            {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'config' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              
              {/* Enable / Disable Card */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="font-bold text-sm text-white block">Automated Recurring Briefing</span>
                  <p className="text-xs text-[#D0D6BB]/70 leading-relaxed">
                    When enabled, the system automatically emails the executive briefing on the configured schedule.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.enabled}
                    onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Schedule Details */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
                <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-emerald-300 border-b border-white/5 pb-2">
                  Delivery Schedule & Timezone
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase text-[#D0D6BB]/60 font-bold block">Day of Week</label>
                    <select
                      value={config.dayOfWeek}
                      onChange={(e) => setConfig({ ...config, dayOfWeek: e.target.value as any })}
                      className="w-full px-3 py-2 bg-[#01241E] border border-white/15 rounded-xl text-white focus:outline-none focus:border-emerald-400"
                    >
                      <option value="monday">Monday (Recommended)</option>
                      <option value="tuesday">Tuesday</option>
                      <option value="wednesday">Wednesday</option>
                      <option value="thursday">Thursday</option>
                      <option value="friday">Friday</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase text-[#D0D6BB]/60 font-bold block">Delivery Time</label>
                    <input
                      type="time"
                      value={config.deliveryTime}
                      onChange={(e) => setConfig({ ...config, deliveryTime: e.target.value })}
                      className="w-full px-3 py-2 bg-[#01241E] border border-white/15 rounded-xl text-white focus:outline-none focus:border-emerald-400 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase text-[#D0D6BB]/60 font-bold block">Timezone</label>
                    <select
                      value={config.workspaceTimezone}
                      onChange={(e) => setConfig({ ...config, workspaceTimezone: e.target.value })}
                      className="w-full px-3 py-2 bg-[#01241E] border border-white/15 rounded-xl text-white focus:outline-none focus:border-emerald-400"
                    >
                      <option value="America/New_York">Eastern Time (New York)</option>
                      <option value="America/Chicago">Central Time (Chicago)</option>
                      <option value="America/Denver">Mountain Time (Denver)</option>
                      <option value="America/Los_Angeles">Pacific Time (Los Angeles)</option>
                    </select>
                  </div>
                </div>

                {/* Recipients */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-[10px] font-mono uppercase text-[#D0D6BB]/60 font-bold block">
                    Recipient Emails (comma separated)
                  </label>
                  <input
                    type="text"
                    value={recipientInput}
                    onChange={(e) => setRecipientInput(e.target.value)}
                    placeholder="e.g. ryan@nestrealty.com, matt@nestrealty.com"
                    className="w-full px-3 py-2 bg-[#01241E] border border-white/15 rounded-xl text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-400 font-mono"
                  />
                  <span className="text-[10px] text-[#D0D6BB]/50 block">Only authorized workspace leadership will receive operational digests.</span>
                </div>
              </div>

              {/* Send Test Email Card */}
              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider font-bold text-emerald-300">
                    Send Instant Test Briefing
                  </span>
                  <span className="text-[10px] text-emerald-400/70 font-mono">Idempotent & Audited</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="email"
                    value={testRecipient}
                    onChange={(e) => setTestRecipient(e.target.value)}
                    placeholder="Recipient email..."
                    className="flex-1 px-3 py-2 bg-[#01241E] border border-emerald-500/40 rounded-xl text-xs text-white placeholder-white/40 focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleSendTest}
                    disabled={sendingTest}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold font-mono uppercase flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{sendingTest ? 'Sending...' : 'Send Test'}</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  disabled={saving}
                  className="px-5 py-2 bg-[#00635C] hover:bg-[#007a72] text-white border border-emerald-400/40 rounded-xl text-xs font-bold uppercase tracking-wider shadow cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[#D0D6BB]/70">
                  Live preview based on current tenant work queue and compliance items:
                </span>
                <button
                  type="button"
                  onClick={loadConfigAndPreview}
                  className="px-3 py-1 bg-white/5 hover:bg-white/10 text-white rounded-lg text-[11px] font-mono flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh Data</span>
                </button>
              </div>

              {previewData ? (
                <div className="border border-white/10 rounded-2xl overflow-hidden shadow-lg bg-white">
                  <div dangerouslySetInnerHTML={{ __html: previewData.html }} />
                </div>
              ) : (
                <div className="p-12 text-center text-xs text-[#D0D6BB]/40 font-mono">
                  Loading preview briefing...
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
