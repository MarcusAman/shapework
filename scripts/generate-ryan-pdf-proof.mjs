/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOMServer from 'react-dom/server';
import fs from 'fs';
import path from 'path';
import { chromium } from '@playwright/test';
import RoleProfilePdfDocument from '../src/components/role-profile/RoleProfilePdfDocument.js';

const ryanPdfData = {
  person: {
    id: 'pos_ryan',
    displayName: 'Ryan Crecelius',
    initials: 'RC',
    title: 'Principal Broker',
    department: 'Leadership',
    status: 'active'
  },
  generatedAt: 'July 28, 2026',
  reportsTo: undefined,
  backupOwner: {
    positionName: 'Broker-in-Charge',
    personName: 'Jessica Keenan'
  },
  calculatedBackup: {
    positionName: 'Broker-in-Charge',
    personName: 'Jessica Keenan'
  },
  rolesAndResponsibilities: [
    { title: 'Recruiting', description: 'Recruiting new agents to the brokerage.' },
    { title: 'Coaching', description: 'Mentoring and coaching active agents.' },
    { title: 'Leadership Escalation', description: 'Resolving complex operational and leadership bottlenecks.' }
  ],
  sopsAndKnowledge: [
    {
      title: 'Leadership Escalation',
      type: 'sop',
      trigger: 'A task is overdue, sensitive, cross-functional, financial, compliance-related, or unresolved.'
    }
  ],
  backupCoverage: [
    { type: 'seat', label: 'Jessica Keenan (Broker-in-Charge)' },
    { type: 'request', label: 'Agent question' },
    { type: 'request', label: 'Compliance' },
    { type: 'request', label: 'Contract / transaction issue' },
    { type: 'request', label: 'Accounting / commissions' },
    { type: 'request', label: 'Payables / bills / receipts' },
    { type: 'request', label: 'Marketing request' },
    { type: 'request', label: 'Listing marketing' },
    { type: 'request', label: 'Agent branding' },
    { type: 'request', label: 'Lockboxes / keys' },
    { type: 'request', label: 'Office supplies' },
    { type: 'request', label: 'Room reservation' },
    { type: 'request', label: 'IT Support' },
    { type: 'request', label: 'Onboarding Assistance' }
  ]
};

async function main() {
  console.log('Generating Ryan Crecelius Role Profile Document HTML & PDF proof...');

  const documentHtml = ReactDOMServer.renderToStaticMarkup(
    React.createElement(RoleProfilePdfDocument, { data: ryanPdfData })
  );

  const fullPageHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Ryan Crecelius Role Profile</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            background: #ffffff;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
          }
          @page {
            size: letter portrait;
            margin: 0;
          }
        </style>
      </head>
      <body>
        ${documentHtml}
      </body>
    </html>
  `;

  const distDir = path.resolve(process.cwd(), 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  const htmlPath = path.join(distDir, 'ryan_role_profile_doc.html');
  fs.writeFileSync(htmlPath, fullPageHtml, 'utf8');
  console.log(`HTML document saved to: ${htmlPath}`);

  // Launch Playwright
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 816, height: 1056 } // 8.5 x 11 inches at 96 DPI
  });

  await page.setContent(fullPageHtml, { waitUntil: 'networkidle' });

  // Generate PDF
  const pdfPath = path.join(distDir, 'Ryan_Crecelius_Role_Profile.pdf');
  await page.pdf({
    path: pdfPath,
    format: 'Letter',
    printBackground: true,
    margin: { top: 0, bottom: 0, left: 0, right: 0 }
  });
  console.log(`PDF document saved to: ${pdfPath}`);

  // Capture PNG preview screenshot of document
  const previewPath = path.join(distDir, 'Ryan_Crecelius_Role_Profile_Preview.png');
  await page.screenshot({ path: previewPath, fullPage: true });
  console.log(`Preview screenshot saved to: ${previewPath}`);

  // Copy preview image to Antigravity Artifacts directory
  const artifactDir = '/Users/marcusaman/.gemini/antigravity/brain/807bbfaa-2c92-4881-a75c-bf62a3f51014';
  if (fs.existsSync(artifactDir)) {
    const artifactImgPath = path.join(artifactDir, 'Ryan_Crecelius_Role_Profile_Preview.png');
    fs.copyFileSync(previewPath, artifactImgPath);
    console.log(`Copied preview artifact to: ${artifactImgPath}`);

    const artifactPdfPath = path.join(artifactDir, 'Ryan_Crecelius_Role_Profile.pdf');
    fs.copyFileSync(pdfPath, artifactPdfPath);
    console.log(`Copied PDF artifact to: ${artifactPdfPath}`);
  }

  await browser.close();
  console.log('PDF Proof generation complete!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
