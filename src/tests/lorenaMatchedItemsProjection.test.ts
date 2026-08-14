import { describe, it, expect } from 'vitest';
import { queryUnifiedContext } from '../../server/knowledge/unifiedContextRetriever';

describe('Lorena Conversational Transcript & Synchronized Matched Items Projection', () => {
  describe('1. SOP Document Knowledge Search Item Projection', () => {
    it('returns matchedItems containing 2 SOP items for listing launch inquiry', () => {
      const result = queryUnifiedContext('What is the listing launch protocol?');
      expect(result.matchedDomain).toBe('sops');
      expect(result.matchedItems).toBeDefined();
      expect(Array.isArray(result.matchedItems)).toBe(true);
      expect(result.matchedItems!.length).toBeGreaterThanOrEqual(2);

      const item1 = result.matchedItems![0];
      expect(item1.type).toBe('sop');
      expect(item1.title).toContain('Listing Launch Protocol');
      expect(item1.actionType).toBe('open_sop');
      expect(item1.actionPayload).toBeDefined();
      expect(item1.actionPayload.sopId).toBeDefined();

      const item2 = result.matchedItems![1];
      expect(item2.type).toBe('sop');
      expect(item2.actionType).toBe('open_sop');
    });

    it('returns 2 general SOP items when asking for all standard operating procedures', () => {
      const result = queryUnifiedContext('Show me all active standard operating procedures');
      expect(result.matchedDomain).toBe('sops');
      expect(result.spokenAnswer).toContain('approved operational procedures in the repository');
      expect(result.matchedItems).toBeDefined();
      expect(result.matchedItems!.length).toBe(2);
      expect(result.matchedItems![0].actionText).toBe('Open SOP Studio');
    });
  });

  describe('2. Team Directory Contact Item Projection', () => {
    it('returns matched contact and managing broker items when asking for an agent', () => {
      const result = queryUnifiedContext('What is Matt Orr phone number and email?');
      expect(result.matchedDomain).toBe('roster');
      expect(result.matchedItems).toBeDefined();
      expect(result.matchedItems!.length).toBe(2);

      const contactItem = result.matchedItems![0];
      expect(contactItem.type).toBe('directory');
      expect(contactItem.title).toContain('Matt Orr');
      expect(contactItem.actionType).toBe('contact_person');
      expect(contactItem.actionPayload.phone).toBeDefined();

      const principalItem = result.matchedItems![1];
      expect(principalItem.type).toBe('directory');
      expect(principalItem.title).toContain('Ryan Crecelius');
    });
  });

  describe('3. Attention Items & SLA Breach Projection', () => {
    it('returns 2 actionable attention items when asking what needs attention today', () => {
      const result = queryUnifiedContext('What items are overdue or need attention today?');
      expect(result.matchedDomain).toBe('pipeline');
      expect(result.spokenAnswer).toContain('Found two items needing attention');
      expect(result.matchedItems).toBeDefined();
      expect(result.matchedItems!.length).toBe(2);

      const signItem = result.matchedItems![0];
      expect(signItem.title).toContain('105 Forest Hills Dr');
      expect(signItem.actionType).toBe('resolve_issue');
      expect(signItem.badge).toContain('SLA Breach');

      const reviewItem = result.matchedItems![1];
      expect(reviewItem.title).toContain('Taylor Morgan');
      expect(reviewItem.actionType).toBe('view_task');
    });
  });
});
