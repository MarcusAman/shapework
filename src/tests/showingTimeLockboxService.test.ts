import { describe, it, expect } from 'vitest';
import { ShowingTimeLockboxService } from '../../server/services/showingTimeLockboxService';

describe('ShowingTime & Supra Lockbox 2-Way Integration Suite', () => {
  it('1. Retrieves active and completed showing appointments', () => {
    const appts = ShowingTimeLockboxService.getAppointments();
    expect(appts.length).toBeGreaterThanOrEqual(3);

    const mayfaireAppt = appts.find(a => a.propertyAddress.includes('312 Mayfaire Way'));
    expect(mayfaireAppt).toBeDefined();
    expect(mayfaireAppt?.listingAgentEmail).toBe('ryan@nestrealty.com');
    expect(mayfaireAppt?.showingAgentBrokerage).toBeDefined();
  });

  it('2. Retrieves and reconciles Supra eKEY Bluetooth access logs', () => {
    const logs = ShowingTimeLockboxService.getSupraAccessLogs();
    expect(logs.length).toBeGreaterThanOrEqual(3);

    const matched = logs.filter(l => l.isMatchedWithAppointment);
    expect(matched.length).toBeGreaterThanOrEqual(2);

    const vendorLog = logs.find(l => l.securityFlag === 'vendor_service');
    expect(vendorLog).toBeDefined();
    expect(vendorLog?.agentName).toContain('Coastal HVAC');
  });

  it('3. Dispatches automated feedback request to buyer agent', () => {
    const appts = ShowingTimeLockboxService.getAppointments();
    const appt = appts[0];
    const result = ShowingTimeLockboxService.requestShowingFeedback(appt.id);
    expect(result.success).toBe(true);
    expect(result.message).toContain(appt.showingAgentName);
    expect(result.surveyUrl).toContain(appt.id);
  });

  it('4. Ingests buyer agent feedback and updates appointment record', () => {
    const updated = ShowingTimeLockboxService.submitShowingFeedback({
      appointmentId: 'shw_104_landfall_01',
      overallImpression: '5_stars',
      priceOpinion: 'just_right',
      clientInterest: 'writing_offer',
      writtenComments: 'Exceptional estate in Landfall! Submitting full price offer with quick closing.'
    });

    expect(updated.status).toBe('feedback_received');
    expect(updated.feedback).toBeDefined();
    expect(updated.feedback?.overallImpression).toBe('5_stars');
    expect(updated.feedback?.writtenComments).toContain('Exceptional estate');
  });

  it('5. Generates AI executive summary seller showing digest', () => {
    const digest = ShowingTimeLockboxService.generateSellerShowingDigest('312 Mayfaire Way');
    expect(digest).toBeDefined();
    expect(digest.propertyAddress).toContain('312 Mayfaire Way');
    expect(digest.totalShowings).toBeGreaterThanOrEqual(2);
    expect(digest.averageRating).toBeGreaterThanOrEqual(4.0);
    expect(digest.aiExecutiveSummary).toContain('312 Mayfaire Way');
    expect(digest.actionRecommendations.length).toBeGreaterThan(0);
  });
});
