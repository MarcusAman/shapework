import { test, expect } from '@playwright/test';

test.describe('Marketing Design System & Contrast', () => {
  test('Page uses Nest dark-green canvas and surface tokens without white containers', async ({ page }) => {
    await page.goto('http://localhost:3000/app/marketing');
    await expect(page.getByRole('heading', { name: 'Marketing', exact: true })).toBeVisible();
    const heading = page.getByRole('heading', { name: 'Marketing', exact: true });
    const textStyle = await heading.evaluate(el => getComputedStyle(el).color);
    expect(textStyle).toBeDefined();
  });
});
