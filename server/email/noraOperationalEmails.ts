import { renderNoraEmailLayout, escapeEmailHtml } from './noraEmailLayout.js';
const paragraph = (text?: string) => text ? `<p style="margin:0 0 14px;">${escapeEmailHtml(text)}</p>` : '';
const details = (items: [string,string | undefined][]) => items.filter(([,value])=>value).map(([label,value])=>`<p style="margin:0 0 14px;"><strong>${escapeEmailHtml(label)}</strong><br>${escapeEmailHtml(value)}</p>`).join('');
export function renderCallFollowUpEmail(input: { name?: string; ticketId?: string; propertyAddress?: string; callerNeed?: string; noraAction?: string; routedTo?: string; estimatedDelivery?: string; trackerUrl?: string }): string {
  return renderNoraEmailLayout({title:'Your conversation with Nora',status:'RECEIVED',propertyAddress:input.propertyAddress,metadata:input.ticketId,
    bodyHtml:paragraph(`Hi ${input.name || 'there'},`)+paragraph('Thank you for speaking with Nora. Here is your request summary.')+details([
      ['What you need',input.callerNeed],['What Nora is doing',input.noraAction],['Assigned to',input.routedTo],['Estimated delivery',input.estimatedDelivery],
    ]),cta:{label:'View task tracker',url:input.trackerUrl || 'mailto:asknora@nestrealty.com'},footnote:'Reply if anything changes or you have more information.'});
}
export function renderSlaAlertEmail(input: { overdue?: boolean; assignee?: string; departmentOwner?: string; propertyAddress?: string; taskTitle?: string; due?: string; status?: string; actionUrl?: string }): string {
  return renderNoraEmailLayout({title:input.overdue?'Task deadline passed':'Task deadline approaching',status:'ACTION NEEDED',propertyAddress:input.propertyAddress,
    bodyHtml:paragraph(`Hi ${input.assignee || 'team'},`)+paragraph(input.overdue?'This task has passed its deadline without completion. Please coordinate with the team to complete it or update the listing agent.':'This task is approaching its deadline. Please review its progress.')+details([
      ['Task',input.taskTitle],['Due',input.due],['Status',input.status],['Department lead',input.departmentOwner],
    ]),cta:{label:'Review task',url:input.actionUrl || 'https://shapework.co/app'},footnote:'Update the task with any changes to its delivery time.'});
}
export function renderWorkspaceReceiptEmail(input: { name?: string; propertyAddress?: string; deliverables?: string[]; vendorApproval?: boolean; trackerUrl?: string }): string {
  return renderNoraEmailLayout({title:'Your request is received',status:'RECEIVED',propertyAddress:input.propertyAddress,
    bodyHtml:paragraph(`Hi ${input.name || 'there'},`)+paragraph('Nora received your email and staged the requested work for the team.')+
      (input.deliverables?.length?`<ul style="padding-left:20px;">${input.deliverables.map(item=>`<li>${escapeEmailHtml(item)}</li>`).join('')}</ul>`:'')+
      paragraph(input.vendorApproval?'Vendor dispatches are waiting for Ann and Melissa to review.':undefined),
    cta:{label:'View request',url:input.trackerUrl || 'mailto:asknora@nestrealty.com'},footnote:'Reply to this email if you need to add anything.'});
}
export function renderWorkspaceGuidanceEmail(input: { name?: string; answer?: string; sources?: string[] }): string {
  return renderNoraEmailLayout({title:'Guidance from Nora',status:'RECEIVED',
    bodyHtml:paragraph(`Hi ${input.name || 'there'},`)+(input.answer?`<p style="white-space:pre-line;margin:0 0 18px;">${escapeEmailHtml(input.answer).replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')}</p>`:'')+
      (input.sources?.length?`<p><strong>Sources</strong></p><ul style="padding-left:20px;">${input.sources.map(source=>`<li>${escapeEmailHtml(source)}</li>`).join('')}</ul>`:''),
    cta:{label:'Reply to Nora',url:'mailto:asknora@nestrealty.com'}});
}
export function renderCalendarInvitationEmail(input: { title?: string; name?: string; when?: string; location?: string; description?: string; calendarUrl?: string }): string {
  return renderNoraEmailLayout({title:input.title || 'Your calendar invitation',status:'ACTION NEEDED',
    bodyHtml:paragraph(`Hi ${input.name || 'there'},`)+paragraph('Nora has scheduled a calendar event.')+details([['When',input.when],['Location',input.location]])+paragraph(input.description),
    cta:input.calendarUrl?{label:'Add to calendar',url:input.calendarUrl}:{label:'Reply to Nora',url:'mailto:asknora@nestrealty.com'}});
}
export function renderProductionInquiryEmail(input: { name?: string; propertyAddress?: string; reviewer?: string; reviewerRole?: string; note?: string; assetUrl?: string; cc?: string }): string {
  return renderNoraEmailLayout({title:'A few details needed',status:'ACTION NEEDED',propertyAddress:input.propertyAddress,
    bodyHtml:paragraph(`Hi ${input.name || 'there'},`)+paragraph(`${input.reviewer || 'The marketing team'}${input.reviewerRole?` (${input.reviewerRole})`:''} reviewed your request and needs a few details to finish your materials.`)+paragraph(input.note)+paragraph(input.cc?`CC: ${input.cc}`:undefined),
    cta:input.assetUrl?{label:'View request assets',url:input.assetUrl}:{label:'Reply with details',url:'mailto:asknora@nestrealty.com'},
    footnote:'Reply directly to this email with the requested details or attachments.'});
}
export function renderManagerReviewEmail(input: { name?: string; propertyAddress?: string; taskTitle?: string; submittedBy?: string; note?: string; assetUrl?: string }): string {
  return renderNoraEmailLayout({title:'Assets ready for your review',status:'ACTION NEEDED',propertyAddress:input.propertyAddress,
    bodyHtml:paragraph(`Hi ${input.name || 'there'},`)+paragraph(`${input.submittedBy || 'Eduardo Lovo'} submitted ${input.taskTitle || 'the marketing assets'} for your approval.`)+paragraph(input.note),
    cta:{label:'Review assets',url:input.assetUrl || 'https://shapework.co/app'},footnote:'Review the assets before approving them for delivery.'});
}
export function renderOperationalEscalationEmail(input: { title?: string; summary?: string; details?: {label:string;value:string}[]; actionLabel?: string; actionUrl?: string }): string {
  return renderNoraEmailLayout({title:input.title || 'An item needs your attention',status:'ACTION NEEDED',
    bodyHtml:paragraph(input.summary)+details((input.details || []).map(item=>[item.label,item.value])),
    cta:{label:input.actionLabel || 'Review details',url:input.actionUrl || 'https://shapework.co/app'}});
}
/** Keep the SMS receipt's words and resource URLs intact in the email fallback. */
export function renderMmsReceiptEmail(input: { propertyAddress?: string; receiptText?: string; trackerUrl?: string }): string {
  const receipt = input.receiptText || 'Nora received your request. Reply to this email if you need to add anything.';
  const bodyHtml = receipt.split(/(https:\/\/[^\s<>]+)/g).map(part => part.startsWith('https://')
    ? `<a href="${escapeEmailHtml(part)}" style="color:#245A3F;text-decoration:underline;overflow-wrap:anywhere;word-break:break-word;">${escapeEmailHtml(part)}</a>`
    : escapeEmailHtml(part)).join('');
  return renderNoraEmailLayout({title:'Your text request is received',status:'RECEIVED',propertyAddress:input.propertyAddress,
    bodyHtml:`<p style="margin:0;white-space:pre-line;overflow-wrap:anywhere;">${bodyHtml}</p>`,
    cta:input.trackerUrl?{label:'Track your request',url:input.trackerUrl}:{label:'Reply to Nora',url:'mailto:asknora@nestrealty.com'}});
}
