import { describe, it, expect } from 'vitest';
import { opportunityRegisterRepository } from '../../server/persistence/opportunityRegisterRepository';

describe('Nest Realty Opportunity Register — Complete Tier 2 & Tier 3 Features Suite', () => {

  describe('1. [25] Agent Happiness Monitor & Distress Radar', () => {
    it('should list agent happiness signals with multi-factor distress scores', async () => {
      const signals = await opportunityRegisterRepository.listHappinessSignals();
      expect(signals.length).toBeGreaterThanOrEqual(3);

      const highDistress = signals.find(s => s.riskTier === 'high_distress');
      expect(highDistress).toBeDefined();
      expect(highDistress?.agentName).toBe('Sarah Jenkins');
      expect(highDistress?.distressScore).toBeGreaterThanOrEqual(80);
      expect(highDistress?.stalledDealsCount).toBe(3);
      expect(highDistress?.recommendedAction).toContain('Jessica Keenan');
    });

    it('should record proactive leadership outreach and reduce agent distress score', async () => {
      const updated = await opportunityRegisterRepository.recordLeadershipOutreach(
        'usr_sarah',
        'Jessica Keenan (BIC — Mayfaire)',
        'Scheduled 1-on-1 coffee on Thursday morning to review Landfall offer terms.'
      );

      expect(updated).toBeDefined();
      expect(updated?.lastLeadershipOutreachAt).toBeDefined();
      expect(updated?.riskTier).toBe('moderate_friction');
      expect(updated?.distressScore).toBeLessThan(80);
      expect(updated?.outreachNotes?.some(n => n.includes('Jessica Keenan'))).toBe(true);
    });
  });

  describe('2. [22] Agent Birthday & Life Event CRM', () => {
    it('should list upcoming agent birthdays, work anniversaries, and volume milestones', async () => {
      const events = await opportunityRegisterRepository.listLifeEvents();
      expect(events.length).toBeGreaterThanOrEqual(3);

      const workAnniv = events.find(e => e.eventType === 'work_anniversary');
      expect(workAnniv).toBeDefined();
      expect(workAnniv?.giftCardType).toBeDefined();
      expect(workAnniv?.personalizedMessage).toBeDefined();
    });

    it('should dispatch gift card and mark celebration touch as sent', async () => {
      const sent = await opportunityRegisterRepository.sendLifeEventTouch('evt_sarah_anniv', 'Ryan Crecelius (Owner)');
      expect(sent).toBeDefined();
      expect(sent?.status).toBe('sent');
      expect(sent?.sentAt).toBeDefined();
    });
  });

  describe('3. [7] Agent Help Video Library', () => {
    it('should provide curated walkthrough videos with BIC instructors', async () => {
      const videos = await opportunityRegisterRepository.listHelpVideos();
      expect(videos.length).toBeGreaterThanOrEqual(3);

      const dotloopVid = videos.find(v => v.category === 'dotloop_compliance');
      expect(dotloopVid).toBeDefined();
      expect(dotloopVid?.instructorName).toBe('Jessica Keenan (BIC)');

      const supraVid = videos.find(v => v.category === 'supra_lockbox');
      expect(supraVid).toBeDefined();
      expect(supraVid?.instructorName).toBe('Eric Knight (BIC)');
    });
  });

  describe('4. [18] Friends of Nest VIP Relationship Engine', () => {
    it('should track top past client advocates with local partner gifts', async () => {
      const vips = await opportunityRegisterRepository.listVips();
      expect(vips.length).toBeGreaterThanOrEqual(2);

      const platinum = vips.find(v => v.advocateTier === 'platinum_referral');
      expect(platinum).toBeDefined();
      expect(platinum?.totalReferralsProvided).toBeGreaterThanOrEqual(4);
      expect(platinum?.localPartnerGift).toContain('PinPoint');
    });

    it('should schedule custom VIP touches and advance touch schedules', async () => {
      const updatedVip = await opportunityRegisterRepository.scheduleVipTouch(
        'vip_miller',
        'quarterly_local_touch',
        "Boombalatti's Artisan Ice Cream $25"
      );

      expect(updatedVip).toBeDefined();
      expect(updatedVip?.nextTouchType).toBe('quarterly_local_touch');
      expect(updatedVip?.localPartnerGift).toContain("Boombalatti's");
    });
  });

  describe('5. [21] Event Planning Playbook & [14] Follow-Up Engine', () => {
    it('should track multi-stage event budgets, RSVPs, and vendor checklists', async () => {
      const playbooks = await opportunityRegisterRepository.listEventPlaybooks();
      expect(playbooks.length).toBeGreaterThanOrEqual(2);

      const cruise = playbooks.find(p => p.eventType === 'client_appreciation');
      expect(cruise).toBeDefined();
      expect(cruise?.targetBudget).toBe(4500);
      expect(cruise?.rsvpCount).toBe(84);
      expect(cruise?.vendorChecklist.length).toBeGreaterThanOrEqual(2);
    });

    it('should trigger 24h post-event follow-up blitz and collect reviews', async () => {
      const blitz = await opportunityRegisterRepository.triggerEventFollowUpBlitz('evt_playbook_gala2026');
      expect(blitz).toBeDefined();
      expect(blitz?.status).toBe('completed');
      expect(blitz?.postEventFollowUp.blitzDispatched).toBe(true);
      expect(blitz?.postEventFollowUp.smsSentCount).toBe(84);
      expect(blitz?.postEventFollowUp.testimonialsCollectedCount).toBeGreaterThan(0);
      expect(blitz?.postEventFollowUp.googleReviewsGeneratedCount).toBeGreaterThan(0);
    });
  });

  describe('6. [15] Cost Leakage Alerts Auditor', () => {
    it('should detect vendor invoice anomalies and calculate leakage amount', async () => {
      const leakages = await opportunityRegisterRepository.listCostLeakages();
      expect(leakages.length).toBeGreaterThanOrEqual(3);

      const activeLeaks = leakages.filter(l => l.status === 'active_leakage');
      expect(activeLeaks.length).toBeGreaterThan(0);

      const dupInvoice = leakages.find(l => l.category === 'vendor_order');
      expect(dupInvoice).toBeDefined();
      expect(dupInvoice?.amount).toBe(75.00);
    });

    it('should resolve and settle cost leakage anomalies with audit note', async () => {
      const resolved = await opportunityRegisterRepository.resolveCostLeakage(
        'leak_002',
        'Photographer Cape Fear Media refunded $75 duplicate floor plan invoice.'
      );

      expect(resolved).toBeDefined();
      expect(resolved?.status).toBe('resolved_refunded');
      expect(resolved?.resolutionNote).toContain('refunded $75');
    });
  });

  describe('7. [13] Geographic Lead Routing Dispatch Matrix', () => {
    it('should provide submarket territories with on-duty agent lists', async () => {
      const territories = await opportunityRegisterRepository.listTerritories();
      expect(territories.length).toBeGreaterThanOrEqual(3);

      const mayfaire = territories.find(t => t.submarketId === 'terr_mayfaire');
      expect(mayfaire).toBeDefined();
      expect(mayfaire?.activeAgentsOnDuty.some(a => a.agentName === 'Sarah Jenkins')).toBe(true);

      const beach = territories.find(t => t.submarketId === 'terr_pleasure_island');
      expect(beach).toBeDefined();
      expect(beach?.activeAgentsOnDuty.some(a => a.agentName.includes('Eric Knight'))).toBe(true);
    });

    it('should allow toggling on-duty agent availability status', async () => {
      const updatedTerr = await opportunityRegisterRepository.updateAgentDuty('terr_mayfaire', 'usr_sarah', false);
      expect(updatedTerr).toBeDefined();
      const agent = updatedTerr?.activeAgentsOnDuty.find(a => a.agentId === 'usr_sarah');
      expect(agent?.isAvailable).toBe(false);
    });
  });

});
