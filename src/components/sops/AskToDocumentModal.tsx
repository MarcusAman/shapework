import React, { useState } from 'react';
import {
  X, Send, UserCheck, FileText, Compass, Calendar, CheckCircle2, ShieldCheck, Mail,
  ArrowRight, ArrowLeft, Copy, Check, Sparkles, Building2, User, HelpCircle, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AskToDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  onRequestCreated?: () => void;
}

const DEPARTMENTS = [
  'Operations',
  'Listing Management',
  'Transaction Coordination & Escrow',
  'Marketing & Client Services',
  'Agent Onboarding & Support',
  'Brokerage Compliance'
];

const LOCATIONS = [
  'All Offices',
  'Mayfaire (Wilmington Main)',
  'Carolina Beach'
];

const ROLES_LIST = [
  'Transaction Coordinator',
  'Marketing Coordinator',
  'Listing Coordinator',
  'Operations Lead',
  'Broker-In-Charge (BIC)',
  'Associate Broker / Agent'
];

export function AskToDocumentModal({
  isOpen,
  onClose,
  workspaceId,
  onRequestCreated
}: AskToDocumentModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successReq, setSuccessReq] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // Step 1: What process needs to be documented?
  const [processName, setProcessName] = useState('Commission DA Verification & Escrow Audit Procedure');
  const [processContext, setProcessContext] = useState('Verify seller digital signature, agent splits against NCREC rules, and earnest money receipts before payout.');
  const [department, setDepartment] = useState('Operations');
  const [location, setLocation] = useState('All Offices');
  const [applicableRoles, setApplicableRoles] = useState<string[]>(['Transaction Coordinator']);
  const [startingMethod, setStartingMethod] = useState<'nora_guided' | 'blank' | 'template'>('nora_guided');

  // Step 2: Who should document it?
  const [employeeMode, setEmployeeMode] = useState<'preset' | 'custom'>('preset');
  const [employeeId, setEmployeeId] = useState('usr_melissa');
  const [employeeName, setEmployeeName] = useState('Melissa Gagliardi');
  const [employeeEmail, setEmployeeEmail] = useState('melissa@nestrealty.com');
  const [employeeRole, setEmployeeRole] = useState('Marketing Coordinator & Operations Lead');

  // Step 3: Review & Approval Chain
  const [processOwnerName, setProcessOwnerName] = useState('Melissa Gagliardi');
  const [reviewerUserId, setReviewerUserId] = useState('usr_ryan');
  const [reviewerName, setReviewerName] = useState('Ryan Crecelius');
  const [requiresBicReview, setRequiresBicReview] = useState(true);
  const [bicReviewerUserId, setBicReviewerUserId] = useState('usr_jessica');
  const [bicReviewerName, setBicReviewerName] = useState('Jessica Keenan (BIC — Mayfaire)');
  const [dueDate, setDueDate] = useState('2026-08-30');
  const [instructions, setInstructions] = useState('Please verify earnest money escrow accounting and CDA sign-off requirements.');

  if (!isOpen) return null;

  const handleSelectPresetEmployee = (name: string, email: string, role: string, id: string) => {
    setEmployeeName(name);
    setEmployeeEmail(email);
    setEmployeeRole(role);
    setEmployeeId(id);
    setProcessOwnerName(name);
  };

  const toggleRole = (role: string) => {
    setApplicableRoles(prev => 
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const handleSendInvitation = async () => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('shapework_session_token') || 'usr_ryan';
      const res = await fetch('/api/sops/authoring-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': workspaceId || 'nest-realty-wilmington',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          workspaceId: workspaceId || 'nest-realty-wilmington',
          employeeId,
          employeeName,
          employeeEmail: employeeEmail.toLowerCase().trim(),
          employeeRole,
          assignmentType: 'known_process',
          processName,
          processContext,
          department,
          location,
          applicableRoles,
          startingMethod,
          processOwnerName,
          reviewerUserId,
          reviewerName,
          requiresBicReview,
          bicReviewerUserId: requiresBicReview ? bicReviewerUserId : undefined,
          bicReviewerName: requiresBicReview ? bicReviewerName : undefined,
          finalApproverUserId: 'usr_ryan',
          finalApproverName: 'Ryan Crecelius',
          dueDate,
          riskLevel: requiresBicReview ? 'compliance_sensitive' : 'standard',
          instructions
        })
      });
      const data = await res.json();
      setIsSubmitting(false);
      if (data.success && data.request) {
        setSuccessReq(data.request);
        if (onRequestCreated) onRequestCreated();
      }
    } catch (e) {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    if (successReq?.invitationUrl) {
      navigator.clipboard.writeText(successReq.invitationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 overflow-y-auto font-sans selection:bg-[#E5EFEA] selection:text-[#00635C]">
      <div className="bg-white border border-stone-200 rounded-2xl w-full max-w-2xl overflow-hidden shadow-xl text-stone-900 flex flex-col my-auto max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#00635C] flex items-center justify-center text-white font-serif font-bold text-base shadow-sm">
              N
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-stone-900">Invite Staff to Document an SOP</h2>
              <p className="text-[11px] text-stone-500 font-medium">Assign a structured operational process to a team member with NORA guidance</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-600 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator Bar */}
        {!successReq && (
          <div className="px-6 py-3 bg-[#F7F8F5] border-b border-stone-200/80 flex items-center justify-between text-xs text-stone-600 font-medium shrink-0">
            <div className={`flex items-center gap-1.5 ${step === 1 ? 'text-[#00635C] font-bold' : ''}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step === 1 ? 'bg-[#00635C] text-white' : 'bg-stone-200 text-stone-700'
              }`}>1</span>
              <span>1. Process</span>
            </div>
            <div className={`flex items-center gap-1.5 ${step === 2 ? 'text-[#00635C] font-bold' : ''}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step === 2 ? 'bg-[#00635C] text-white' : 'bg-stone-200 text-stone-700'
              }`}>2</span>
              <span>2. Contributor</span>
            </div>
            <div className={`flex items-center gap-1.5 ${step === 3 ? 'text-[#00635C] font-bold' : ''}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step === 3 ? 'bg-[#00635C] text-white' : 'bg-stone-200 text-stone-700'
              }`}>3</span>
              <span>3. Review Chain</span>
            </div>
            <div className={`flex items-center gap-1.5 ${step === 4 ? 'text-[#00635C] font-bold' : ''}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step === 4 ? 'bg-[#00635C] text-white' : 'bg-stone-200 text-stone-700'
              }`}>4</span>
              <span>4. Review & Send</span>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          
          {/* SUCCESS VIEW */}
          {successReq ? (
            <div className="space-y-5 text-center py-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-serif font-bold text-stone-900">SOP Authoring Invitation Sent!</h3>
                <p className="text-stone-500 text-xs mt-1">
                  An invitation has been generated for <strong className="text-stone-800">{successReq.employeeName}</strong> ({successReq.employeeEmail}).
                </p>
              </div>

              {/* Invitation Link Box */}
              <div className="p-4 bg-[#F7F8F5] border border-stone-200 rounded-xl text-left space-y-2">
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                  Secure Single-Use Authoring Link
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={successReq.invitationUrl}
                    className="flex-1 px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs font-mono text-stone-700 select-all"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#00635C] hover:bg-[#00514B] text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy Link'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-stone-500">
                  This single-use cryptographic token allows {successReq.employeeName} to set their password, enter SOP Studio, and record the procedure with NORA.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-stone-900 hover:bg-black text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* STEP 1: What process needs to be documented? */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Process Name / Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={processName}
                      onChange={(e) => setProcessName(e.target.value)}
                      placeholder="e.g. Commission DA Verification & Escrow Audit Procedure"
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Why document this process? (Context for employee)
                    </label>
                    <textarea
                      rows={2}
                      value={processContext}
                      onChange={(e) => setProcessContext(e.target.value)}
                      placeholder="Describe what outcome this ensures (e.g. NCREC compliance, avoiding closing delays)..."
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">Department</label>
                      <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C]"
                      >
                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">Office Location</label>
                      <select
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#00635C]/20 focus:border-[#00635C]"
                      >
                        {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Applicable Roles */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">Applicable Roles</label>
                    <div className="flex flex-wrap gap-1.5">
                      {ROLES_LIST.map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => toggleRole(r)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                            applicableRoles.includes(r)
                              ? 'bg-[#E5EFEA] border-[#00635C] text-[#00635C] font-semibold'
                              : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Starting Method */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">Starting Authoring Experience</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setStartingMethod('nora_guided')}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                          startingMethod === 'nora_guided'
                            ? 'border-[#00635C] bg-[#E5EFEA]/50 ring-1 ring-[#00635C]/30'
                            : 'border-stone-200 bg-white hover:bg-stone-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 font-bold text-stone-900 text-xs">
                            <Sparkles className="w-3.5 h-3.5 text-[#00635C]" />
                            <span>NORA-guided interview</span>
                          </div>
                          <span className="px-1.5 py-0.5 rounded-md bg-[#00635C] text-white text-[9px] font-bold uppercase tracking-wider">
                            Recommended
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-1.5 leading-relaxed">
                          Answer one question at a time by voice or typing to draft the procedure automatically.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setStartingMethod('blank')}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                          startingMethod === 'blank'
                            ? 'border-[#00635C] bg-[#E5EFEA]/50 ring-1 ring-[#00635C]/30'
                            : 'border-stone-200 bg-white hover:bg-stone-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 font-bold text-stone-900 text-xs">
                          <FileText className="w-3.5 h-3.5 text-stone-700" />
                          <span>Structured 5-section form</span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-1.5 leading-relaxed">
                          Standard section-by-section editable fields, steps, and compliance gates.
                        </p>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Who should document it? */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-stone-700">Select Team Member</label>
                    <div className="flex gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setEmployeeMode('preset')}
                        className={`font-semibold ${employeeMode === 'preset' ? 'text-[#00635C] underline' : 'text-stone-400'}`}
                      >
                        Directory Staff
                      </button>
                      <span className="text-stone-300">|</span>
                      <button
                        type="button"
                        onClick={() => setEmployeeMode('custom')}
                        className={`font-semibold ${employeeMode === 'custom' ? 'text-[#00635C] underline' : 'text-stone-400'}`}
                      >
                        New Staff / Custom Email
                      </button>
                    </div>
                  </div>

                  {employeeMode === 'preset' ? (
                    <div className="space-y-2">
                      {[
                        { id: 'usr_melissa', name: 'Melissa Gagliardi', email: 'melissa@nestrealty.com', role: 'Marketing Coordinator & Operations Lead' },
                        { id: 'dir_ann_gunn_28', name: 'Ann Gunn', email: 'ann@nestrealty.com', role: 'Operations Lead (ATC)' },
                        { id: 'usr_diane', name: 'Diane Ross', email: 'diane.ross@nestrealty.com', role: 'Transaction Coordinator' },
                        { id: 'usr_james', name: 'James Fort', email: 'james.fort@nestrealty.com', role: 'Transaction Coordinator' }
                      ].map((emp) => (
                        <button
                          key={emp.id}
                          type="button"
                          onClick={() => handleSelectPresetEmployee(emp.name, emp.email, emp.role, emp.id)}
                          className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                            employeeEmail === emp.email
                              ? 'border-[#00635C] bg-[#E5EFEA]/40'
                              : 'border-stone-200 bg-white hover:bg-stone-50'
                          }`}
                        >
                          <div>
                            <div className="font-semibold text-stone-900 text-xs">{emp.name}</div>
                            <div className="text-[11px] text-stone-500">{emp.role} • {emp.email}</div>
                          </div>
                          {employeeEmail === emp.email && (
                            <CheckCircle2 className="w-4 h-4 text-[#00635C]" />
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3 p-3.5 bg-stone-50 rounded-xl border border-stone-200">
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">Full Name</label>
                        <input
                          type="text"
                          value={employeeName}
                          onChange={(e) => setEmployeeName(e.target.value)}
                          placeholder="e.g. Taylor Smith"
                          className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">Work Email</label>
                        <input
                          type="email"
                          value={employeeEmail}
                          onChange={(e) => setEmployeeEmail(e.target.value)}
                          placeholder="e.g. taylor.smith@nestrealty.com"
                          className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">Role Title</label>
                        <input
                          type="text"
                          value={employeeRole}
                          onChange={(e) => setEmployeeRole(e.target.value)}
                          placeholder="e.g. Operations Assistant"
                          className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {/* Least Privilege Security Notice */}
                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 space-y-1">
                    <div className="font-semibold flex items-center gap-1.5 text-blue-950">
                      <ShieldCheck className="w-4 h-4 text-blue-700" />
                      <span>Least-Privilege Contributor Access</span>
                    </div>
                    <p className="text-[11px] text-blue-800 leading-relaxed">
                      The invited employee receives scoped <code>sop_contributor</code> permissions to draft and submit this specific SOP. They cannot publish or alter brokerage policies.
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 3: Who reviews and approves it? */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">Operational Reviewer</label>
                      <select
                        value={reviewerUserId}
                        onChange={(e) => {
                          setReviewerUserId(e.target.value);
                          if (e.target.value === 'usr_ryan') setReviewerName('Ryan Crecelius');
                          if (e.target.value === 'dir_ann_gunn_28') setReviewerName('Ann Gunn');
                        }}
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs text-stone-900"
                      >
                        <option value="usr_ryan">Ryan Crecelius (Owner)</option>
                        <option value="dir_ann_gunn_28">Ann Gunn (Ops Lead)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">Target Due Date</label>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs text-stone-900"
                      />
                    </div>
                  </div>

                  {/* BIC Compliance Gate Toggle */}
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={requiresBicReview}
                        onChange={(e) => setRequiresBicReview(e.target.checked)}
                        className="mt-0.5 rounded border-amber-300 text-amber-700 focus:ring-amber-600"
                      />
                      <div>
                        <span className="font-bold text-amber-900 text-xs">
                          Requires Broker-In-Charge (BIC) Compliance Review
                        </span>
                        <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                          Recommended for earnest money trust funds, agency agreements (Form 201), contract timelines, or regulatory NCREC rules.
                        </p>
                      </div>
                    </label>

                    {requiresBicReview && (
                      <div className="pt-2 border-t border-amber-200/80">
                        <label className="block text-[11px] font-semibold text-amber-900 mb-1">Designated BIC Reviewer</label>
                        <select
                          value={bicReviewerUserId}
                          onChange={(e) => {
                            setBicReviewerUserId(e.target.value);
                            setBicReviewerName(e.target.value === 'usr_eric' ? 'Eric Knight (BIC — Carolina Beach)' : 'Jessica Keenan (BIC — Mayfaire)');
                          }}
                          className="w-full px-3 py-1.5 bg-white border border-amber-200 rounded-lg text-xs text-stone-900"
                        >
                          <option value="usr_jessica">Jessica Keenan (BIC — Mayfaire)</option>
                          <option value="usr_eric">Eric Knight (BIC — Carolina Beach)</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Instructions for Contributor</label>
                    <textarea
                      rows={2}
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      placeholder="e.g. Please document the exact steps you take in Dotloop and QuickBooks..."
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs text-stone-900"
                    />
                  </div>
                </div>
              )}

              {/* STEP 4: Review & Send */}
              {step === 4 && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-[#F7F8F5] border border-stone-200 space-y-3">
                    <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                      Invitation Summary
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-stone-500 block">Process Title:</span>
                        <strong className="text-stone-900">{processName}</strong>
                      </div>
                      <div>
                        <span className="text-stone-500 block">Contributor:</span>
                        <strong className="text-stone-900">{employeeName} ({employeeEmail})</strong>
                      </div>
                      <div>
                        <span className="text-stone-500 block">Department:</span>
                        <strong className="text-stone-900">{department} • {location}</strong>
                      </div>
                      <div>
                        <span className="text-stone-500 block">Due Date:</span>
                        <strong className="text-stone-900">{dueDate}</strong>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-stone-200 text-xs">
                      <span className="text-stone-500 block">Review & Approval Chain:</span>
                      <div className="mt-1 flex items-center gap-2 text-stone-700 font-medium">
                        <span>{employeeName} (Draft)</span>
                        <ArrowRight className="w-3 h-3 text-stone-400" />
                        <span>{reviewerName}</span>
                        {requiresBicReview && (
                          <>
                            <ArrowRight className="w-3 h-3 text-stone-400" />
                            <span>{bicReviewerName}</span>
                          </>
                        )}
                        <ArrowRight className="w-3 h-3 text-stone-400" />
                        <span className="text-[#00635C] font-bold">Ryan Crecelius (Publish)</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-[11px] text-stone-600 leading-relaxed">
                    Clicking <strong>Send Invitation & Generate Link</strong> generates a single-use token and prepares the employee onboarding record.
                  </div>
                </div>
              )}
            </>
          )}

        </div>

        {/* Modal Footer Controls */}
        {!successReq && (
          <div className="px-6 py-3.5 bg-stone-50 border-t border-stone-200 flex items-center justify-between shrink-0">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(s => (s - 1) as any)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-stone-500 hover:text-stone-800"
              >
                Cancel
              </button>
            )}

            {step < 4 ? (
              <button
                type="button"
                disabled={step === 1 && !processName.trim()}
                onClick={() => setStep(s => (s + 1) as any)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00635C] hover:bg-[#00514B] text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSendInvitation}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#00635C] hover:bg-[#00514B] text-white text-xs font-bold shadow-sm transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Sending...' : 'Send Invitation & Generate Link'}</span>
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
