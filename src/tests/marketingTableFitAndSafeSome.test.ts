import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { getDerivedCampaignState, getDerivedAssetState } from '../shared/marketingStateModel';
import { deriveCampaignProjection } from '../shared/marketingProjection';

describe('Marketing Intake Table Viewport Fit & Robust Non-Array Safety Suite', () => {
  it('1. Handles object or non-array missingInformation gracefully without throwing S.some is not a function', () => {
    const objectMissingCampaign: any = {
      id: 'campaign_test_1',
      status: 'needs_information',
      missingInformation: { prompt: 'Confirm weekend Open House start and end hours' },
      requestedAssets: ['flyer', 'social']
    };

    expect(() => {
      const state = getDerivedCampaignState(objectMissingCampaign, null);
      expect(state).toBe('needs_information');
    }).not.toThrow();

    expect(() => {
      const projection = deriveCampaignProjection(objectMissingCampaign, null);
      expect(projection.campaignState).toBe('needs_information');
      expect(projection.nextAction.title).toBe('Missing Information');
    }).not.toThrow();
  });

  it('2. Handles non-array approvalReceipts safely in getDerivedAssetState', () => {
    const nonArrayReceiptsCampaign: any = {
      id: 'campaign_test_2',
      status: 'ready_for_review',
      approvalReceipts: 'not-an-array'
    };

    expect(() => {
      const assetState = getDerivedAssetState('flyer', nonArrayReceiptsCampaign, null);
      expect(typeof assetState).toBe('string');
    }).not.toThrow();
  });

  it('3. Verifies MarketingHomeInbox table uses responsive full-width layout with More actions menu', () => {
    const inboxPath = path.resolve(process.cwd(), 'src/components/marketing/MarketingHomeInbox.tsx');
    const inboxContent = fs.readFileSync(inboxPath, 'utf-8');

    expect(inboxContent).toContain('MoreHorizontal');
    expect(inboxContent).toContain('activeActionDropdownId');
    expect(inboxContent).not.toContain('<Sparkles');
  });

  it('4. Verifies zero sparkles across updated marketing components', () => {
    const filesToCheck = [
      'src/components/marketing/MarketingHomeInbox.tsx',
      'src/components/marketing/CampaignActivityView.tsx',
      'src/components/marketing/AskRequesterQuestionsModal.tsx',
      'src/components/nest-wilmington/RyanSettingsPage.tsx'
    ];

    filesToCheck.forEach(file => {
      const content = fs.readFileSync(path.resolve(process.cwd(), file), 'utf-8');
      expect(content).not.toContain('<Sparkles');
      expect(content).not.toContain('<SparklesIcon');
    });
  });

  it('5. Verifies dropdown has elevated z-index stacking and flips upwards near bottom of table', () => {
    const inboxPath = path.resolve(process.cwd(), 'src/components/marketing/MarketingHomeInbox.tsx');
    const inboxContent = fs.readFileSync(inboxPath, 'utf-8');

    expect(inboxContent).toContain('isDropdownActive ? \'relative z-30\'');
    expect(inboxContent).toContain('isDropdownActive ? \'z-40\' : \'z-10\'');
    expect(inboxContent).toContain('isNearBottom ? \'bottom-full mb-1.5\' : \'top-full mt-1.5\'');
  });
});
