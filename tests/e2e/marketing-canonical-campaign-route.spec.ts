import { test, expect } from '@playwright/test';

test.describe('Marketing Canonical Campaign Routing', () => {
  test('uses canonical route format without subtab=... while campaign is open', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration&view=review&asset=flyer');
    await page.waitForFunction(() => !document.body.innerText.includes('Loading shapework'), { timeout: 15000 });
    
    const url = page.url();
    expect(url).toContain('campaign=campaign_990_inspiration');
    expect(url).toContain('view=review');
    expect(url).not.toContain('subtab=today');

    await page.getByTestId('tab-work').click();
    expect(page.url()).toContain('view=work');
  });
});
