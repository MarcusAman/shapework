/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Nora Autonomous Employee Express Route
 */

import { Router, Request, Response } from 'express';
import { NoraAutonomousEmployeeService } from '../ai/noraAutonomousEmployeeService.js';

export const noraAutonomousEmployeeRouter = Router();

// GET /api/nora/activity-log
noraAutonomousEmployeeRouter.get('/activity-log', (_req: Request, res: Response) => {
  try {
    const logs = NoraAutonomousEmployeeService.getActivityLog();
    res.json({ success: true, logs, total: logs.length });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/nora/execute-action
noraAutonomousEmployeeRouter.post('/execute-action', async (req: Request, res: Response) => {
  try {
    const { actionType, params } = req.body;

    let result: any = null;
    switch (actionType) {
      case 'dispatch_vendor_order':
        result = await NoraAutonomousEmployeeService.executeDispatchVendorOrder(params);
        break;
      case 'generate_marketing_collateral':
        result = await NoraAutonomousEmployeeService.executeGenerateMarketingCollateral(params);
        break;
      case 'draft_and_stage_contract':
        result = await NoraAutonomousEmployeeService.executeDraftAndStageContract(params);
        break;
      case 'send_caller_followup':
        result = await NoraAutonomousEmployeeService.executeSendCallerFollowup(params);
        break;
      case 'verify_trust_deposit_and_nudge':
        result = await NoraAutonomousEmployeeService.executeVerifyTrustDepositAndNudge(params);
        break;
      default:
        return res.status(400).json({ success: false, error: `Unsupported actionType: ${actionType}` });
    }

    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/nora/run-heartbeat
noraAutonomousEmployeeRouter.post('/run-heartbeat', async (_req: Request, res: Response) => {
  try {
    const heartbeatResult = await NoraAutonomousEmployeeService.executeProactiveHeartbeat();
    res.json({ success: true, heartbeat: heartbeatResult });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
