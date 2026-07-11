import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('Comment Prefix Cleanup - Scan customer-facing UI components for remaining // headings', async () => {
  const componentsDir = path.join(__dirname, '../../src/components');
  
  const filesToScan = [
    path.join(componentsDir, 'transactions/ClosingComplianceGuard.tsx'),
    path.join(componentsDir, 'workflows/MarketingRequestDesk.tsx'),
    path.join(componentsDir, 'workflows/OfficeReadinessSignInventory.tsx'),
    path.join(componentsDir, 'transactions/PipelineClosingTracker.tsx'),
    path.join(componentsDir, 'integrations/IntegrationDrawer.tsx'),
    path.join(componentsDir, 'integrations/RechatDetailsDrawer.tsx')
  ];

  for (const filePath of filesToScan) {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      const hasDoubleSlashHeading = content.includes('>//') || content.includes('"//');
      if (hasDoubleSlashHeading) {
        console.error(`[Test Failure] File contains double slash heading: ${filePath}`);
      }
      
      expect(hasDoubleSlashHeading).toBe(false);
    }
  }
});
