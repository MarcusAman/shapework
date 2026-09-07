export interface ShowingAppointment {
  id: string;
  propertyAddress: string;
  listingAgentEmail: string;
  showingAgentName: string;
  showingAgentEmail: string;
  showingAgentPhone: string;
  showingAgentBrokerage: string;
  appointmentTime: string;
  durationMinutes: number;
  status: 'confirmed' | 'completed' | 'cancelled' | 'feedback_received';
  lockboxSerial: string;
  supraAccessVerified: boolean;
  feedback?: {
    overallImpression: '5_stars' | '4_stars' | '3_stars' | '2_stars' | '1_star';
    priceOpinion: 'just_right' | 'too_high' | 'too_low';
    clientInterest: 'writing_offer' | 'second_showing' | 'neutral' | 'not_interested';
    writtenComments: string;
    submittedAt: string;
  };
}

export interface SupraLockboxAccessEvent {
  id: string;
  lockboxSerial: string;
  propertyAddress: string;
  accessTime: string;
  agentName: string;
  agentEmail: string;
  keySerial: string;
  isMatchedWithAppointment: boolean;
  securityFlag: 'normal' | 'unauthorized_entry' | 'vendor_service';
}

export interface SellerShowingDigest {
  propertyAddress: string;
  generatedAt: string;
  totalShowings: number;
  averageRating: number;
  priceOpinionBreakdown: { justRight: number; tooHigh: number; tooLow: number };
  clientInterestBreakdown: { writingOffer: number; secondShowing: number; notInterested: number };
  aiExecutiveSummary: string;
  recentComments: { agent: string; brokerage: string; comment: string; date: string }[];
  actionRecommendations: string[];
}

class ShowingTimeLockboxEngine {
  private appointments: Map<string, ShowingAppointment> = new Map();
  private lockboxEvents: SupraLockboxAccessEvent[] = [];

  constructor() {
    this.seedDefaultShowingsAndAccessLogs();
  }

  private seedDefaultShowingsAndAccessLogs() {
    const appt1: ShowingAppointment = {
      id: 'shw_312_mayfaire_01',
      propertyAddress: '312 Mayfaire Way, Wilmington, NC 28405',
      listingAgentEmail: 'ryan@nestrealty.com',
      showingAgentName: 'Sarah Jenkins',
      showingAgentEmail: 's.jenkins@intracoastalrealty.com',
      showingAgentPhone: '(910) 443-8891',
      showingAgentBrokerage: 'Intracoastal Realty',
      appointmentTime: new Date(Date.now() - 86400000).toISOString(),
      durationMinutes: 45,
      status: 'feedback_received',
      lockboxSerial: 'SUPRA-NC-99412',
      supraAccessVerified: true,
      feedback: {
        overallImpression: '5_stars',
        priceOpinion: 'just_right',
        clientInterest: 'writing_offer',
        writtenComments: 'Buyers loved the open quartz kitchen and private screened porch. We are preparing a Form 2-T offer with a $15,000 due diligence fee.',
        submittedAt: new Date(Date.now() - 72000000).toISOString()
      }
    };

    const appt2: ShowingAppointment = {
      id: 'shw_312_mayfaire_02',
      propertyAddress: '312 Mayfaire Way, Wilmington, NC 28405',
      listingAgentEmail: 'ryan@nestrealty.com',
      showingAgentName: 'David Vance',
      showingAgentEmail: 'david.vance@cbsea.com',
      showingAgentPhone: '(910) 332-9012',
      showingAgentBrokerage: 'Coldwell Banker Sea Coast Advantage',
      appointmentTime: new Date(Date.now() - 43200000).toISOString(),
      durationMinutes: 30,
      status: 'feedback_received',
      lockboxSerial: 'SUPRA-NC-99412',
      supraAccessVerified: true,
      feedback: {
        overallImpression: '4_stars',
        priceOpinion: 'too_high',
        clientInterest: 'second_showing',
        writtenComments: 'Home shows beautifully. Buyers felt the primary closet was slightly tight for the price point, but might return for an evening showing.',
        submittedAt: new Date(Date.now() - 28800000).toISOString()
      }
    };

    const appt3: ShowingAppointment = {
      id: 'shw_104_landfall_01',
      propertyAddress: '104 Landfall Dr, Wilmington, NC 28405',
      listingAgentEmail: 'ann.gunn@nestrealty.com',
      showingAgentName: 'Tyler Ward',
      showingAgentEmail: 't.ward@landmarkrealty.com',
      showingAgentPhone: '(910) 612-4411',
      showingAgentBrokerage: 'Landmark Sotheby\'s',
      appointmentTime: new Date(Date.now() + 7200000).toISOString(),
      durationMinutes: 60,
      status: 'confirmed',
      lockboxSerial: 'SUPRA-NC-88124',
      supraAccessVerified: false
    };

    this.appointments.set(appt1.id, appt1);
    this.appointments.set(appt2.id, appt2);
    this.appointments.set(appt3.id, appt3);

    // Supra Lockbox Bluetooth Access Logs
    this.lockboxEvents = [
      {
        id: 'supra_evt_01',
        lockboxSerial: 'SUPRA-NC-99412',
        propertyAddress: '312 Mayfaire Way, Wilmington, NC 28405',
        accessTime: new Date(Date.now() - 86350000).toISOString(),
        agentName: 'Sarah Jenkins',
        agentEmail: 's.jenkins@intracoastalrealty.com',
        keySerial: 'eKEY-77821',
        isMatchedWithAppointment: true,
        securityFlag: 'normal'
      },
      {
        id: 'supra_evt_02',
        lockboxSerial: 'SUPRA-NC-99412',
        propertyAddress: '312 Mayfaire Way, Wilmington, NC 28405',
        accessTime: new Date(Date.now() - 43150000).toISOString(),
        agentName: 'David Vance',
        agentEmail: 'david.vance@cbsea.com',
        keySerial: 'eKEY-55912',
        isMatchedWithAppointment: true,
        securityFlag: 'normal'
      },
      {
        id: 'supra_evt_03',
        lockboxSerial: 'SUPRA-NC-99412',
        propertyAddress: '312 Mayfaire Way, Wilmington, NC 28405',
        accessTime: new Date(Date.now() - 14400000).toISOString(),
        agentName: 'Coastal HVAC Service',
        agentEmail: 'service@coastalhvacnc.com',
        keySerial: 'CALLAWAY-CB-90',
        isMatchedWithAppointment: false,
        securityFlag: 'vendor_service'
      }
    ];
  }

  public getAppointments(): ShowingAppointment[] {
    return Array.from(this.appointments.values()).sort(
      (a, b) => new Date(b.appointmentTime).getTime() - new Date(a.appointmentTime).getTime()
    );
  }

  public getSupraAccessLogs(): SupraLockboxAccessEvent[] {
    return this.lockboxEvents;
  }

  public requestShowingFeedback(appointmentId: string): { success: boolean; message: string; surveyUrl: string } {
    const appt = this.appointments.get(appointmentId);
    if (!appt) {
      throw new Error(`Appointment ${appointmentId} not found`);
    }

    const surveyUrl = `https://nora.nestrealty.com/feedback/${appointmentId}`;
    return {
      success: true,
      message: `Automated ShowingTime feedback request SMS & Email dispatched to ${appt.showingAgentName} (${appt.showingAgentEmail}).`,
      surveyUrl
    };
  }

  public submitShowingFeedback(params: {
    appointmentId: string;
    overallImpression: '5_stars' | '4_stars' | '3_stars' | '2_stars' | '1_star';
    priceOpinion: 'just_right' | 'too_high' | 'too_low';
    clientInterest: 'writing_offer' | 'second_showing' | 'neutral' | 'not_interested';
    writtenComments: string;
  }): ShowingAppointment {
    const appt = this.appointments.get(params.appointmentId);
    if (!appt) {
      throw new Error(`Appointment ${params.appointmentId} not found`);
    }

    appt.status = 'feedback_received';
    appt.feedback = {
      overallImpression: params.overallImpression,
      priceOpinion: params.priceOpinion,
      clientInterest: params.clientInterest,
      writtenComments: params.writtenComments,
      submittedAt: new Date().toISOString()
    };

    this.appointments.set(appt.id, appt);
    return appt;
  }

  public generateSellerShowingDigest(propertyAddress: string): SellerShowingDigest {
    const all = Array.from(this.appointments.values()).filter(
      a => a.propertyAddress.toLowerCase().includes(propertyAddress.toLowerCase()) || propertyAddress.toLowerCase().includes(a.propertyAddress.toLowerCase())
    );

    const feedbackAppts = all.filter(a => a.feedback !== undefined);
    const totalShowings = all.length;

    let justRight = 0, tooHigh = 0, tooLow = 0;
    let writingOffer = 0, secondShowing = 0, notInterested = 0;
    let totalScore = 0;

    feedbackAppts.forEach(a => {
      const fb = a.feedback!;
      if (fb.priceOpinion === 'just_right') justRight++;
      else if (fb.priceOpinion === 'too_high') tooHigh++;
      else if (fb.priceOpinion === 'too_low') tooLow++;

      if (fb.clientInterest === 'writing_offer') writingOffer++;
      else if (fb.clientInterest === 'second_showing') secondShowing++;
      else if (fb.clientInterest === 'not_interested') notInterested++;

      const stars = parseInt(fb.overallImpression[0]) || 4;
      totalScore += stars;
    });

    const averageRating = feedbackAppts.length > 0 ? Number((totalScore / feedbackAppts.length).toFixed(1)) : 4.5;

    const recentComments = feedbackAppts.map(a => ({
      agent: a.showingAgentName,
      brokerage: a.showingAgentBrokerage,
      comment: a.feedback!.writtenComments,
      date: new Date(a.feedback!.submittedAt).toLocaleDateString()
    }));

    const aiExecutiveSummary = `Over the last 7 days, ${propertyAddress} received ${totalShowings} private agent showings with an outstanding ${averageRating} / 5.0 satisfaction score. ${writingOffer} buyer group is actively preparing a purchase offer, while ${justRight} out of ${feedbackAppts.length} showing agents confirmed the listing price is aligned with market comps.`;

    const actionRecommendations = [
      'Encourage showing agent Sarah Jenkins (Intracoastal Realty) to submit the Form 2-T offer with competitive Due Diligence before the weekend.',
      'Follow up with David Vance (Coldwell Banker) regarding the second evening walkthrough.'
    ];

    return {
      propertyAddress,
      generatedAt: new Date().toISOString(),
      totalShowings,
      averageRating,
      priceOpinionBreakdown: { justRight, tooHigh, tooLow },
      clientInterestBreakdown: { writingOffer, secondShowing, notInterested },
      aiExecutiveSummary,
      recentComments,
      actionRecommendations
    };
  }
}

export const ShowingTimeLockboxService = new ShowingTimeLockboxEngine();
