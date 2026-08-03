import { test, expect } from '@playwright/test';

test.describe('Marketing Today Domain Filtering', () => {
  test('includes only marketing work items and excludes facilities and office supplies', async ({ page }) => {
    await page.goto('http://localhost:3049/app/marketing?subtab=today');
    await page.waitForFunction(() => !document.body.innerText.includes('Loading shapework'), { timeout: 15000 });
    
    await expect(page.getByTestId('marketing-today-view')).toBeVisible();
    
    const pageText = await page.getByTestId('marketing-today-view').textContent();
    expect(pageText).not.toContain('projector bulb flicker');
    expect(pageText).not.toContain('Brokerage Folders');
    expect(pageText).not.toContain('Conference Room');
  });
});
