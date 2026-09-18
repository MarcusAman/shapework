import { test, expect } from '@playwright/test';

test.describe('Marketing Configured Compliance Language', () => {
  test('uses "Configured checks passed" language and avoids legal guarantees', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration&view=review&asset=flyer');
    await page.waitForFunction(() => !document.body.innerText.includes('Loading shapework'), { timeout: 15000 });
    
    await expect(page.getByText('Configured checks passed')).toBeVisible();
    await expect(page.getByText('1. Automated brand checks')).toBeVisible();
    await expect(page.getByText('2. Configured brokerage checks')).toBeVisible();
    await expect(page.getByText('3. Human review status')).toBeVisible();

    const panelText = await page.getByTestId('campaign-inspector-panel').textContent();
    expect(panelText).not.toContain('Legally compliant');
    expect(panelText).not.toContain('Compliance Audited');
  });
});
