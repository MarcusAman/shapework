/** Shared, render-only Nora shell. No transport, database, or environment side effects. */
export type NoraEmailStatus = 'ACTION NEEDED' | 'RECEIVED' | 'COMPLETE';
export const NORA_EMAIL_LOGO_URL = 'https://shapework.co/nora-email-logo.png';
export const escapeEmailHtml = (value: unknown): string => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));
const plainTitle = (value: string) => value.replace(/<br\s*\/?\s*>/gi, ' ').replace(/<[^>]*>/g, '').trim();
export function safeEmailActionUrl(value?: string): string {
  if (!value) return 'mailto:asknora@nestrealty.com';
  try {
    const url = new URL(value, 'https://shapework.co');
    if ((url.protocol === 'https:' && !url.username && !url.password) || url.protocol === 'mailto:') return url.href;
  } catch {}
  return 'mailto:asknora@nestrealty.com';
}
export function renderNoraEmailLayout(input: {
  title: string; status: NoraEmailStatus; bodyHtml: string; propertyAddress?: string; metadata?: string;
  preheader?: string; cta?: {label: string; url: string}; footnote?: string;
  logoUrl?: string; brandName?: string;
}): string {
  const title = escapeEmailHtml(plainTitle(input.title || 'Your request'));
  const action = input.cta || { label: 'Reply to Nora', url: 'mailto:asknora@nestrealty.com' };
  const href = escapeEmailHtml(safeEmailActionUrl(action.url));
  const label = escapeEmailHtml(action.label || 'Reply to Nora');
  const statusColors = input.status === 'ACTION NEEDED' ? ['#FFF3DD','#85550B'] : input.status === 'COMPLETE' ? ['#E2F0E8','#245A3F'] : ['#EBF1EF','#3B6054'];
  return `<!doctype html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting"><title>${title}</title>
<style>@media screen and (max-width:600px){.nora-pad{padding-left:24px!important;padding-right:24px!important}.nora-title{font-size:28px!important}.nora-cta{min-width:176px!important}.nora-outer{padding:16px 8px!important}}</style></head>
<body style="margin:0;padding:0;background:#F2F5F3;color:#173C31;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeEmailHtml(input.preheader || plainTitle(input.title))}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#F2F5F3"><tr><td class="nora-outer" align="center" style="padding:32px 12px;">
<!--[if mso]><table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#FFFFFF;border:1px solid #DFE6E1;">
<tr><td data-nora-header="logo-only" height="76" align="left" bgcolor="#01362D" style="height:76px;padding:0 32px;">
<img src="${escapeEmailHtml(input.logoUrl || NORA_EMAIL_LOGO_URL)}" alt="${escapeEmailHtml(input.brandName || 'Nest Realty')}" width="104" height="45" style="display:block;width:104px;height:45px;border:0;color:#FFFFFF;font-family:Arial,sans-serif;font-size:18px;">
</td></tr>
<tr><td class="nora-pad" style="padding:32px 36px 0;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td data-nora-status="true" bgcolor="${statusColors[0]}" style="padding:6px 10px;border-radius:14px;color:${statusColors[1]};font:700 10px/14px Arial,sans-serif;letter-spacing:1px;">${input.status}</td></tr></table>
<h1 class="nora-title" style="margin:18px 0 12px;font:400 32px/1.2 Georgia,'Times New Roman',serif;color:#01362D;">${title}</h1>
${input.propertyAddress?.trim() ? `<p style="margin:0 0 10px;font:600 14px/22px Arial,sans-serif;color:#345449;">${escapeEmailHtml(input.propertyAddress)}</p>` : ''}
${input.metadata?.trim() ? `<p style="margin:0 0 8px;font:12px/18px Arial,sans-serif;color:#6B7D75;">${escapeEmailHtml(input.metadata)}</p>` : ''}
</td></tr>
<tr><td class="nora-pad" style="padding:18px 36px 0;font:15px/24px Arial,Helvetica,sans-serif;color:#374D43;">${input.bodyHtml}</td></tr>
<tr><td class="nora-pad" align="left" style="padding:26px 36px 28px;">
<!--[if mso]><v:roundrect href="${href}" style="height:48px;v-text-anchor:middle;width:280px;" arcsize="12%" strokecolor="#01362D" fillcolor="#01362D"><w:anchorlock/><center style="color:#FFFFFF;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;">${label}</center></v:roundrect><![endif]-->
<!--[if !mso]><!--><table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td bgcolor="#01362D" style="border-radius:6px;"><a class="nora-cta" data-nora-cta="primary" href="${href}" target="_blank" style="display:inline-block;min-width:224px;padding:0 24px;border:1px solid #01362D;border-radius:6px;background:#01362D;color:#FFFFFF;text-align:center;text-decoration:none;font:700 14px/48px Arial,sans-serif;mso-hide:all;">${label}</a></td></tr></table><!--<![endif]-->
${input.footnote ? `<p style="margin:20px 0 0;font:12px/19px Arial,sans-serif;color:#6B7D75;">${input.footnote}</p>` : ''}
</td></tr>
<tr><td class="nora-pad" style="padding:20px 36px;border-top:1px solid #E6EBE7;font:12px/19px Arial,sans-serif;color:#6B7D75;">Nora &bull; ${escapeEmailHtml(input.brandName || 'Nest Realty Wilmington')}<br>AskNora@nestrealty.com</td></tr>
</table><!--[if mso]></td></tr></table><![endif]-->
</td></tr></table></body></html>`;
}
