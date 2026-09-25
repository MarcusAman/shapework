import fs from 'node:fs';
import path from 'node:path';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const capture = vi.hoisted(() => ({ mail: vi.fn() }));
vi.mock('nodemailer', () => ({ default: { createTransport: () => ({ sendMail: capture.mail }) } }));
vi.mock('./gatedTransport.js', () => ({ deliverNodemailer: async ({mail}: any) => {
  capture.mail(mail); return { sent: true, messageId: 'preview-only', info: { accepted: [mail.to], rejected: [] } };
} }));
vi.mock('./outboundGate.js', () => ({ checkOutbound: () => ({ allowed: true }) }));
vi.mock('./outboundDispatchGuards.js', () => ({ evaluateOutboundDispatchGuard: async () => ({ allowed: true }) }));
import * as email from './emailProvider.js';
import { renderMarketingQuestionsEmail } from './marketingQuestionsEmail.js';
import { renderCallFollowUpEmail, renderSlaAlertEmail, renderWorkspaceReceiptEmail, renderWorkspaceGuidanceEmail, renderCalendarInvitationEmail, renderProductionInquiryEmail, renderManagerReviewEmail, renderOperationalEscalationEmail } from './noraOperationalEmails.js';
import { renderBaseEmailLayout } from '../notifications/emailTemplates/baseEmailLayout.js';
import { compileEmailNotification } from '../notifications/notificationRenderer.js';
import { ownerDigestEngine } from '../notifications/ownerDigestEngine.js';
import * as operationalEmail from './noraOperationalEmails.js';
import { NoraEmailComposer } from '../services/nora/noraEmailComposer.js';

const output = process.env.NORA_EMAIL_PREVIEW_DIR;
const previews: { id: string; title: string; status: string }[] = [];
function check(html: string, status: string, id: string, title: string) {
  expect(html).toContain('data-nora-header');
  expect(html).toMatch(new RegExp(`data-nora-status[^>]*>\\s*${status}\\s*<`));
  expect(html.match(/<img\b/g)).toHaveLength(1);
  expect(html).toMatch(/<img[^>]+alt="Nest Realty"/);
  expect(html).not.toMatch(/heroImageUrl|1916.?wolcott|height:\s*260px|Drive Folder Ready|undefined|\[object Object\]/i);
  expect(html.match(/data-nora-cta=/g)).toHaveLength(1);
  expect(html).toContain('<v:roundrect');
  expect(html).toContain('<!--[if mso]>');
  expect(html).toContain('<!--[if !mso]><!-->');
  expect(html).toMatch(/<h1[^>]*>[^<]+<\/h1>/);
  if (output) {
    fs.mkdirSync(output, { recursive: true });
    fs.copyFileSync(path.join(process.cwd(), 'public/nora-email-logo.png'), path.join(output, 'nora-email-logo.png'));
    fs.writeFileSync(path.join(output, `${id}.html`), html.replaceAll('https://shapework.co/nora-email-logo.png', './nora-email-logo.png'));
    previews.push({ id, title, status });
  }
}
const common = { toEmail: 'preview@nestrealty.com', agentName: 'Jordan Agent', propertyAddress: '24 Magnolia Lane, Wilmington, NC 28403' };
const providerCases = [
  { id: 'photo-request', status: 'ACTION NEEDED', send: () => email.sendPhotoUploadRequestEmail({ ...common, trackerUrl: 'https://shapework.co/track/marketing/preview', requestedItems: ['Exterior photos', 'Interior photos'] }) },
  { id: 'photo-request-minimal', status: 'ACTION NEEDED', send: () => email.sendPhotoUploadRequestEmail({ ...common, propertyAddress: '', agentName: '' }) },
  { id: 'intake-received', status: 'RECEIVED', send: () => email.sendMarketingIntakeConfirmationEmail({ ...common, deliverables: ['Listing flyer', 'Social graphics'], assignedLead: 'Melissa Gagliardi', trackerUrl: 'https://shapework.co/track/marketing/preview' }) },
  { id: 'intake-received-minimal', status: 'RECEIVED', send: () => email.sendMarketingIntakeConfirmationEmail({ ...common, deliverables: [], assignedLead: 'Melissa Gagliardi' }) },
  { id: 'address-request', status: 'ACTION NEEDED', send: () => email.sendAddressRequestEmail({ ...common, subjectTitle: 'Listing flyer' }) },
  { id: 'address-request-minimal', status: 'ACTION NEEDED', send: () => email.sendAddressRequestEmail({ ...common }) },
  { id: 'task-in-progress', status: 'RECEIVED', send: () => email.sendTaskInProgressNotificationEmail({ ...common, taskTitle: 'Listing flyer', assignedTo: 'Eduardo Lovo', assignedToRole: 'Marketing assistant', ccManagerEmail: 'melissa@nestrealty.com' }) },
  { id: 'task-in-progress-minimal', status: 'RECEIVED', send: () => email.sendTaskInProgressNotificationEmail({ ...common, taskTitle: 'Listing flyer', assignedTo: 'Eduardo Lovo' }) },
  { id: 'more-information', status: 'ACTION NEEDED', send: () => email.sendTaskNeedMoreInfoEmail({ ...common, taskTitle: 'Listing flyer', requestedItems: ['Listing price', 'Open house date'], staffNotes: 'Please confirm the updated details.' }) },
  { id: 'more-information-minimal', status: 'ACTION NEEDED', send: () => email.sendTaskNeedMoreInfoEmail({ ...common, taskTitle: 'Listing flyer', requestedItems: [] }) },
  { id: 'assets-complete', status: 'COMPLETE', send: () => email.sendTaskCompletionEmail({ ...common, taskTitle: 'Listing flyer', proofUrl: 'https://shapework.co/api/marketing/assets/download/preview', trackerUrl: 'https://shapework.co/track/marketing/preview' }) },
  { id: 'assets-complete-attachment-only', status: 'COMPLETE', send: () => email.sendTaskCompletionEmail({ ...common, taskTitle: 'Listing flyer', attachments: [{ filename: 'preview.pdf', content: Buffer.from('Preview only') }] }) },
  { id: 'welcome', status: 'ACTION NEEDED', send: () => email.sendWelcomeInvitationEmail(common.toEmail, 'Jordan', 'https://shapework.co/setup-password?token=preview') },
  { id: 'password-reset', status: 'ACTION NEEDED', send: () => email.sendPasswordResetEmail(common.toEmail, 'https://shapework.co/reset-password?token=preview') },
  { id: 'system-verification', status: 'COMPLETE', send: () => email.sendSystemVerificationEmail(common.toEmail) },
];
describe('Nora email layout capture — no network transports', () => {
  beforeEach(() => { vi.stubEnv('NODE_ENV', 'development'); vi.stubEnv('NORA_EMAIL_PASSWORD', 'synthetic-render-only'); });
  afterEach(() => { capture.mail.mockClear(); vi.unstubAllEnvs(); });
  for (const item of providerCases) it(item.id, async () => {
    await item.send(); expect(capture.mail).toHaveBeenCalledTimes(1);
    const mail = capture.mail.mock.calls[0][0]; expect(mail.text).not.toMatch(/undefined|\[object Object\]/); check(mail.html, item.status, item.id, mail.subject);
  });
  const notifications = ['work_item_assigned','approval_needed','missing_info_needed','due_soon','overdue','owner_brief_ready','task_completed','integration_issue'] as const;
  for (const template of notifications) for (const minimal of [false,true]) it(`notification ${template}${minimal ? ' minimal' : ''}`, () => {
    const mail = compileEmailNotification(template, { workspaceName: 'Nest Realty', actionUrl: 'https://shapework.co/app', ...(minimal ? {} : { recipientName: 'Melissa', workItemTitle: 'Review listing flyer', actionTitle: 'Approve listing flyer', integrationName: 'Email', summary: 'A marketing request has an update.', assignedTo: 'Eduardo Lovo', dueText: 'Monday, 10 AM', whyItMatters: 'Keep the listing on schedule.' }) });
    const status = template==='task_completed' ? 'COMPLETE' : template==='owner_brief_ready' ? 'RECEIVED' : 'ACTION NEEDED';
    check(mail.html,status,`notification-${template}${minimal ? '-minimal' : ''}`,mail.subject);
  });
  for (const followUpType of ['REQUEST_CONFIRMATION','ESCALATION_NOTICE','SOP_INSTRUCTIONS','KNOWLEDGE_RESOURCES']) for (const minimal of [false,true]) it(`conversation ${followUpType} ${minimal}`, () => {
    const result = NoraEmailComposer.composeFollowUpEmail({ agentIdentity: { email: common.toEmail, fullName: 'Jordan Agent' }, callerIdentity: { name:'Jordan Agent', isRepresentingAgent:false }, followUp:{recommended:true,followUpType}, goal:'your listing request', knowledgeUsed:[],sopsUsed:[],resourcesUsed:minimal?[]:[{title:'Marketing resources',url:'https://shapework.co/app',description:'Approved team resources'}],requestsCreated:[],warnings:[] } as any)!;
    check(result.bodyHtml,'RECEIVED',`conversation-${followUpType.toLowerCase()}${minimal?'-minimal':''}`,result.subject);
  });
  for (const deliveryComplete of [true,false]) for (const minimal of [true,false]) it(`marketing dispatch ${deliveryComplete} ${minimal}`, () => {
    const html = renderMarketingQuestionsEmail({deliveryComplete,...(minimal?{}:{recipientName:'Jordan',propertyAddress:common.propertyAddress,message:'Please confirm the listing price.',selectedQuestions:['What is the listing price?'],assetLinks:['https://shapework.co/api/marketing/assets/download/preview'],cc:['melissa@nestrealty.com']})});
    check(html,deliveryComplete?'COMPLETE':'ACTION NEEDED',`dispatch-${deliveryComplete?'assets':'questions'}${minimal?'-minimal':''}`,'Marketing dispatch');
  });
  it('keeps every approved asset accessible with one primary button', () => {
    const assets = ['https://shapework.co/api/marketing/assets/download/flyer', 'https://shapework.co/api/marketing/assets/download/social'];
    const html = renderMarketingQuestionsEmail({deliveryComplete:true,recipientName:'Jordan',assetLinks:assets});
    for(const asset of assets) expect(html).toContain(asset);
    check(html,'COMPLETE','dispatch-multiple-assets','Multiple approved assets');
  });
  it('preserves a different brokerage’s existing branding', () => {
    const html = renderBaseEmailLayout({workspaceName:'Harbor Realty',headline:'Review task',preheader:'Task update',typeLabel:'Review',summary:'A task needs review.',ctaLabel:'Open task',actionUrl:'https://harbor.example/task'},'',{brokerageName:'Harbor Realty',primaryColor:'#112233',emailHeaderLogo:'https://harbor.example/logo.png'});
    expect(html).toContain('https://harbor.example/logo.png'); expect(html).toContain('#112233');
    expect(html).not.toContain('data-nora-header'); expect(html).not.toContain('nora-email-logo');
  });
  for(const minimal of [false,true]) it(`weekly owner digest ${minimal}`, () => {
    const item = {id:'task-preview',title:'Review listing flyer',category:'marketing',status:'Needs review',ownerName:'Melissa',daysOverdue:2};
    const data = {workspaceId:'preview',brokerageName:'Nest Realty Wilmington',principalName:minimal?'':'Ryan',generationDate:minimal?'':'Monday, September 28, 2026',reportingPeriod:'This week',periodId:'preview',needsAttentionCount:minimal?0:1,openRequestsCount:minimal?0:1,resolvedLastWeekCount:minimal?0:1,needsAttention:minimal?[]:[item],openRequests:minimal?[]:[{...item,id:'open',title:'Prepare social graphics',status:'In progress'}],resolvedLastWeek:minimal?[]:[{...item,id:'done',title:'Approved listing brochure',status:'Completed',completedAt:'Friday'}]};
    const html=ownerDigestEngine.renderDigestHtml(data);
    if(!minimal) for(const expected of ['Review listing flyer','Needs review','Melissa','2d','Prepare social graphics','Approved listing brochure','Friday']) expect(html).toContain(expected);
    check(html,'RECEIVED',`weekly-owner-digest${minimal?'-minimal':''}`,'Weekly owner briefing');
  });
  for(const minimal of [false,true]) it(`MMS request email receipt ${minimal}`, () => {
    const original='Hi Jordan! Nora here. Processed your new listing.\n\nGoogle Drive Asset Pack: https://drive.google.com/drive/folders/preview\nGoogle Slides Deck: https://docs.google.com/presentation/d/preview\nSign Post: Order preview Staged ($65)\nFlyer & Story: Generating in Eduardo’s queue.\nTrack Live: https://shapework.co/marketing/trk_preview';
    const html=(operationalEmail as any).renderMmsReceiptEmail(minimal?{}:{propertyAddress:common.propertyAddress,receiptText:original,trackerUrl:'https://shapework.co/marketing/trk_preview'});
    if(!minimal) for(const value of ['https://drive.google.com/drive/folders/preview','https://docs.google.com/presentation/d/preview','https://shapework.co/marketing/trk_preview','Staged ($65)','Generating in Eduardo']) expect(html).toContain(value);
    check(html,'RECEIVED',`mms-request-receipt${minimal?'-minimal':''}`,'Text request receipt');
  });
  const operationalCases = [
    {id:'production-inquiry',status:'ACTION NEEDED',render:(minimal:boolean)=>renderProductionInquiryEmail(minimal?{}:{name:'Jordan',propertyAddress:common.propertyAddress,reviewer:'Melissa Gagliardi',reviewerRole:'Marketing director',note:'Please send the high-resolution listing photos.',cc:'melissa@nestrealty.com'})},
    {id:'manager-review',status:'ACTION NEEDED',render:(minimal:boolean)=>renderManagerReviewEmail(minimal?{}:{name:'Melissa',propertyAddress:common.propertyAddress,taskTitle:'Listing flyer',submittedBy:'Eduardo Lovo',note:'The flyer and social graphics are ready for your review.',assetUrl:'https://shapework.co/app'})},
    {id:'ryan-shield-escalation',status:'ACTION NEEDED',render:(minimal:boolean)=>renderOperationalEscalationEmail({title:'Ryan Shield — Urgent SLA Breach Alert',...(minimal?{}:{summary:'Two high-priority items need your review.',details:[{label:'Yard sign installation',value:'Vendor update is overdue.'},{label:'Closing disclosure review',value:'Broker review is pending.'}],actionLabel:'1-Click Resolve & Approve Items',actionUrl:'https://shapework.co/app/ask-nest-ops?tab=attention&action=resolve_all'})})},
    {id:'emd-escalation',status:'ACTION NEEDED',render:(minimal:boolean)=>renderOperationalEscalationEmail({title:'Statutory EMD Wire Receipt SLA Alert',...(minimal?{}:{details:[{label:'Property',value:common.propertyAddress},{label:'Status',value:'Review required'},{label:'Required action',value:'Review the task with your closing team.'}],actionLabel:'Verify Trust Receipt in Nest Ops',actionUrl:'https://shapework.co/app/ask-nest-ops?tab=contracts'})})},
    {id:'call-follow-up',status:'RECEIVED',render:(minimal:boolean)=>renderCallFollowUpEmail(minimal?{}:{name:'Jordan',propertyAddress:common.propertyAddress,ticketId:'NORA-1024',callerNeed:'Listing flyer and social graphics',noraAction:'Route the request for review',routedTo:'Melissa Gagliardi',estimatedDelivery:'Monday afternoon',trackerUrl:'https://shapework.co/tracker/preview'})},
    {id:'sla-warning',status:'ACTION NEEDED',render:(minimal:boolean)=>renderSlaAlertEmail(minimal?{}:{assignee:'Eduardo Lovo',propertyAddress:common.propertyAddress,taskTitle:'Listing flyer',due:'Monday, 10 AM',status:'Due in 4 hours'})},
    {id:'sla-overdue',status:'ACTION NEEDED',render:(minimal:boolean)=>renderSlaAlertEmail({overdue:true,...(minimal?{}:{assignee:'Eduardo Lovo',departmentOwner:'Melissa Gagliardi',propertyAddress:common.propertyAddress,taskTitle:'Listing flyer',due:'Monday, 10 AM',status:'Overdue by 1 hour'})})},
    {id:'workspace-receipt',status:'RECEIVED',render:(minimal:boolean)=>renderWorkspaceReceiptEmail(minimal?{}:{name:'Jordan',propertyAddress:common.propertyAddress,deliverables:['Listing flyer','Social graphics'],vendorApproval:true,trackerUrl:'https://shapework.co/app/marketing'})},
    {id:'workspace-guidance',status:'RECEIVED',render:(minimal:boolean)=>renderWorkspaceGuidanceEmail(minimal?{}:{name:'Jordan',answer:'**Brand resources**\nThe marketing team can help with your listing materials.',sources:['Nest marketing resources']})},
    {id:'calendar-invitation',status:'ACTION NEEDED',render:(minimal:boolean)=>renderCalendarInvitationEmail(minimal?{}:{title:'Marketing review',name:'Melissa',when:'Monday, 10 AM',location:'Wilmington office',description:'Review the listing flyer and social graphics.',calendarUrl:'https://calendar.google.com/calendar/r/eventedit?text=preview'})},
  ];
  for(const item of operationalCases) for(const minimal of [false,true]) it(`${item.id} ${minimal}`,()=>check(item.render(minimal),item.status,`${item.id}${minimal?'-minimal':''}`,item.id));
  afterAll(() => {
    if (!output || !previews.length) return;
    fs.writeFileSync(path.join(output,'manifest.json'), JSON.stringify(previews,null,2));
    fs.writeFileSync(path.join(output,'index.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><title>Nora email previews</title><style>body{margin:40px;font:16px system-ui;background:#f3f5f4;color:#123d32}h1{font-size:32px}ul{columns:2}li{margin:12px}a{color:#125b46}small{color:#586963}</style><h1>Nora email previews</h1><p>Captured locally. No email sent. Includes missing optional information.</p><ul>${previews.map(p=>`<li><a href="${p.id}.html">${p.id.replaceAll('-',' ')}</a><br><small>${p.status}</small></li>`).join('')}</ul></html>`);
  });
});
