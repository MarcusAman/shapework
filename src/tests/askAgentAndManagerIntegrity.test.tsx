import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { WorkspaceTaskDrawer } from '../components/marketing/WorkspaceTaskDrawer';
import { AskRequesterQuestionsModal } from '../components/marketing/AskRequesterQuestionsModal';
import {
  resolveCanonicalRecipient,
  isProhibitedEmail,
  isProhibitedPhone,
  isHotlineNumber,
  maskEmail,
  maskPhoneNumber,
  getRequesterActionLabel,
  PROHIBITED_PHONE_NUMBERS,
  PROHIBITED_EMAIL_EXACT
} from '../services/canonicalRecipientService';
import {
  resolveServerCanonicalRecipient,
  isProhibitedPhone as serverIsProhibitedPhone,
  isProhibitedEmail as serverIsProhibitedEmail,
  isHotlineNumber as serverIsHotlineNumber
} from '../../server/services/canonicalRecipientService';
import { resolveCanonicalStaffMember } from '../services/canonicalRoster';

describe('Ask Agent & Reviewing Manager Integrity Suite', () => {

  describe('1. Eradicate Melissa Cooper & Resolve Melissa Gagliardi', () => {
    const baseTask: any = {
      id: 'VA-TEST-01',
      propertyAddress: '100 Matt Way, Wilmington, NC',
      agentName: 'Matt Orr',
      agentPhone: '(910) 612-8283',
      agentEmail: 'matt.orr@nestrealty.com',
      agentRole: 'Broker',
      packageType: 'Luxury Collateral Package',
      priority: 'high',
      status: 'in_production',
      reviewOwnerId: 'dir_melissa_gagliardi_33',
      photos: [],
      listingDetails: {
        price: '$950,000',
        bedsBaths: '4 Beds / 3 Baths',
        sqft: '3,100 SqFt',
        headline: 'Coastal Dream',
        description: 'Wonderful property in Landfall.',
        disclosures: 'Equal Housing Opportunity.'
      },
      requestedAssets: [
        { name: 'Flyer', format: 'PDF', dimensions: '8.5x11', templateId: 'flyer_editorial_letter' }
      ]
    };

    it('resolves reviewOwnerId dir_melissa_gagliardi_33 canonically to Melissa Gagliardi', () => {
      const manager = resolveCanonicalStaffMember('dir_melissa_gagliardi_33', 'ws_wilmington');
      expect(manager).not.toBeNull();
      expect(manager?.name).toBe('Melissa Gagliardi');
      expect(manager?.role).toBe('Marketing Director');
    });

    it('renders Melissa Gagliardi as Reviewing Manager in WorkspaceTaskDrawer', () => {
      const html = renderToStaticMarkup(
        <WorkspaceTaskDrawer
          isOpen={true}
          activeTask={baseTask}
          onClose={() => {}}
          onAskRequester={() => {}}
        />
      );

      expect(html).toContain('Reviewing Manager:');
      expect(html).toContain('Melissa Gagliardi');
      expect(html).not.toContain('Melissa Cooper');
    });

    it('renders "Review manager not assigned" when reviewOwnerId is undefined or empty', () => {
      const unassignedTask = {
        ...baseTask,
        reviewOwnerId: undefined,
        reviewOwnerName: 'Fabricated Manager Name' // should be ignored
      };

      const html = renderToStaticMarkup(
        <WorkspaceTaskDrawer
          isOpen={true}
          activeTask={unassignedTask}
          onClose={() => {}}
          onAskRequester={() => {}}
        />
      );

      expect(html).toContain('Review manager not assigned');
      expect(html).not.toContain('Fabricated Manager Name');
      expect(html).not.toContain('Melissa Cooper');
    });

    it('ignores client-provided reviewOwnerName if reviewOwnerId maps to Melissa Gagliardi', () => {
      const tamperedTask = {
        ...baseTask,
        reviewOwnerId: 'dir_melissa_gagliardi_33',
        reviewOwnerName: 'Some Impostor'
      };

      const html = renderToStaticMarkup(
        <WorkspaceTaskDrawer
          isOpen={true}
          activeTask={tamperedTask}
          onClose={() => {}}
          onAskRequester={() => {}}
        />
      );

      expect(html).toContain('Melissa Gagliardi');
      expect(html).not.toContain('Some Impostor');
    });
  });

  describe('2. Action Button Renaming: Ask Agent vs Ask Requester', () => {
    it('returns "Ask Agent" for Matt Orr (Broker)', () => {
      const label = getRequesterActionLabel({
        agentName: 'Matt Orr',
        agentRole: 'Broker'
      });
      expect(label).toBe('Ask Agent');
    });

    it('returns "Ask Agent" for agents, listing specialists, and realtors', () => {
      expect(getRequesterActionLabel({ agentRole: 'Listing Specialist' })).toBe('Ask Agent');
      expect(getRequesterActionLabel({ agentRole: 'Associate Broker' })).toBe('Ask Agent');
      expect(getRequesterActionLabel({ agentRole: 'Broker-in-Charge' })).toBe('Ask Agent');
    });

    it('returns "Ask Requester" for operations, marketing, and internal staff', () => {
      expect(getRequesterActionLabel({ agentName: 'Ann Gunn', agentRole: 'Operations Lead & ATC' })).toBe('Ask Requester');
      expect(getRequesterActionLabel({ agentName: 'Eduardo Lovo', agentRole: 'Virtual Assistant & Marketing Production' })).toBe('Ask Requester');
      expect(getRequesterActionLabel({ agentName: 'Melissa Gagliardi', agentRole: 'Marketing Director' })).toBe('Ask Requester');
    });

    it('renders "Ask Agent" button in WorkspaceTaskDrawer for Matt Orr task', () => {
      const task: any = {
        id: 'VA-TEST-02',
        propertyAddress: '100 Matt Way, Wilmington, NC',
        agentName: 'Matt Orr',
        agentRole: 'Broker',
        packageType: 'Luxury Flyer',
        priority: 'normal',
        status: 'in_production',
        reviewOwnerId: 'dir_melissa_gagliardi_33',
        photos: [],
        listingDetails: { price: '$800,000', bedsBaths: '3/2', sqft: '2000', headline: 'H', description: 'D', disclosures: 'Disc' },
        requestedAssets: []
      };

      const html = renderToStaticMarkup(
        <WorkspaceTaskDrawer
          isOpen={true}
          activeTask={task}
          onClose={() => {}}
          onAskRequester={() => {}}
        />
      );

      expect(html).toContain('data-testid="ask-agent-btn"');
      expect(html).toContain('Ask Agent');
      expect(html).not.toContain('Ask Broker');
    });
  });

  describe('3. Provider-Neutral Dialog (No Twilio or Resend)', () => {
    const mockCampaign = {
      id: 'camp_matt_orr_100',
      agentName: 'Matt Orr',
      propertyAddress: '100 Matt Way, Wilmington, NC 28403',
      phone: '(910) 612-8283',
      email: 'matt.orr@nestrealty.com',
      agentRole: 'Broker'
    };

    it('renders provider-neutral channel terms (Email, Text message) without vendor mentions', () => {
      const html = renderToStaticMarkup(
        <AskRequesterQuestionsModal
          isOpen={true}
          campaign={mockCampaign}
          onClose={() => {}}
          isOutboundEnabled={false}
        />
      );

      // Must NOT contain third-party vendor infrastructure names
      expect(html).not.toContain('Twilio');
      expect(html).not.toContain('Resend');
      expect(html).not.toContain('live Resend email &amp; Twilio SMS');
      expect(html).not.toContain('live Resend email & Twilio SMS');

      // Must contain neutral customer-facing wording
      expect(html).toContain('Text message');
      expect(html).toContain('Email');
      expect(html).toContain('Email + text');
      expect(html).toContain('Request missing information');
    });
  });

  describe('4. Canonical Sender: Ask NORA <AskNora@NestRealty.com>', () => {
    const mockCampaign = {
      id: 'camp_matt_orr_100',
      agentName: 'Matt Orr',
      propertyAddress: '100 Matt Way, Wilmington, NC 28403',
      phone: '(910) 612-8283',
      email: 'matt.orr@nestrealty.com',
      agentRole: 'Broker'
    };

    it('displays Ask NORA · AskNora@NestRealty.com as the immutable From address', () => {
      const html = renderToStaticMarkup(
        <AskRequesterQuestionsModal
          isOpen={true}
          campaign={mockCampaign}
          onClose={() => {}}
        />
      );

      expect(html).toContain('From Ask NORA · AskNora@NestRealty.com');
      expect(html).toContain('From Identity');
    });
  });

  describe('5. Prohibited Recipient Safeguards & Canonical Lookup', () => {
    it('blocks Retell hotline (910) 507-2047 on client and server', () => {
      expect(isHotlineNumber('(910) 507-2047')).toBe(true);
      expect(isHotlineNumber('9105072047')).toBe(true);
      expect(isHotlineNumber('+19105072047')).toBe(true);
      expect(isProhibitedPhone('(910) 507-2047')).toBe(true);
      expect(serverIsProhibitedPhone('(910) 507-2047')).toBe(true);
      expect(serverIsHotlineNumber('(910) 507-2047')).toBe(true);
    });

    it('blocks placeholder email agent@nestrealty.com on client and server', () => {
      expect(isProhibitedEmail('agent@nestrealty.com')).toBe(true);
      expect(isProhibitedEmail('Agent@NestRealty.com')).toBe(true);
      expect(isProhibitedEmail('test@example.com')).toBe(true);
      expect(serverIsProhibitedEmail('agent@nestrealty.com')).toBe(true);
      expect(serverIsProhibitedEmail('test@example.com')).toBe(true);
    });

    it('resolves Matt Orr to verified canonical phone and email with masking', () => {
      const recipient = resolveCanonicalRecipient({
        agentName: 'Matt Orr'
      });

      expect(recipient.name).toBe('Matt Orr');
      expect(recipient.email).toBe('matt.orr@nestrealty.com');
      expect(recipient.phone).toBe('(910) 612-8283');
      expect(recipient.emailVerified).toBe(true);
      expect(recipient.phoneVerified).toBe(true);
      expect(recipient.maskedEmail).toBe('m•••@nestrealty.com');
      expect(recipient.maskedPhone).toBe('(910) •••-8283');
    });

    it('rejects hotline phone if passed as agent phone and marks phone unverified', () => {
      const recipient = resolveCanonicalRecipient({
        agentName: 'Unknown Agent',
        agentPhone: '(910) 507-2047',
        agentEmail: 'agent@nestrealty.com'
      });

      expect(recipient.phoneVerified).toBe(false);
      expect(recipient.emailVerified).toBe(false);
      expect(recipient.maskedPhone).toBeNull();
      expect(recipient.maskedEmail).toBeNull();
      expect(recipient.phoneExplanation).toContain('No verified mobile number');
      expect(recipient.emailExplanation).toContain('No verified email address');
    });
  });

  describe('6. Channel State & Unverified Channels', () => {
    it('disables channels when verified destination is unavailable and explains why', () => {
      const unverifiedCampaign = {
        id: 'camp_unverified',
        agentName: 'Unverified Requester',
        phone: '(910) 507-2047', // hotline -> prohibited
        email: 'agent@nestrealty.com', // placeholder -> prohibited
        propertyAddress: '123 Unverified St'
      };

      const html = renderToStaticMarkup(
        <AskRequesterQuestionsModal
          isOpen={true}
          campaign={unverifiedCampaign}
          onClose={() => {}}
        />
      );

      expect(html).toContain('No verified email address is available');
      expect(html).toContain('No verified mobile number is available');
    });
  });

  describe('7. Outbound Safety Gate & Draft Mode', () => {
    const mockCampaign = {
      id: 'camp_matt_orr_100',
      agentName: 'Matt Orr',
      propertyAddress: '100 Matt Way, Wilmington, NC 28403',
      phone: '(910) 612-8283',
      email: 'matt.orr@nestrealty.com',
      agentRole: 'Broker'
    };

    it('renders "Save Outreach Draft" button when outbound is disabled', () => {
      const html = renderToStaticMarkup(
        <AskRequesterQuestionsModal
          isOpen={true}
          campaign={mockCampaign}
          onClose={() => {}}
          isOutboundEnabled={false}
        />
      );

      expect(html).toContain('Save Outreach Draft');
      expect(html).toContain('External communication is currently disabled.');
      expect(html).toContain('This outreach will be saved as an internal team draft');
      expect(html).not.toContain('Send Email');
    });
  });

  describe('8. Duplicate Outreach Safeguard Warning Banner', () => {
    const mockCampaign = {
      id: 'camp_matt_orr_100',
      agentName: 'Matt Orr',
      propertyAddress: '100 Matt Way, Wilmington, NC 28403',
      phone: '(910) 612-8283',
      email: 'matt.orr@nestrealty.com',
      agentRole: 'Broker'
    };

    it('renders recent outreach warning banner when outreach occurred recently', () => {
      const html = renderToStaticMarkup(
        <AskRequesterQuestionsModal
          isOpen={true}
          campaign={mockCampaign}
          onClose={() => {}}
          recentOutreach={{
            timestamp: new Date().toISOString(),
            channel: 'email',
            relativeTime: '15 minutes ago'
          }}
        />
      );

      expect(html).toContain('data-testid="recent-contact-warning"');
      expect(html).toContain('15 minutes ago');
      expect(html).toContain('Confirm repeating outreach to Matt Orr');
    });
  });

  describe('9. Server-Side Canonical Recipient Resolution', () => {
    it('resolves Matt Orr against server directory and rejects client overrides', async () => {
      const result = await resolveServerCanonicalRecipient({
        requesterId: 'dir_matt_orr_10',
        requesterName: 'Client Fake Name',
        requesterEmail: 'fake@spoof.com',
        requesterPhone: '(910) 507-2047'
      });

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Matt Orr');
      expect(result?.email).toBe('matt.orr@nestrealty.com');
      expect(result?.phone).toBe('(910) 612-8283');
      expect(result?.emailVerified).toBe(true);
      expect(result?.phoneVerified).toBe(true);
      expect(result?.maskedEmail).toBe('m•••@nestrealty.com');
      expect(result?.maskedPhone).toBe('(910) •••-8283');
    });

    it('blocks prohibited hotline phone on server resolution', async () => {
      const result = await resolveServerCanonicalRecipient({
        requesterName: 'Unknown Caller Without Roster Match',
        requesterPhone: '(910) 507-2047',
        requesterEmail: 'agent@nestrealty.com'
      });

      expect(result).toBeNull();
    });
  });
});
