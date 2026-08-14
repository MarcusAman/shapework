/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Contract Demo Routes — Phase 4A.3 Architecture
 * Express router for triggering development-only demo fixtures and listing pending intakes.
 * Fails 404/Forbidden in production mode or if CONTRACT_COPILOT_DEMO_MODE=true is missing.
 */

import { Router, Request, Response } from 'express';
import { ContractDemoFixtureService, DemoScenarioKey } from './contractDemoFixtures.js';
import { PendingContractIntakeService } from './pendingContractIntake.js';

export const contractDemoRouter = Router();

// Middleware: Assert non-production & demo mode allowed
contractDemoRouter.use((req: Request, res: Response, next) => {
  try {
    ContractDemoFixtureService.assertDemoModeAllowed();
    next();
  } catch (err: any) {
    return res.status(404).json({ success: false, error: err.message });
  }
});

// POST /api/contracts/demo/fixtures (Trigger Demo Fixture Creation)
contractDemoRouter.post('/fixtures', async (req: Request, res: Response) => {
  try {
    const { scenario = 'scenario_a_sms', workspaceId = 'nest-realty-wilmington', brokerUserId } = req.body || {};
    const authUser = (req as any).authUser;
    const targetUserId = brokerUserId || authUser?.id || 'usr_broker_alice';

    const pendingIntake = await ContractDemoFixtureService.createDemoFixture(
      scenario as DemoScenarioKey,
      workspaceId,
      targetUserId
    );

    return res.json({ success: true, pendingIntake });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// GET /api/contracts/demo/pending (List Pending Intakes for Broker)
contractDemoRouter.get('/pending', async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).authUser;
    const workspaceId = (req as any).workspaceId || (req.query.workspaceId as string) || 'nest-realty-wilmington';
    const targetUserId = authUser?.id || (req.query.brokerUserId as string) || 'usr_broker_alice';

    const pendingIntakes = await PendingContractIntakeService.listPendingByBroker(targetUserId, workspaceId);
    return res.json({ success: true, pendingIntakes });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});
