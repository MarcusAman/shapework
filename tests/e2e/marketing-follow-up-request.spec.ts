import { test, expect } from '@playwright/test';

test.describe('Marketing Follow-Up Request', () => {
  test('Submitting follow-up request creates a new campaign revision', async ({ page, request }) => {
    const res = await request.post('http://localhost:3049/api/marketing/campaigns/campaign_304_ocean/follow-up', {
      data: {
        requestText: 'Change open-house time to Sunday 1:00 PM - 3:00 PM',
        requestedBy: 'Eric'
      }
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.revision).toBeGreaterThan(1);

    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_304_ocean&mode=brief');
    await page.waitForSelector('[data-testid="brief-revision-badge"]');
    await expect(page.locator('[data-testid="brief-revision-badge"]')).toContainText(/Revision \d+/);
    await expect(page.locator('[data-testid="brief-followup-history"]')).toBeVisible();
  });
});
