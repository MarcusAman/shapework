import { renderNoraEmailLayout, escapeEmailHtml, safeEmailActionUrl } from './noraEmailLayout.js';
/** Rendering only; the dispatch route remains responsible for recipients, proof and gates. */
export function renderMarketingQuestionsEmail(input: {
  deliveryComplete: boolean; recipientName?: string; propertyAddress?: string;
  message?: string; selectedQuestions?: string[]; assetLinks?: string[]; cc?: string[];
}): string {
  const assetUrl = input.assetLinks?.[0];
  const body = input.deliveryComplete
    ? (assetUrl ? 'Your approved marketing assets are ready. Use the button below to view them.' : 'Your approved marketing assets are attached to this email.')
    : 'We need a few details to continue your marketing request.';
  return renderNoraEmailLayout({
    title: input.deliveryComplete ? 'Your assets are ready' : 'A few details needed',
    status: input.deliveryComplete ? 'COMPLETE' : 'ACTION NEEDED',
    propertyAddress: input.propertyAddress === 'Listing Property' ? undefined : input.propertyAddress,
    bodyHtml: `<p style="margin:0 0 14px;">Hi ${escapeEmailHtml(input.recipientName || 'there')},</p><p style="margin:0 0 14px;">${body}</p>` +
      (!input.deliveryComplete && input.selectedQuestions?.length ? `<ul style="padding-left:20px;">${input.selectedQuestions.map(q=>`<li>${escapeEmailHtml(q)}</li>`).join('')}</ul>` : '') +
      (!input.deliveryComplete && input.message ? `<p style="white-space:pre-line;">${escapeEmailHtml(input.message)}</p>` : '') +
      (input.deliveryComplete && (input.assetLinks?.length || 0) > 1 ? `<p style="margin:16px 0 8px;"><strong>Additional approved assets</strong></p><ul style="padding-left:20px;">${input.assetLinks!.slice(1).map((url,index)=>`<li style="padding-bottom:6px;"><a href="${escapeEmailHtml(safeEmailActionUrl(url))}" style="color:#245A3F;text-decoration:underline;">Download asset ${index+2}</a></li>`).join('')}</ul>` : '') +
      (input.cc?.length ? `<p style="font-size:12px;color:#6B7D75;">CC: ${input.cc.map(escapeEmailHtml).join(', ')}</p>` : ''),
    cta: input.deliveryComplete && assetUrl ? {label:'View approved assets',url:assetUrl} : {label:input.deliveryComplete ? 'Reply to Nora' : 'Reply with details',url:'mailto:asknora@nestrealty.com'},
    footnote: input.deliveryComplete ? 'Reply to this email if you need changes.' : 'Reply to this email with the requested information or photos.',
  });
}
