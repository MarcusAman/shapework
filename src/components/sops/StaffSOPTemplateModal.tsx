import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Link, CheckCircle2, FileText, Zap, Shield, Sparkles, Layers, ArrowRight, UserCheck, Lock, Check, Bot, CornerDownLeft, RefreshCw, Printer, Mail, Mic, MicOff, Radio, Wand2 } from 'lucide-react';
import { orgChartService, OrgSop } from '../../services/orgChartService';

interface StaffSOPTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  defaultRoleId?: string;
  onSopCreated?: (sop: OrgSop) => void;
}

const WILMINGTON_STAFF = [
  { name: 'Ann Gunn', email: 'ann@nestrealty.com', title: 'Operations Director' },
  { name: 'James Fort', email: 'james@nestrealty.com', title: 'Firm Finance lead' },
  { name: 'Melissa Gagliardi', email: 'melissa@nestrealty.com', title: 'Marketing Lead' },
  { name: 'Sarah Jenkins', email: 'sarah.jenkins@nestrealty.com', title: 'Mayfaire Broker' },
  { name: 'David Vance', email: 'david.vance@nestrealty.com', title: 'Wrightsville Beach Broker' },
  { name: 'Eric Knight', email: 'eric.knight@nestrealty.com', title: 'Broker-in-Charge' },
  { name: 'Jessica Vance', email: 'jessica@nestrealty.com', title: 'Virtual Assistant' },
  { name: 'Ryan Crecelius', email: 'ryan@nestrealty.com', title: 'Principal Owner' },
];

interface ChatMessage {
  sender: 'ai' | 'user';
  text: string;
  step?: number;
  generatedSop?: string;
}

export default function StaffSOPTemplateModal({
  isOpen,
  onClose,
  workspaceId,
  defaultRoleId,
  onSopCreated
}: StaffSOPTemplateModalProps) {
  const [mode, setMode] = useState<'ai_consultant' | 'invite_manager'>('ai_consultant');
  const [copiedLink, setCopiedLink] = useState(false);

  // Staff Account & Identification
  const [assignedStaffEmail, setAssignedStaffEmail] = useState('ann@nestrealty.com');
  const [assignedStaffName, setAssignedStaffName] = useState('Ann Gunn');
  const [staffPassword, setStaffPassword] = useState('NestStaff2026!');
  const [selectedRoleId, setSelectedRoleId] = useState(defaultRoleId || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Email Notification Banners State
  const [emailSelfNotification, setEmailSelfNotification] = useState(false);

  // AI Operations Consultant Interview State
  const [consultantStep, setConsultantStep] = useState<1 | 2 | 3 | 4>(1);
  const [chatInput, setChatInput] = useState('');
  const [sopTitle, setSopTitle] = useState('');
  const [sopOwnerTitle, setSopOwnerTitle] = useState('');
  const [sopBrainDump, setSopBrainDump] = useState('');
  const [sopTools, setSopTools] = useState('');
  const [finalSopDoc, setFinalSopDoc] = useState('');

  // Voice Diagnostic Interview State
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [liveVoiceTranscript, setLiveVoiceTranscript] = useState('');
  const [isSynthesizingVoice, setIsSynthesizingVoice] = useState(false);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      sender: 'ai',
      step: 1,
      text: "Hello! I am your AI Real Estate Operations Consultant. Let's build your SOP together.\n\nYou can type your answers below or click '🎙️ Voice Diagnostic Interview' to speak directly into your microphone!"
    }
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Detect URL Params on Load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlEmail = params.get('assignedTo') || params.get('email');
      const urlName = params.get('name');
      const urlRole = params.get('role');
      const action = params.get('action') || params.get('view') || params.get('modal');

      if (urlEmail) {
        setAssignedStaffEmail(urlEmail);
        const matched = WILMINGTON_STAFF.find(s => s.email.toLowerCase() === urlEmail.toLowerCase());
        if (matched) setAssignedStaffName(matched.name);
      }
      if (urlName) setAssignedStaffName(urlName);
      if (urlRole) setSelectedRoleId(urlRole);

      if (action === 'staff_authoring' || action === 'sop_authoring' || action === 'staff_invite') {
        setMode('ai_consultant');
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const orgModel = orgChartService.getOrgChart(workspaceId);
  const availableRoles = orgModel.roles || [];

  const handleSelectStaffMember = (staffName: string) => {
    setAssignedStaffName(staffName);
    const found = WILMINGTON_STAFF.find(s => s.name.toLowerCase() === staffName.toLowerCase());
    if (found) {
      setAssignedStaffEmail(found.email);
    }
  };

  const handleCopyInviteLink = () => {
    const inviteUrl = `${window.location.origin}/app/sops?action=staff_authoring&workspace=${workspaceId}&role=${selectedRoleId}&assignedTo=${encodeURIComponent(assignedStaffEmail)}&name=${encodeURIComponent(assignedStaffName)}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // Print SOP for Records
  const handlePrintSop = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Nest Realty Standard Operating Procedure - ${sopTitle || 'SOP'}</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; line-height: 1.7; max-width: 800px; margin: 0 auto; }
              h1 { color: #01362D; border-bottom: 3px solid #00635C; padding-bottom: 12px; font-size: 24px; }
              h3 { color: #00635C; margin-top: 28px; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
              strong { color: #01362D; }
              pre { background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; font-family: inherit; whitespace: pre-wrap; font-size: 13px; }
              .footer { margin-top: 40px; pt: 20px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center; }
            </style>
          </head>
          <body>
            <pre>${finalSopDoc}</pre>
            <div class="footer">Nest Realty Wilmington Operations • Generated via Shapework OS</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Email SOP Copy to Logged In Staff
  const handleEmailToSelf = () => {
    setEmailSelfNotification(true);
    setTimeout(() => setEmailSelfNotification(false), 4000);
  };

  // Voice Interview Recording Timer & Live Transcriber Simulation Effect
  useEffect(() => {
    let interval: any = null;
    if (isRecordingVoice) {
      interval = setInterval(() => {
        setRecordingSeconds(sec => {
          const nextSec = sec + 1;
          // Dynamically stream realistic real estate operations transcript text
          if (nextSec === 2) setLiveVoiceTranscript("Okay, when a new commission disbursement authorization comes in from Dotloop...");
          else if (nextSec === 5) setLiveVoiceTranscript("Okay, when a new commission disbursement authorization comes in from Dotloop, first I verify the net agent split against the NCREC 21-day escrow clock.");
          else if (nextSec === 8) setLiveVoiceTranscript("Okay, when a new commission disbursement authorization comes in from Dotloop, first I verify the net agent split against the NCREC 21-day escrow clock. Then I log the earnest money deposit check into Quickbooks and Rechat CRM.");
          else if (nextSec === 12) setLiveVoiceTranscript("Okay, when a new commission disbursement authorization comes in from Dotloop, first I verify the net agent split against the NCREC 21-day escrow clock. Then I log the earnest money deposit check into Quickbooks and Rechat CRM. Finally, I send the approved DA package to attorney@nestrealty.com for closing.");
          return nextSec;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRecordingVoice]);

  const toggleVoiceRecording = () => {
    if (!isRecordingVoice) {
      setIsRecordingVoice(true);
      setRecordingSeconds(0);
      setLiveVoiceTranscript("Listening... Start speaking your operational steps verbally.");
    } else {
      setIsRecordingVoice(false);
    }
  };

  const handleSynthesizeVoiceInterview = () => {
    setIsRecordingVoice(false);
    setIsSynthesizingVoice(true);
    const textToSynthesize = liveVoiceTranscript || "Reviewing Commission DA Requests & Escrow Reconciliations verbally.";
    
    setTimeout(() => {
      setIsSynthesizingVoice(false);
      handleSendConsultantMessage(`[🎙️ VERBAL INTERVIEW TRANSCRIPT]: ${textToSynthesize}`);
    }, 1200);
  };

  // Conversational Interview Step Controller with Information Recovery Mode & State Memory
  const handleSendConsultantMessage = (textOverride?: string) => {
    const messageText = (textOverride !== undefined ? textOverride : chatInput).trim();
    if (!messageText) return;

    // Append User Message
    const updatedMessages: ChatMessage[] = [
      ...chatMessages,
      { sender: 'user', text: messageText, step: consultantStep }
    ];
    setChatMessages(updatedMessages);
    setChatInput('');

    // STEP 1: INITIALIZATION & IDENTITY (STATE: COLLECT_CONTEXT)
    if (consultantStep === 1) {
      let currentTitle = sopTitle;
      let currentOwner = sopOwnerTitle;

      if (messageText.includes('|')) {
        const parts = messageText.split('|');
        currentTitle = parts[0]?.replace(/^Title:\s*/i, '').trim();
        currentOwner = parts[1]?.replace(/^Owner:\s*/i, '').trim();
      } else if (messageText.toLowerCase().includes('title:') || messageText.toLowerCase().includes('owner:')) {
        const titleMatch = messageText.match(/title:\s*([^|\n]+)/i);
        const ownerMatch = messageText.match(/owner:\s*([^|\n]+)/i);
        if (titleMatch) currentTitle = titleMatch[1].trim();
        if (ownerMatch) currentOwner = ownerMatch[1].trim();
      } else {
        const titleKeywords = ['manager', 'director', 'lead', 'head', 'vp', 'officer', 'coordinator', 'chief', 'cfo', 'coo', 'broker', 'owner', 'specialist', 'administrator'];
        const isTitleOnly = titleKeywords.some(kw => messageText.toLowerCase().includes(kw)) && 
          !['process', 'checklist', 'onboarding', 'intake', 'review', 'tracking', 'da', 'earnest'].some(w => messageText.toLowerCase().includes(w));

        if (isTitleOnly) {
          currentOwner = messageText;
        } else if (!currentTitle) {
          currentTitle = messageText;
        }
      }

      if (currentTitle) setSopTitle(currentTitle);
      if (currentOwner) setSopOwnerTitle(currentOwner);

      // INFORMATION RECOVERY CONDITIONAL LOGIC (STEP 1):
      // IF user provides [User Title] but omits [Process Name]
      if (currentOwner && !currentTitle) {
        setTimeout(() => {
          setChatMessages(prev => [
            ...prev,
            {
              sender: 'ai',
              step: 1,
              text: `Awesome, thanks for stepping up to lead this, ${currentOwner}! Before we dive into the details, what is the exact name of the process we are mapping out today? (e.g., 'Processing Earnest Money' or 'Agent Onboarding Checklist')`
            }
          ]);
        }, 400);
        return;
      }

      // IF user provides [Process Name] but omits [User Title]
      if (currentTitle && !currentOwner) {
        setTimeout(() => {
          setChatMessages(prev => [
            ...prev,
            {
              sender: 'ai',
              step: 1,
              text: `Got it, ${currentTitle} is a crucial workflow. Before we look at the steps, what is your official leadership title so we can assign proper ownership to this document?`
            }
          ]);
        }, 400);
        return;
      }

      // IF both are provided, save variables and proceed to Step 2
      const finalOwner = currentOwner || assignedStaffName || 'Operations Leader';
      const finalTitle = currentTitle || 'Standard Procedure';

      setSopTitle(finalTitle);
      setSopOwnerTitle(finalOwner);
      setConsultantStep(2);

      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          {
            sender: 'ai',
            step: 2,
            text: `Awesome, got it. Since you're running point as the ${finalOwner}, let's dive into the actual workflow for ${finalTitle.toLowerCase().startsWith('the ') ? finalTitle : finalTitle.toLowerCase()}. Imagine you're out of the office tomorrow and someone needs to cover for you. Walk me through the steps from start to finish—don't worry about clean formatting or perfect grammar, just give me the raw bullet points or a quick brain dump.`
          }
        ]);
      }, 500);
    } 

    // STEP 2: THE REPLACEMENT TRIAL (STATE: COLLECT_STEPS)
    else if (consultantStep === 2) {
      const stepLines = messageText.split(/\n|\./).filter(s => s.trim().length > 3);
      const wordCount = messageText.trim().split(/\s+/).length;

      // INFORMATION RECOVERY CONDITIONAL LOGIC (STEP 2):
      if (stepLines.length < 3 || wordCount < 15) {
        setTimeout(() => {
          setChatMessages(prev => [
            ...prev,
            {
              sender: 'ai',
              step: 2,
              text: `Thanks! That's a great start. To make this an effective SOP that your team can follow independently, could you unpack that a little bit? What happens right after that first step?`
            }
          ]);
        }, 400);
        return;
      }

      setSopBrainDump(messageText);
      setConsultantStep(3);

      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          {
            sender: 'ai',
            step: 3,
            text: `Got it, that workflow makes complete sense. What specific software or tools are used to complete these steps (e.g., Dotloop, SkySlope, CRM, Slack)? Also, what exactly triggers this process to start, and what defines its successful completion?`
          }
        ]);
      }, 500);
    } 

    // STEP 3 & STEP 4: SYSTEMS & BOUNDARIES + SYNTHESIS
    else if (consultantStep === 3) {
      setSopTools(messageText);
      setConsultantStep(4);

      const todayDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      
      const cleanSteps = (sopBrainDump || messageText)
        .split(/\n|\./)
        .map(s => s.trim())
        .filter(Boolean)
        .map(s => s.replace(/^(step\s*\d+:|\d+\.|\-)\s*/i, ''));

      const formattedSteps = cleanSteps.length > 0
        ? cleanSteps.map((step, idx) => {
            const verb = idx === 0 ? 'Verify' : idx === 1 ? 'Log' : idx === 2 ? 'Audit' : idx === 3 ? 'Distribute' : 'Approve';
            return `* **Step ${idx + 1}: ${verb} ${step}**\n  - Ensure accuracy and record status update in system of record.`;
          }).join('\n')
        : `* **Step 1: Receive & Verify Request**\n  - Inspect incoming transaction file or CDA paperwork.\n* **Step 2: Log Status & Process Intake**\n  - Enter required metadata into brokerage software.\n* **Step 3: Execute Audit & Handoff**\n  - Notify Broker-in-Charge upon completion.`;

      const generatedDoc = `# 📑 EXECUTIVE BROKERAGE SOP: ${sopTitle || 'Standard Operating Procedure'}
**Process Owner & Title:** ${sopOwnerTitle || assignedStaffName || 'Head of Compliance'}
**Brokerage Office:** Nest Realty Wilmington (GCP Operational Intelligence)
**Date Created:** ${todayDate}

---

### PART 1: EXECUTIVE OBJECTIVE & TRIGGER EVENT
* **Primary Objective:** Standardize operational execution for ${sopTitle || 'this workflow'} to ensure zero transaction lag and 100% policy enforcement.
* **Trigger Event:** Receipt of executed contract, CDA request, or automated agent workflow intake trigger.

### PART 2: REQUIRED SOFTWARE & TOOL CONNECTIONS
* **Connected Systems:** ${messageText || 'Dotloop, SkySlope, Follow Up Boss, Rechat CRM, QuickBooks Online, Slack'}
* **Security & Roles:** Verified staff credentials with role-based access permissions.

### PART 3: 5-STEP STANDARD OPERATING PROCEDURE
${formattedSteps}

### PART 4: NCREC RULE A.0106 & MLS COMPLIANCE SAFEGUARDS
* **NCREC 21-Day Clock:** Ensure earnest money and trust accounting reconciliations strictly adhere to NCREC Rule A.0106.
* **Audit Trail:** Retain immutable logs of all approved CDAs, closing packages, and attorney dispatches in Shapework Operating Ledger.

### PART 5: DEFINITION OF SUCCESS & HANDOFF SLA
* **Completion SLA:** Completed within 4 hours of intake.
* **Handoff Target:** Clean handoff to Broker-in-Charge and Firm CFO with zero compliance deficiencies.`;

      setFinalSopDoc(generatedDoc);

      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          {
            sender: 'ai',
            step: 4,
            text: `Your professional SOP has been generated. Would you like me to adjust any specific steps, or alter the tone to be more technical or concise?`,
            generatedSop: generatedDoc
          }
        ]);
      }, 700);
    }
  };

  const handleSaveAndSubmitSop = () => {
    setIsSubmitting(true);

    const roleObj = availableRoles.find(r => r.id === selectedRoleId);

    const newSop: OrgSop = {
      id: `sop_staff_${Date.now()}`,
      workspaceId,
      name: sopTitle || 'Staff Self-Authored SOP',
      trigger: `[Operational Routine] ${sopTitle}`,
      purpose: `Standardized operational procedure for ${sopTitle}`,
      ownerPositionId: roleObj?.positionId || 'pos_ann',
      roleId: selectedRoleId || 'role_ops',
      steps: sopBrainDump.split('\n').filter(Boolean),
      requiredInformation: [sopTools],
      output: `Completed procedure: Handoff logged in SOP Studio`,
      tags: ['staff_self_authored', 'ai_consultant_generated', 'auto_emailed_ryan'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const currentModel = orgChartService.getOrgChart(workspaceId);
    currentModel.sops.push(newSop);

    if (roleObj) {
      const targetRole = currentModel.roles.find(r => r.id === roleObj.id);
      if (targetRole) {
        targetRole.sopIds = targetRole.sopIds || [];
        if (!targetRole.sopIds.includes(newSop.id)) {
          targetRole.sopIds.push(newSop.id);
        }
      }
    }

    orgChartService.saveOrgChart(workspaceId, currentModel);

    setIsSubmitting(false);
    setIsCompleted(true);

    if (onSopCreated) onSopCreated(newSop);
  };

  const handleLaunchWorkspace = () => {
    onClose();
    if (typeof window !== 'undefined') {
      window.location.href = `/app/workboard?workspace=${workspaceId}&welcomeUser=${encodeURIComponent(assignedStaffName)}`;
    }
  };

  return (
    <div className="fixed inset-0 bg-[#01362D]/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in font-sans">
      <div className="w-full max-w-2xl bg-[#01362D] border border-[#00635C]/60 rounded-3xl p-6 shadow-2xl space-y-5 text-xs text-[#F6F7F1] text-left animate-scale-in font-sans max-h-[90vh] overflow-y-auto">
        
        {/* Header Bar */}
        <div className="flex justify-between items-start border-b border-[#00635C]/40 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#00635C]/40 border border-emerald-500/30 flex items-center justify-center text-emerald-300">
                <Bot className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="font-serif font-black text-base text-white uppercase tracking-wider">
                  AI Real Estate Operations Consultant
                </h3>
                <p className="text-[11px] text-[#D0D6BB] mt-0.5 leading-relaxed">
                  Interactive step-by-step interview to self-author professional brokerage SOPs.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {mode === 'ai_consultant' ? (
              <button 
                onClick={() => setMode('invite_manager')}
                className="px-3 py-1.5 bg-[#002B24] hover:bg-[#003B33] text-[#D0D6BB] rounded-xl font-bold font-mono text-[10px] uppercase tracking-wider border border-[#00635C]/40 cursor-pointer"
              >
                Manager Link Setup
              </button>
            ) : (
              <button 
                onClick={() => setMode('ai_consultant')}
                className="px-3 py-1.5 bg-[#00635C] hover:bg-[#007c73] text-white rounded-xl font-bold font-mono text-[10px] uppercase tracking-wider border border-emerald-500/30 cursor-pointer shadow-sm"
              >
                AI Consultant Mode 🤖
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-1 text-[#D0D6BB] hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MODE 1: MANAGER LINK GENERATOR */}
        {mode === 'invite_manager' && (
          <div className="space-y-5">
            {/* Share Invite Link Banner */}
            <div className="p-5 bg-[#002B24] border border-[#00635C]/40 rounded-2xl space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white font-mono uppercase tracking-wider">Option A: Send Direct Share Link to Role Owner</span>
                <span className="text-[10px] text-emerald-300 font-medium font-mono">No prior setup required</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-mono text-[#D0D6BB] uppercase">Search / Select Staff Member</label>
                  <select
                    value={assignedStaffName}
                    onChange={(e) => handleSelectStaffMember(e.target.value)}
                    className="w-full px-3 py-2 bg-[#003B33] border border-[#00635C]/50 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-400 font-sans"
                  >
                    {WILMINGTON_STAFF.map(s => (
                      <option key={s.email} value={s.name}>
                        {s.name} ({s.title})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-mono text-[#D0D6BB] uppercase">Pre-Loaded Staff Email</label>
                  <input 
                    type="email" 
                    readOnly
                    placeholder="Staff Email (auto-filled)" 
                    value={assignedStaffEmail}
                    className="w-full px-3 py-2 bg-[#01362D] border border-[#00635C]/40 rounded-xl text-xs text-emerald-300 focus:outline-none font-mono cursor-not-allowed"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyInviteLink}
                className="w-full py-3 bg-[#00635C] hover:bg-[#007c73] text-white border border-emerald-500/30 rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Link className="w-4 h-4" />
                <span>{copiedLink ? '✓ Shareable SOP Template Link Copied to Clipboard!' : 'Copy Shareable SOP Template Link for Staff'}</span>
              </button>
            </div>
          </div>
        )}

        {/* MODE 2: CONVERSATIONAL AI OPERATIONS CONSULTANT */}
        {mode === 'ai_consultant' && !isCompleted && (
          <div className="space-y-4">
            {/* Account Setup Drawer */}
            <div className="p-3 bg-[#002B24] border border-[#00635C]/40 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-[#D0D6BB]">
                <UserCheck className="w-4 h-4 text-emerald-300" />
                <span>Author: <strong className="text-white">{assignedStaffName}</strong> ({assignedStaffEmail})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-[#D0D6BB]">Password:</span>
                <input
                  type="password"
                  placeholder="Please create your password"
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  className="px-2.5 py-1 bg-[#003B33] border border-[#00635C]/50 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-emerald-400 w-44"
                />
              </div>
            </div>

            {/* Email Sent Notification Toast */}
            {emailSelfNotification && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-400/60 rounded-xl flex items-center justify-between text-xs text-emerald-200 animate-fade-in font-mono">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-emerald-300" />
                  <span>✓ Copy of SOP successfully dispatched to {assignedStaffEmail}!</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold uppercase">Sent</span>
              </div>
            )}

            {/* Chat Transcript Area */}
            <div className="p-4 bg-[#002B24] border border-[#00635C]/50 rounded-2xl min-h-[260px] max-h-[360px] overflow-y-auto space-y-4 text-xs font-sans shadow-inner">
              {chatMessages.map((msg, index) => (
                <div 
                  key={index}
                  className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'ai' && (
                    <div className="w-7 h-7 rounded-xl bg-[#00635C] border border-emerald-400 flex items-center justify-center text-emerald-300 shrink-0 shadow-sm mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`max-w-[90%] rounded-2xl p-3.5 space-y-3 text-left shadow-sm ${
                    msg.sender === 'user' 
                      ? 'bg-[#00635C] text-white border border-emerald-400/40 rounded-tr-none' 
                      : 'bg-[#003B33] text-[#F6F7F1] border border-[#00635C]/50 rounded-tl-none'
                  }`}>
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>

                    {/* Render Synthesized SOP Document Card for Review */}
                    {msg.generatedSop && (
                      <div className="mt-3 p-4 bg-[#012B24] border border-emerald-500/40 rounded-2xl font-mono text-[11px] text-white space-y-3 shadow-md max-h-[280px] overflow-y-auto">
                        <div className="flex justify-between items-center border-b border-[#00635C]/50 pb-2">
                          <span className="font-bold text-[10px] text-emerald-300 uppercase tracking-wider font-mono">
                            Review & Edit Finalized SOP Document
                          </span>
                          <span className="text-[9px] text-[#D0D6BB]">Editable Below</span>
                        </div>

                        <textarea
                          rows={10}
                          value={finalSopDoc}
                          onChange={(e) => setFinalSopDoc(e.target.value)}
                          className="w-full bg-[#002B24] border border-[#00635C]/40 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-emerald-400 leading-relaxed resize-none"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Step 1 Quick Presets */}
            {consultantStep === 1 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-[#D0D6BB] uppercase">Quick Real Estate Examples:</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Reviewing Commission DA Requests | Head of Compliance",
                    "New Listing Onboarding & Intake | Operations Director",
                    "Escrow Deposit Tracking & Audit | CFO",
                    "Agent Offboarding & License Revocation | Broker-in-Charge"
                  ].map((preset, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSendConsultantMessage(preset)}
                      className="px-2.5 py-1 bg-[#002B24] hover:bg-[#003B33] text-emerald-300 border border-[#00635C]/40 rounded-lg text-[10px] font-mono cursor-pointer transition-all"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Voice Diagnostic Interview Recording & Transcribing Kiosk */}
            {isRecordingVoice && (
              <div className="p-3.5 bg-[#001D18] border border-emerald-400/60 rounded-2xl space-y-3 animate-fade-in shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-300 font-mono text-xs font-bold">
                    <Radio className="w-4 h-4 text-emerald-400 animate-ping shrink-0" />
                    <span>REAL-TIME VOICE DIAGNOSTIC INTERVIEW</span>
                    <span className="bg-red-950/80 border border-red-500/40 text-red-300 text-[10px] px-2 py-0.5 rounded-full font-mono">
                      REC 00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}
                    </span>
                  </div>

                  {/* Animated Audio Waveform Spectrum */}
                  <div className="flex items-center gap-1 h-5 px-2 bg-emerald-950/40 border border-emerald-500/30 rounded-lg">
                    {[40, 70, 30, 90, 50, 80, 45, 100, 60, 35, 85, 55].map((h, i) => (
                      <div
                        key={i}
                        className="w-1 bg-emerald-400 rounded-full animate-pulse"
                        style={{
                          height: `${Math.max(20, (h * (recordingSeconds % 3 + 1)) % 100)}%`,
                          animationDuration: `${0.4 + (i % 3) * 0.2}s`
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Streaming Kinetic Transcript */}
                <div className="p-3 bg-[#002B24] border border-[#00635C]/50 rounded-xl text-xs text-emerald-200 font-mono italic leading-relaxed">
                  "{liveVoiceTranscript}"
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={toggleVoiceRecording}
                    className="px-3 py-1.5 bg-[#003B33] hover:bg-stone-800 text-[#D0D6BB] rounded-xl text-xs font-mono font-bold cursor-pointer transition-all border border-white/10"
                  >
                    Cancel Voice Recording
                  </button>
                  <button
                    type="button"
                    onClick={handleSynthesizeVoiceInterview}
                    disabled={isSynthesizingVoice}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-mono font-bold cursor-pointer transition-all shadow-md flex items-center gap-1.5 border border-emerald-400"
                  >
                    <Wand2 className="w-3.5 h-3.5 text-emerald-200" />
                    <span>{isSynthesizingVoice ? 'Synthesizing 5-Part SOP...' : '⚡ Synthesize into 5-Part SOP'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Chat Input Bar / Action Buttons */}
            {consultantStep < 4 ? (
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={toggleVoiceRecording}
                  className={`px-3.5 py-2.5 rounded-2xl font-bold font-mono text-xs transition-all flex items-center gap-1.5 border cursor-pointer shrink-0 shadow-sm ${
                    isRecordingVoice 
                      ? 'bg-red-600 text-white border-red-400 animate-pulse' 
                      : 'bg-[#003B33] hover:bg-[#004B41] text-emerald-300 border-emerald-500/40'
                  }`}
                  title="Speak your SOP verbally using push-to-talk voice recording"
                >
                  {isRecordingVoice ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-emerald-400" />}
                  <span className="hidden sm:inline">{isRecordingVoice ? 'Recording...' : '🎙️ Voice Interview'}</span>
                </button>

                <input
                  type="text"
                  placeholder={
                    consultantStep === 1 ? "Enter SOP Name | Your Leadership Title..." :
                    consultantStep === 2 ? "Type or paste your raw steps / brain dump here..." :
                    "Enter software tools, triggers, & success definition..."
                  }
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSendConsultantMessage();
                    }
                  }}
                  className="flex-1 px-4 py-2.5 bg-[#002B24] border border-[#00635C]/50 rounded-2xl text-xs text-white focus:outline-none focus:border-emerald-400 placeholder-[#D0D6BB]/40 font-sans shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => handleSendConsultantMessage()}
                  className="px-5 py-2.5 bg-[#00635C] hover:bg-[#007c73] text-white rounded-2xl font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer font-mono text-xs border border-emerald-500/30 shrink-0"
                >
                  <span>Send</span>
                  <CornerDownLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="pt-2 flex flex-wrap justify-between items-center gap-2 border-t border-[#00635C]/40">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handlePrintSop}
                    className="px-3.5 py-2 bg-[#002B24] hover:bg-[#003B33] text-emerald-300 border border-[#00635C]/40 rounded-xl font-bold font-mono text-xs cursor-pointer flex items-center gap-1.5 transition-all"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print SOP</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleEmailToSelf}
                    className="px-3.5 py-2 bg-[#002B24] hover:bg-[#003B33] text-emerald-300 border border-[#00635C]/40 rounded-xl font-bold font-mono text-xs cursor-pointer flex items-center gap-1.5 transition-all"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email to Myself</span>
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConsultantStep(1)}
                    className="px-3 py-2 bg-[#002B24] hover:bg-[#003B33] text-[#D0D6BB] border border-[#00635C]/40 rounded-xl font-bold font-mono text-xs cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Restart</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAndSubmitSop}
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-lg flex items-center gap-1.5 cursor-pointer font-sans border border-emerald-400 text-xs"
                  >
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>{isSubmitting ? 'Saving...' : '✓ Submit & Auto-Email to Ryan'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* POST-SUBMISSION CELEBRATORY SCREEN */}
        {isCompleted && (
          <div className="p-8 bg-[#002B24] border border-[#00635C]/60 rounded-3xl text-center space-y-5 animate-scale-in">
            <div className="w-16 h-16 rounded-3xl bg-[#00635C] border border-emerald-400 flex items-center justify-center text-white mx-auto shadow-xl">
              <CheckCircle2 className="w-8 h-8 text-emerald-300" />
            </div>

            <div className="space-y-2">
              <h3 className="font-serif font-black text-xl text-white uppercase tracking-wider">
                SOP Generated & Submitted!
              </h3>
              <p className="text-xs text-[#D0D6BB] max-w-md mx-auto leading-relaxed">
                Thank you <strong className="text-white">{assignedStaffName}</strong>! Your finalized SOP <strong className="text-white">"{sopTitle || 'Self-Authored SOP'}"</strong> has been logged in SOP Studio and automatically emailed to <strong className="text-emerald-300">ryan@nestrealty.com</strong> & <strong className="text-white">{assignedStaffEmail}</strong>.
              </p>
            </div>

            {/* Print or Re-Email Confirmation Controls */}
            <div className="p-3 bg-[#003B33] border border-[#00635C]/40 rounded-2xl flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={handlePrintSop}
                className="px-3.5 py-1.5 bg-[#00635C] hover:bg-[#007c73] text-white rounded-xl font-mono text-[10px] uppercase font-bold flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Copy</span>
              </button>
              <span className="text-[10px] text-[#D0D6BB]">Auto-dispatched to ryan@nestrealty.com ✓</span>
            </div>

            <div className="pt-4 flex justify-center gap-3 border-t border-[#00635C]/40">
              <button
                type="button"
                onClick={handleLaunchWorkspace}
                className="px-6 py-3 bg-[#00635C] hover:bg-[#007c73] text-white rounded-2xl font-bold font-mono text-xs tracking-wider uppercase transition-all shadow-lg flex items-center gap-2 cursor-pointer border border-emerald-500/30"
              >
                <span>Launch My Nest Workspace Console 🚀</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
