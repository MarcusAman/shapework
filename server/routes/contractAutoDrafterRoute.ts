/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Contract Auto-Drafter REST API Routes
 */

import { Router, Request, Response } from 'express';
import { ContractAutoDrafterService } from '../services/contractAutoDrafterService.js';

export const contractAutoDrafterRouter = Router();

// GET /api/contracts/auto-draft/templates
contractAutoDrafterRouter.get('/templates', (_req: Request, res: Response) => {
  try {
    const templates = ContractAutoDrafterService.getSupportedTemplates();
    res.json({ success: true, templates });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/contracts/auto-draft/dispatch
contractAutoDrafterRouter.post('/dispatch', async (req: Request, res: Response) => {
  try {
    const {
      subjectPropertyId,
      customAddress,
      agreementType,
      purchasePrice,
      dueDiligenceFee,
      earnestMoneyDeposit,
      closingDateDays,
      financingType,
      buyerNames,
      closingAttorney
    } = req.body;

    const session = await ContractAutoDrafterService.dispatchAutoDraftSession({
      subjectPropertyId,
      customAddress,
      agreementType,
      purchasePrice,
      dueDiligenceFee,
      earnestMoneyDeposit,
      closingDateDays,
      financingType,
      buyerNames,
      closingAttorney
    });

    res.json({ success: true, session });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/contracts/auto-draft/:draftId
contractAutoDrafterRouter.get('/:draftId', (req: Request, res: Response) => {
  try {
    const session = ContractAutoDrafterService.getDraftSession(req.params.draftId);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Contract draft session not found.' });
    }
    res.json({ success: true, session });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/contracts/auto-draft/:draftId/update
contractAutoDrafterRouter.post('/:draftId/update', (req: Request, res: Response) => {
  try {
    const session = ContractAutoDrafterService.updateDraftSession(req.params.draftId, req.body);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Contract draft session not found.' });
    }
    res.json({ success: true, session });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/contracts/auto-draft/live-browser-run (Real County Playwright Browser Agent)
contractAutoDrafterRouter.post('/live-browser-run', async (req: Request, res: Response) => {
  try {
    const { subjectPropertyId, customAddress, purchasePrice, buyerNames, closingAttorney } = req.body;
    const { RealCountyBrowserAgentService } = await import('../services/realCountyBrowserAgentService.js');
    
    const result = await RealCountyBrowserAgentService.executeLiveCountyHarvest({
      subjectPropertyId,
      customAddress,
      purchasePrice,
      buyerNames,
      closingAttorney
    });

    res.json({ success: true, run: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/contracts/auto-draft/live-browser-run/:runId
contractAutoDrafterRouter.get('/live-browser-run/:runId', async (req: Request, res: Response) => {
  try {
    const { RealCountyBrowserAgentService } = await import('../services/realCountyBrowserAgentService.js');
    const run = RealCountyBrowserAgentService.getLiveRun(req.params.runId);
    if (!run) {
      return res.status(404).json({ success: false, error: 'Live browser run not found.' });
    }
    res.json({ success: true, run });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/contracts/auto-draft/generate-pdf
contractAutoDrafterRouter.post('/generate-pdf', async (req: Request, res: Response) => {
  try {
    const { runId } = req.body;
    const { RealCountyBrowserAgentService } = await import('../services/realCountyBrowserAgentService.js');
    const run = RealCountyBrowserAgentService.getLiveRun(runId);
    if (!run) {
      return res.status(404).json({ success: false, error: 'Live browser run not found.' });
    }

    const html = RealCountyBrowserAgentService.generateForm2tHtmlPacket(run);
    res.json({ success: true, htmlPacket: html, filename: `NC_Form_2T_${run.propertyAddress.replace(/\s+/g, '_')}.pdf` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
