export type OutboundEmailOutcome = 'sent' | 'held' | 'suppressed' | 'failed';

export type ClassifiedOutboundEmail = {
  outcome: OutboundEmailOutcome;
  success: boolean;
  reason?: string;
  activityEvent: 'outreach.sent' | 'outreach.held' | 'outreach.blocked';
  communicationStatus: 'sent' | 'queued' | 'blocked';
};

type SendResult = {
  success?: boolean;
  held?: boolean;
  suppressed?: boolean;
  error?: string;
  reason?: string;
  messageId?: string;
} | null | undefined;

/**
 * Gate holds and suppressions report success:true from the transport.
 * Only a real send is outcome "sent".
 */
export function classifyOutboundEmailResult(result: SendResult): ClassifiedOutboundEmail {
  if (!result) {
    return {
      outcome: 'failed',
      success: false,
      reason: 'No send result.',
      activityEvent: 'outreach.blocked',
      communicationStatus: 'blocked',
    };
  }
  if (result.held) {
    return {
      outcome: 'held',
      success: false,
      reason: result.reason || 'held',
      activityEvent: 'outreach.held',
      communicationStatus: 'queued',
    };
  }
  if (result.suppressed) {
    return {
      outcome: 'suppressed',
      success: false,
      reason: result.reason || 'suppressed',
      activityEvent: 'outreach.blocked',
      communicationStatus: 'blocked',
    };
  }
  if (result.success === false || result.error) {
    return {
      outcome: 'failed',
      success: false,
      reason: result.error || result.reason || 'Send failed.',
      activityEvent: 'outreach.blocked',
      communicationStatus: 'blocked',
    };
  }
  if (result.success) {
    return {
      outcome: 'sent',
      success: true,
      activityEvent: 'outreach.sent',
      communicationStatus: 'sent',
    };
  }
  return {
    outcome: 'failed',
    success: false,
    reason: result.reason || 'Send failed.',
    activityEvent: 'outreach.blocked',
    communicationStatus: 'blocked',
  };
}
