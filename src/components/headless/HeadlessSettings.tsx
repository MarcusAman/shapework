import React, { useState, useEffect } from 'react';
import { Copy, Plus, Trash2, Key, Link as LinkIcon, Palette, Mail, ShieldAlert, Zap, Check, CheckCircle2 } from 'lucide-react';

// Helper to copy text to clipboard
const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
  alert('Copied to clipboard!');
};

// ----------------------------------------------------
// BRANDING PANEL
// ----------------------------------------------------
export function BrandingPanel() {
  const [brokerageName, setBrokerageName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#18382b');
  const [emailHeaderLogo, setEmailHeaderLogo] = useState('');
  const [secureActionPageBrand, setSecureActionPageBrand] = useState('');
  const [clientPortalBrand, setClientPortalBrand] = useState('');
  const [replyToEmail, setReplyToEmail] = useState('');
  const [notificationFooter, setNotificationFooter] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/headless/branding')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.branding) {
          const b = data.branding;
          setBrokerageName(b.brokerageName || '');
          setLogoUrl(b.logoUrl || '');
          setPrimaryColor(b.primaryColor || '#18382b');
          setEmailHeaderLogo(b.emailHeaderLogo || '');
          setSecureActionPageBrand(b.secureActionPageBrand || '');
          setClientPortalBrand(b.clientPortalBrand || '');
          setReplyToEmail(b.replyToEmail || '');
          setNotificationFooter(b.notificationFooter || '');
        }
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/headless/branding/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brokerageName,
          logoUrl,
          primaryColor,
          emailHeaderLogo,
          secureActionPageBrand,
          clientPortalBrand,
          replyToEmail,
          notificationFooter
        })
      });
      alert('Branding updated successfully!');
    } catch {}
    setSaving(false);
  };

  return (
    <div 
      className="rounded-[28px] p-6 shadow-lg space-y-6 text-left border"
      style={{
        background: 'rgba(246, 247, 241, 0.10)',
        border: '1px solid rgba(246, 247, 241, 0.18)',
        backdropFilter: 'blur(18px)'
      }}
    >
      <div>
        <h3 className="text-xs font-serif font-black text-white uppercase tracking-wider">White-Label Branding</h3>
        <p className="text-xs text-[#D0D6BB] mt-1 font-medium font-sans">Style public-facing pages, action portals, and outgoing emails.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="space-y-1">
          <label className="block text-[9px] font-bold text-[#D0D6BB] uppercase tracking-wider font-mono">Brokerage Name</label>
          <input
            type="text"
            value={brokerageName}
            onChange={e => setBrokerageName(e.target.value)}
            className="w-full p-2.5 border border-[rgba(246,247,241,0.18)] rounded-xl bg-[#01362D] text-white focus:outline-none focus:border-emerald-500/50 font-semibold"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-[9px] font-bold text-[#D0D6BB] uppercase tracking-wider font-mono">Primary Brand Color</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={primaryColor}
              onChange={e => setPrimaryColor(e.target.value)}
              className="w-8 h-8 rounded border border-[rgba(246,247,241,0.18)] bg-[#01362D] cursor-pointer"
            />
            <input
              type="text"
              value={primaryColor}
              onChange={e => setPrimaryColor(e.target.value)}
              className="flex-1 p-2.5 border border-[rgba(246,247,241,0.18)] rounded-xl bg-[#01362D] text-white focus:outline-none focus:border-emerald-500/50 font-mono font-bold"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-[9px] font-bold text-[#D0D6BB] uppercase tracking-wider font-mono">Header Logo URL</label>
          <input
            type="text"
            value={logoUrl}
            onChange={e => setLogoUrl(e.target.value)}
            placeholder="https://example.com/logo.png"
            className="w-full p-2.5 border border-[rgba(246,247,241,0.18)] rounded-xl bg-[#01362D] text-white focus:outline-none focus:border-emerald-500/50 font-medium"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-[9px] font-bold text-[#D0D6BB] uppercase tracking-wider font-mono">Email Header Logo URL</label>
          <input
            type="text"
            value={emailHeaderLogo}
            onChange={e => setEmailHeaderLogo(e.target.value)}
            placeholder="https://example.com/email-logo.png"
            className="w-full p-2.5 border border-[rgba(246,247,241,0.18)] rounded-xl bg-[#01362D] text-white focus:outline-none focus:border-emerald-500/50 font-medium"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-[9px] font-bold text-[#D0D6BB] uppercase tracking-wider font-mono">Reply-To Email Address</label>
          <input
            type="email"
            value={replyToEmail}
            onChange={e => setReplyToEmail(e.target.value)}
            placeholder="notifications@yourdomain.com"
            className="w-full p-2.5 border border-[rgba(246,247,241,0.18)] rounded-xl bg-[#01362D] text-white focus:outline-none focus:border-emerald-500/50 font-medium"
          />
        </div>

        <div className="space-y-1 md:col-span-2">
          <label className="block text-[9px] font-bold text-[#D0D6BB] uppercase tracking-wider font-mono">Notification Footer Text</label>
          <textarea
            value={notificationFooter}
            onChange={e => setNotificationFooter(e.target.value)}
            rows={2}
            placeholder="You received this because shapework is routing operational alerts for Nest Realty Wilmington."
            className="w-full p-2.5 border border-[rgba(246,247,241,0.18)] rounded-xl bg-[#01362D] text-white focus:outline-none focus:border-emerald-500/50 font-medium"
          />
        </div>
      </div>

      <div className="pt-2 select-none">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-[#00635C] hover:bg-[#007c73] border border-[rgba(246,247,241,0.18)] rounded-xl font-bold text-white text-xs cursor-pointer transition-colors shadow-md"
        >
          {saving ? 'Saving...' : 'Save Branding'}
        </button>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// ACTION LINKS PANEL
// ----------------------------------------------------
export function ActionLinksPanel() {
  const [actions, setActions] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/headless/actions/list')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.actions) {
          setActions(data.actions);
        }
      });
  }, []);

  return (
    <div 
      className="rounded-[28px] p-6 shadow-lg space-y-4 text-left border"
      style={{
        background: 'rgba(246, 247, 241, 0.10)',
        border: '1px solid rgba(246, 247, 241, 0.18)',
        backdropFilter: 'blur(18px)'
      }}
    >
      <div>
        <h3 className="text-xs font-serif font-black text-white uppercase tracking-wider">Active Action Links</h3>
        <p className="text-xs text-[#D0D6BB] mt-1 font-medium font-sans">Log of active, completed, or expired secure links generated for staff.</p>
      </div>

      <div className="border border-[rgba(246,247,241,0.12)] rounded-xl overflow-hidden shadow-lg">
        <table className="w-full text-left border-collapse text-xs text-white">
          <thead className="bg-[rgba(246,247,241,0.04)] border-b border-[rgba(246,247,241,0.12)] text-[9px] font-bold text-white uppercase tracking-wider font-serif font-black select-none">
            <tr>
              <th className="p-3">Action Type</th>
              <th className="p-3">Target</th>
              <th className="p-3">Expires</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(246,247,241,0.12)]">
            {actions.map((act: any) => (
              <tr key={act.id} className="hover:bg-[rgba(246,247,241,0.06)] font-medium">
                <td className="p-3 capitalize font-mono text-[10px] text-[#D0D6BB]">{act.actionType.replace(/_/g, ' ')}</td>
                <td className="p-3 font-semibold text-white truncate max-w-[120px]">
                  {act.recipientStaffMemberId ? `Staff: ${act.recipientStaffMemberId}` : 'External Agent/Client'}
                </td>
                <td className="p-3 font-mono text-[10px] text-[#D0D6BB]">
                  {new Date(act.expiresAt).toLocaleDateString()}
                </td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                    act.status === 'completed' 
                      ? 'bg-emerald-955/40 text-emerald-300 border-emerald-800/40' 
                      : 'bg-amber-955/40 text-amber-350 border-amber-800/40'
                  }`}>
                    {act.status}
                  </span>
                </td>
                <td className="p-3 text-right select-none">
                  <button
                    onClick={() => copyToClipboard(`${window.location.origin}/link/${act.id}`)}
                    className="p-1.5 hover:bg-[rgba(246,247,241,0.12)] rounded text-[#D0D6BB] hover:text-white cursor-pointer transition-colors"
                    title="Copy Link"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {actions.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-[#D0D6BB] italic font-sans">No active action links generated in this session.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// INTAKE LINKS PANEL
// ----------------------------------------------------
export function IntakeLinksPanel() {
  const categories = [
    { type: 'marketing', label: 'Marketing Request Intake', desc: 'Allows agents to submit collateral requests (flyers, brochures, photos).' },
    { type: 'compliance', label: 'Compliance Audit Intake', desc: 'Secure document upload intake for closing files and legal checks.' },
    { type: 'office', label: 'Office & Facilities Support', desc: 'Facilities maintenance, signage orders, lockbox keys, and repairs intake.' },
    { type: 'support', label: 'General Admin Support', desc: 'Routine coordinators task assignments and administrative triage.' }
  ];

  return (
    <div 
      className="rounded-[28px] p-6 shadow-lg space-y-6 text-left border"
      style={{
        background: 'rgba(246, 247, 241, 0.10)',
        border: '1px solid rgba(246, 247, 241, 0.18)',
        backdropFilter: 'blur(18px)'
      }}
    >
      <div>
        <h3 className="text-xs font-serif font-black text-white uppercase tracking-wider">Smart Intake Links</h3>
        <p className="text-xs text-[#D0D6BB] mt-1 font-medium font-sans">Distribute these links to agents or clients to collect files and triage tasks without app credentials.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((c) => {
          const url = `${window.location.origin}/request/${c.type}/nest-realty`;
          return (
            <div key={c.type} className="p-4 border border-[rgba(246,247,241,0.18)] rounded-xl bg-[#01362D] hover:bg-[#01362D]/90 transition-all space-y-3">
              <div>
                <strong className="text-xs font-bold text-white block">{c.label}</strong>
                <p className="text-[11px] text-[#D0D6BB] mt-0.5 leading-relaxed font-sans font-medium">{c.desc}</p>
              </div>

              <div className="flex gap-2 items-center bg-[#00635C]/20 border border-[rgba(246,247,241,0.12)] p-2 rounded-lg">
                <span className="flex-1 font-mono text-[9px] text-[#D0D6BB] truncate select-all">{url}</span>
                <button
                  onClick={() => copyToClipboard(url)}
                  className="p-1.5 hover:bg-[rgba(246,247,241,0.12)] rounded text-[#D0D6BB] hover:text-white transition-colors cursor-pointer"
                  title="Copy Link"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ----------------------------------------------------
// CLIENT & AGENT PORTAL ACCESS PANEL
// ----------------------------------------------------
export function ClientAgentAccessPanel() {
  const [clientPortals, setClientPortals] = useState<any[]>([]);
  const [agentPortals, setAgentPortals] = useState<any[]>([]);

  // Form states
  const [clientName, setClientName] = useState('');
  const [dealId, setDealId] = useState('t_1'); // Seed deal
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  const fetchLists = () => {
    fetch('/api/headless/client-portal/list')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.portals) setClientPortals(data.portals);
      });

    fetch('/api/headless/agent-portal/list')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.portals) setAgentPortals(data.portals);
      });
  };

  useEffect(() => {
    fetchLists();
  }, []);

  const handleCreateClientPortal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return;

    try {
      const res = await fetch('/api/headless/client-portal/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId, clientName, clientEmail, clientPhone })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Portal token generated!\nSecure URL: ${window.location.origin}/client/deal/${data.token}`);
        setClientName('');
        setClientEmail('');
        setClientPhone('');
        fetchLists();
      }
    } catch {}
  };

  return (
    <div className="space-y-6 text-left text-white">
      {/* Create Client Portal access */}
      <div 
        className="rounded-[28px] p-6 shadow-lg space-y-4 border"
        style={{
          background: 'rgba(246, 247, 241, 0.10)',
          border: '1px solid rgba(246, 247, 241, 0.18)',
          backdropFilter: 'blur(18px)'
        }}
      >
        <div>
          <h3 className="text-xs font-serif font-black text-white uppercase tracking-wider">Generate Client Deal Portal Access</h3>
          <p className="text-xs text-[#D0D6BB] mt-1 font-medium font-sans">Create a secure link for property buyers/sellers to track status and sign disclosures.</p>
        </div>

        <form onSubmit={handleCreateClientPortal} className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="space-y-1">
            <label className="block text-[9px] font-bold text-[#D0D6BB] uppercase tracking-wider font-mono">Client Name</label>
            <input
              type="text"
              required
              placeholder="e.g. John Doe"
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              className="w-full p-2.5 border border-[rgba(246,247,241,0.18)] rounded-xl bg-[#01362D] text-white focus:outline-none focus:border-emerald-500/50 font-semibold"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[9px] font-bold text-[#D0D6BB] uppercase tracking-wider font-mono">Target Deal / Property</label>
            <select
              value={dealId}
              onChange={e => setDealId(e.target.value)}
              className="w-full p-2.5 border border-[rgba(246,247,241,0.18)] rounded-xl bg-[#01362D] text-white focus:outline-none focus:border-emerald-500/50 font-semibold"
            >
              <option value="t_1">109 Woodlawn Avenue (Closed)</option>
              <option value="t_2">412 Market Street (Under Contract)</option>
              <option value="t_3">788 Pinehurst Blvd (Listing Launch)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-[9px] font-bold text-[#D0D6BB] uppercase tracking-wider font-mono">Email</label>
            <input
              type="email"
              placeholder="client@gmail.com"
              value={clientEmail}
              onChange={e => setClientEmail(e.target.value)}
              className="w-full p-2.5 border border-[rgba(246,247,241,0.18)] rounded-xl bg-[#01362D] text-white focus:outline-none focus:border-emerald-500/50 font-medium"
            />
          </div>

          <div className="flex gap-2 items-end pt-1 select-none">
            <button
              type="submit"
              className="w-full py-2.5 bg-[#00635C] hover:bg-[#007c73] border border-[rgba(246,247,241,0.18)] text-white rounded-xl font-bold transition-colors cursor-pointer text-center text-xs shadow-md"
            >
              Create Access
            </button>
          </div>
        </form>
      </div>

      {/* List Active Accesses */}
      <div 
        className="rounded-[28px] p-6 shadow-lg space-y-4 border"
        style={{
          background: 'rgba(246, 247, 241, 0.10)',
          border: '1px solid rgba(246, 247, 241, 0.18)',
          backdropFilter: 'blur(18px)'
        }}
      >
        <div>
          <h3 className="text-xs font-serif font-black text-white uppercase tracking-wider">Active Portal Access Tokens</h3>
          <p className="text-xs text-[#D0D6BB] mt-1 font-medium font-sans">Active client deal status views and external authorization tokens.</p>
        </div>

        <div className="border border-[rgba(246,247,241,0.12)] rounded-xl overflow-hidden shadow-lg">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-[rgba(246,247,241,0.04)] border-b border-[rgba(246,247,241,0.12)] text-[9px] font-bold text-white uppercase tracking-wider select-none font-serif font-black">
              <tr>
                <th className="p-3">Client</th>
                <th className="p-3">Deal ID</th>
                <th className="p-3">Email</th>
                <th className="p-3">Created</th>
                <th className="p-3 text-right">Access Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(246,247,241,0.12)] text-white">
              {clientPortals.map((c: any) => (
                <tr key={c.id} className="hover:bg-[rgba(246,247,241,0.06)] font-medium">
                  <td className="p-3 font-bold text-white">{c.clientName}</td>
                  <td className="p-3 font-mono text-[10px] text-[#D0D6BB]">{c.dealId}</td>
                  <td className="p-3 font-mono text-[10px] text-[#D0D6BB]">{c.clientEmail || 'N/A'}</td>
                  <td className="p-3 text-[#D0D6BB] font-mono text-[10px]">{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td className="p-3 text-right select-none">
                    <button
                      onClick={() => copyToClipboard(`${window.location.origin}/client/deal/${c.tokenHash}`)}
                      className="p-1.5 hover:bg-[rgba(246,247,241,0.12)] rounded text-[#D0D6BB] hover:text-white cursor-pointer transition-colors"
                      title="Copy Access Link"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {clientPortals.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#D0D6BB] italic font-sans">No active client portals defined in system state.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// WEBHOOKS PANEL
// ----------------------------------------------------
export function WebhooksPanel() {
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [targetUrl, setTargetUrl] = useState('');
  const [events, setEvents] = useState<string[]>(['work_item_completed']);

  const fetchWebhooks = () => {
    fetch('/api/headless/webhooks/list')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.webhooks) setWebhooks(data.webhooks);
      });
  };

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUrl.trim()) return;

    try {
      const res = await fetch('/api/headless/webhooks/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUrl, events })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Webhook registered!\nSigning Secret: ${data.secret}`);
        setTargetUrl('');
        fetchWebhooks();
      }
    } catch {}
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch('/api/headless/webhooks/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      fetchWebhooks();
    } catch {}
  };

  return (
    <div className="space-y-6 text-left">
      {/* Create Webhook */}
      <div className="bg-white border border-[#e4decb] rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <h3 className="text-xs font-bold text-[#1e2520] uppercase tracking-wider">Register Webhook Endpoint</h3>
          <p className="text-xs text-text-secondary mt-1 font-medium">Subscribe to brokerage event triggers and receive signed HTTP POST payloads.</p>
        </div>

        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="block text-[9px] font-bold text-text-secondary uppercase tracking-wider font-mono">Payload URL</label>
            <input
              type="url"
              required
              placeholder="https://api.yourbrokerage.com/webhooks/shapework"
              value={targetUrl}
              onChange={e => setTargetUrl(e.target.value)}
              className="w-full p-2 border border-[#e4decb] rounded-lg focus:outline-none focus:border-stone-400 font-mono font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[9px] font-bold text-text-secondary uppercase tracking-wider font-mono">Trigger Events</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 font-semibold text-[#1e2520] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={events.includes('work_item_completed')}
                  onChange={e => {
                    if (e.target.checked) setEvents([...events, 'work_item_completed']);
                    else setEvents(events.filter(ev => ev !== 'work_item_completed'));
                  }}
                  className="accent-[#18382b]"
                />
                Work Item Completed
              </label>

              <label className="flex items-center gap-1.5 font-semibold text-[#1e2520] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={events.includes('approval_granted')}
                  onChange={e => {
                    if (e.target.checked) setEvents([...events, 'approval_granted']);
                    else setEvents(events.filter(ev => ev !== 'approval_granted'));
                  }}
                  className="accent-[#18382b]"
                />
                Approval Granted
              </label>
            </div>
          </div>

          <div className="pt-2 select-none">
            <button
              type="submit"
              className="px-4 py-2 bg-[#18382b] text-white hover:bg-[#1f4a39] rounded-lg font-bold transition-colors cursor-pointer"
            >
              Add Subscription
            </button>
          </div>
        </form>
      </div>

      {/* Webhooks list */}
      <div className="bg-white border border-[#e4decb] rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <h3 className="text-xs font-bold text-[#1e2520] uppercase tracking-wider">Active Subscriptions</h3>
        </div>

        <div className="border border-[#e4decb]/60 rounded-xl overflow-hidden bg-white shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-[#fcfbf7] border-b border-[#e4decb] text-[9px] font-bold text-text-tertiary uppercase tracking-wider">
              <tr>
                <th className="p-3">Target URL</th>
                <th className="p-3">Events</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e4decb]/40">
              {webhooks.map((w: any) => (
                <tr key={w.id} className="hover:bg-[#fcfbf7]/20 font-medium">
                  <td className="p-3 font-mono text-[10px] text-text-secondary truncate max-w-[200px]">{w.targetUrl}</td>
                  <td className="p-3 font-semibold text-[#1e2520] capitalize">{w.events.join(', ')}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-[#eaf2ee] text-[#18382b]">
                      {w.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleDelete(w.id)}
                      className="p-1 hover:bg-red-50 text-red-700 rounded transition-colors cursor-pointer"
                      title="Delete Subscription"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {webhooks.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-text-tertiary italic">No active webhooks registered.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// EXTENDED NOTIFICATION PANEL WITH STAFF PREFERENCES
// ----------------------------------------------------
export function ExtendedNotificationPanel({ state }: { state: any }) {
  // Original Trigger Rules
  const [cooldown, setCooldown] = useState(5);
  const [rules, setRules] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Staff Preferences
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [preferredChannel, setPreferredChannel] = useState('both');
  const [quietHoursStart, setQuietHoursStart] = useState('22:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState('07:00');
  const [timezone, setTimezone] = useState('America/New_York');
  const [savingPrefs, setSavingPrefs] = useState(false);

  const fetchSettings = () => {
    fetch('/api/notifications/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCooldown(data.cooldown);
          setRules(data.rules);
        }
      });

    fetch('/api/notifications/list')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setNotifications(data.notifications || []);
        }
      });
  };

  const fetchStaffPrefs = () => {
    // usr_sarah is active demo login
    fetch('/api/headless/preferences/usr_sarah')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.preference) {
          const p = data.preference;
          setEmailEnabled(p.emailEnabled !== false);
          setSmsEnabled(p.smsEnabled !== false);
          setPreferredChannel(p.preferredChannel || 'both');
          setQuietHoursStart(p.quietHoursStart || '22:00');
          setQuietHoursEnd(p.quietHoursEnd || '07:00');
          setTimezone(p.timezone || 'America/New_York');
        }
      });
  };

  useEffect(() => {
    fetchSettings();
    fetchStaffPrefs();
  }, []);

  const handleSaveSettings = async (newCooldown: number, newRules: any[]) => {
    try {
      await fetch('/api/notifications/settings/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cooldown: newCooldown, rules: newRules })
      });
      fetchSettings();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSavePrefs = async () => {
    setSavingPrefs(true);
    try {
      await fetch('/api/headless/preferences/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffMemberId: 'usr_sarah',
          emailEnabled,
          smsEnabled,
          preferredChannel,
          quietHoursStart,
          quietHoursEnd,
          timezone
        })
      });
      alert('Notification preferences updated!');
    } catch {}
    setSavingPrefs(false);
  };

  const toggleRule = (ruleId: string) => {
    const updated = rules.map(r => r.id === ruleId ? { ...r, enabled: !r.enabled } : r);
    setRules(updated);
    handleSaveSettings(cooldown, updated);
  };

  return (
    <div className="space-y-6 text-left text-white font-sans">
      {/* Provider & Channel Status Card */}
      <div 
        className="rounded-[28px] p-6 shadow-lg space-y-4 border"
        style={{
          background: 'rgba(246, 247, 241, 0.10)',
          border: '1px solid rgba(246, 247, 241, 0.18)',
          backdropFilter: 'blur(18px)'
        }}
      >
        <div>
          <h3 className="text-xs font-serif font-black text-white uppercase tracking-wider">Brokerage Operations Gateway Status</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-[rgba(246,247,241,0.04)] border border-[rgba(246,247,241,0.08)] rounded-xl space-y-1">
            <span className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">SMS Provider Mode</span>
            <strong className="text-white font-bold font-mono">dev_log</strong>
          </div>
          <div className="p-3 bg-[rgba(246,247,241,0.04)] border border-[rgba(246,247,241,0.08)] rounded-xl space-y-1">
            <span className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Email Provider Status</span>
            <strong className="text-white font-bold font-mono">Sandbox Enabled</strong>
          </div>
          <div className="p-3 bg-[rgba(246,247,241,0.04)] border border-[rgba(246,247,241,0.08)] rounded-xl space-y-1">
            <span className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Vault Safety Lock</span>
            <strong className="text-white font-bold font-mono">Active (PII Masking)</strong>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal preferences */}
        <div 
          className="rounded-[28px] p-6 shadow-lg space-y-4 border"
          style={{
            background: 'rgba(246, 247, 241, 0.10)',
            border: '1px solid rgba(246, 247, 241, 0.18)',
            backdropFilter: 'blur(18px)'
          }}
        >
          <div>
            <h3 className="text-xs font-serif font-black text-white uppercase tracking-wider">Your Delivery Channels</h3>
            <p className="text-xs text-[#D0D6BB] mt-1 font-medium font-sans">Configure where alerts reach you during office hours.</p>
          </div>

          <div className="space-y-3.5 text-xs text-white">
            <label className="flex items-center gap-2 font-semibold text-white cursor-pointer select-none">
              <input
                type="checkbox"
                checked={emailEnabled}
                onChange={e => setEmailEnabled(e.target.checked)}
                className="accent-emerald-600 rounded bg-[#01362D] border-[rgba(246,247,241,0.18)]"
              />
              Email Delivery Enabled
            </label>

            <label className="flex items-center gap-2 font-semibold text-white cursor-pointer select-none">
              <input
                type="checkbox"
                checked={smsEnabled}
                onChange={e => setSmsEnabled(e.target.checked)}
                className="accent-emerald-600 rounded bg-[#01362D] border-[rgba(246,247,241,0.18)]"
              />
              SMS Mobile Delivery Enabled
            </label>

            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-[#D0D6BB] uppercase tracking-wider font-mono">Preferred Channel</label>
              <select
                value={preferredChannel}
                onChange={e => setPreferredChannel(e.target.value)}
                className="w-full p-2 border border-[rgba(246,247,241,0.18)] rounded-xl bg-[#01362D] text-white focus:outline-none focus:border-emerald-500/50 font-semibold text-xs"
              >
                <option value="both">Both Channels (Simultaneous)</option>
                <option value="email">Email Only</option>
                <option value="sms">SMS Only</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-[#D0D6BB] uppercase tracking-wider font-mono">Quiet Hours Start</label>
                <input
                  type="time"
                  value={quietHoursStart}
                  onChange={e => setQuietHoursStart(e.target.value)}
                  className="w-full p-2 border border-[rgba(246,247,241,0.18)] rounded-xl bg-[#01362D] text-white focus:outline-none focus:border-emerald-500/50 font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-[#D0D6BB] uppercase tracking-wider font-mono">Quiet Hours End</label>
                <input
                  type="time"
                  value={quietHoursEnd}
                  onChange={e => setQuietHoursEnd(e.target.value)}
                  className="w-full p-2 border border-[rgba(246,247,241,0.18)] rounded-xl bg-[#01362D] text-white focus:outline-none focus:border-emerald-500/50 font-mono text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-[#D0D6BB] uppercase tracking-wider font-mono">Timezone</label>
              <input
                type="text"
                value={timezone}
                onChange={e => setTimezone(e.target.value)}
                className="w-full p-2.5 border border-[rgba(246,247,241,0.18)] rounded-xl bg-[#01362D] text-white focus:outline-none focus:border-emerald-500/50 font-mono font-semibold text-xs"
              />
            </div>

            <div className="pt-2 select-none">
              <button
                onClick={handleSavePrefs}
                disabled={savingPrefs}
                className="px-4 py-2 bg-[#00635C] hover:bg-[#007c73] border border-[rgba(246,247,241,0.18)] text-white rounded-xl font-bold transition-colors cursor-pointer text-xs shadow-md"
              >
                {savingPrefs ? 'Updating...' : 'Save Preferences'}
              </button>
            </div>
          </div>
        </div>

        {/* Cooldown Settings */}
        <div 
          className="rounded-[28px] p-6 shadow-lg space-y-4 border flex flex-col justify-between"
          style={{
            background: 'rgba(246, 247, 241, 0.10)',
            border: '1px solid rgba(246, 247, 241, 0.18)',
            backdropFilter: 'blur(18px)'
          }}
        >
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-serif font-black text-white uppercase tracking-wider">System Rule Limits</h3>
              <p className="text-xs text-[#D0D6BB] mt-1 font-medium font-sans">Prevent duplicate notifications by defining the minimum interval between messages.</p>
            </div>
            <div className="flex items-center gap-4 select-none">
              <input 
                type="range" 
                min="1" 
                max="30" 
                value={cooldown} 
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setCooldown(val);
                }}
                onMouseUp={() => handleSaveSettings(cooldown, rules)}
                className="flex-1 accent-emerald-600 cursor-pointer" 
              />
              <span className="font-mono font-bold text-white text-xs bg-[rgba(246,247,241,0.08)] px-2.5 py-1 rounded-xl border border-[rgba(246,247,241,0.18)]">{cooldown} Minutes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rules list Card */}
      <div 
        className="rounded-[28px] p-6 shadow-lg space-y-4 border"
        style={{
          background: 'rgba(246, 247, 241, 0.10)',
          border: '1px solid rgba(246, 247, 241, 0.18)',
          backdropFilter: 'blur(18px)'
        }}
      >
        <div>
          <h3 className="text-xs font-serif font-black text-white uppercase tracking-wider">Trigger Rules</h3>
          <p className="text-xs text-[#D0D6BB] mt-1 font-medium font-sans">Configure automated notifications dispatched to administrators and brokerage coordinators.</p>
        </div>
        
        <div className="space-y-2 text-xs">
          {rules && rules.map ? (
            rules.map((rule) => (
              <div key={rule.id} className="flex justify-between items-center py-2.5 border-b border-[rgba(246,247,241,0.08)] hover:bg-[rgba(246,247,241,0.04)] px-2 rounded-xl transition-all select-none">
                <div className="space-y-0.5">
                  <span className="font-bold text-white block">{rule.event}</span>
                  <span className="block text-[9px] text-[#D0D6BB] uppercase font-mono">{rule.channel} Channel</span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleRule(rule.id)}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer select-none ${
                    rule.enabled 
                      ? 'bg-emerald-955/40 border-emerald-800/40 text-emerald-300' 
                      : 'bg-[rgba(246,247,241,0.06)] border-[rgba(246,247,241,0.12)] text-[#D0D6BB]'
                  }`}
                >
                  {rule.enabled ? 'Active' : 'Disabled'}
                </button>
              </div>
            ))
          ) : (
            <span className="text-xs text-[#D0D6BB] italic font-sans">Rules failed to load in list mode.</span>
          )}
        </div>
      </div>

      {/* Triggered Notifications list Card */}
      <div 
        className="rounded-[28px] p-6 shadow-lg space-y-4 border"
        style={{
          background: 'rgba(246, 247, 241, 0.10)',
          border: '1px solid rgba(246, 247, 241, 0.18)',
          backdropFilter: 'blur(18px)'
        }}
      >
        <div>
          <h3 className="text-xs font-serif font-black text-white uppercase tracking-wider">Notification Handoff Log</h3>
          <p className="text-xs text-[#D0D6BB] mt-1 font-medium font-sans">System audit record of queued, dispatched, and interacted notifications.</p>
        </div>

        <div className="border border-[rgba(246,247,241,0.12)] rounded-xl overflow-hidden shadow-lg">
          <table className="w-full text-left table-fixed">
            <thead className="bg-[rgba(246,247,241,0.04)] border-b border-[rgba(246,247,241,0.12)] text-[9px] font-bold text-white uppercase tracking-wider select-none font-serif font-black">
              <tr>
                <th className="p-2 w-1/4">Recipient</th>
                <th className="p-2">Action Type</th>
                <th className="p-2 w-16 text-center">Channel</th>
                <th className="p-2 w-20 text-center">Status</th>
                <th className="p-2 w-24 text-right pr-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(246,247,241,0.12)] text-[10px] text-white">
              {notifications.map((n: any) => (
                <tr key={n.id} className="hover:bg-[rgba(246,247,241,0.06)] font-medium">
                  <td className="p-2 font-bold text-white truncate">{n.recipientName}</td>
                  <td className="p-2 truncate capitalize font-mono text-[9px] text-[#D0D6BB]">{n.actionType.replace(/_/g, ' ')}</td>
                  <td className="p-2 text-center uppercase font-mono text-[9px] text-[#D0D6BB]">{n.channel}</td>
                  <td className="p-2 text-center select-none">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[8px] uppercase tracking-wide border ${
                      n.status === 'sent' || n.status === 'acted'
                        ? 'bg-emerald-955/40 text-emerald-300 border-emerald-800/40'
                        : n.status === 'failed'
                        ? 'bg-rose-955/40 text-rose-350 border-rose-800/40'
                        : 'bg-[rgba(246,247,241,0.06)] text-[#D0D6BB] border border-[rgba(246,247,241,0.12)]'
                    }`}>
                      {n.status}
                    </span>
                  </td>
                  <td className="p-2 text-right text-[#D0D6BB]/70 pr-4 font-mono text-[9px]">{new Date(n.createdAt).toLocaleTimeString()}</td>
                </tr>
              ))}
              {notifications.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#D0D6BB] italic font-sans">No dispatched notifications in system state log.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
