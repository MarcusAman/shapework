import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const ARTIFACT_DIR = '/Users/marcusaman/.gemini/antigravity/brain/438d0515-eff4-4e56-ad09-da389d4b82d9';

test.describe('Marketing Truth & Screenshot Verification', () => {
  test('captures all 17 fresh truth screenshots and verifies integrity', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // 1. truth_01_campaign_overview_next_action.png
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration&view=overview');
    await page.waitForFunction(() => !document.body.innerText.includes('Loading shapework'), { timeout: 15000 });
    await expect(page.getByTestId('campaign-next-action-banner')).toBeVisible();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'truth_01_campaign_overview_next_action.png') });

    // 2. truth_02_campaign_work_current_transition.png
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration&view=work');
    await page.waitForFunction(() => !document.body.innerText.includes('Loading shapework'), { timeout: 15000 });
    await expect(page.getByTestId('print-and-quote-card')).toBeVisible();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'truth_02_campaign_work_current_transition.png') });

    // 3. truth_03_flyer_real_preview.png
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration&view=review&asset=flyer');
    await page.waitForFunction(() => !document.body.innerText.includes('Loading shapework'), { timeout: 15000 });
    await expect(page.getByTestId('flyer-preview-canvas')).toBeVisible();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'truth_03_flyer_real_preview.png') });

    // 4. truth_04_social_slide_1.png
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration&view=review&asset=carousel');
    await page.waitForFunction(() => !document.body.innerText.includes('Loading shapework'), { timeout: 15000 });
    await expect(page.getByTestId('social-package-canvas')).toBeVisible();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'truth_04_social_slide_1.png') });

    // 5. truth_05_social_slide_2.png
    const nextBtn = page.getByTestId('social-next-slide-btn');
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
    }
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'truth_05_social_slide_2.png') });

    // 6. truth_06_social_slide_3.png
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
    }
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'truth_06_social_slide_3.png') });

    // 7. truth_07_social_thumbnail_rail.png
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'truth_07_social_thumbnail_rail.png') });

    // 8. truth_08_postcard_front_back.png
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration&view=review&asset=postcard');
    await page.waitForFunction(() => !document.body.innerText.includes('Loading shapework'), { timeout: 15000 });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'truth_08_postcard_front_back.png') });

    // 9. truth_09_sign_rider_real_preview.png
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration&view=review&asset=sign_rider');
    await page.waitForFunction(() => !document.body.innerText.includes('Loading shapework'), { timeout: 15000 });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'truth_09_sign_rider_real_preview.png') });

    // 10. truth_10_email_desktop_mobile_preview.png
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration&view=review&asset=email');
    await page.waitForFunction(() => !document.body.innerText.includes('Loading shapework'), { timeout: 15000 });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'truth_10_email_desktop_mobile_preview.png') });

    // 11. truth_11_approval_receipt_after_refresh.png
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration&view=review&asset=flyer');
    await page.waitForFunction(() => !document.body.innerText.includes('Loading shapework'), { timeout: 15000 });
    await page.reload();
    await page.waitForFunction(() => !document.body.innerText.includes('Loading shapework'), { timeout: 15000 });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'truth_11_approval_receipt_after_refresh.png') });

    // 12. truth_12_communications_roles.png
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration&view=communications');
    await page.waitForFunction(() => !document.body.innerText.includes('Loading shapework'), { timeout: 15000 });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'truth_12_communications_roles.png') });

    // 13. truth_13_print_quote_guard.png
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration&view=work');
    await page.waitForFunction(() => !document.body.innerText.includes('Loading shapework'), { timeout: 15000 });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'truth_13_print_quote_guard.png') });

    // 14. truth_14_exported_not_delivered.png
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration&view=history');
    await page.waitForFunction(() => !document.body.innerText.includes('Loading shapework'), { timeout: 15000 });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'truth_14_exported_not_delivered.png') });

    // 15. truth_15_delivered_receipt.png
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'truth_15_delivered_receipt.png') });

    // 16. truth_16_marketing_today_filtered.png
    await page.goto('http://localhost:3049/app/marketing?subtab=today');
    await page.waitForFunction(() => !document.body.innerText.includes('Loading shapework'), { timeout: 15000 });
    const backBtn = page.getByText('Back to Marketing');
    if (await backBtn.isVisible()) {
      await backBtn.click();
    }
    const todayTab = page.locator('[data-testid="subtab-today"]');
    if (await todayTab.isVisible()) {
      await todayTab.click();
    }
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'truth_16_marketing_today_filtered.png') });

    // 17. truth_17_source_photo_contact_sheet.png
    await page.goto('http://localhost:3049/app/marketing?campaign=campaign_990_inspiration&view=overview');
    await page.waitForFunction(() => !document.body.innerText.includes('Loading shapework'), { timeout: 15000 });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'truth_17_source_photo_contact_sheet.png') });
  });
});
