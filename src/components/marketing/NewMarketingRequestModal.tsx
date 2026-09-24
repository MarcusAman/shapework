/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * New Task & Operational Request Modal
 * Supports Phone Call / Email / Desk intake for Melissa and brokerage staff:
 * - Domain selector: Marketing Task vs. Operational Task vs. Other
 * - Agent / Caller Directory selector with custom write-in fallback
 * - Intake Channel: Phone Call (910-507-2047), Email (AskNora), Walk-In, Text
 * - Dynamic Deliverables Checklist
 * - Drag-and-drop Attachment & Image Uploader with thumbnail previews
 * - Assignee & Target SLA Due Date
 */

import React, { useState, useRef } from 'react';
import {
  X,
  Plus,
  Trash2,
  Calendar,
  Layers,
  User,
  Building2,
  FileText,
  Sparkles,
  Check,
  Truck,
  Phone,
  Mail,
  Upload,
  Image as ImageIcon,
  Paperclip,
  Clock,
  ShieldCheck,
  Palette,
  Wrench,
  HelpCircle
} from 'lucide-react';
import type { CanonicalMarketingTask, CanonicalMarketingRequest } from '../../../server/persistence/marketingCampaignsRepository';
import { TEAM_MEMBERS } from './MarketingHomeInbox';

export const NEST_AGENTS_DIRECTORY = [
  { name: 'Jessica Keenan', email: 'jessica.keenan@nestrealty.com', role: 'Broker-in-Charge (BIC)', phone: '+19103681507' },
  { name: 'Eric Knight', email: 'eric@nestrealty.com', role: 'Broker-in-Charge (BIC)', phone: '+19103672253' },
  { name: 'James Fort', email: 'james.fort@nestrealty.com', role: 'CFO & Finance', phone: '+19106178264' },
  { name: 'Eric Miller', email: 'eric.miller@nestrealty.com', role: 'Broker', phone: '+19105550102' },
  { name: 'Matt Orr', email: 'matt.orr@nestrealty.com', role: 'Broker', phone: '+19106128283' },
  { name: 'Ryan Crecelius', email: 'ryan@nestrealty.com', role: 'BIC / Principal Broker', phone: '+19104097120' },
  { name: 'Ann Gunn', email: 'ann.gunn@nestrealty.com', role: 'Operations & Signage Lead', phone: '+19105072047' },
  { name: 'Melissa Gagliardi', email: 'melissa.gagliardi@nestrealty.com', role: 'Marketing Director', phone: '+19105072047' },
  { name: 'Marcus Aman', email: 'marcus.aman@gmail.com', role: 'Broker / Tech Lead', phone: '+12527170595' },
  { name: 'Dawn', email: 'dawn@nestrealty.com', role: 'Broker', phone: '+19105550103' }
];

export type TaskDomain = 'marketing' | 'operational' | 'other';

export interface UploadedAsset {
  id: string;
  name: string;
  sizeBytes: number;
  type: string;
  url: string; // Base64 or Object URL
  file?: File;
}

export interface NewMarketingRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestCreated: (newRequest: CanonicalMarketingRequest, newTasks: CanonicalMarketingTask[]) => void;
}

export const NewMarketingRequestModal: React.FC<NewMarketingRequestModalProps> = ({
  isOpen,
  onClose,
  onRequestCreated
}) => {
  const [domain, setDomain] = useState<TaskDomain>('marketing');
  const [title, setTitle] = useState<string>('');
  const [propertyAddress, setPropertyAddress] = useState<string>('');
  const [loggedBy, setLoggedBy] = useState<string>('Melissa Gagliardi');
  const [selectedAgent, setSelectedAgent] = useState<string>('Matt Orr');
  const [customAgentName, setCustomAgentName] = useState<string>('');
  const [customAgentEmail, setCustomAgentEmail] = useState<string>('');
  const [channel, setChannel] = useState<'phone' | 'email' | 'walkin' | 'sms'>('phone');
  const [requestExcerpt, setRequestExcerpt] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [assignedTo, setAssignedTo] = useState<string>('Melissa Gagliardi');
  
  // Dynamic deliverables based on domain
  const [deliverables, setDeliverables] = useState<string[]>([
    '1-Page Property Flyer (8.5x11 Print)',
    '9:16 Social Story Carousel'
  ]);
  /** Yard sign: brokerage install needs address; agent pickup does not */
  const [fulfillmentMode, setFulfillmentMode] = useState<'install' | 'pickup'>('install');

  // Uploaded images & attachments
  const [uploadedAssets, setUploadedAssets] = useState<UploadedAsset[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Pre-configured deliverables options
  const MARKETING_OPTIONS = [
    '1-Page Property Flyer (8.5x11 Print)',
    '9:16 Social Story Carousel',
    '6x9 EDDM Postcard Mailer',
    'Open House Print Kit & Sign Rider',
    'Digital Ad Banner Suite',
    'Custom Asset Edit / Brand Polish'
  ];

  const OPERATIONAL_OPTIONS = [
    'Yard Sign Post & Custom Rider Installation',
    'Supra Lockbox Placement & Key Verification',
    'Open House A-Frame Directionals',
    'Sign Removal & Yard Restoration',
    'NCREC Form 2-T Compliance Check'
  ];

  const OTHER_OPTIONS = [
    'Vendor Dispatch & Estimate Review',
    'Closing Package Preparation',
    'Administrative Brokerage Support'
  ];

  const handleDomainChange = (newDomain: TaskDomain) => {
    setDomain(newDomain);
    if (newDomain === 'marketing') {
      setDeliverables(['1-Page Property Flyer (8.5x11 Print)', '9:16 Social Story Carousel']);
      setAssignedTo('Melissa Gagliardi');
    } else if (newDomain === 'operational') {
      setDeliverables(['Yard Sign Post & Custom Rider Installation']);
      setAssignedTo('Ann Gunn');
      setFulfillmentMode('install');
    } else {
      setDeliverables(['Vendor Dispatch & Estimate Review']);
      setAssignedTo('Ryan Crecelius');
    }
  };

  const handleToggleDeliverable = (item: string) => {
    setDeliverables(prev =>
      prev.includes(item)
        ? prev.length > 1 ? prev.filter(d => d !== item) : prev
        : [...prev, item]
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setUploadedAssets(prev => [
          ...prev,
          {
            id: `upload_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            name: file.name,
            sizeBytes: file.size,
            type: file.type || 'image/jpeg',
            url: result,
            file
          }
        ]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAsset = (id: string) => {
    setUploadedAssets(prev => prev.filter(a => a.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isYardSignRequest = domain === 'operational' && deliverables.some((d) => /yard sign/i.test(d));
  const hasLocationOps = deliverables.some((d) => /lockbox|a-frame|removal/i.test(d));
  /** Agent pickup of yard sign only → no address. Install (or lockbox / A-frame / removal) → address required. */
  const requireAddress =
    domain !== 'operational'
      ? true
      : hasLocationOps || !(isYardSignRequest && fulfillmentMode === 'pickup');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (requireAddress && !propertyAddress.trim()) return;
    const finalAddress = propertyAddress.trim()
      || (requireAddress ? 'Address not specified' : 'Agent pickup — address not required');
    const fulfillmentNote = isYardSignRequest
      ? (fulfillmentMode === 'pickup'
          ? 'Fulfillment: Agent pickup (no install address required)'
          : 'Fulfillment: Brokerage install (property address required)')
      : '';
    const finalTitle = title.trim() || `${finalAddress} — ${domain === 'marketing' ? 'Marketing Suite' : domain === 'operational' ? 'Signage & Ops' : 'Brokerage Request'}`;
    
    // Resolve agent details
    const matchedAgent = NEST_AGENTS_DIRECTORY.find(a => a.name === selectedAgent);
    const agentName = selectedAgent === 'custom' ? (customAgentName || 'Agent Requester') : (matchedAgent?.name || selectedAgent);
    const agentEmail = selectedAgent === 'custom' ? (customAgentEmail || 'marcus.aman@gmail.com') : (matchedAgent?.email || 'marcus.aman@gmail.com');
    const agentPhone = matchedAgent?.phone || '+19105072047';
    const agentRole = matchedAgent?.role || 'Broker';

    const reqId = `req_${Date.now().toString(36)}`;
    const taskId = `task_${Date.now().toString(36)}_0`;

    const photos = uploadedAssets.map((asset, idx) => ({
      id: asset.id,
      name: asset.name,
      url: asset.url,
      type: asset.type,
      sizeBytes: asset.sizeBytes,
      driveUrl: `https://drive.google.com/drive/folders/1DRV_${finalAddress.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`
    }));

    const assignedRole = assignedTo === 'Melissa Gagliardi' 
      ? 'Marketing Director' 
      : assignedTo === 'Ann Gunn' 
      ? 'Operations & Signage Lead' 
      : assignedTo === 'Eduardo Lovo'
      ? 'Virtual Assistant'
      : 'Principal Broker';

    const createdTasks: CanonicalMarketingTask[] = deliverables.map((delivTitle, idx) => ({
      id: `${taskId}_${idx}`,
      requestId: reqId,
      requestTitle: finalTitle,
      propertyAddress: finalAddress,
      agentName: `${agentName} (${agentRole})`,
      title: delivTitle,
      category: domain === 'marketing' ? (delivTitle.toLowerCase().includes('social') ? 'social' : 'print') : domain === 'operational' ? 'signage' : 'other',
      assignedTo: assignedTo || 'Melissa Gagliardi',
      assignedToRole: assignedRole,
      status: 'in_progress',
      dueAt: dueDate,
      notes: `Logged By: ${loggedBy} | Requester: ${agentName} | Intake Channel: ${channel.toUpperCase()} | Caller Notes: ${requestExcerpt || 'None provided'}${fulfillmentNote ? `\n${fulfillmentNote}` : ''}\nUploaded Assets: ${photos.map(p => p.name).join(', ') || 'None'}`,
      photos,
      attachments: photos,
      driveFolderUrl: `https://drive.google.com/drive/folders/1DRV_${finalAddress.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

    const newRequest: CanonicalMarketingRequest = {
      id: reqId,
      title: finalTitle,
      propertyAddress: finalAddress,
      category: domain === 'marketing' ? 'listing_launch' : domain === 'operational' ? 'signage' : 'other',
      agentName: `${agentName} (${agentRole})`,
      agentEmail,
      agentPhone,
      agentRole,
      channel: channel === 'phone' ? 'phone' : channel === 'email' ? 'email' : 'manual',
      status: 'assigned',
      assignedTo,
      onBehalfOf: loggedBy,
      requestExcerpt: requestExcerpt.trim() || `Inbound ${channel} intake: ${deliverables.join(' • ')}`,
      rawExcerpt: `Logged By: ${loggedBy}\nChannel: ${channel.toUpperCase()} (Desk/Nora Hotline 910-507-2047)\nCaller: ${agentName} <${agentEmail}>\nProperty: ${finalAddress}${fulfillmentNote ? `\n${fulfillmentNote}` : ''}\nDirectives: ${requestExcerpt || 'Proceed with standard template package.'}`,
      taskIds: createdTasks.map(t => t.id),
      photos,
      attachments: photos,
      driveFolderUrl: `https://drive.google.com/drive/folders/1DRV_${finalAddress.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`,
      receivedAt: 'Just now · Desk Intake',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onRequestCreated(newRequest, createdTasks);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn font-sans text-left">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#00635C] text-white flex items-center justify-center shadow-xs">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">New Task & Operational Request</h2>
              <p className="text-xs text-slate-500">Record phone call, email, or desk requests with instant agent attribution</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          
          {/* Domain Segmented Tabs */}
          <div>
            <label className="font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
              <span>Request Domain & Type *</span>
            </label>
            <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => handleDomainChange('marketing')}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition text-xs cursor-pointer ${
                  domain === 'marketing'
                    ? 'bg-white text-[#00635C] shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Marketing Task</span>
              </button>
              
              <button
                type="button"
                onClick={() => handleDomainChange('operational')}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition text-xs cursor-pointer ${
                  domain === 'operational'
                    ? 'bg-white text-[#00635C] shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Operational Task</span>
              </button>

              <button
                type="button"
                onClick={() => handleDomainChange('other')}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition text-xs cursor-pointer ${
                  domain === 'other'
                    ? 'bg-white text-[#00635C] shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Other / Admin</span>
              </button>
            </div>
          </div>

          {/* Row: Staff Actor, Agent Requester & Intake Channel */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>Intake Proxy / On Behalf Of *</span>
              </label>
              <select
                value={loggedBy}
                onChange={(e) => setLoggedBy(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#00635C] outline-none text-xs font-semibold text-slate-800 cursor-pointer"
              >
                <option value="Melissa Gagliardi">Melissa Gagliardi (Marketing)</option>
                <option value="Ann Gunn">Ann Gunn (Signage & Ops)</option>
                <option value="Ryan Crecelius">Ryan Crecelius (BIC)</option>
                <option value="Marcus Aman">Marcus Aman (Tech / Broker)</option>
                <option value="Eduardo Lovo">Eduardo Lovo (VA)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#00635C]" />
                <span>Agent / Caller *</span>
              </label>
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#00635C] outline-none text-xs font-semibold text-slate-800 cursor-pointer"
              >
                {NEST_AGENTS_DIRECTORY.map(agent => (
                  <option key={agent.name} value={agent.name}>
                    {agent.name} ({agent.role})
                  </option>
                ))}
                <option value="custom">+ Other / Custom Requester</option>
              </select>

              {selectedAgent === 'custom' && (
                <div className="mt-2 space-y-1.5">
                  <input
                    type="text"
                    required
                    placeholder="Requester Full Name"
                    value={customAgentName}
                    onChange={(e) => setCustomAgentName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                  <input
                    type="email"
                    required
                    placeholder="Requester Email"
                    value={customAgentEmail}
                    onChange={(e) => setCustomAgentEmail(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#00635C]" />
                <span>Intake Channel / Source</span>
              </label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#00635C] outline-none text-xs font-semibold text-slate-800 cursor-pointer"
              >
                <option value="phone">📞 Phone Call (Desk/Retell)</option>
                <option value="email">✉️ Email (AskNora)</option>
                <option value="walkin">🏢 In-Person / Walk-In</option>
                <option value="sms">💬 Text Message (SMS)</option>
              </select>
            </div>
          </div>

          {/* Yard sign fulfillment: install vs agent pickup */}
          {isYardSignRequest && (
            <div data-testid="ops-yard-sign-fulfillment">
              <label className="font-bold text-slate-700 block mb-1.5">Yard sign fulfillment *</label>
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setFulfillmentMode('install')}
                  className={`py-2 px-3 rounded-xl font-bold text-xs transition cursor-pointer ${
                    fulfillmentMode === 'install'
                      ? 'bg-white text-[#00635C] shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Brokerage installs
                </button>
                <button
                  type="button"
                  onClick={() => setFulfillmentMode('pickup')}
                  className={`py-2 px-3 rounded-xl font-bold text-xs transition cursor-pointer ${
                    fulfillmentMode === 'pickup'
                      ? 'bg-white text-[#00635C] shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Agent pickup
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-1.5">
                {fulfillmentMode === 'install'
                  ? 'Install needs the property address for the crew.'
                  : 'Pickup at the office — property address not required.'}
              </p>
            </div>
          )}

          {/* Row: Property Address & Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#00635C]" />
                <span>Property Address{requireAddress ? ' *' : ' (optional)'}</span>
              </label>
              <input
                type="text"
                required={requireAddress}
                value={propertyAddress}
                onChange={(e) => setPropertyAddress(e.target.value)}
                placeholder={requireAddress ? 'e.g. 104 N 3rd St, Wilmington, NC' : 'Optional — not needed for agent pickup'}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#00635C] outline-none text-xs font-semibold text-slate-800"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Request Subject / Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Listing Launch Package or Custom Yard Post"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#00635C] outline-none text-xs font-medium text-slate-800"
              />
            </div>
          </div>

          {/* Deliverables Checklist */}
          <div>
            <label className="font-bold text-slate-700 block mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#00635C]" />
                <span>Queued Deliverables ({deliverables.length})</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Select all that apply</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(domain === 'marketing' ? MARKETING_OPTIONS : domain === 'operational' ? OPERATIONAL_OPTIONS : OTHER_OPTIONS).map(item => {
                const isSelected = deliverables.includes(item);
                return (
                  <button
                    type="button"
                    key={item}
                    onClick={() => handleToggleDeliverable(item)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 cursor-pointer border ${
                      isSelected
                        ? 'bg-teal-50 border-[#00635C] text-[#00635C] font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {isSelected ? <Check className="w-3 h-3 text-[#00635C]" /> : <Plus className="w-3 h-3 text-slate-400" />}
                    <span>{item}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Directives & Special Instructions */}
          <div>
            <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#00635C]" />
              <span>Directives & Special Instructions (Call Notes)</span>
            </label>
            <textarea
              rows={2}
              value={requestExcerpt}
              onChange={(e) => setRequestExcerpt(e.target.value)}
              placeholder="e.g. Agent called in asking for dark green template with highlighted pool feature, needs proof staged by Thursday morning..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#00635C] outline-none text-xs font-sans text-slate-800 placeholder:text-slate-400"
            />
          </div>

          {/* Attachment & Photo Uploader — required for marketing photos; optional on ops */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[#00635C]" />
                <span>
                  {domain === 'operational'
                    ? `Attachments (optional) (${uploadedAssets.length})`
                    : `Upload Photos & File Attachments (${uploadedAssets.length})`}
                </span>
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <Upload className="w-3 h-3" />
                <span>Browse Files</span>
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept="image/*,application/pdf"
              onChange={handleFileUpload}
              className="hidden"
            />

            {uploadedAssets.length === 0 ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-[#00635C] bg-slate-50/50 hover:bg-teal-50/30 rounded-2xl p-4 text-center cursor-pointer transition"
              >
                <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                <p className="font-semibold text-slate-700 text-xs">
                  {domain === 'operational'
                    ? 'Optional — drop a photo, PDF, or note if helpful'
                    : 'Drag and drop property photos or click to browse'}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {domain === 'operational'
                    ? 'Ops tasks do not require assets to complete. PNG, JPG, WebP, or PDF if needed.'
                    : 'Supports high-resolution PNG, JPG, WebP, and PDF collateral files'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {uploadedAssets.map((asset) => (
                  <div key={asset.id} className="relative group bg-slate-50 border border-slate-200 rounded-xl p-2 flex flex-col justify-between">
                    <div className="aspect-video bg-slate-200 rounded-lg overflow-hidden mb-1.5 flex items-center justify-center">
                      {asset.type.startsWith('image/') ? (
                        <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                      ) : (
                        <Paperclip className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate text-[10px] font-semibold text-slate-700" title={asset.name}>
                        {asset.name}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 shrink-0">
                        {formatFileSize(asset.sizeBytes)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAsset(asset.id)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-xs opacity-90 hover:opacity-100 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Row: Assignee & Target SLA Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#00635C]" />
                <span>Assignee Lead</span>
              </label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#00635C] outline-none text-xs font-semibold text-slate-800 cursor-pointer"
              >
                {TEAM_MEMBERS.map(m => (
                  <option key={m.name} value={m.name}>{m.name} ({m.role.split(' ')[0]})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#00635C]" />
                <span>Target SLA / Due Date</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#00635C] outline-none text-xs font-mono font-bold text-slate-800"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#00635C] hover:bg-[#004d47] text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{domain === 'operational' ? 'Create Operational Task' : 'Create Task & Stage Collateral'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

