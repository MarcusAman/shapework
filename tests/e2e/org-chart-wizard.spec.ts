import { test, expect } from '@playwright/test';
import { spawn, execSync } from 'child_process';
import type { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess: ChildProcess;
const PORT = '3000';

test.beforeAll(async () => {
  // Kill only the listening process on this port
  try {
    execSync(`lsof -t -sTCP:LISTEN -i:${PORT} | xargs kill -9`, { stdio: 'ignore' });
  } catch (e) {}

  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, 'db.json');
  if (fs.existsSync(dbPath)) {
    try {
      fs.unlinkSync(dbPath);
    } catch (e) {}
  }

  serverProcess = spawn('npx', ['tsx', 'server.ts'], {
    env: {
      ...process.env,
      APP_MODE: 'development',
      STORAGE_DRIVER: 'local',
      DEMO_PASSCODE: 'shapework2026',
      ADMIN_BOOTSTRAP_SECRET: 'test-secret',
      JWT_SECRET: 'mock_jwt_secret_for_e2e_testing_purposes',
      CREDENTIAL_ENCRYPTION_KEY: 'mock_encryption_key_32_characters_long!',
      PASSWORD_RESET_SECRET: 'mock_password_reset_secret_key_32_chars!',
      PORT
    }
  });

  serverProcess.stdout?.on('data', (data) => console.log(`[Test Server ${PORT} STDOUT]`, data.toString()));
  serverProcess.stderr?.on('data', (data) => console.error(`[Test Server ${PORT} STDERR]`, data.toString()));

  await new Promise((resolve) => setTimeout(resolve, 8000));
});

test.afterAll(async () => {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
});

test('Test 1: Navigate to /app/settings, click Visual Org Map, assert visible positions', async ({ page }) => {
  // Login
  await page.goto(`http://localhost:${PORT}/login`);
  await page.fill('input[type="email"]', 'marcus@shapework.co');
  await page.fill('input[type="password"]', 'shapework2026');
  await page.click('button[type="submit"]');
  await page.waitForURL(`**/app/workboard`);

  // Navigate to Settings
  await page.goto(`http://localhost:${PORT}/app/settings`);
  await expect(page.locator('h3:has-text("Workspace Profile")')).toBeVisible({ timeout: 15000 });

  // Click Visual Org Map tab
  await page.click('button:has-text("Visual Org Map")');

  // Assert header and positions visible
  await expect(page.getByRole('heading', { name: 'Visual Org Map' })).toBeVisible();
  await expect(page.getByText('Ryan Crecelius').first()).toBeVisible();
  await expect(page.getByText('Ann Gunn').first()).toBeVisible();
  await expect(page.getByRole('button', { name: '+ Add Position' })).toBeVisible();

  // Assert canvas exists
  await expect(page.locator('.visual-org-map-canvas-shell')).toBeVisible();

  // Assert Settings Workspace Profile is not the main content anymore (workspace mode active)
  await expect(page.locator('h3:has-text("Workspace Profile")')).not.toBeVisible();
});

test('Test 2: Navigate to /app/settings, click Organization Chart Wizard, assert guided builder visible', async ({ page }) => {
  // Login
  await page.goto(`http://localhost:${PORT}/login`);
  await page.fill('input[type="email"]', 'marcus@shapework.co');
  await page.fill('input[type="password"]', 'shapework2026');
  await page.click('button[type="submit"]');
  await page.waitForURL(`**/app/workboard`);

  // Navigate to Settings
  await page.goto(`http://localhost:${PORT}/app/settings`);
  await expect(page.locator('h3:has-text("Workspace Profile")')).toBeVisible({ timeout: 15000 });

  // Click Organization Chart Wizard tab
  await page.click('button:has-text("Organization Chart Wizard")');

  // Assert header and guided builder layout is visible
  await expect(page.getByRole('heading', { name: 'Organization Chart Wizard' })).toBeVisible();
  await expect(page.getByText('Guided Progress')).toBeVisible();
  await expect(page.getByText('Positions', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: '+ Add Position' })).toBeVisible();
});

test('Test 3 & 4: Test entry card buttons switch tabs and modal is not visible', async ({ page }) => {
  // Login
  await page.goto(`http://localhost:${PORT}/login`);
  await page.fill('input[type="email"]', 'marcus@shapework.co');
  await page.fill('input[type="password"]', 'shapework2026');
  await page.click('button[type="submit"]');
  await page.waitForURL(`**/app/workboard`);

  // Navigate to Settings
  await page.goto(`http://localhost:${PORT}/app/settings`);
  await expect(page.locator('h3:has-text("Workspace Profile")')).toBeVisible({ timeout: 15000 });

  // Click Open Visual Org Map button inside profile tab
  await page.click('button:has-text("Open Visual Org Map")');

  // Assert Visual Org Map tab renders
  await expect(page.getByRole('heading', { name: 'Visual Org Map' })).toBeVisible();
  
  // Go back to Settings
  await page.click('button:has-text("Back to Settings")');
  await expect(page.locator('h3:has-text("Workspace Profile")')).toBeVisible();

  // Click Open Organization Chart Wizard button inside profile tab
  await page.click('button:has-text("Open Organization Chart Wizard")');

  // Assert Organization Chart Wizard tab renders
  await expect(page.getByRole('heading', { name: 'Organization Chart Wizard' })).toBeVisible();

  // Assert OrgChartWizardModal is not visible/rendered
  await expect(page.locator('div:has-text("OrgChartWizardModal")')).not.toBeVisible();
  await expect(page.locator('[data-testid="org-chart-wizard-modal"]')).not.toBeVisible();
});

test('Test 5: Avatar crop interaction flow', async ({ page }) => {
  // Login
  await page.goto(`http://localhost:${PORT}/login`);
  await page.fill('input[type="email"]', 'marcus@shapework.co');
  await page.fill('input[type="password"]', 'shapework2026');
  await page.click('button[type="submit"]');
  await page.waitForURL(`**/app/workboard`);

  // Navigate to Settings, Visual Org Map
  await page.goto(`http://localhost:${PORT}/app/settings`);
  await page.click('button:has-text("Visual Org Map")');
  await expect(page.getByText('Ryan Crecelius').first()).toBeVisible();

  // Wait for React hydration of event listeners
  await page.waitForTimeout(1500);

  // Find Ryan's card and click Edit Seat programmatically to bypass scaled canvas hit-testing
  const ryanCard = page.locator('.position-card', { hasText: 'Ryan Crecelius' });
  await ryanCard.locator('button:has-text("Edit Seat")').evaluate(el => (el as HTMLButtonElement).click());

  // Assert drawer open, click Edit Crop
  await expect(page.locator('h3:has-text("Edit POSITION")')).toBeVisible({ timeout: 15000 });
  await page.click('button:has-text("Edit Crop")');

  // Assert Edit Avatar Position & Crop modal open
  await expect(page.locator('h4:has-text("Edit Avatar Position & Crop")')).toBeVisible();

  // Click controls
  await page.click('button[title="Move Down"]');
  await page.click('button[title="Zoom In"]');

  // Click Save Crop
  await page.click('button:has-text("Save Crop")');

  // Assert modal closed
  await expect(page.locator('h4:has-text("Edit Avatar Position & Crop")')).not.toBeVisible();

  // Assert unsaved changes badge appears in header
  await expect(page.locator('span:has-text("Unsaved changes")')).toBeVisible();
});
