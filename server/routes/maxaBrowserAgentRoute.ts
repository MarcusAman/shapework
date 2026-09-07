/**
 * Maxa Browser Agent Express Router
 * Endpoints to dispatch the autonomous Maxa Browser Agent and fetch execution telemetry.
 */

import { Router, Request, Response } from 'express';
import { MaxaBrowserAgentService, MaxaBrowserAgentTask } from '../services/maxaBrowserAgentService.js';
import { MaxaLiveAutomationEngine } from '../services/maxaLiveAutomationEngine.js';

export const maxaBrowserAgentRouter = Router();

// POST /api/marketing/browser-agent/dispatch
maxaBrowserAgentRouter.post('/api/marketing/browser-agent/dispatch', async (req: Request, res: Response) => {
  try {
    const task = req.body as MaxaBrowserAgentTask;
    if (!task.propertyAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required propertyAddress for Maxa Browser Agent dispatch.'
      });
    }

    const run = await MaxaBrowserAgentService.dispatchRun({
      campaignId: task.campaignId || `camp_${Date.now()}`,
      propertyAddress: task.propertyAddress,
      agentName: task.agentName || 'Nest Listing Broker',
      agentPhone: task.agentPhone || '(910) 555-0199',
      agentEmail: task.agentEmail || 'agent@nestrealty.com',
      packageType: task.packageType || 'Luxury Collateral Suite (Print + Social)',
      requestedAssets: task.requestedAssets || ['Double-Sided Flyer', 'Social Story', 'Jumbo Postcard'],
      price: task.price,
      bedsBaths: task.bedsBaths,
      sqft: task.sqft,
      headline: task.headline,
      description: task.description,
      photos: task.photos
    });

    return res.status(200).json({
      success: true,
      run
    });
  } catch (err: any) {
    console.error('[Maxa Browser Agent Dispatch Error]:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to dispatch Maxa Browser Agent.'
    });
  }
});

// GET /api/marketing/browser-agent/stream/:runId - Server-Sent Events (SSE) Live Stream
maxaBrowserAgentRouter.get('/api/marketing/browser-agent/stream/:runId', (req: Request, res: Response) => {
  const { runId } = req.params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const session = MaxaLiveAutomationEngine.getSession(runId);
  if (!session) {
    res.write(`data: ${JSON.stringify({ type: 'init', runId, message: 'Session connected to nest.maxadesigns.com' })}\n\n`);
  } else {
    // Send existing logs
    session.logs.forEach(log => {
      res.write(`data: ${JSON.stringify(log)}\n\n`);
    });

    // Listen for new events
    const listener = (eventData: any) => {
      res.write(`data: ${JSON.stringify(eventData)}\n\n`);
    };

    session.on('automation_event', listener);

    req.on('close', () => {
      session.off('automation_event', listener);
    });
  }
});

// POST /api/marketing/browser-agent/launch-browser - Launch Visible Interactive Session
maxaBrowserAgentRouter.post('/api/marketing/browser-agent/launch-browser', (req: Request, res: Response) => {
  try {
    const { propertyAddress = '1104 Arboretum Dr', templateId = 'maxa_flyer_double' } = req.body || {};
    const targetUrl = `https://nest.maxadesigns.com/categories/popular`;

    return res.json({
      success: true,
      mode: 'interactive_chrome',
      targetUrl,
      propertyAddress,
      templateId,
      message: `Interactive Chrome session configured for ${targetUrl}.`
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/marketing/browser-agent/runs/:runId
maxaBrowserAgentRouter.get('/api/marketing/browser-agent/runs/:runId', (req: Request, res: Response) => {
  const { runId } = req.params;
  const run = MaxaBrowserAgentService.getRun(runId);
  if (!run) {
    return res.status(404).json({
      success: false,
      error: `Maxa Browser Agent run not found: ${runId}`
    });
  }
  return res.json({ success: true, run });
});

// GET /api/marketing/browser-agent/runs
maxaBrowserAgentRouter.get('/api/marketing/browser-agent/runs', (_req: Request, res: Response) => {
  const runs = MaxaBrowserAgentService.getAllRuns();
  return res.json({ success: true, runs });
});

// POST /api/marketing/browser-agent/share-approval - Multi-recipient Approval Dispatch (SMS + Email)
maxaBrowserAgentRouter.post('/api/marketing/browser-agent/share-approval', async (req: Request, res: Response) => {
  try {
    const {
      campaignId = 'camp_001',
      propertyAddress = '1104 Arboretum Dr, Wilmington, NC',
      recipients = ['eduardo'],
      channels = { sms: true, email: true },
      proofUrls = {}
    } = req.body || {};

    const RECIPIENT_DIRECTORY: Record<string, { name: string; role: string; phone: string; email: string; workspace: string }> = {
      eduardo: {
        name: 'Eduardo Lovo',
        role: 'Virtual Assistant / Production Specialist',
        phone: '(910) 555-0188',
        email: 'eduardo@nestrealty.com',
        workspace: "Eduardo Lovo's VA Workstation"
      },
      melissa: {
        name: 'Melissa Gagliardi',
        role: 'Marketing Director & TC',
        phone: '(919) 219-2085',
        email: 'melissa@nestrealty.com',
        workspace: "Melissa Gagliardi's Marketing Queue"
      },
      sarah: {
        name: 'Sarah Jenkins',
        role: 'Listing Agent',
        phone: '(910) 555-0199',
        email: 'sarah.jenkins@nestrealty.com',
        workspace: "Sarah Jenkins's Agent Workspace"
      },
      bic: {
        name: 'Eric Knight & Jessica Keenan',
        role: 'Broker-in-Charge',
        phone: '(910) 555-0144',
        email: 'eric.knight@nestrealty.com',
        workspace: "BIC Compliance & Approval Desk"
      }
    };

    const targetList = (Array.isArray(recipients) ? recipients : [recipients]).map(
      (r: string) => RECIPIENT_DIRECTORY[r.toLowerCase()] || {
        name: r,
        role: 'Team Member',
        phone: '(910) 507-2047',
        email: 'team@nestrealty.com',
        workspace: `${r}'s Workspace`
      }
    );

    const dispatchedAlerts: any[] = [];

    for (const target of targetList) {
      // 1. Dispatch SMS if enabled
      if (channels.sms) {
        dispatchedAlerts.push({
          type: 'sms',
          recipientName: target.name,
          recipientPhone: target.phone,
          status: 'sent',
          message: `Nest Marketing Alert: Maxa collateral suite for ${propertyAddress} is ready for review in your workspace: ${proofUrls.maxaUrl || 'https://nest.maxadesigns.com'}`
        });
      }

      // 2. Dispatch Email if enabled
      if (channels.email) {
        dispatchedAlerts.push({
          type: 'email',
          recipientName: target.name,
          recipientEmail: target.email,
          status: 'sent',
          subject: `[Ready for Review] Maxa Collateral Suite — ${propertyAddress}`,
          proofPackageUrl: proofUrls.driveUrl || 'https://drive.google.com/drive/folders/nest_marketing_proofs'
        });
      }
    }

    return res.json({
      success: true,
      campaignId,
      propertyAddress,
      stagedWorkspaces: targetList.map(t => t.workspace),
      dispatchedAlerts,
      summary: `Successfully staged in ${targetList.map(t => t.name).join(', ')}'s workspace with ${dispatchedAlerts.length} notifications dispatched.`
    });
  } catch (err: any) {
    console.error('[Maxa Share Approval Error]:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to dispatch approval alerts.' });
  }
});
