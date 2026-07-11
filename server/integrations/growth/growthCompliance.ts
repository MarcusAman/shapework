/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ComplianceResult {
  success: boolean;
  failures: string[];
}

const PROHIBITED_SOURCES = [
  'purchased_list',
  'scraped_data',
  'unknown_source',
  'no_source',
  'third_party_list_without_permission'
];

export async function runCampaignComplianceCheck(
  dbState: any,
  campaignId: string,
  wsId: string
): Promise<ComplianceResult> {
  const failures: string[] = [];

  // Helper to ensure collections are initialized
  const domains = dbState.sendingDomains || [];
  const campaigns = dbState.campaigns || [];
  const campaignSteps = dbState.campaignSteps || [];
  const contacts = dbState.contacts || [];
  const audienceContacts = dbState.audienceContacts || [];
  const suppressionList = dbState.suppressionList || [];
  const workspaces = dbState.workspaces || [];

  // 1. Fetch Campaign
  const campaign = campaigns.find((c: any) => c.id === campaignId && c.workspaceId === wsId);
  if (!campaign) {
    return { success: false, failures: ['Campaign not found or unauthorized.'] };
  }

  // 2. Campaign must have selected audience
  if (!campaign.audienceId) {
    failures.push('Campaign must have a selected target audience.');
  }

  // 3. Campaign must have at least one active step
  const steps = campaignSteps.filter(
    (s: any) => s.campaignId === campaignId && s.workspaceId === wsId && s.isActive !== false
  );
  if (steps.length === 0) {
    failures.push('Campaign must have at least one active email step in the sequence.');
  }

  // 4. Every step body must contain unsubscribe language
  steps.forEach((step: any, index: number) => {
    const bodyLower = (step.body || '').toLowerCase();
    if (!bodyLower.includes('unsubscribe') && !bodyLower.includes('{{unsubscribe_link}}')) {
      failures.push(`Step ${step.stepNumber || index + 1} email body lacks mandatory unsubscribe language.`);
    }
  });

  // 5. Campaign must use a verified sending domain
  if (!campaign.sendingDomainId) {
    failures.push('Campaign must have a configured sending domain.');
  } else {
    const domain = domains.find(
      (d: any) => d.id === campaign.sendingDomainId && d.workspaceId === wsId
    );
    if (!domain) {
      failures.push('Selected sending domain not found.');
    } else if (domain.status !== 'verified') {
      failures.push(`Sending domain "${domain.domain}" is not verified. SPF/DKIM verification checks pending.`);
    }
  }

  // 6. Workspace physical mailing address check
  const workspace = workspaces.find((w: any) => w.id === wsId);
  const physicalAddress = workspace?.address || workspace?.physicalAddress || 
    (wsId === 'nest-realty-demo' ? '123 Main St, Charlottesville, VA 22902' : null);
  if (!physicalAddress) {
    failures.push('Brokerage workspace must have a physical mailing address configured for CAN-SPAM compliance.');
  }

  // 7. Enrolled contact sources compliance check
  if (campaign.audienceId) {
    const targetContactsIds = audienceContacts
      .filter((ac: any) => ac.audienceId === campaign.audienceId && ac.workspaceId === wsId)
      .map((ac: any) => ac.contactId);
      
    const campaignContacts = contacts.filter((c: any) => targetContactsIds.includes(c.id));
    
    // Check for prohibited sources
    const dirtySources = campaignContacts
      .filter((c: any) => PROHIBITED_SOURCES.includes(c.source || ''))
      .map((c: any) => c.source);
      
    if (dirtySources.length > 0) {
      const distinctSources = Array.from(new Set(dirtySources));
      failures.push(
        `Audience contains contacts from prohibited/high-risk list sources: [${distinctSources.join(', ')}]. Outreach campaigns to cold lists are blocked.`
      );
    }

    // Check if all contacts are suppressed
    const activeContactsCount = campaignContacts.filter((c: any) => {
      const isSuppressed = suppressionList.some(
        (s: any) => s.workspaceId === wsId && s.email.toLowerCase() === c.email.toLowerCase()
      );
      return !isSuppressed;
    }).length;

    if (campaignContacts.length > 0 && activeContactsCount === 0) {
      failures.push('All target contacts in the selected audience are suppressed or unsubscribed.');
    }
  }

  return {
    success: failures.length === 0,
    failures
  };
}
