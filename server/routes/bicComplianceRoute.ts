/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * BIC Legal Compliance & Trust Account Express Route
 */

import { Router, Request, Response } from 'express';
import { BicComplianceRepository } from '../persistence/bicComplianceRepository.js';

export const bicComplianceRouter = Router();

// GET /api/bic/audit-summary
bicComplianceRouter.get('/audit-summary', (_req: Request, res: Response) => {
  try {
    const summary = BicComplianceRepository.getAuditSummary();
    res.json({ success: true, summary });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/bic/trust-accounts
bicComplianceRouter.get('/trust-accounts', (_req: Request, res: Response) => {
  try {
    const items = BicComplianceRepository.getTrustAccountQueue();
    res.json({ success: true, items, total: items.length });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/bic/disclosures
bicComplianceRouter.get('/disclosures', (_req: Request, res: Response) => {
  try {
    const audits = BicComplianceRepository.getDisclosureAudits();
    res.json({ success: true, audits, total: audits.length });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/bic/ce-roster
bicComplianceRouter.get('/ce-roster', (req: Request, res: Response) => {
  try {
    const warningLevel = req.query.warningLevel as string;
    const roster = BicComplianceRepository.getCeRoster({ warningLevel });
    res.json({ success: true, roster, total: roster.length });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/bic/verify-deposit
bicComplianceRouter.post('/verify-deposit', (req: Request, res: Response) => {
  try {
    const { depositId, verifiedBy } = req.body;
    const updated = BicComplianceRepository.verifyTrustDeposit(depositId, verifiedBy);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Deposit record not found.' });
    }
    res.json({ success: true, deposit: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/bic/send-agent-nudge
bicComplianceRouter.post('/send-agent-nudge', (req: Request, res: Response) => {
  try {
    const { brokerName, propertyAddress, issueType } = req.body;
    const receipt = BicComplianceRepository.dispatchAgentNudge({
      brokerName,
      propertyAddress,
      issueType
    });
    res.json({ success: true, receipt });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
