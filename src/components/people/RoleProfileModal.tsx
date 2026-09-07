import React, { useRef, useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, Shield, Award, User, Layers, FileText, CheckCircle2, Mail, Phone, MapPin, Edit, Plus, Trash2 } from 'lucide-react';
import { orgChartService, OrgPosition, OrgRole, OrgSop, OrgKnowledgeDocument } from '../../services/orgChartService';
import html2pdf from 'html2pdf.js';
import RoleProfilePdfDocument, { RoleProfilePdfData } from '../role-profile/RoleProfilePdfDocument';

interface RoleProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: {
    id: string;
    displayName: string;
    email?: string;
    phone?: string;
    photoUrl?: string;
    title?: string;
    status: 'active' | 'inactive' | 'unknown' | 'needs_review';
    personType: string;
    primaryOfficeName?: string;
  };
  workspaceId: string;
  onEdit?: (person: any) => void;
  currentUserEmail?: string;
  autoDownloadPDF?: boolean;
}

export default function RoleProfileModal({ isOpen, onClose, person, workspaceId, onEdit, currentUserEmail, autoDownloadPDF }: RoleProfileModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  const [isAddingRole, setIsAddingRole] = useState(false);
  const [roleTitle, setRoleTitle] = useState('');
  const [roleDesc, setRoleDesc] = useState('');
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editRoleTitle, setEditRoleTitle] = useState('');
  const [editRoleDesc, setEditRoleDesc] = useState('');
  const [localRoles, setLocalRoles] = useState<OrgRole[]>([]);
  const [deletingRole, setDeletingRole] = useState<OrgRole | null>(null);

  const currentDateStr = useMemo(() => new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }), []);

  const isAdmin = useMemo(() => {
    if (!currentUserEmail) return true;
    const clean = currentUserEmail.toLowerCase().trim();
    return ['matt@shapework.co', 'adam@shapework.co', 'marcus@shapework.co', 'ryan@nestrealty.com', 'admin@shapework.co'].includes(clean);
  }, [currentUserEmail]);

  useEffect(() => {
    if (!isOpen) return;
    const model = orgChartService.getOrgChart(workspaceId);
    const pos = model.positions.find(
      p =>
        (p.id && p.id === person.id) ||
        (p.email && person.email && p.email.toLowerCase() === person.email.toLowerCase()) ||
        (p.name && p.name.toLowerCase() === person.displayName?.toLowerCase()) ||
        (p.title && p.title.toLowerCase() === person.displayName?.toLowerCase())
    );
    if (pos) {
      setLocalRoles(model.roles.filter(r => r.positionId === pos.id));
    } else {
      setLocalRoles([]);
    }
    setIsAddingRole(false);
    setEditingRoleId(null);
    setRoleTitle('');
    setRoleDesc('');
  }, [person, workspaceId, isOpen]);

  // Retrieve org chart model to get position, roles, sops, etc.
  const orgModel = orgChartService.getOrgChart(workspaceId);
  const position = orgModel.positions.find(
    pos =>
      (pos.id && pos.id === person.id) ||
      (pos.email && person.email && pos.email.toLowerCase() === person.email.toLowerCase()) ||
      (pos.name && pos.name.toLowerCase() === person.displayName?.toLowerCase()) ||
      (pos.title && pos.title.toLowerCase() === person.displayName?.toLowerCase())
  );

  // If no position mapped, fallback gracefully
  const positionTitle = position?.title || person.title || 'Nest Agent';
  const department = position?.department || (person.personType === 'agent' ? 'Sales' : 'Operations');
  const officeText = position?.office || person.primaryOfficeName || 'Wilmington';

  // reportsToPosition
  const reportsToPos = position
    ? orgModel.positions.find(p => p.id === position.reportsToPositionId)
    : null;
  const reportsToText = reportsToPos
    ? `${reportsToPos.name === reportsToPos.title ? '' : reportsToPos.name + ' — '}${reportsToPos.title}`
    : 'None';

  // backupSeatOwner
  const backupPos = position
    ? orgModel.positions.find(p => p.id === position.backupPositionId)
    : null;
  const backupSeatOwnerText = backupPos
    ? `${backupPos.name} — ${backupPos.title}`
    : 'None';

  // calculatedBackup
  const calculatedBackupPos = backupPos;
  const calculatedBackupText = calculatedBackupPos ? calculatedBackupPos.name : 'None';

  // Roles & Responsibilities
  const modelRoles = position
    ? orgModel.roles.filter(r => r.positionId === position.id)
    : [];
  const roles = useMemo(() => {
    const combined = [...modelRoles];
    localRoles.forEach(lr => {
      if (!combined.some(r => r.id === lr.id)) {
        combined.push(lr);
      }
    });
    return combined;
  }, [modelRoles, localRoles]);

  const handleSaveRole = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!roleTitle.trim()) return;

    const model = orgChartService.getOrgChart(workspaceId);
    let pos = model.positions.find(
      p =>
        (p.email && p.email.toLowerCase() === person.email?.toLowerCase()) ||
        (p.name && p.name.toLowerCase() === person.displayName.toLowerCase())
    );

    if (!pos) {
      pos = {
        id: `pos_${Date.now()}`,
        workspaceId,
        title: person.title || 'Nest Agent',
        name: person.displayName,
        email: person.email || '',
        department: person.personType === 'agent' ? 'Sales' : 'Operations',
        office: person.primaryOfficeName || 'Wilmington',
        status: 'active',
        connectedTools: [],
        sopIds: [],
        roleIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      model.positions.push(pos);
    }

    const newRoleObj: OrgRole = {
      id: `role_${Date.now()}`,
      workspaceId,
      positionId: pos.id,
      name: roleTitle.trim(),
      description: roleDesc.trim() || 'Assigned operational responsibility.',
      categories: [roleTitle.trim()],
      sopIds: [],
      escalationPolicyIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    model.roles.push(newRoleObj);
    if (!pos.roleIds) pos.roleIds = [];
    pos.roleIds.push(newRoleObj.id);

    orgChartService.saveOrgChart(workspaceId, model);

    setLocalRoles(prev => [...prev, newRoleObj]);

    try {
      const evt = document.createEvent('Event');
      evt.initEvent('shapework_ops_reset', true, true);
      window.dispatchEvent(evt);
    } catch (err) {
      console.error(err);
    }

    setRoleTitle('');
    setRoleDesc('');
    setIsAddingRole(false);
  };

  // SOPs
  const sops = position
    ? orgModel.sops.filter(s => s.ownerPositionId === position.id)
    : [];

  // Knowledge Documents
  const docs = position
    ? (orgModel.knowledgeDocuments || []).filter(d => d.ownerPositionId === position.id)
    : [];

  // Backup Coverage (Routing Matrix Backup Entries)
  const backupMatrixItems = position
    ? (orgModel.routingMatrix || []).filter(item => item.backupOwnerPositionId === position.id)
    : [];

  const backupCoverageItems = [
    ...(backupPos ? [`Seat backup: ${backupPos.name}`] : []),
    ...backupMatrixItems.map(item => `Request: ${item.category}`)
  ];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const pdfData: RoleProfilePdfData = useMemo(() => {
    const rawCoverage: Array<{ type: string; label: string }> = [
      ...(backupPos ? [{ type: 'seat', label: `${backupPos.name} (${backupPos.title})` }] : []),
      ...backupMatrixItems.map(item => ({ type: 'request', label: item.category }))
    ];

    return {
      person: {
        id: person.id,
        displayName: person.displayName,
        initials: getInitials(person.displayName),
        title: person.title || position?.title,
        department: position?.department,
        status: person.status || 'active'
      },
      generatedAt: currentDateStr,
      reportsTo: reportsToPos ? {
        positionName: reportsToPos.title,
        personName: reportsToPos.name
      } : undefined,
      backupOwner: backupPos ? {
        positionName: backupPos.title,
        personName: backupPos.name
      } : undefined,
      calculatedBackup: calculatedBackupPos ? {
        positionName: calculatedBackupPos.title,
        personName: calculatedBackupPos.name
      } : undefined,
      rolesAndResponsibilities: (localRoles || []).map(r => ({
        id: r.id,
        title: r.name,
        description: r.description
      })),
      sopsAndKnowledge: [
        ...sops.map(s => ({
          id: s.id,
          title: s.name,
          type: 'sop' as const,
          summary: (s as any).summary || s.aiSummary || '',
          trigger: s.trigger
        })),
        ...docs.map(d => ({
          id: d.id,
          title: d.title,
          type: 'knowledge' as const,
          summary: (d as any).summary || d.aiSummary || ''
        }))
      ],
      backupCoverage: rawCoverage
    };
  }, [person, position, reportsToPos, backupPos, calculatedBackupPos, localRoles, sops, docs, backupMatrixItems, currentDateStr]);

  const handleDownloadPDF = async () => {
    if (!pdfContainerRef.current) return;

    const element = pdfContainerRef.current.firstElementChild as HTMLElement || pdfContainerRef.current;
    const cleanName = person.displayName.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_');
    const filename = `${cleanName || 'Role'}_Role_Profile.pdf`;

    const opt = {
      margin: 0,
      filename,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: '#ffffff'
      },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as const }
    };

    try {
      await html2pdf().from(element).set(opt).save();
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    }
  };

  useEffect(() => {
    if (isOpen && autoDownloadPDF) {
      const timer = setTimeout(() => {
        handleDownloadPDF();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoDownloadPDF]);

  if (!isOpen || typeof window === 'undefined') return null;

  const hasSops = sops.length > 0 || docs.length > 0;
  const hasBackups = backupCoverageItems.length > 0;
  const showFullCard = hasSops || hasBackups;

  // -------------------------------------------------------------
  // SIMPLIFIED PROFILE CARD VIEW (For users without SOPs AND not backup on anything)
  // -------------------------------------------------------------
  if (!showFullCard) {
    const compactCard = (
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6 text-left animate-fadeIn">
        <style>{`
          .print-light-theme {
            background-color: #ffffff !important;
            color: #12291e !important;
            padding: 16px !important;
          }
          .print-light-theme button,
          .print-light-theme form {
            display: none !important;
          }
          .print-light-theme h2 {
            color: #0d281e !important;
            font-size: 22px !important;
            font-weight: 800 !important;
          }
          .print-light-theme h3,
          .print-light-theme h4 {
            color: #0d281e !important;
            font-size: 13px !important;
            font-weight: 700 !important;
          }
          .print-light-theme p,
          .print-light-theme span,
          .print-light-theme a {
            color: #2e3d34 !important;
          }
          .print-light-theme .text-emerald-300,
          .print-light-theme .text-emerald-400,
          .print-light-theme .text-emerald-500 {
            color: #0d5e42 !important;
          }
          .print-light-theme .text-sky-300,
          .print-light-theme .text-sky-400 {
            color: #0369a1 !important;
          }
          
          /* Target inner cards and panels */
          .print-light-theme div[class*="bg-[#00382f]"],
          .print-light-theme div[class*="bg-black"],
          .print-light-theme div[class*="bg-white/5"] {
            background-color: #f7f8f5 !important;
            border: 1px solid #e1e6db !important;
            overflow: visible !important;
            height: auto !important;
            min-height: auto !important;
            padding: 12px 14px !important;
          }
          .print-light-theme div,
          .print-light-theme span,
          .print-light-theme border {
            border-color: #e1e6db !important;
          }
          .print-light-theme .truncate {
            overflow: visible !important;
            white-space: normal !important;
            text-overflow: clip !important;
            word-break: break-word !important;
            line-height: 1.45 !important;
            font-size: 13px !important;
          }
          
          /* Avatar initials box */
          .print-light-theme .w-14,
          .print-light-theme .w-16 {
            background-color: #edf2ee !important;
            border: 1px solid #c9d8cc !important;
            color: #0d281e !important;
          }
          
          /* Badges */
          .print-light-theme span[class*="bg-emerald-500/10"],
          .print-light-theme span[class*="bg-emerald-950/60"],
          .print-light-theme span[class*="bg-[#00382f]"] {
            background-color: #e8f4ec !important;
            border: 1px solid #c4e3cf !important;
            color: #0d5e42 !important;
          }
          .print-light-theme span[class*="bg-amber-950/40"] {
            background-color: #fef3c7 !important;
            border: 1px solid #fde68a !important;
            color: #92400e !important;
          }
          
          /* Target specific count text values color */
          .print-light-theme .text-3xl {
            color: #0d5e42 !important;
            font-size: 28px !important;
            font-weight: 800 !important;
          }
          .print-light-theme span[class*="text-white"] {
            color: #0d281e !important;
          }
          .print-light-theme span[class*="text-[#D0D6BB]"] {
            color: #37473f !important;
          }
          .print-light-theme span[class*="text-[#D0D6BB]/50"],
          .print-light-theme span[class*="text-[#D0D6BB]/40"],
          .print-light-theme span[class*="text-[#D0D6BB]/60"] {
            color: #5d6e64 !important;
            font-size: 10px !important;
            font-weight: 700 !important;
          }
        `}</style>
        {/* Blurred Backdrop */}
        <div 
          className="fixed inset-0 bg-[#001c17]/85 backdrop-blur-md transition-opacity duration-300 z-0"
          onClick={onClose}
        />

        {/* Modal Wrapper Container */}
        <div className="relative bg-[#012a23] border border-white/10 rounded-[32px] max-w-md w-full shadow-2xl flex flex-col z-10 text-white overflow-hidden animate-scale-in">
          {/* Header Actions */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#00211b] shrink-0 select-none">
            <span className="text-[10px] font-bold text-[#D0D6BB] uppercase tracking-wider">
              Contact Profile Card
            </span>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <button
                  onClick={() => {
                    onClose();
                    if (onEdit) onEdit(person);
                  }}
                  className="px-2.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Edit Employee Details"
                >
                  <Edit className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              )}
              <button
                onClick={handleDownloadPDF}
                className="px-3 py-1.5 bg-[#00635C] hover:bg-[#007c73] rounded-xl text-[10px] font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer border-none text-white animate-fade-in"
              >
                <Download className="w-3 h-3" />
                <span>PDF</span>
              </button>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/10 rounded-xl text-[#D0D6BB] hover:text-white transition-colors cursor-pointer border-none bg-transparent"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-6 space-y-6" ref={printRef} style={{ backgroundColor: '#012a23' }}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg bg-[#00382f] border border-white/10 shadow-sm">
                {getInitials(person.displayName)}
              </div>
              <div className="space-y-0.5">
                <h2 className="text-xl font-bold tracking-tight text-white leading-tight">{person.displayName}</h2>
                <p className="text-xs font-semibold text-emerald-300 uppercase tracking-wider leading-none">{positionTitle}</p>
                <span className="text-[10px] text-[#D0D6BB]/70 font-medium block leading-none">{department}</span>
              </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-3 bg-[#00382f]/30 border border-white/5 rounded-2xl p-4 font-mono text-xs text-[#D0D6BB]">
              {person.email && (
                <div className="flex items-center justify-between gap-4 py-1.5 border-b border-white/5 last:border-none">
                  <span className="text-[10px] uppercase text-[#D0D6BB]/40">Email</span>
                  <a href={`mailto:${person.email}`} className="text-white hover:underline truncate hover:text-emerald-300">
                    {person.email}
                  </a>
                </div>
              )}
              {person.phone && (
                <div className="flex items-center justify-between gap-4 py-1.5 border-b border-white/5 last:border-none">
                  <span className="text-[10px] uppercase text-[#D0D6BB]/40">Phone</span>
                  <a href={`tel:${person.phone}`} className="text-white hover:underline hover:text-emerald-300">
                    {person.phone}
                  </a>
                </div>
              )}
              <div className="flex items-center justify-between gap-4 py-1.5 last:border-none">
                <span className="text-[10px] uppercase text-[#D0D6BB]/40">Office</span>
                <span className="text-white">{officeText}</span>
              </div>
            </div>

            {/* Roles list & Add Role form */}
            <div className="space-y-2.5 border-t border-white/10 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#D0D6BB]/50 uppercase tracking-wider block select-none">Roles & Responsibilities</span>
                {isAdmin && !isAddingRole && (
                  <button
                    type="button"
                    onClick={() => setIsAddingRole(true)}
                    className="px-2 py-0.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-[9px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-2.5 h-2.5" />
                    <span>+ Add Role</span>
                  </button>
                )}
              </div>

              {isAddingRole && (
                <form onSubmit={handleSaveRole} className="p-3 bg-[#00382f]/70 border border-emerald-500/30 rounded-xl space-y-2 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">Add Role / Responsibility</span>
                    <button type="button" onClick={() => setIsAddingRole(false)} className="text-xs text-[#D0D6BB] hover:text-white">✕</button>
                  </div>
                  <input
                    type="text"
                    required
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    placeholder="Role Title (e.g. Listing Disclosures)"
                    className="w-full px-2.5 py-1.5 bg-[#01241E] border border-white/15 rounded-lg text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-400"
                  />
                  <textarea
                    value={roleDesc}
                    onChange={(e) => setRoleDesc(e.target.value)}
                    placeholder="Responsibilities / operational duties..."
                    rows={2}
                    className="w-full px-2.5 py-1.5 bg-[#01241E] border border-white/15 rounded-lg text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-400"
                  />
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingRole(false)}
                      className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[10px] font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-[#00635C] hover:bg-[#004d47] text-white border border-emerald-400/40 rounded-lg text-[10px] font-bold shadow-sm cursor-pointer"
                    >
                      Save Responsibility
                    </button>
                  </div>
                </form>
              )}

              {roles.length === 0 && !isAddingRole ? (
                <p className="text-[11px] text-[#D0D6BB]/50 italic">No roles or responsibilities assigned yet.</p>
              ) : (
                <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1">
                  {roles.map(role => {
                    const isEditingThis = editingRoleId === role.id;
                    if (isEditingThis) {
                      return (
                        <div key={role.id} className="p-3 bg-[#00382f]/80 border border-emerald-500/40 rounded-xl space-y-2 text-left">
                          <input
                            type="text"
                            value={editRoleTitle}
                            onChange={(e) => setEditRoleTitle(e.target.value)}
                            placeholder="Responsibility title"
                            className="w-full px-2 py-1 bg-[#01241E] border border-white/20 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-400 font-bold"
                          />
                          <textarea
                            value={editRoleDesc}
                            onChange={(e) => setEditRoleDesc(e.target.value)}
                            placeholder="Description..."
                            rows={2}
                            className="w-full px-2 py-1 bg-[#01241E] border border-white/20 rounded-lg text-[11px] text-white focus:outline-none focus:border-emerald-400"
                          />
                          <div className="flex justify-end gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => setEditingRoleId(null)}
                              className="px-2 py-0.5 bg-white/10 hover:bg-white/20 text-white rounded text-[10px]"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (!editRoleTitle.trim()) return;
                                orgChartService.updateRole(workspaceId, role.id, {
                                  name: editRoleTitle.trim(),
                                  description: editRoleDesc.trim()
                                });
                                setLocalRoles(prev => prev.map(r => r.id === role.id ? { ...r, name: editRoleTitle.trim(), description: editRoleDesc.trim() } : r));
                                setEditingRoleId(null);
                              }}
                              className="px-2.5 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={role.id} className="text-xs space-y-1 p-2 bg-[#00382f]/40 border border-white/5 rounded-xl">
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                            <h4 className="font-bold text-white leading-none">{role.name}</h4>
                          </div>
                          {isAdmin && (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingRoleId(role.id);
                                  setEditRoleTitle(role.name);
                                  setEditRoleDesc(role.description || '');
                                }}
                                className="p-1 text-slate-400 hover:text-emerald-300 rounded transition-colors cursor-pointer"
                                title="Edit Responsibility"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingRole(role)}
                                className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors cursor-pointer"
                                title="Remove Responsibility"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                        {role.description && (
                          <p className="text-[11px] text-[#D0D6BB]/70 leading-relaxed pl-3">
                            {role.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* DELETE ROLE REASSIGNMENT PROMPT MODAL */}
            {deletingRole && (
              <div className="p-4 bg-rose-950/90 border border-rose-500/40 rounded-2xl space-y-3 text-left animate-fade-in">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-rose-200">Remove Role: "{deletingRole.name}"</h4>
                  <button type="button" onClick={() => setDeletingRole(null)} className="text-xs text-rose-300">✕</button>
                </div>
                <p className="text-[11px] text-rose-100/80 leading-relaxed">
                  How would you like to handle any attached SOPs or duties assigned to this role?
                </p>
                <div className="flex flex-col gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const otherRole = roles.find(r => r.id !== deletingRole.id);
                      orgChartService.deleteRole(workspaceId, deletingRole.id, otherRole?.id);
                      setLocalRoles(prev => prev.filter(r => r.id !== deletingRole.id));
                      setDeletingRole(null);
                    }}
                    className="w-full px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-[11px] font-bold text-left cursor-pointer"
                  >
                    ✓ Reassign attached SOPs to another active role
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      orgChartService.deleteRole(workspaceId, deletingRole.id);
                      setLocalRoles(prev => prev.filter(r => r.id !== deletingRole.id));
                      setDeletingRole(null);
                    }}
                    className="w-full px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-[11px] font-bold text-left cursor-pointer"
                  >
                    ✕ Delete role and unassign attached SOPs permanently
                  </button>
                </div>
              </div>
            )}

            <div className="text-center text-[9px] text-[#D0D6BB]/30 pt-4 border-t border-white/5 select-none">
              Contact profile · generated {currentDateStr}
            </div>
          </div>
        </div>

        {/* Offscreen Target Container for PDF Export */}
        <div style={{ position: 'fixed', left: '-9999px', top: '-9999px', zIndex: -100, pointerEvents: 'none' }} ref={pdfContainerRef}>
          <RoleProfilePdfDocument data={pdfData} />
        </div>
      </div>
    );

    return createPortal(compactCard, document.body);
  }

  // -------------------------------------------------------------
  // FULL PROFILE CARD VIEW (For users with SOPs & Docs)
  // -------------------------------------------------------------
  const fullCard = (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6 text-left animate-fadeIn">
      <style>{`
        .print-light-theme {
          background-color: #ffffff !important;
          color: #1c1917 !important;
        }
        .print-light-theme h2,
        .print-light-theme h3,
        .print-light-theme h4,
        .print-light-theme strong,
        .print-light-theme span.text-white,
        .print-light-theme a.text-white {
          color: #1c1917 !important;
        }
        .print-light-theme p,
        .print-light-theme span,
        .print-light-theme a {
          color: #44403c !important;
        }
        .print-light-theme .text-emerald-300,
        .print-light-theme .text-emerald-400,
        .print-light-theme .text-emerald-500 {
          color: #15803d !important;
        }
        .print-light-theme .text-sky-300,
        .print-light-theme .text-sky-400 {
          color: #0369a1 !important;
        }
        
        /* Target inner cards and panels */
        .print-light-theme div[class*="bg-[#00382f]"],
        .print-light-theme div[class*="bg-black"],
        .print-light-theme div[class*="bg-white/5"] {
          background-color: #f5f5f4 !important;
          border-color: #e7e5e4 !important;
        }
        .print-light-theme div,
        .print-light-theme span,
        .print-light-theme border {
          border-color: #e7e5e4 !important;
        }
        
        /* Avatar initials box */
        .print-light-theme .w-14,
        .print-light-theme .w-16 {
          background-color: #f5f5f4 !important;
          border-color: #d6d3d1 !important;
          color: #1c1917 !important;
        }
        
        /* Badges */
        .print-light-theme span[class*="bg-emerald-500/10"] {
          background-color: #dcfce7 !important;
          border-color: #bbf7d0 !important;
          color: #166534 !important;
        }
        .print-light-theme span[class*="bg-emerald-950/60"] {
          background-color: #dcfce7 !important;
          border-color: #bbf7d0 !important;
          color: #166534 !important;
        }
        .print-light-theme span[class*="bg-amber-950/40"] {
          background-color: #fef3c7 !important;
          border-color: #fde68a !important;
          color: #92400e !important;
        }
        
        /* Backup coverage items */
        .print-light-theme span[class*="bg-[#00382f]"] {
          background-color: #dcfce7 !important;
          border-color: #bbf7d0 !important;
          color: #166534 !important;
        }
        
        /* Target specific count text values color */
        .print-light-theme .text-3xl {
          color: #15803d !important;
        }
        .print-light-theme span[class*="text-white"] {
          color: #1c1917 !important;
        }
        .print-light-theme span[class*="text-[#D0D6BB]"] {
          color: #44403c !important;
        }
        .print-light-theme span[class*="text-[#D0D6BB]/50"],
        .print-light-theme span[class*="text-[#D0D6BB]/40"],
        .print-light-theme span[class*="text-[#D0D6BB]/60"] {
          color: #78716c !important;
        }
      `}</style>
      {/* Blurred Backdrop */}
      <div 
        className="fixed inset-0 bg-[#001c17]/85 backdrop-blur-md transition-opacity duration-300 z-0"
        onClick={onClose}
      />

      {/* Modal Wrapper Container */}
      <div className="relative bg-[#012a23] border border-white/10 rounded-[32px] max-w-4xl w-full shadow-2xl flex flex-col z-10 max-h-[90vh] text-white overflow-hidden animate-scale-in">
        
        {/* Sticky Actions Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#00211b] shrink-0 select-none">
          <span className="text-xs font-bold text-[#D0D6BB] uppercase tracking-wider">
            Role Profile Viewer
          </span>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => {
                  onClose();
                  if (onEdit) onEdit(person);
                }}
                className="px-3.5 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Edit Employee Details"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            )}
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 bg-[#00635C] hover:bg-[#007c73] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer border-none text-white"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl text-[#D0D6BB] hover:text-white transition-colors cursor-pointer border-none bg-transparent"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Profile Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8" ref={printRef} style={{ backgroundColor: '#012a23' }}>
          
          {/* Header Block */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl bg-[#00382f] border border-white/10 shadow-sm">
                {getInitials(person.displayName)}
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight text-white">{person.displayName}</h2>
                <p className="text-sm font-medium text-[#D0D6BB]">{department} · {positionTitle}</p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1.5 text-right select-none">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-full text-xs font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Active Seat</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block font-mono">shapework</span>
                <span className="text-[10px] text-[#D0D6BB]/50 block">Role profile · generated {currentDateStr}</span>
              </div>
            </div>
          </div>

          {/* Reports & Backup Metadata Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-[#00382f]/40 border border-white/10 rounded-2xl">
              <span className="text-[10px] font-bold text-[#D0D6BB]/60 uppercase tracking-wider block mb-1 select-none">REPORTS TO</span>
              <span className="text-sm font-semibold text-white block truncate" title={reportsToText}>
                {reportsToText}
              </span>
            </div>
            <div className="p-4 bg-[#00382f]/40 border border-white/10 rounded-2xl">
              <span className="text-[10px] font-bold text-[#D0D6BB]/60 uppercase tracking-wider block mb-1 select-none">BACKUP SEAT OWNER</span>
              <span className="text-sm font-semibold text-white block truncate" title={backupSeatOwnerText}>
                {backupSeatOwnerText}
              </span>
            </div>
            <div className="p-4 bg-[#00382f]/40 border border-white/10 rounded-2xl">
              <span className="text-[10px] font-bold text-[#D0D6BB]/60 uppercase tracking-wider block mb-1 select-none">CALCULATED BACKUP</span>
              <span className="text-sm font-semibold text-white block truncate" title={calculatedBackupText}>
                {calculatedBackupText}
              </span>
            </div>
          </div>

          {/* Counts Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 select-none">
            <div className="p-4 bg-[#00382f]/60 border border-white/10 rounded-2xl flex items-center gap-4">
              <span className="text-3xl font-bold text-[#D0D6BB]">{roles.length}</span>
              <div>
                <span className="text-[10px] font-bold text-white uppercase tracking-wider block leading-tight">ROLES &</span>
                <span className="text-[10px] font-bold text-white uppercase tracking-wider block leading-tight">RESPONSIBILITIES</span>
              </div>
            </div>
            <div className="p-4 bg-[#00382f]/60 border border-white/10 rounded-2xl flex items-center gap-4">
              <span className="text-3xl font-bold text-[#D0D6BB]">{sops.length + docs.length}</span>
              <div>
                <span className="text-[10px] font-bold text-white uppercase tracking-wider block leading-tight">SOPS &</span>
                <span className="text-[10px] font-bold text-white uppercase tracking-wider block leading-tight">KNOWLEDGE</span>
              </div>
            </div>
            <div className="p-4 bg-[#00382f]/60 border border-white/10 rounded-2xl flex items-center gap-4">
              <span className="text-3xl font-bold text-[#D0D6BB]">{backupCoverageItems.length}</span>
              <div>
                <span className="text-[10px] font-bold text-white uppercase tracking-wider block leading-tight">BACKUP</span>
                <span className="text-[10px] font-bold text-white uppercase tracking-wider block leading-tight">COVERAGE</span>
              </div>
            </div>
          </div>

          {/* Main Content Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start pt-2">
            
            {/* Left Column: Roles & Responsibilities */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-2 select-none">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#D0D6BB]">ROLES & RESPONSIBILITIES</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/50">{roles.length}</span>
                  {isAdmin && !isAddingRole && (
                    <button
                      type="button"
                      onClick={() => setIsAddingRole(true)}
                      className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ Add Role / Responsibility</span>
                    </button>
                  )}
                </div>
              </div>

              {isAddingRole && (
                <form onSubmit={handleSaveRole} className="p-4 bg-[#00382f]/70 border border-emerald-500/30 rounded-2xl space-y-3 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Add Role / Responsibility</span>
                    <button type="button" onClick={() => setIsAddingRole(false)} className="text-xs text-[#D0D6BB] hover:text-white">✕</button>
                  </div>
                  <input
                    type="text"
                    required
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    placeholder="Role Title (e.g. Pre-MLS Listing Operations)"
                    className="w-full px-3 py-2 bg-[#01241E] border border-white/15 rounded-xl text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-400"
                  />
                  <textarea
                    value={roleDesc}
                    onChange={(e) => setRoleDesc(e.target.value)}
                    placeholder="Operational duties & responsibilities..."
                    rows={2}
                    className="w-full px-3 py-2 bg-[#01241E] border border-white/15 rounded-xl text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-400"
                  />
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingRole(false)}
                      className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-[#00635C] hover:bg-[#004d47] text-white border border-emerald-400/40 rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                    >
                      Save Responsibility
                    </button>
                  </div>
                </form>
              )}

              {roles.length === 0 && !isAddingRole ? (
                <p className="text-xs text-[#D0D6BB]/50 italic">No roles or responsibilities mapped to this seat yet.</p>
              ) : (
                <div className="space-y-4">
                  {roles.map(role => (
                    <div key={role.id} className="space-y-1.5 pb-3 border-b border-white/5 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                        <h4 className="text-sm font-bold text-white">{role.name}</h4>
                      </div>
                      <p className="text-xs text-[#D0D6BB]/80 leading-relaxed pl-3.5">
                        {role.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: SOPs & Knowledge and Backup */}
            <div className="space-y-8">
              
              {/* SOPs & Knowledge */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-2 select-none">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#D0D6BB]">SOPS & KNOWLEDGE</h3>
                  <span className="text-xs text-white/50">{sops.length + docs.length}</span>
                </div>

                {sops.length === 0 && docs.length === 0 ? (
                  <p className="text-xs text-[#D0D6BB]/50 italic">No standard operating procedures or knowledge documents mapped</p>
                ) : (
                  <div className="space-y-3.5">
                    {/* Render SOPs */}
                    {sops.map(sop => (
                      <div key={sop.id} className="p-4 bg-[#00382f]/30 border border-white/10 rounded-2xl space-y-1">
                        <h4 className="text-sm font-bold text-white">{sop.name}</h4>
                        <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest block font-mono">TRIGGER</span>
                        <p className="text-xs text-[#D0D6BB]/80 leading-relaxed pt-0.5">
                          {sop.trigger}
                        </p>
                      </div>
                    ))}

                    {/* Render Knowledge Docs */}
                    {docs.map(doc => (
                      <div key={doc.id} className="p-4 bg-[#00382f]/30 border border-white/10 rounded-2xl space-y-1">
                        <h4 className="text-sm font-bold text-white">{doc.title}</h4>
                        <span className="text-[9px] font-bold text-sky-400 uppercase tracking-widest block font-mono">
                          FILE · {doc.fileName?.toUpperCase()}
                        </span>
                        <p className="text-xs text-[#D0D6BB]/80 leading-relaxed pt-0.5">
                          {doc.aiSummary}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Backup Coverage */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-2 select-none">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#D0D6BB]">BACKUP COVERAGE</h3>
                  <span className="text-xs text-white/50">{backupCoverageItems.length}</span>
                </div>

                {backupCoverageItems.length === 0 ? (
                  <p className="text-xs text-[#D0D6BB]/50 italic">No backup coverage mapped</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {backupCoverageItems.map((item, idx) => {
                      const isSeatBackup = item.startsWith('Seat backup:');
                      return (
                        <span 
                          key={idx}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                            isSeatBackup
                              ? 'bg-[#00382f] border-emerald-500/30 text-emerald-300'
                              : 'bg-white/5 border-white/10 text-[#D0D6BB]'
                          }`}
                        >
                          {item}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );

  return createPortal(
    <>
      {fullCard}
      <div style={{ position: 'fixed', left: '-9999px', top: '-9999px', zIndex: -1000, pointerEvents: 'none' }} ref={pdfContainerRef}>
        <RoleProfilePdfDocument data={pdfData} />
      </div>
    </>,
    document.body
  );
}
