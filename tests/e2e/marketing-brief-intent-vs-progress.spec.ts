import { test, expect } from '@playwright/test';

test.describe('Marketing Brief Intent vs Progress Separation', () => {
  test('displays intent objective and separate progress section in Overview', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration&view=overview');
    await page.waitForFunction(() => !document.body.innerText.includes('Loading shapework'), { timeout: 15000 });
    
    // Check Brief Objective uses intent language
    const objectiveText = await page.getByTestId('brief-ai-summary').textContent();
    expect(objectiveText).toContain('Create a five-material luxury listing package');

    // Check separate progress area exists
    await expect(page.getByTestId('campaign-brief-progress-area')).toBeVisible();
  });
});
