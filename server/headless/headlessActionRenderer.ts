import { HeadlessAction, BrandingSettings } from './headlessActionTypes.js';

export function renderHeadlessActionSummary(action: HeadlessAction, detail: any): string {
  switch (action.actionType) {
    case 'view_work_item':
      return `View work item "${detail?.title || 'Unknown Task'}"`;
    case 'complete_work_item':
      return `Complete task "${detail?.title || 'Unknown Task'}"`;
    case 'approve_draft':
      return `Approve draft "${detail?.title || 'Unknown Draft'}"`;
    case 'reject_draft':
      return `Reject draft "${detail?.title || 'Unknown Draft'}"`;
    case 'request_missing_info':
      return `Request missing information for "${detail?.title || 'Unknown'}"`;
    case 'assign_owner':
      return `Assign owner for task`;
    case 'add_note':
      return `Add operational note`;
    case 'review_document':
      return `Review file "${detail?.title || 'Document'}"`;
    case 'upload_document':
      return `Upload required file`;
    case 'view_owner_brief':
      return `View Owner Brief`;
    case 'view_deal_status':
      return `View deal status portal`;
    case 'reply_to_request':
      return `Reply to operational request`;
    default:
      return `Perform operational action`;
  }
}

export function renderActionPortalHtml(
  action: HeadlessAction,
  brand: BrandingSettings,
  detail: any
): string {
  const primaryColor = brand.primaryColor || '#18382b';
  const brokerageName = brand.brokerageName || 'Nest Realty';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brokerageName} - Action Portal</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #fcfbf7;
      color: #1e2520;
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .card {
      background-color: #ffffff;
      border: 1px border #e4decb;
      border-radius: 16px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      max-width: 480px;
      width: 100%;
      padding: 32px;
      text-align: center;
      margin: 20px;
    }
    .logo {
      font-size: 16px;
      font-weight: 800;
      color: ${primaryColor};
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin-bottom: 24px;
    }
    h2 {
      font-size: 18px;
      font-weight: 700;
      margin: 0 0 12px 0;
    }
    p {
      font-size: 13px;
      color: #68726b;
      line-height: 1.5;
      margin: 0 0 24px 0;
    }
    .btn {
      display: inline-block;
      background-color: ${primaryColor};
      color: #ffffff;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      transition: opacity 0.2s;
    }
    .btn:hover {
      opacity: 0.9;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">${brokerageName}</div>
    <h2>${renderHeadlessActionSummary(action, detail)}</h2>
    <p>This is a secure action portal link. Clicking the action button below completes the requested task.</p>
    <a href="#" class="btn">Proceed with Action</a>
  </div>
</body>
</html>
  `;
}
