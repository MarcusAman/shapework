/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { getOperatingRecordRepositories } from './operatingRecordRepository';
import { 
  OperatingRecord, 
  BrokerageResponsibilityDetail, 
  OperatingOpportunity, 
  QuickWin, 
  BuildSprint 
} from '../../src/types/operatingRecord';

export function getOperatingRecordRouter(dbState: any) {
  const router = express.Router();
  const repos = getOperatingRecordRepositories(dbState);

  // GET /api/operating-record - get active operating record for the workspace
  router.get('/', async (req: any, res) => {
    try {
      const workspaceId = req.workspaceId || 'nest-realty-demo';
      
      let record = (await repos.operatingRecords.list((r) => r.workspaceId === workspaceId))[0];
      if (!record) {
        // Create an empty default record if none exists
        record = await repos.operatingRecords.create({
          id: `rec_${Date.now()}`,
          workspaceId,
          businessName: 'Unassigned Brokerage',
          vertical: 'real_estate_brokerage',
          status: 'discovery',
          workflowMapIds: [],
          systemMapIds: [],
          quickWinIds: [],
          buildSprintIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      const responsibilities = await repos.responsibilities.list();
      const opportunities = await repos.opportunities.list((o) => o.workspaceId === workspaceId);
      const quickWins = await repos.quickWins.list((q) => q.workspaceId === workspaceId);
      const buildSprints = await repos.buildSprints.list((b) => b.workspaceId === workspaceId);

      res.json({
        record,
        responsibilities,
        opportunities,
        quickWins,
        buildSprints
      });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: 'Failed to fetch operating record.' });
    }
  });

  // POST /api/operating-record/update - update snapshot details
  router.post('/update', async (req: any, res) => {
    try {
      const workspaceId = req.workspaceId || 'nest-realty-demo';
      const record = (await repos.operatingRecords.list((r) => r.workspaceId === workspaceId))[0];
      if (!record) {
        return res.status(404).json({ error: 'Operating record not found.' });
      }

      const updated = await repos.operatingRecords.update(record.id, {
        ...req.body,
        updatedAt: new Date().toISOString()
      });

      res.json(updated);
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: 'Failed to update operating record.' });
    }
  });

  // POST /api/operating-record/responsibility/update - update role assignment
  router.post('/responsibility/update', async (req: any, res) => {
    try {
      const { id, primaryOwnerRole, backupOwnerRole, sla, escalationRule, currentPainLevel, notes, ownershipStatus } = req.body;
      if (!id) {
        return res.status(400).json({ error: 'Missing responsibility ID.' });
      }

      const updated = await repos.responsibilities.update(id, {
        primaryOwnerRole,
        backupOwnerRole,
        sla,
        escalationRule,
        currentPainLevel,
        notes,
        ownershipStatus
      });

      // Register audit event
      if (dbState.auditEvents) {
        dbState.auditEvents.unshift({
          id: `audit_${Date.now()}`,
          workspaceId: req.workspaceId || 'nest-realty-demo',
          timestamp: new Date().toISOString(),
          actor: req.user?.email || 'System Admin',
          action: `Role Map Updated: Responsibility ${id} reassigned to ${primaryOwnerRole}.`,
          severity: 'info',
          redacted: false
        });
      }

      res.json(updated);
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: 'Failed to update responsibility details.' });
    }
  });

  // POST /api/operating-record/opportunity/update - update opportunity
  router.post('/opportunity/update', async (req: any, res) => {
    try {
      const { id, title, category, severity, frictionScore, dependencyScore, wasteScore, visibilityScore, readinessScore, impactScore, confidence, whatIsHappening, hiddenCost, recommendedFix, quickWinCandidate, buildSprintCandidate, status } = req.body;
      const workspaceId = req.workspaceId || 'nest-realty-demo';

      if (id) {
        const existing = await repos.opportunities.get(id);
        if (!existing) {
          return res.status(404).json({ error: 'Opportunity not found.' });
        }

        const totalScore = Math.round(
          ((frictionScore + dependencyScore + wasteScore + visibilityScore + readinessScore + impactScore) / 60) * 100
        );

        const updated = await repos.opportunities.update(id, {
          title,
          category,
          severity,
          frictionScore,
          dependencyScore,
          wasteScore,
          visibilityScore,
          readinessScore,
          impactScore,
          totalScore,
          confidence,
          whatIsHappening,
          hiddenCost,
          recommendedFix,
          quickWinCandidate,
          buildSprintCandidate,
          status
        });

        res.json(updated);
      } else {
        // Create new opportunity
        const friction = frictionScore || 5;
        const dependency = dependencyScore || 5;
        const waste = wasteScore || 5;
        const visibility = visibilityScore || 5;
        const readiness = readinessScore || 5;
        const impact = impactScore || 5;
        const totalScore = Math.round(((friction + dependency + waste + visibility + readiness + impact) / 60) * 100);

        const created = await repos.opportunities.create({
          id: `opp_${Date.now()}`,
          workspaceId,
          title: title || 'New Opportunity',
          category: category || 'ownership',
          severity: severity || 'medium',
          frictionScore: friction,
          dependencyScore: dependency,
          wasteScore: waste,
          visibilityScore: visibility,
          readinessScore: readiness,
          impactScore: impact,
          totalScore,
          confidence: confidence || 'medium',
          whatIsHappening: whatIsHappening || '',
          hiddenCost: hiddenCost || '',
          recommendedFix: recommendedFix || '',
          quickWinCandidate: !!quickWinCandidate,
          buildSprintCandidate: !!buildSprintCandidate,
          status: status || 'identified'
        });

        res.json(created);
      }
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: 'Failed to save opportunity.' });
    }
  });

  // POST /api/operating-record/quick-win/update - update quick win status
  router.post('/quick-win/update', async (req: any, res) => {
    try {
      const { id, opportunityId, title, description, ownerRole, estimatedTimeToImplementHours, expectedImpact, status, reusableTemplateCreated } = req.body;
      const workspaceId = req.workspaceId || 'nest-realty-demo';

      if (id) {
        const updated = await repos.quickWins.update(id, {
          status,
          reusableTemplateCreated
        });

        if (dbState.auditEvents) {
          dbState.auditEvents.unshift({
            id: `audit_${Date.now()}`,
            workspaceId,
            timestamp: new Date().toISOString(),
            actor: req.user?.email || 'System Admin',
            action: `Quick Win Status Changed: ${title} transitioned to ${status}.`,
            severity: 'info',
            redacted: false
          });
        }

        res.json(updated);
      } else {
        const created = await repos.quickWins.create({
          id: `qw_${Date.now()}`,
          workspaceId,
          opportunityId: opportunityId || '',
          title: title || 'New Quick Win',
          description: description || '',
          ownerRole: ownerRole || 'operations_lead',
          estimatedTimeToImplementHours: estimatedTimeToImplementHours || 2,
          expectedImpact: expectedImpact || '',
          implementationSteps: req.body.implementationSteps || [],
          requiredTools: req.body.requiredTools || [],
          status: status || 'proposed',
          reusableTemplateCreated: !!reusableTemplateCreated
        });

        res.json(created);
      }
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: 'Failed to update quick win.' });
    }
  });

  // POST /api/operating-record/build-sprint/create - create a build sprint
  router.post('/build-sprint/create', async (req: any, res) => {
    try {
      const workspaceId = req.workspaceId || 'nest-realty-demo';
      const { name, opportunityIds, workflowTemplateIds, scopeSummary, outOfScope, thirdPartyTools, shapeworkComponents, deliverables, assumptions, supportTerms, estimatedFeeRange } = req.body;

      const created = await repos.buildSprints.create({
        id: `bs_${Date.now()}`,
        workspaceId,
        name: name || 'New Build Sprint',
        status: 'draft',
        opportunityIds: opportunityIds || [],
        workflowTemplateIds: workflowTemplateIds || [],
        scopeSummary: scopeSummary || '',
        outOfScope: outOfScope || [],
        thirdPartyTools: thirdPartyTools || [],
        shapeworkComponents: shapeworkComponents || [],
        deliverables: deliverables || [],
        assumptions: assumptions || [],
        supportTerms: supportTerms || [],
        estimatedFeeRange: estimatedFeeRange || '',
        startDate: new Date().toISOString(),
        targetShipDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      });

      // Register audit event
      if (dbState.auditEvents) {
        dbState.auditEvents.unshift({
          id: `audit_${Date.now()}`,
          workspaceId,
          timestamp: new Date().toISOString(),
          actor: req.user?.email || 'System Admin',
          action: `Build Sprint Scoped: Created draft build plan "${name}".`,
          severity: 'info',
          redacted: false
        });
      }

      res.json(created);
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: 'Failed to create build sprint plan.' });
    }
  });

  return router;
}
