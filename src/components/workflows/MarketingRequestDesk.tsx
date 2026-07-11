import React, { useState } from 'react';
import { Mail, Clock, HelpCircle, FileText, Send, CheckCircle, AlertTriangle, ArrowRight, CheckSquare } from 'lucide-react';

interface MarketingRequestDeskProps {
  state?: any;
}

export default function MarketingRequestDesk({ state = {} }: MarketingRequestDeskProps) {
  const {
    workItems = [],
    fetchState,
    activeProfile
  } = state;

  const [request, setRequest] = useState({
    type: 'social_post',
    propertyAddress: '',
    assetNeeded: '',
    dueDate: '',
    photoLink: '',
    description: '',
    agentName: activeProfile?.name || 'Sarah Jenkins',
    agentEmail: activeProfile?.email || 'sarah.j@nest-demo.local',
    clientName: 'Arthur Pendragon',
    goLiveDate: '',
    photoDate: '',
    signInstallDate: ''
  });

  const [activeTab, setActiveTab] = useState<'submit' | 'queue'>('submit');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [deflectionTriggered, setDeflectionTriggered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Listing Launch Checklist state
  const [launchChecklist, setLaunchChecklist] = useState({
    photographyScheduled: false,
    signPostInstalled: false,
    flyerDrafted: false,
    socialQueued: false,
    emailScheduled: false
  });

  // Load from DB
  const dbQueue = workItems.filter((w: any) => 
    w.type === 'marketing_request' || 
    w.type === 'missing_information' || 
    w.type === 'review_request'
  );

  const [newClarification, setNewClarification] = useState<Record<string, string>>({});
  const [sentClarifications, setSentClarifications] = useState<Record<string, string>>({});

  const faqs = [
    {
      keywords: ['flyer', 'brochure', 'design center'],
      question: 'Where do I access listing brochure templates?',
      answer: 'Brochure templates are self-serve in the Rechat Design Center. Navigate to Marketing -> Templates -> Listings. No manual request form is needed unless you require custom layouts.'
    },
    {
      keywords: ['photo', 'download', 'photography'],
      question: 'How do I download high-res listing photos?',
      answer: 'Photography links are automatically synced from the MLS and Rechat. Check the property folder in Google Drive before requesting manual asset packages.'
    },
    {
      keywords: ['logo', 'branding'],
      question: 'Where can I find approved brokerage logos?',
      answer: 'Official vector and high-res PNG logos are stored in the Shared Drive at `/Marketing/Brand-Assets`. Please use these directly for Canva or social graphics.'
    }
  ];

  const handleInputChange = (field: string, val: string) => {
    setRequest(prev => ({ ...prev, [field]: val }));
    
    // Simple keyword deflection matching
    const matches = faqs.some(faq => 
      faq.keywords.some(kw => 
        val.toLowerCase().includes(kw) || 
        request.assetNeeded.toLowerCase().includes(kw)
      )
    );
    setDeflectionTriggered(matches);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const isListingLaunch = request.type === 'listing_launch_asset';
    const isReviewRequest = request.type === 'review_request';

    // Auto-detect missing details
    const isMissingInfo = !isReviewRequest && (!request.photoLink || request.description.length < 10);
    
    let itemType = 'marketing_request';
    let status = 'ready_for_production';
    let priority = 'medium';

    if (isMissingInfo) {
      itemType = 'missing_information';
      status = 'waiting_on_agent';
      priority = 'high';
    } else if (isReviewRequest) {
      itemType = 'review_request';
      status = 'pending';
      priority = 'medium';
    }

    let title = `Marketing Request: ${request.type.replace(/_/g, ' ').toUpperCase()} - ${request.propertyAddress}`;
    if (isMissingInfo) {
      title = `[MISSING INFO] Marketing Request: ${request.type.replace(/_/g, ' ').toUpperCase()} - ${request.propertyAddress}`;
    } else if (isReviewRequest) {
      title = `[REVIEW ENGINE] Gated Review Request - ${request.clientName} (${request.propertyAddress})`;
    }

    let recommendedNextAction = `Design team: produce ${request.type.replace(/_/g, ' ')} asset for ${request.propertyAddress}.`;
    if (isMissingInfo) {
      recommendedNextAction = `Draft agent clarification regarding missing photo link or description detail.`;
    } else if (isReviewRequest) {
      recommendedNextAction = `Approve outbound neutral review request draft for client ${request.clientName}.`;
    } else if (isListingLaunch) {
      const pendingTasks = Object.entries(launchChecklist)
        .filter(([_, checked]) => !checked)
        .map(([key]) => key.replace(/([A-Z])/g, ' $1').toLowerCase())
        .join(', ');
      recommendedNextAction = `Complete remaining launch tasks: ${pendingTasks || 'none (ready for production)'}`;
    }

    try {
      const res = await fetch('/api/work-items/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          type: itemType,
          source: 'manual',
          ownerRole: isReviewRequest ? 'operations_lead' : 'marketing_coordinator',
          priority,
          recommendedNextAction,
          relatedType: 'workflow',
          relatedId: `mkt_${Date.now()}`,
          relatedLabel: request.propertyAddress,
          approvalRequired: isMissingInfo || isReviewRequest, // Review requests and missing info are approval-gated
          status
        })
      });

      if (res.ok) {
        setIsSubmitted(true);
        if (fetchState) await fetchState();
        setTimeout(() => {
          setIsSubmitted(false);
          setRequest({
            type: 'social_post',
            propertyAddress: '',
            assetNeeded: '',
            dueDate: '',
            photoLink: '',
            description: '',
            agentName: activeProfile?.name || 'Sarah Jenkins',
            agentEmail: activeProfile?.email || 'sarah.j@nest-demo.local',
            clientName: 'Arthur Pendragon',
            goLiveDate: '',
            photoDate: '',
            signInstallDate: ''
          });
          setDeflectionTriggered(false);
          setLaunchChecklist({
            photographyScheduled: false,
            signPostInstalled: false,
            flyerDrafted: false,
            socialQueued: false,
            emailScheduled: false
          });
        }, 2000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendClarification = async (reqId: string) => {
    const text = newClarification[reqId];
    if (!text) return;
    setSentClarifications(prev => ({ ...prev, [reqId]: text }));
    
    try {
      await fetch('/api/work-items/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Approval Needed: Send outreach details to agent`,
          type: 'approval_needed',
          source: 'system',
          ownerRole: 'operations_lead',
          priority: 'medium',
          recommendedNextAction: `Approve outreach text: "${text}"`,
          relatedType: 'workflow',
          relatedId: reqId,
          relatedLabel: 'Marketing Coordinator Outreach',
          approvalRequired: true
        })
      });
      if (fetchState) await fetchState();
      alert(`Outbound clarification draft queued for Operations approval.`);
      setNewClarification(prev => ({ ...prev, [reqId]: '' }));
    } catch (e) {
      console.error(e);
    }
  };

  const getNeutralReviewRequestDraft = () => {
    return `Hi ${request.clientName || 'Valued Client'}, thank you for partnering with Nest Realty for your transaction at ${request.propertyAddress || 'your property'}. We would appreciate it if you could share your honest feedback on your experience. 

Google Review Link: https://g.page/nest-realty/review`;
  };

  return (
    <div className="space-y-6 font-sans text-xs text-[#F6F7F1] select-text text-left">
      
      {/* Title */}
      <div className="flex justify-between items-center border-b border-[rgba(246,247,241,0.12)] pb-4 select-none">
        <div>
          <h3 className="text-xl font-serif font-black text-white select-none">Marketing Request Desk</h3>
          <p className="mt-1 text-[#D0D6BB] font-medium font-sans">Standardized request portal and FAQ deflection engine for agent collateral production.</p>
        </div>
        <div className="flex bg-[rgba(246,247,241,0.08)] rounded-xl p-0.5 border border-[rgba(246,247,241,0.18)] animate-fade-in">
          <button
            onClick={() => setActiveTab('submit')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'submit' ? 'bg-[#00635C] text-white shadow-sm' : 'text-[#D0D6BB] hover:text-white'
            }`}
          >
            Agent Portal
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'queue' ? 'bg-[#00635C] text-white shadow-sm' : 'text-[#D0D6BB] hover:text-white'
            }`}
          >
            Coordinator Queue ({dbQueue.length})
          </button>
        </div>
      </div>

      {activeTab === 'submit' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div 
            className="lg:col-span-2 rounded-[28px] p-6 space-y-4 shadow-lg text-left"
            style={{
              background: 'rgba(246, 247, 241, 0.10)',
              border: '1px solid rgba(246, 247, 241, 0.18)',
              backdropFilter: 'blur(18px)'
            }}
          >
            <span className="font-mono font-bold text-[9px] text-[#D0D6BB] uppercase tracking-wider block">Submit Collateral Request</span>
            
            {isSubmitted ? (
              <div className="bg-[rgba(0,99,92,0.15)] border border-[rgba(0,99,92,0.3)] p-6 rounded-2xl text-center space-y-2 select-none">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="font-bold text-white text-sm">Collateral Request Logged</h4>
                <p className="text-xs text-[#D0D6BB]">Request submitted to coordinator. Validating missing asset links...</p>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-4 select-text">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-white block">Asset Template Type</label>
                    <select
                      value={request.type}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      className="w-full p-2 border border-[rgba(246,247,241,0.18)] rounded-xl bg-[#01362D] text-white text-xs focus:outline-none focus:border-emerald-500/50"
                    >
                      <option value="flyer">Print Flyer</option>
                      <option value="brochure">Listing Brochure</option>
                      <option value="social_post">Social Graphic</option>
                      <option value="open_house_asset">Open House Asset</option>
                      <option value="listing_launch_asset">Listing Launch Asset</option>
                      <option value="agent_bio_update">Agent Bio Update</option>
                      <option value="event_promotion">Event Promotion</option>
                      <option value="email_graphic">Email Graphic</option>
                      <option value="review_request">Google Review Request</option>
                      <option value="other">Other (Specify below)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-white block">Listing / Property Address</label>
                    <input 
                      type="text" 
                      value={request.propertyAddress}
                      onChange={(e) => handleInputChange('propertyAddress', e.target.value)}
                      placeholder="e.g. 102 Pine Street"
                      className="w-full p-2 border border-[rgba(246,247,241,0.18)] rounded-xl bg-[#01362D] text-white text-xs placeholder-[rgba(246,247,241,0.3)] focus:outline-none focus:border-emerald-500/50"
                      required
                    />
                  </div>

                  {request.type === 'review_request' ? (
                    <div className="space-y-1 sm:col-span-2">
                      <label className="font-bold text-white block">Client Name</label>
                      <input 
                        type="text" 
                        value={request.clientName}
                        onChange={(e) => handleInputChange('clientName', e.target.value)}
                        placeholder="e.g. Arthur Pendragon"
                        className="w-full p-2 border border-[rgba(246,247,241,0.18)] rounded-xl bg-[#01362D] text-white text-xs placeholder-[rgba(246,247,241,0.3)] focus:outline-none focus:border-emerald-500/50"
                        required
                      />
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <label className="font-bold text-white block">High-Res Photo Link</label>
                        <input 
                          type="text" 
                          value={request.photoLink}
                          onChange={(e) => handleInputChange('photoLink', e.target.value)}
                          placeholder="Google Drive link (warns if empty)"
                          className="w-full p-2 border border-[rgba(246,247,241,0.18)] rounded-xl bg-[#01362D] text-white text-xs placeholder-[rgba(246,247,241,0.3)] focus:outline-none focus:border-emerald-500/50"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-white block">Target Due Date</label>
                        <input 
                          type="date" 
                          value={request.dueDate}
                          onChange={(e) => handleInputChange('dueDate', e.target.value)}
                          className="w-full p-2 border border-[rgba(246,247,241,0.18)] rounded-xl bg-[#01362D] text-white text-xs focus:outline-none focus:border-emerald-500/50"
                          required
                        />
                      </div>
                      {request.type === 'listing_launch_asset' && (
                        <>
                          <div className="space-y-1">
                            <label className="font-bold text-white block">Go-Live Launch Date</label>
                            <input 
                              type="date" 
                              value={request.goLiveDate}
                              onChange={(e) => handleInputChange('goLiveDate', e.target.value)}
                              className="w-full p-2 border border-[rgba(246,247,241,0.18)] rounded-xl bg-[#01362D] text-white text-xs focus:outline-none focus:border-emerald-500/50"
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="font-bold text-white block">Photography Date</label>
                            <input 
                              type="date" 
                              value={request.photoDate}
                              onChange={(e) => handleInputChange('photoDate', e.target.value)}
                              className="w-full p-2 border border-[rgba(246,247,241,0.18)] rounded-xl bg-[#01362D] text-white text-xs focus:outline-none focus:border-emerald-500/50"
                            />
                          </div>
                          <div className="space-y-1 sm:col-span-2">
                            <label className="font-bold text-white block">Sign Post Installation Date</label>
                            <input 
                              type="date" 
                              value={request.signInstallDate}
                              onChange={(e) => handleInputChange('signInstallDate', e.target.value)}
                              className="w-full p-2 border border-[rgba(246,247,241,0.18)] rounded-xl bg-[#01362D] text-white text-xs focus:outline-none focus:border-emerald-500/50"
                            />
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>

                {request.type === 'review_request' ? (
                  <div className="space-y-2 p-3 bg-[rgba(246,247,241,0.04)] border border-[rgba(246,247,241,0.08)] rounded-xl text-left">
                    <span className="text-[8px] font-mono text-[#D0D6BB] uppercase tracking-wider block">Outbound Gated Draft Preview</span>
                    <pre className="text-[10px] text-white whitespace-pre-wrap font-sans leading-relaxed">
                      {getNeutralReviewRequestDraft()}
                    </pre>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1">
                      <label className="font-bold text-white block">Copy Text / Description details</label>
                      <textarea
                        value={request.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Provide description details (triggers missing warning if under 10 characters)"
                        className="w-full p-3 border border-[rgba(246,247,241,0.18)] rounded-xl bg-[#01362D] text-white text-xs h-20 font-sans focus:outline-none focus:border-emerald-500/50"
                      />
                    </div>

                    {/* Self-Serve Rechat Banner */}
                    <div className="p-4 bg-[rgba(246,247,241,0.06)] border border-[rgba(246,247,241,0.12)] rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 select-none text-left">
                      <div>
                        <span className="font-serif font-black text-white text-xs block">Self-Serve Rechat Templates</span>
                        <span className="text-[10px] text-[#D0D6BB] block mt-0.5">Need a standard brochure or flyer? Rechat templates are faster.</span>
                      </div>
                      <a 
                        href="https://rechat.com/design-center" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="px-3 py-1.5 bg-[#00635C] hover:bg-[#007c73] text-white text-[10px] font-bold rounded-xl border border-[rgba(246,247,241,0.18)] shadow-md transition-all shrink-0 cursor-pointer text-center"
                      >
                        Open Rechat Design Center
                      </a>
                    </div>

                    {/* Real-time missing info warning panel */}
                    {(!request.photoLink || request.description.length < 10) && (
                      <div className="p-3.5 bg-amber-955/30 border border-amber-800 rounded-2xl space-y-1 select-none text-left">
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider block font-mono flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                          Intake Warning: Missing Information Detected
                        </span>
                        <p className="text-[10px] text-amber-300 leading-relaxed font-sans font-medium">
                          {!request.photoLink && "· Photo link is empty. "}
                          {request.description.length < 10 && "· Description copy is too short. "}
                          This request will be flagged as <strong className="text-amber-250">[MISSING INFO]</strong> and routed to the Operations/Approvals Queue for manual verification instead of directly to production.
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* Listing Launch Checklist inline options */}
                {request.type === 'listing_launch_asset' && (
                  <div className="p-3 bg-[rgba(246,247,241,0.04)] border border-[rgba(246,247,241,0.08)] rounded-xl space-y-2 select-none text-left">
                    <div className="flex items-center gap-1.5 font-bold text-white uppercase text-[9px] tracking-wider">
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>Listing Launch Checklist Status</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-[#D0D6BB]">
                      <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                        <input 
                          type="checkbox" 
                          checked={launchChecklist.photographyScheduled} 
                          onChange={(e) => setLaunchChecklist({...launchChecklist, photographyScheduled: e.target.checked})}
                          className="rounded border-[rgba(246,247,241,0.18)] bg-[#01362D] text-emerald-650"
                        />
                        <span>Photography Scheduled</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                        <input 
                          type="checkbox" 
                          checked={launchChecklist.signPostInstalled} 
                          onChange={(e) => setLaunchChecklist({...launchChecklist, signPostInstalled: e.target.checked})}
                          className="rounded border-[rgba(246,247,241,0.18)] bg-[#01362D] text-emerald-650"
                        />
                        <span>Sign Post Installed</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                        <input 
                          type="checkbox" 
                          checked={launchChecklist.flyerDrafted} 
                          onChange={(e) => setLaunchChecklist({...launchChecklist, flyerDrafted: e.target.checked})}
                          className="rounded border-[rgba(246,247,241,0.18)] bg-[#01362D] text-emerald-650"
                        />
                        <span>Print Flyer Drafted</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                        <input 
                          type="checkbox" 
                          checked={launchChecklist.socialQueued} 
                          onChange={(e) => setLaunchChecklist({...launchChecklist, socialQueued: e.target.checked})}
                          className="rounded border-[rgba(246,247,241,0.18)] bg-[#01362D] text-emerald-650"
                        />
                        <span>Social Graphic Queued</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer sm:col-span-2 hover:text-white">
                        <input 
                          type="checkbox" 
                          checked={launchChecklist.emailScheduled} 
                          onChange={(e) => setLaunchChecklist({...launchChecklist, emailScheduled: e.target.checked})}
                          className="rounded border-[rgba(246,247,241,0.18)] bg-[#01362D] text-emerald-650"
                        />
                        <span>Launch Blast Email Scheduled</span>
                      </label>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2 bg-[#00635C] hover:bg-[#007c73] text-white text-xs font-bold rounded-xl border border-[rgba(246,247,241,0.18)] shadow-md transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'Logging...' : request.type === 'review_request' ? 'Queue Gated Review' : 'Submit Request'}
                </button>
              </form>
            )}
          </div>

          {/* Right sidebar: Deflections */}
          <div className="space-y-4 select-none">
            {deflectionTriggered ? (
              <div className="bg-[rgba(0,99,92,0.15)] border border-[rgba(0,99,92,0.3)] rounded-[28px] p-5 space-y-3 text-left">
                <div className="flex gap-2 items-center text-white">
                  <HelpCircle className="w-5 h-5 text-emerald-400" />
                  <span className="font-bold text-xs uppercase tracking-wider font-mono">Suggested Self-Serve Answer</span>
                </div>
                <div className="space-y-2 text-[11px] font-sans">
                  <p className="font-bold text-white">
                    {faqs.find(f => f.keywords.some(kw => request.type.toLowerCase().includes(kw) || request.propertyAddress.toLowerCase().includes(kw) || request.description.toLowerCase().includes(kw)))?.question}
                  </p>
                  <p className="text-[#D0D6BB] leading-relaxed">
                    {faqs.find(f => f.keywords.some(kw => request.type.toLowerCase().includes(kw) || request.propertyAddress.toLowerCase().includes(kw) || request.description.toLowerCase().includes(kw)))?.answer}
                  </p>
                </div>
              </div>
            ) : (
              <div 
                className="rounded-[28px] p-5 space-y-2 text-left"
                style={{
                  background: 'rgba(246, 247, 241, 0.10)',
                  border: '1px solid rgba(246, 247, 241, 0.18)',
                  backdropFilter: 'blur(18px)'
                }}
              >
                <HelpCircle className="w-5 h-5 text-[#D0D6BB]" />
                <span className="font-bold text-[11px] block text-white">Deflection Layer Active</span>
                <p className="text-[11px] text-[#D0D6BB] leading-relaxed font-sans">
                  The system scans template types to match self-serve FAQ articles, reducing coordinator task volumes.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'queue' && (
        <div className="space-y-3 select-text animate-fade-in">
          <span className="font-mono font-bold text-[9px] text-[#D0D6BB] uppercase tracking-wider block select-none">Coordinator Queue</span>
          <div 
            className="rounded-[28px] overflow-hidden shadow-lg border"
            style={{
              background: 'rgba(246, 247, 241, 0.10)',
              border: '1px solid rgba(246, 247, 241, 0.18)',
              backdropFilter: 'blur(18px)'
            }}
          >
            <table className="w-full text-left">
              <thead className="bg-[rgba(246,247,241,0.04)] text-[10px] font-bold text-white uppercase tracking-wider border-b border-[rgba(246,247,241,0.12)] select-none font-serif font-black">
                <tr>
                  <th className="py-3 px-3">Collateral Request</th>
                  <th className="py-3 px-3">Timeline Stage</th>
                  <th className="py-3 px-3">Compliance status</th>
                  <th className="py-3 px-3 text-right">Clarifications</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(246,247,241,0.12)] text-xs text-white">
                {dbQueue.map((item) => (
                  <tr key={item.id} className="hover:bg-[rgba(246,247,241,0.06)]">
                    <td className="py-3 px-3">
                      <span className="font-bold text-white block">{item.title}</span>
                      <span className="text-[10px] text-[#D0D6BB] block mt-0.5">Asset: {item.relatedLabel}</span>
                    </td>
                    <td className="py-3 px-3 select-none">
                      <div className="flex gap-2 items-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                          item.status === 'completed' ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40' :
                          item.status === 'ready_for_production' ? 'bg-blue-950/40 text-blue-300 border-blue-800/40' :
                          'bg-amber-955/40 text-amber-350 border-amber-800/40'
                        }`}>
                          {item.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono">
                      {item.type === 'missing_information' ? (
                        <span className="text-rose-350 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-450" />
                          Missing Details
                        </span>
                      ) : (
                        <span className="text-emerald-350 font-bold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          Ready
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {item.status === 'waiting_on_agent' && (
                        <div className="flex items-center justify-end gap-2 select-none">
                          <input
                            type="text"
                            placeholder="Request photos or details..."
                            value={newClarification[item.id] || ''}
                            onChange={(e) => setNewClarification({ ...newClarification, [item.id]: e.target.value })}
                            className="px-2 py-1.5 border border-[rgba(246,247,241,0.18)] rounded-xl bg-[#01362D] text-white text-[10px] focus:outline-none focus:border-emerald-500/50 w-40"
                          />
                          <button
                            onClick={() => handleSendClarification(item.id)}
                            className="p-1.5 bg-[rgba(246,247,241,0.05)] hover:bg-[rgba(246,247,241,0.12)] border border-[rgba(246,247,241,0.15)] rounded-xl cursor-pointer transition-all text-white"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                      {sentClarifications[item.id] && (
                        <span className="block text-[10px] text-[#D0D6BB] mt-1 font-sans">
                          Outbox Pending: "{sentClarifications[item.id]}"
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {dbQueue.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-[#D0D6BB] select-none italic font-sans">
                      No active marketing requests logged in database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
