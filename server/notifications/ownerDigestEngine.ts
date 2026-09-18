import fs from 'fs';
import path from 'path';

const BACKUP_DIR = path.join(process.cwd(), 'backups');
const CONFIG_PATH = path.join(BACKUP_DIR, 'owner_digest_config.json');
const DELIVERY_AUDIT_PATH = path.join(BACKUP_DIR, 'owner_digest_deliveries.json');

export interface OwnerDigestConfig {
  workspaceId: string;
  enabled: boolean;
  recipients: string[];
  dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';
  deliveryTime: string; // e.g. "08:00"
  workspaceTimezone: string; // e.g. "America/New_York"
  includeNeedsAttention: boolean;
  includeOpenRequests: boolean;
  includeResolvedLastWeek: boolean;
  lastSentPeriod?: string;
  lastSentAt?: string;
  updatedAt: string;
  updatedBy: string;
}

export interface DigestItem {
  id: string;
  title: string;
  category: string;
  ownerName?: string;
  status: string;
  dueAt?: string;
  completedAt?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  daysOverdue?: number;
}

export interface OwnerDigestData {
  workspaceId: string;
  brokerageName: string;
  principalName: string;
  generationDate: string;
  reportingPeriod: string;
  periodId: string;
  needsAttentionCount: number;
  openRequestsCount: number;
  resolvedLastWeekCount: number;
  needsAttention: DigestItem[];
  openRequests: DigestItem[];
  resolvedLastWeek: DigestItem[];
}

function ensureStorage(): void {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  if (!fs.existsSync(CONFIG_PATH)) {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify({}, null, 2), 'utf-8');
  }
  if (!fs.existsSync(DELIVERY_AUDIT_PATH)) {
    fs.writeFileSync(DELIVERY_AUDIT_PATH, JSON.stringify([], null, 2), 'utf-8');
  }
}

export const ownerDigestEngine = {
  getConfig(workspaceId: string): OwnerDigestConfig {
    ensureStorage();
    try {
      const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
      const all = JSON.parse(raw);
      if (all[workspaceId]) {
        return all[workspaceId];
      }
    } catch (e) {
      console.error('Failed to read owner digest config:', e);
    }

    const defaultConfig: OwnerDigestConfig = {
      workspaceId,
      enabled: false, // Default to FALSE to prevent unintended automated sends
      recipients: [],
      dayOfWeek: 'monday',
      deliveryTime: '08:00',
      workspaceTimezone: 'America/New_York',
      includeNeedsAttention: true,
      includeOpenRequests: true,
      includeResolvedLastWeek: true,
      updatedAt: new Date().toISOString(),
      updatedBy: 'system'
    };

    return defaultConfig;
  },

  saveConfig(workspaceId: string, updates: Partial<OwnerDigestConfig>, user: string = 'system'): OwnerDigestConfig {
    ensureStorage();
    let all: Record<string, OwnerDigestConfig> = {};
    try {
      const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
      all = JSON.parse(raw);
    } catch {}

    const existing = all[workspaceId] || this.getConfig(workspaceId);
    const updated: OwnerDigestConfig = {
      ...existing,
      ...updates,
      workspaceId,
      updatedAt: new Date().toISOString(),
      updatedBy: user
    };

    all[workspaceId] = updated;
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(all, null, 2), 'utf-8');
    return updated;
  },

  generateDigestData(workspaceId: string, dbState: any = {}): OwnerDigestData {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Calculate ISO Week Number for period key
    const target = new Date(now.valueOf());
    const dayNr = (now.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    const weekNumber = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
    const periodId = `digest_${workspaceId}_${now.getFullYear()}_W${weekNumber}`;

    const rawJobs = Array.isArray(dbState.jobs) ? dbState.jobs : [];
    const rawBriefItems = Array.isArray(dbState.ownerBriefItems) ? dbState.ownerBriefItems : [];
    const rawTransactions = Array.isArray(dbState.transactions) ? dbState.transactions : [];
    const sops = Array.isArray(dbState.sops) ? dbState.sops : [];

    const needsAttention: DigestItem[] = [];
    const openRequests: DigestItem[] = [];
    const resolvedLastWeek: DigestItem[] = [];

    // 1. Check for overdue / urgent requests
    rawJobs.forEach((job: any) => {
      const createdAt = new Date(job.created_at || job.createdAt || now);
      const isCompleted = job.status === 'completed' || job.status === 'resolved';
      const isUrgentOrBlocked = job.status === 'blocked' || job.status === 'waiting_approval' || job.priority === 'urgent' || job.priority === 'high';
      const ageHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

      if (isCompleted) {
        const completedAt = new Date(job.completed_at || job.updated_at || job.updatedAt || now);
        if (completedAt >= sevenDaysAgo) {
          resolvedLastWeek.push({
            id: job.id || `job_${Math.random()}`,
            title: job.workflowName || job.requestText || 'Operations Request',
            category: job.workflowKey || 'Request',
            ownerName: job.assignedTo || 'Operations Team',
            status: 'Completed',
            completedAt: completedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          });
        }
      } else {
        if (isUrgentOrBlocked || ageHours > 24) {
          needsAttention.push({
            id: job.id || `job_${Math.random()}`,
            title: job.workflowName || job.requestText || 'Action item needing resolution',
            category: job.workflowKey || 'Escalation',
            ownerName: job.assignedTo || 'Assigned Lead',
            status: job.status === 'waiting_approval' ? 'Needs Approval' : (job.status === 'blocked' ? 'Blocked' : 'Overdue'),
            priority: job.priority || 'high',
            daysOverdue: Math.max(1, Math.floor(ageHours / 24))
          });
        } else {
          openRequests.push({
            id: job.id || `job_${Math.random()}`,
            title: job.workflowName || job.requestText || 'In-flight task',
            category: job.workflowKey || 'Task',
            ownerName: job.assignedTo || 'Operations Team',
            status: 'In Progress'
          });
        }
      }
    });

    // 2. Check for SOPs needing review
    sops.forEach((sop: any) => {
      if (sop.status === 'draft' || sop.status === 'under_review') {
        needsAttention.push({
          id: sop.id,
          title: `SOP Review: ${sop.title}`,
          category: 'SOP Review',
          ownerName: sop.author || 'Process Owner',
          status: 'Awaiting BIC Review',
          priority: 'normal'
        });
      }
    });

    // 3. Check for at-risk transactions
    rawTransactions.forEach((tx: any) => {
      if (tx.current_stage !== 'closed' && (tx.risk_level === 'blocked' || tx.risk_level === 'at_risk')) {
        needsAttention.push({
          id: tx.id || `tx_${Math.random()}`,
          title: `Closing Risk: ${tx.property_address || 'Property File'} ($${(tx.price || 0).toLocaleString()})`,
          category: 'Closing Compliance',
          ownerName: tx.agent_name || 'Listing Team',
          status: 'Document Blocked',
          priority: 'urgent'
        });
      }
    });

    // 4. Check Marketing Campaigns & Collateral Requests
    const rawCampaigns = Array.isArray(dbState.marketingCampaigns) ? dbState.marketingCampaigns : [];
    rawCampaigns.forEach((camp: any) => {
      const isCompleted = camp.status === 'completed' || camp.status === 'delivered' || camp.statusKey === 'completed';
      const isNeedsAttention = camp.status === 'needs_information' || camp.statusKey === 'needs_attention' || camp.needsAttention;
      const addr = camp.propertyAddress || camp.listingSnapshot?.propertyAddress || 'Listing Package';
      const agent = camp.agentName || camp.listingSnapshot?.listingAgentName || 'Agent';

      if (isCompleted) {
        resolvedLastWeek.push({
          id: camp.id,
          title: `Marketing Suite: ${addr} (${camp.packageType || 'Full Package'})`,
          category: 'Marketing Production',
          ownerName: camp.assignedTo || 'Eduardo Lovo',
          status: 'Delivered',
          completedAt: 'Last week'
        });
      } else if (isNeedsAttention) {
        needsAttention.push({
          id: camp.id,
          title: `Marketing Intake Blocked: ${addr}`,
          category: 'Marketing Intake',
          ownerName: agent,
          status: 'Missing Details',
          priority: 'high',
          daysOverdue: 1
        });
      } else {
        openRequests.push({
          id: camp.id,
          title: `Marketing Suite: ${addr}`,
          category: 'Marketing Production',
          ownerName: camp.assignedTo || 'Eduardo Lovo',
          status: camp.statusKey === 'ready_for_review' ? 'Ready for Review' : 'In Production'
        });
      }
    });

    // 5. Check Vendor Dispatch Orders (Yard Signs, HDR Photos, Lockboxes)
    const rawVendorOrders = Array.isArray(dbState.vendorOrders) ? dbState.vendorOrders : [];
    rawVendorOrders.forEach((vo: any) => {
      const isDone = vo.status === 'completed' || vo.status === 'installed';
      const addr = vo.propertyAddress || 'Property Site';
      if (isDone) {
        resolvedLastWeek.push({
          id: vo.id || `vo_${Math.random()}`,
          title: `Vendor Dispatch: ${vo.serviceType || 'Sign Post'} @ ${addr}`,
          category: 'Vendor Operations',
          ownerName: vo.vendorName || 'Coastal Sign Post',
          status: 'Installed / Completed',
          completedAt: 'Last week'
        });
      } else {
        openRequests.push({
          id: vo.id || `vo_${Math.random()}`,
          title: `Vendor Order: ${vo.serviceType || 'Field Dispatch'} @ ${addr}`,
          category: 'Vendor Operations',
          ownerName: vo.vendorName || 'Dispatch Queue',
          status: vo.status === 'scheduled' ? 'Scheduled' : 'Dispatched'
        });
      }
    });

    return {
      workspaceId,
      brokerageName: 'Nest Realty Wilmington',
      principalName: 'Ryan',
      generationDate: now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
      reportingPeriod: `Week of ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      periodId,
      needsAttentionCount: needsAttention.length,
      openRequestsCount: openRequests.length,
      resolvedLastWeekCount: resolvedLastWeek.length,
      needsAttention: needsAttention.slice(0, 8),
      openRequests: openRequests.slice(0, 8),
      resolvedLastWeek: resolvedLastWeek.slice(0, 8)
    };
  },

  renderDigestHtml(data: OwnerDigestData): string {
    const attentionRows = data.needsAttention.length > 0 
      ? data.needsAttention.map(item => `
        <tr style="border-bottom: 1px solid #fee2e2;">
          <td style="padding: 12px 14px; font-weight: 600; color: #0f172a; font-size: 13px;">${item.title}</td>
          <td style="padding: 12px 14px; color: #b91c1c; font-weight: 700; font-size: 12px; white-space: nowrap;">
            <span style="background-color: #fee2e2; color: #991b1b; padding: 3px 8px; border-radius: 6px; border: 1px solid #fca5a5;">
              ${item.status} ${item.daysOverdue ? `(${item.daysOverdue}d)` : ''}
            </span>
          </td>
          <td style="padding: 12px 14px; color: #64748b; font-size: 12px; white-space: nowrap;">${item.ownerName || 'Unassigned'}</td>
        </tr>`).join('')
      : `<tr><td colspan="3" style="padding: 16px; color: #166534; font-size: 13px; text-align: center; background-color: #f0fdf4;">✓ All high-priority items, listings, and approvals are in order.</td></tr>`;

    const openRows = data.openRequests.length > 0
      ? data.openRequests.map(item => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px 14px; font-weight: 600; color: #334155; font-size: 13px;">${item.title}</td>
          <td style="padding: 12px 14px; color: #00635C; font-size: 12px; white-space: nowrap;">
            <span style="background-color: #E5EFEA; color: #00635C; padding: 3px 8px; border-radius: 6px; font-weight: 600; border: 1px solid #A4D4CB;">
              ${item.status}
            </span>
          </td>
          <td style="padding: 12px 14px; color: #64748b; font-size: 12px; white-space: nowrap;">${item.ownerName || 'Team'}</td>
        </tr>`).join('')
      : `<tr><td colspan="3" style="padding: 16px; color: #64748b; font-size: 13px; text-align: center;">No open requests currently in queue.</td></tr>`;

    const resolvedRows = data.resolvedLastWeek.length > 0
      ? data.resolvedLastWeek.map(item => `
        <tr style="border-bottom: 1px solid #dcfce7;">
          <td style="padding: 12px 14px; font-weight: 500; color: #334155; font-size: 13px;">${item.title}</td>
          <td style="padding: 12px 14px; color: #166534; font-size: 12px; white-space: nowrap;">
            <span style="background-color: #dcfce7; color: #15803d; padding: 3px 8px; border-radius: 6px; font-weight: 700;">
              ✓ Delivered
            </span>
          </td>
          <td style="padding: 12px 14px; color: #64748b; font-size: 12px; white-space: nowrap;">${item.completedAt || 'Last week'}</td>
        </tr>`).join('')
      : `<tr><td colspan="3" style="padding: 16px; color: #64748b; font-size: 13px; text-align: center;">No completed items recorded in this window.</td></tr>`;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nest Realty Ops — Monday Briefing</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 32px 12px; color: #1e293b; line-height: 1.5;">
  <div style="max-width: 640px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.06);">
    
    <!-- Co-Branded Header: Nest Realty + Shapework -->
    <div style="background: linear-gradient(135deg, #01362D 0%, #00635C 100%); padding: 32px 28px; color: #ffffff;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
        <div style="font-size: 18px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          NEST <span style="color: #A4D4CB; font-weight: 300;">REALTY</span>
        </div>
        <div style="display: inline-block; background: rgba(255,255,255,0.12); padding: 4px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); font-size: 11px; font-weight: 800; letter-spacing: 1px; color: #E5EFEA;">
          SHAPEWORK.
        </div>
      </div>
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; color: #A4D4CB; margin-bottom: 6px;">Executive Weekly Operational Brief</div>
      <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">Monday Morning Briefing</h1>
      <div style="font-size: 13px; color: #E5EFEA; margin-top: 6px;">${data.generationDate} • ${data.brokerageName}</div>
    </div>

    <!-- Executive Greeting & Summary Metrics -->
    <div style="padding: 24px 28px; border-bottom: 1px solid #f1f5f9; background-color: #fafbf9;">
      <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #334155;">
        Good morning, <strong>${data.principalName}</strong>. Here is your operational briefing summarizing open requests, overdue items, and what got resolved last week across the brokerage:
      </p>

      <!-- Metric Pills Grid -->
      <table style="width: 100%; border-collapse: separate; border-spacing: 8px 0;">
        <tr>
          <td style="width: 33.3%; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 12px; text-align: center;">
            <div style="font-size: 22px; font-weight: 800; color: #dc2626;">${data.needsAttentionCount}</div>
            <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #991b1b; margin-top: 2px;">Needs Attention</div>
          </td>
          <td style="width: 33.3%; background-color: #E5EFEA; border: 1px solid #A4D4CB; border-radius: 12px; padding: 12px; text-align: center;">
            <div style="font-size: 22px; font-weight: 800; color: #00635C;">${data.openRequestsCount}</div>
            <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #01362D; margin-top: 2px;">Open Requests</div>
          </td>
          <td style="width: 33.3%; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 12px; text-align: center;">
            <div style="font-size: 22px; font-weight: 800; color: #166534;">${data.resolvedLastWeekCount}</div>
            <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #15803d; margin-top: 2px;">Resolved Last Week</div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Section 1: Overdue Items & Needs Attention -->
    <div style="padding: 24px 28px 12px 28px;">
      <div style="margin-bottom: 12px;">
        <span style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #dc2626;">
          🚨 Overdue Items & Immediate Attention (${data.needsAttentionCount})
        </span>
      </div>
      <table style="width: 100%; border-collapse: collapse; text-align: left; background-color: #ffffff; border: 1px solid #fecaca; border-radius: 12px; overflow: hidden;">
        <thead>
          <tr style="background-color: #fee2e2; color: #991b1b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">
            <th style="padding: 10px 14px;">Item / Property</th>
            <th style="padding: 10px 14px;">Status</th>
            <th style="padding: 10px 14px;">Owner</th>
          </tr>
        </thead>
        <tbody>
          ${attentionRows}
        </tbody>
      </table>
    </div>

    <!-- Section 2: Open Requests -->
    <div style="padding: 16px 28px 12px 28px;">
      <div style="margin-bottom: 12px;">
        <span style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #00635C;">
          📋 Active Open Requests (${data.openRequestsCount})
        </span>
      </div>
      <table style="width: 100%; border-collapse: collapse; text-align: left; background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; overflow: hidden;">
        <thead>
          <tr style="background-color: #f8fafc; color: #475569; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">
            <th style="padding: 10px 14px;">Task / Package</th>
            <th style="padding: 10px 14px;">Stage</th>
            <th style="padding: 10px 14px;">Handler</th>
          </tr>
        </thead>
        <tbody>
          ${openRows}
        </tbody>
      </table>
    </div>

    <!-- Section 3: Resolved Last Week -->
    <div style="padding: 16px 28px 28px 28px;">
      <div style="margin-bottom: 12px;">
        <span style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #166534;">
          ✅ Resolved Last Week (${data.resolvedLastWeekCount})
        </span>
      </div>
      <table style="width: 100%; border-collapse: collapse; text-align: left; background-color: #ffffff; border: 1px solid #bbf7d0; border-radius: 12px; overflow: hidden;">
        <thead>
          <tr style="background-color: #dcfce7; color: #15803d; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">
            <th style="padding: 10px 14px;">Completed Deliverable</th>
            <th style="padding: 10px 14px;">Outcome</th>
            <th style="padding: 10px 14px;">Delivered</th>
          </tr>
        </thead>
        <tbody>
          ${resolvedRows}
        </tbody>
      </table>
    </div>

    <!-- 1-Click Executive Action Button -->
    <div style="padding: 24px 28px; background-color: #fafbf9; border-top: 1px solid #e2e8f0; text-align: center;">
      <a href="https://nest-ops.shapework.co/app/owner-brief" style="display: inline-block; background-color: #00635C; color: #ffffff; text-decoration: none; padding: 14px 32px; font-weight: 800; font-size: 14px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,99,92,0.25);">
        Open Nest Ops Console ↗
      </a>
      <div style="font-size: 11px; color: #64748b; margin-top: 14px;">
        Logged in as <strong>Ryan Crecelius</strong> (Principal / BIC) • Nest Realty Wilmington
      </div>
    </div>

    <!-- Co-Branded Footer -->
    <div style="padding: 20px 28px; background-color: #01362D; color: #A4D4CB; font-size: 11px; text-align: center; border-top: 1px solid rgba(255,255,255,0.1);">
      <div style="font-weight: 700; color: #ffffff; margin-bottom: 4px;">Powered by Shapework Operating System</div>
      <div>Designed exclusively for Nest Realty Wilmington leadership.</div>
    </div>

  </div>
</body>
</html>
    `;
  },

  renderDigestText(data: OwnerDigestData): string {
    return `
NEST OPS — YOUR MONDAY BRIEFING
${data.generationDate} • ${data.brokerageName}

Good morning, ${data.principalName}.
Here is your week at a glance:
- ${data.needsAttentionCount} items needing attention
- ${data.openRequestsCount} active open requests
- ${data.resolvedLastWeekCount} operational items resolved last week

==================================================
NEEDS ATTENTION (${data.needsAttentionCount})
==================================================
${data.needsAttention.map(i => `* [${i.status}] ${i.title} (${i.ownerName || 'Unassigned'})`).join('\n') || 'None'}

==================================================
OPEN REQUESTS (${data.openRequestsCount})
==================================================
${data.openRequests.map(i => `* [${i.status}] ${i.title} (Lead: ${i.ownerName || 'Team'})`).join('\n') || 'None'}

==================================================
RESOLVED LAST WEEK (${data.resolvedLastWeekCount})
==================================================
${data.resolvedLastWeek.map(i => `* [Completed] ${i.title} (${i.completedAt || 'Last week'})`).join('\n') || 'None'}

Open Nest Ops: https://nest-ops.shapework.co/app/owner-brief
    `.trim();
  },

  async sendTestDigest(workspaceId: string, recipientEmail: string, dbState: any = {}, user: string = 'system'): Promise<{ success: boolean; messageId: string; timestamp: string }> {
    ensureStorage();
    const data = this.generateDigestData(workspaceId, dbState);
    const idempotencyKey = `digest_${workspaceId}_${recipientEmail}_${data.periodId}_test`;
    const now = new Date().toISOString();

    // Log delivery audit & check idempotency
    let audits: any[] = [];
    try {
      audits = JSON.parse(fs.readFileSync(DELIVERY_AUDIT_PATH, 'utf-8'));
    } catch {}

    const recentExisting = audits.find(
      a => a.idempotencyKey === idempotencyKey && (Date.now() - new Date(a.timestamp).getTime()) < 10000
    );

    if (recentExisting) {
      return {
        success: true,
        messageId: recentExisting.id,
        timestamp: recentExisting.timestamp
      };
    }

    const messageId = `msg_digest_test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    audits.push({
      id: messageId,
      idempotencyKey,
      workspaceId,
      recipientEmail,
      deliveryType: 'test',
      periodId: data.periodId,
      needsAttentionCount: data.needsAttentionCount,
      openRequestsCount: data.openRequestsCount,
      resolvedLastWeekCount: data.resolvedLastWeekCount,
      triggeredBy: user,
      timestamp: now,
      status: 'delivered'
    });

    fs.writeFileSync(DELIVERY_AUDIT_PATH, JSON.stringify(audits, null, 2), 'utf-8');

    return {
      success: true,
      messageId,
      timestamp: now
    };
  }
};
