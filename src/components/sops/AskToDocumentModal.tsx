import React, { useState } from 'react';
import { X, Send, UserCheck, FileText, Compass, Calendar, CheckCircle2, ShieldCheck, Mail } from 'lucide-react';

interface AskToDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  onRequestCreated?: () => void;
}

export function AskToDocumentModal({
  isOpen,
  onClose,
  workspaceId,
  onRequestCreated
}: AskToDocumentModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successReq, setSuccessReq] = useState<any>(null);

  // Form State
  const [employeeId, setEmployeeId] = useState('usr_melissa');
  const [employeeName, setEmployeeName] = useState('Melissa Gagliardi');
  const [employeeEmail, setEmployeeEmail] = useState('melissa@nestrealty.com');
  const [employeeRole, setEmployeeRole] = useState('Marketing Coordinator & Operations Lead');

  const [assignmentType, setAssignmentType] = useState<'known_process' | 'role_discovery'>('known_process');
  const [processName, setProcessName] = useState('Commission DA Verification & Escrow Audit Procedure');
  const [processContext, setProcessContext] = useState('Verify seller digital signature, agent splits against NCREC rules, and earnest money receipts before payout.');

  const [reviewerUserId, setReviewerUserId] = useState('usr_ryan');
  const [reviewerName, setReviewerName] = useState('Ryan Crecelius');
  const [dueDate, setDueDate] = useState('2026-08-15');

  if (!isOpen) return null;

  const handleSendInvitation = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/sops/authoring-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-workspace-id': workspaceId },
        body: JSON.stringify({
          workspaceId: workspaceId || 'nest-realty-wilmington',
          employeeId,
          employeeName,
          employeeEmail,
          employeeRole,
          assignmentType,
          processName: assignmentType === 'known_process' ? processName : 'Role-Based Process Discovery & SOP Mapping',
          processContext,
          reviewerUserId,
          reviewerName,
          dueDate
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#01362D]/90 backdrop-blur-md p-4 overflow-y-auto font-sans">
      <div className="bg-[#FFFDF8] border border-stone-200 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl text-stone-900">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#01362D] text-[#FFFDF8] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Mail className="w-5 h-5 text-[#D0D6BB]" />
            <div>
              <h2 className="text-base font-bold">Ask someone to document a process</h2>
              <p className="text-xs text-[#D0D6BB]/80">Send a voice-guided SOP self-authoring request to your team</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-[#D0D6BB]/70 hover:text-[#FFFDF8] rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Pills */}
        <div className="px-6 py-3 bg-[#F6F7F1] border-b border-stone-200 flex items-center justify-between text-xs text-stone-600 font-medium">
          <div className={`flex items-center gap-1.5 ${step === 1 ? 'text-[#00635C] font-bold' : ''}`}>
            <span className="w-5 h-5 rounded-full bg-[#00635C] text-[#FFFDF8] flex items-center justify-center text-[10px]">1</span>
            <span>Who</span>
          </div>
          <div className={`flex items-center gap-1.5 ${step === 2 ? 'text-[#00635C] font-bold' : ''}`}>
            <span className="w-5 h-5 rounded-full bg-[#00635C] text-[#FFFDF8] flex items-center justify-center text-[10px]">2</span>
            <span>What</span>
          </div>
          <div className={`flex items-center gap-1.5 ${step === 3 ? 'text-[#00635C] font-bold' : ''}`}>
            <span className="w-5 h-5 rounded-full bg-[#00635C] text-[#FFFDF8] flex items-center justify-center text-[10px]">3</span>
            <span>Reviewer</span>
          </div>
          <div className={`flex items-center gap-1.5 ${step === 4 ? 'text-[#00635C] font-bold' : ''}`}>
            <span className="w-5 h-5 rounded-full bg-[#00635C] text-[#FFFDF8] flex items-center justify-center text-[10px]">4</span>
            <span>Preview & Send</span>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 space-y-5">
          {successReq ? (
            /* Success Confirmation View */
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-900">Invitation sent to {employeeName}!</h3>
                <p className="text-xs text-stone-600 max-w-md mx-auto mt-1">
                  We’ve sent an email invitation with a secure authoring link. {employeeName} will be guided step-by-step through voice or typing.
                </p>
              </div>

              <div className="p-3 bg-[#F6F7F1] border border-stone-200 rounded-2xl text-left text-xs font-mono break-all text-stone-700 space-y-1">
                <div className="font-bold font-sans text-stone-900">Direct Invitation Link:</div>
                <div className="text-[#00635C] underline">{successReq.invitationUrl}</div>
              </div>

              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={() => {
                    window.open(successReq.invitationUrl, '_blank');
                  }}
                  className="px-4 py-2 bg-[#00635C] hover:bg-[#01362D] text-[#FFFDF8] font-bold text-xs rounded-xl shadow-md"
                >
                  Test Portal as {employeeName.split(' ')[0]}
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold rounded-xl"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* STEP 1: WHO KNOWS THIS PROCESS BEST */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">Step 1: Who knows this process best?</h3>
                    <p className="text-xs text-stone-600">Select the team member who carries out this procedure day-to-day.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-stone-700">Team Member</label>
                    <select
                      value={employeeId}
                      onChange={(e) => {
                        setEmployeeId(e.target.value);
                        if (e.target.value === 'usr_melissa') {
                          setEmployeeName('Melissa Gagliardi');
                          setEmployeeEmail('melissa@nestrealty.com');
                          setEmployeeRole('Marketing Coordinator & Operations Lead');
                        } else if (e.target.value === 'usr_ann') {
                          setEmployeeName('Ann Gunn');
                          setEmployeeEmail('ann.gunn@nestrealty.com');
                          setEmployeeRole('Brokerage Administrator');
                        } else {
                          setEmployeeName('Eric Knight');
                          setEmployeeEmail('eric.knight@nestrealty.com');
                          setEmployeeRole('Managing Director');
                        }
                      }}
                      className="w-full p-3 bg-[#F6F7F1] border border-stone-300 rounded-xl text-xs font-medium text-stone-900"
                    >
                      <option value="usr_melissa">Melissa Gagliardi — Marketing Coordinator & Operations Lead</option>
                      <option value="usr_ann">Ann Gunn — Brokerage Administrator</option>
                      <option value="usr_eric">Eric Knight — Managing Director</option>
                    </select>
                  </div>

                  <div className="p-3 bg-[#F6F7F1] rounded-xl border border-stone-200 text-xs text-stone-600 space-y-1">
                    <div><strong>Recipient Email:</strong> {employeeEmail}</div>
                    <div><strong>Role Title:</strong> {employeeRole}</div>
                  </div>
                </div>
              )}

              {/* STEP 2: WHAT SHOULD THEY DOCUMENT */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">Step 2: What should they document?</h3>
                    <p className="text-xs text-stone-600">Choose between a known specific procedure or role-based process discovery.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      onClick={() => setAssignmentType('known_process')}
                      className={`p-4 rounded-2xl border text-left space-y-1.5 transition-all cursor-pointer ${
                        assignmentType === 'known_process'
                          ? 'bg-[#00635C]/10 border-[#00635C] text-[#00635C]'
                          : 'bg-[#F6F7F1] border-stone-200 text-stone-700 hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-xs">
                        <FileText className="w-4 h-4" />
                        <span>A specific process</span>
                      </div>
                      <p className="text-[11px] opacity-80 leading-relaxed">
                        Specify a named procedure you need documented (e.g. Commission DA Verification).
                      </p>
                    </button>

                    <button
                      onClick={() => setAssignmentType('role_discovery')}
                      className={`p-4 rounded-2xl border text-left space-y-1.5 transition-all cursor-pointer ${
                        assignmentType === 'role_discovery'
                          ? 'bg-[#00635C]/10 border-[#00635C] text-[#00635C]'
                          : 'bg-[#F6F7F1] border-stone-200 text-stone-700 hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-xs">
                        <Compass className="w-4 h-4" />
                        <span>Role process discovery</span>
                      </div>
                      <p className="text-[11px] opacity-80 leading-relaxed">
                        Help {employeeName.split(' ')[0]} identify all the recurring processes she owns before documenting them.
                      </p>
                    </button>
                  </div>

                  {assignmentType === 'known_process' ? (
                    <div className="space-y-3 pt-2">
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">Process Name</label>
                        <input
                          type="text"
                          value={processName}
                          onChange={(e) => setProcessName(e.target.value)}
                          className="w-full p-2.5 bg-[#F6F7F1] border border-stone-300 rounded-xl text-xs text-stone-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">What should the guide already know? (Context & Discovery Notes)</label>
                        <textarea
                          rows={3}
                          value={processContext}
                          onChange={(e) => setProcessContext(e.target.value)}
                          className="w-full p-2.5 bg-[#F6F7F1] border border-stone-300 rounded-xl text-xs text-stone-900"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-[#F6F7F1] border border-stone-200 rounded-xl text-xs text-stone-700 leading-relaxed">
                      The voice guide will ask {employeeName.split(' ')[0]} to walk through her weekly and per-transaction responsibilities, map out her core recurring processes, and create individual SOP drafts for each.
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: REVIEWER & DUE DATE */}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">Step 3: Who reviews the draft?</h3>
                    <p className="text-xs text-stone-600">Designate the manager or reviewer responsible for reviewing and approving the SOP before publication.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">Reviewer</label>
                      <select
                        value={reviewerUserId}
                        onChange={(e) => {
                          setReviewerUserId(e.target.value);
                          if (e.target.value === 'usr_ryan') setReviewerName('Ryan Crecelius');
                          else setReviewerName('Eric Knight');
                        }}
                        className="w-full p-2.5 bg-[#F6F7F1] border border-stone-300 rounded-xl text-xs text-stone-900"
                      >
                        <option value="usr_ryan">Ryan Crecelius — Managing Broker</option>
                        <option value="usr_eric">Eric Knight — Managing Director</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">Target Completion Date</label>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full p-2.5 bg-[#F6F7F1] border border-stone-300 rounded-xl text-xs text-stone-900"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: PREVIEW EMAIL & SEND */}
              {step === 4 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">Step 4: Preview invitation email</h3>
                    <p className="text-xs text-stone-600">This email will be delivered to {employeeEmail}.</p>
                  </div>

                  {/* Transactional Email Preview Box */}
                  <div className="p-4 bg-[#F6F7F1] border border-stone-300 rounded-2xl text-xs text-stone-800 space-y-3 font-sans shadow-inner">
                    <div className="border-b border-stone-200 pb-2 text-[11px] text-stone-500 space-y-0.5">
                      <div><strong>To:</strong> {employeeName} &lt;{employeeEmail}&gt;</div>
                      <div><strong>From:</strong> Nest Operations &lt;ops@nestrealty.com&gt;</div>
                      <div><strong>Subject:</strong> {employeeName.split(' ')[0]}, help us document an important Nest process</div>
                    </div>

                    <div className="space-y-2 leading-relaxed text-stone-900">
                      <p>Hi {employeeName.split(' ')[0]},</p>
                      <p>
                        Ryan has asked you to document the <strong>{assignmentType === 'known_process' ? processName : 'Role-Based Operational Processes'}</strong>.
                      </p>
                      <p>
                        You know this work better than anyone. Shapework will ask one question at a time and turn your answers into a draft you can review and change.
                      </p>
                      <p className="text-stone-600 italic">
                        Nothing will be published automatically until you and your team review it.
                      </p>
                      <div className="py-2">
                        <span className="px-4 py-2 bg-[#00635C] text-[#FFFDF8] font-bold rounded-xl text-xs inline-block">
                          Start my SOP
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500">Estimated time: 15–20 minutes • Secure link valid until {dueDate}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step Navigation Controls */}
              <div className="pt-4 border-t border-stone-200 flex items-center justify-between">
                {step > 1 ? (
                  <button
                    onClick={() => setStep((s) => (s - 1) as any)}
                    className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 font-medium text-xs rounded-xl"
                  >
                    Back
                  </button>
                ) : <div />}

                {step < 4 ? (
                  <button
                    onClick={() => setStep((s) => (s + 1) as any)}
                    className="px-5 py-2.5 bg-[#00635C] hover:bg-[#01362D] text-[#FFFDF8] font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Next Step
                  </button>
                ) : (
                  <button
                    onClick={handleSendInvitation}
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-[#00635C] hover:bg-[#01362D] text-[#FFFDF8] font-bold text-xs rounded-xl flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? 'Sending...' : 'Send invitation'}</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
