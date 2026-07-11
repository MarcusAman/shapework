import { BaseNotificationEmailInput } from './notificationEmailTypes.js';

export function renderBaseEmailLayout(input: BaseNotificationEmailInput, iconHtml: string, branding?: any): string {
  const {
    recipientName = 'Team Member',
    workspaceName,
    headline,
    preheader,
    typeLabel,
    summary,
    whyItMatters,
    recommendedAction,
    assignedTo,
    dueText,
    priority,
    ctaLabel,
    actionUrl,
    secondaryUrl = 'https://shapework.co',
    notificationSettingsUrl = 'https://shapework.co/app/settings'
  } = input;

  const finalBranding = branding || (input as any).branding;
  const primaryColor = finalBranding?.primaryColor || '#18382B';
  const brokerageName = finalBranding?.brokerageName || workspaceName || 'Nest Realty';
  const logoHtml = finalBranding?.emailHeaderLogo 
    ? `<img src="${finalBranding.emailHeaderLogo}" alt="${brokerageName}" style="max-height: 48px; border: 0;" />`
    : `shapework &bull; ${brokerageName}`;

  const footerText = finalBranding?.notificationFooter || `You received this because shapework is routing operational alerts for ${brokerageName}.`;

  // Compile details panel HTML if details are present
  let detailsPanelHtml = '';
  if (whyItMatters || recommendedAction || assignedTo || dueText) {
    detailsPanelHtml = `
      <tr>
        <td style="padding-top: 24px;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #F7F3EA; border: 1px border #E4DCCB; border-radius: 16px; border-collapse: separate; width: 100%;">
            <tr>
              <td style="padding: 20px; text-align: left;">
                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                  ${whyItMatters ? `
                    <tr>
                      <td style="padding-bottom: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                        <span style="display: block; font-size: 9px; font-weight: bold; text-transform: uppercase; color: #68736A; letter-spacing: 0.5px; margin-bottom: 2px;">Why it matters</span>
                        <span style="font-size: 12px; color: #1E2520; font-weight: 500; line-height: 1.4;">${whyItMatters}</span>
                      </td>
                    </tr>
                  ` : ''}
                  ${assignedTo ? `
                    <tr>
                      <td style="padding-bottom: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                        <span style="display: block; font-size: 9px; font-weight: bold; text-transform: uppercase; color: #68736A; letter-spacing: 0.5px; margin-bottom: 2px;">Assigned to</span>
                        <span style="font-size: 12px; color: #1E2520; font-weight: 500; line-height: 1.4;">${assignedTo}</span>
                      </td>
                    </tr>
                  ` : ''}
                  ${dueText ? `
                    <tr>
                      <td style="padding-bottom: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                        <span style="display: block; font-size: 9px; font-weight: bold; text-transform: uppercase; color: #68736A; letter-spacing: 0.5px; margin-bottom: 2px;">Due</span>
                        <span style="font-size: 12px; color: #1E2520; font-weight: 500; line-height: 1.4;">${dueText}</span>
                      </td>
                    </tr>
                  ` : ''}
                  ${recommendedAction ? `
                    <tr>
                      <td style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                        <span style="display: block; font-size: 9px; font-weight: bold; text-transform: uppercase; color: #68736A; letter-spacing: 0.5px; margin-bottom: 2px;">Recommended Next Action</span>
                        <span style="font-size: 12px; color: ${primaryColor}; font-weight: bold; line-height: 1.4;">${recommendedAction}</span>
                      </td>
                    </tr>
                  ` : ''}
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;
  }

  // Compile priority tag HTML if priority is set
  let priorityTagHtml = '';
  if (priority) {
    let priorityColor = '#B7791F'; // amber default
    let priorityBg = '#FEF3C7';
    if (priority === 'high' || priority === 'critical' || priority === 'owner_worthy') {
      priorityColor = '#B42318'; // red
      priorityBg = '#FEE2E2';
    } else if (priority === 'low') {
      priorityColor = '#68736A'; // muted
      priorityBg = '#E4DCCB';
    }

    priorityTagHtml = `
      <span style="display: inline-block; font-size: 9px; font-weight: bold; text-transform: uppercase; padding: 2px 8px; border-radius: 99px; background-color: ${priorityBg}; color: ${priorityColor}; margin-left: 8px; vertical-align: middle;">
        ${priority.replace('_', ' ')}
      </span>
    `;
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${headline}</title>
  <style>
    @media screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        padding-left: 12px !important;
        padding-right: 12px !important;
      }
      .card-body {
        padding: 24px !important;
        border-radius: 20px !important;
      }
      .logo-title {
        font-size: 20px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F7F3EA; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  <!-- Hidden Preheader -->
  <div style="display: none; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; font-size: 1px; line-height: 1px; color: #F7F3EA; mso-hide: all;">
    ${preheader}
  </div>

  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #F7F3EA; width: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <tr>
      <td align="center" style="padding-top: 40px; padding-bottom: 40px;">
        
        <!-- Email Container -->
        <table cellpadding="0" cellspacing="0" border="0" width="560" class="email-container" style="width: 560px; max-width: 560px;">
          
          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family: Georgia, serif; font-size: 16px; font-weight: bold; color: ${primaryColor}; letter-spacing: -0.5px;">
                    ${logoHtml}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td>
              <table cellpadding="0" cellspacing="0" border="0" width="100%" class="card-body" style="background-color: #FFFFFF; border: 1px solid #E4DCCB; border-radius: 28px; border-collapse: separate; width: 100%; box-shadow: 0 4px 12px rgba(55, 47, 35, 0.03);">
                <tr>
                  <td style="padding: 40px; text-align: center;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                      
                      <!-- Type Label -->
                      <tr>
                        <td align="center" style="padding-bottom: 16px;">
                          <span style="font-size: 9px; font-weight: bold; text-transform: uppercase; color: ${primaryColor}; letter-spacing: 1px; background-color: #DDEBDD; padding: 4px 10px; border-radius: 8px;">
                            ${typeLabel}
                          </span>
                        </td>
                      </tr>

                      <!-- Fallback Icon Block -->
                      <tr>
                        <td align="center" style="padding-bottom: 20px;">
                          ${iconHtml}
                        </td>
                      </tr>

                      <!-- Headline -->
                      <tr>
                        <td align="center" style="padding-bottom: 12px;">
                          <h1 style="margin: 0; font-family: Georgia, serif; font-size: 22px; font-weight: bold; color: ${primaryColor}; line-height: 1.3; text-align: center;">
                            ${headline}
                            ${priorityTagHtml}
                          </h1>
                        </td>
                      </tr>

                      <!-- Recipient & Summary -->
                      <tr>
                        <td align="left" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #1E2520; padding-bottom: 16px;">
                          <p style="margin: 0 0 12px 0; font-weight: 600;">Hello ${recipientName},</p>
                          <p style="margin: 0; font-weight: 500; color: #1E2520;">${summary}</p>
                        </td>
                      </tr>

                      <!-- Details Panel -->
                      ${detailsPanelHtml}

                      <!-- CTA Button -->
                      <tr>
                        <td align="center" style="padding-top: 32px;">
                          <table cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td align="center" style="border-radius: 12px; background-color: ${primaryColor};">
                                <a href="${actionUrl}" target="_blank" style="display: inline-block; padding: 12px 28px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; font-weight: bold; color: #FFFFFF; text-decoration: none; border-radius: 12px;">
                                  ${ctaLabel}
                                </a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <!-- Fallback URL text -->
                      <tr>
                        <td align="center" style="padding-top: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; line-height: 1.4; color: #68736A;">
                          Or open this link directly in your browser:<br />
                          <a href="${actionUrl}" target="_blank" style="color: ${primaryColor}; font-weight: 600; text-decoration: underline; word-break: break-all;">
                            ${actionUrl}
                          </a>
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top: 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; line-height: 1.6; color: #68736A; text-align: center;">
              <p style="margin: 0 0 12px 0;">
                ${footerText}
              </p>
              <p style="margin: 0 0 16px 0;">
                <a href="${notificationSettingsUrl}" target="_blank" style="color: ${primaryColor}; font-weight: 600; text-decoration: underline; margin: 0 8px;">
                  Manage notification settings
                </a>
                &bull;
                <a href="${secondaryUrl}/privacy" target="_blank" style="color: ${primaryColor}; font-weight: 600; text-decoration: underline; margin: 0 8px;">
                  Privacy Policy
                </a>
                &bull;
                <a href="${secondaryUrl}/terms" target="_blank" style="color: ${primaryColor}; font-weight: 600; text-decoration: underline; margin: 0 8px;">
                  Terms of Service
                </a>
              </p>
              <p style="margin: 0; font-size: 10px; color: #68736A;">
                shapework.co &bull; Headless Brokerage Operations Layer &bull; Austin, TX
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
`;
}
