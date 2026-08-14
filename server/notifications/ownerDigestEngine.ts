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
      needsAttention: needsAttention.slice(0, 5),
      openRequests: openRequests.slice(0, 5),
      resolvedLastWeek: resolvedLastWeek.slice(0, 5)
    };
  },

  renderDigestHtml(data: OwnerDigestData): string {
    const attentionRows = data.needsAttention.length > 0 
      ? data.needsAttention.map(item => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px 12px; font-weight: 600; color: #0f172a;">${item.title}</td>
          <td style="padding: 10px 12px; color: #b91c1c; font-weight: bold; font-size: 12px;">${item.status} ${item.daysOverdue ? `(${item.daysOverdue}d)` : ''}</td>
          <td style="padding: 10px 12px; color: #64748b; font-size: 12px;">${item.ownerName || 'Unassigned'}</td>
        </tr>`).join('')
      : `<tr><td colspan="3" style="padding: 12px; color: #166534; font-size: 13px;">✓ All high-priority items and approvals are up to date.</td></tr>`;

    const openRows = data.openRequests.length > 0
      ? data.openRequests.map(item => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px 12px; font-weight: 500; color: #334155;">${item.title}</td>
          <td style="padding: 10px 12px; color: #0284c7; font-size: 12px;">${item.status}</td>
          <td style="padding: 10px 12px; color: #64748b; font-size: 12px;">${item.ownerName || 'Team'}</td>
        </tr>`).join('')
      : `<tr><td colspan="3" style="padding: 12px; color: #64748b; font-size: 13px;">No open requests in queue.</td></tr>`;

    const resolvedRows = data.resolvedLastWeek.length > 0
      ? data.resolvedLastWeek.map(item => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px 12px; font-weight: 500; color: #334155;">${item.title}</td>
          <td style="padding: 10px 12px; color: #166534; font-size: 12px;">✓ Completed</td>
          <td style="padding: 10px 12px; color: #64748b; font-size: 12px;">${item.completedAt || 'Last week'}</td>
        </tr>`).join('')
      : `<tr><td colspan="3" style="padding: 12px; color: #64748b; font-size: 13px;">No completed items recorded in this window.</td></tr>`;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Nest Ops — Monday Briefing</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px 0; color: #1e293b;">
  <div style="max-width: 620px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    
    <!-- Header -->
    <div style="background-color: #00635C; padding: 28px 24px; color: #ffffff;">
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; color: #A4D4CB; margin-bottom: 4px;">Nest Ops Executive Briefing</div>
      <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">Your Monday Briefing</h1>
      <div style="font-size: 13px; color: #e2e8f0; margin-top: 6px;">${data.generationDate} • ${data.brokerageName}</div>
    </div>

    <!-- Executive Greeting -->
    <div style="padding: 24px 24px 16px 24px; border-bottom: 1px solid #f1f5f9;">
      <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #334155;">
        Good morning, <strong>${data.principalName}</strong>.
        Here is your week at a glance: <strong>${data.needsAttentionCount}</strong> ${data.needsAttentionCount === 1 ? 'item needs' : 'items need'} attention, <strong>${data.openRequestsCount}</strong> active open requests, and <strong>${data.resolvedLastWeekCount}</strong> operational tasks resolved last week.
      </p>
    </div>

    <!-- Section 1: Needs Attention -->
    <div style="padding: 20px 24px;">
      <div style="display: flex; align-items: center; margin-bottom: 12px;">
        <span style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #dc2626;">🚨 Needs Attention (${data.needsAttentionCount})</span>
      </div>
      <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; overflow: hidden;">
        <thead>
          <tr style="background-color: #fee2e2; color: #991b1b; font-size: 11px; text-transform: uppercase;">
            <th style="padding: 8px 12px;">Item</th>
            <th style="padding: 8px 12px;">Status</th>
            <th style="padding: 8px 12px;">Owner</th>
          </tr>
        </thead>
        <tbody>
          ${attentionRows}
        </tbody>
      </table>
    </div>

    <!-- Section 2: Open Requests -->
    <div style="padding: 10px 24px 20px 24px;">
      <div style="display: flex; align-items: center; margin-bottom: 12px;">
        <span style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #0284c7;">📋 Open Requests (${data.openRequestsCount})</span>
      </div>
      <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <thead>
          <tr style="background-color: #f1f5f9; color: #475569; font-size: 11px; text-transform: uppercase;">
            <th style="padding: 8px 12px;">Request</th>
            <th style="padding: 8px 12px;">Stage</th>
            <th style="padding: 8px 12px;">Handler</th>
          </tr>
        </thead>
        <tbody>
          ${openRows}
        </tbody>
      </table>
    </div>

    <!-- Section 3: Resolved Last Week -->
    <div style="padding: 10px 24px 24px 24px;">
      <div style="display: flex; align-items: center; margin-bottom: 12px;">
        <span style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #166534;">✅ Resolved Last Week (${data.resolvedLastWeekCount})</span>
      </div>
      <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; overflow: hidden;">
        <thead>
          <tr style="background-color: #dcfce7; color: #166534; font-size: 11px; text-transform: uppercase;">
            <th style="padding: 8px 12px;">Completed Work</th>
            <th style="padding: 8px 12px;">Outcome</th>
            <th style="padding: 8px 12px;">Date</th>
          </tr>
        </thead>
        <tbody>
          ${resolvedRows}
        </tbody>
      </table>
    </div>

    <!-- Call to Action -->
    <div style="padding: 20px 24px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
      <a href="https://nest-ops.shapework.co/app/owner-brief" style="display: inline-block; background-color: #00635C; color: #ffffff; text-decoration: none; padding: 12px 28px; font-weight: 700; font-size: 13px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">Open Nest Ops Console</a>
      <div style="font-size: 11px; color: #94a3b8; margin-top: 12px;">You are receiving this operational brief as a principal of Nest Realty Wilmington.</div>
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
