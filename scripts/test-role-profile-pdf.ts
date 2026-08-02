/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ReactDOMServer from 'react-dom/server';
import RoleProfilePdfDocument, { RoleProfilePdfData } from '../src/components/role-profile/RoleProfilePdfDocument';

// Fixture: Ryan Crecelius Role Profile
const ryanPdfData: RoleProfilePdfData = {
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

console.log('=== RUNNING AUTOMATED ROLE PROFILE PDF VERIFICATION ===');

const htmlOutput = ReactDOMServer.renderToStaticMarkup(
  React.createElement(RoleProfilePdfDocument, { data: ryanPdfData })
);

let passed = true;

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    passed = false;
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

// 1. Verify Headers & Person Data
assert(htmlOutput.includes('Ryan Crecelius'), 'Contains person display name');
assert(htmlOutput.includes('Principal Broker'), 'Contains title');
assert(htmlOutput.includes('Leadership'), 'Contains department');
assert(htmlOutput.includes('July 28, 2026'), 'Contains generated date');

// 2. Verify Reporting & Backup
assert(htmlOutput.includes('Jessica Keenan — Broker-in-Charge'), 'Full backup owner text rendered without truncation');

// 3. Verify Roles & Responsibilities
assert(htmlOutput.includes('Recruiting'), 'Renders Recruiting role');
assert(htmlOutput.includes('Coaching'), 'Renders Coaching role');
assert(htmlOutput.includes('Leadership Escalation'), 'Renders Leadership Escalation role');

// 4. Verify SOPs & Knowledge
assert(htmlOutput.includes('A task is overdue, sensitive, cross-functional, financial, compliance-related, or unresolved.'), 'Renders full SOP trigger');

// 5. Verify Backup Coverage (All 14 items)
assert(ryanPdfData.backupCoverage.length === 14, 'Fixture contains exactly 14 coverage items');
ryanPdfData.backupCoverage.forEach(item => {
  assert(htmlOutput.includes(item.label), `Renders coverage item: "${item.label}"`);
});

// 6. Verify UI Controls Exclusion
assert(!htmlOutput.includes('<button'), 'Contains zero <button> elements');
assert(!htmlOutput.includes('<input'), 'Contains zero <input> elements');
assert(!htmlOutput.includes('+ Add Role'), 'Excludes "+ Add Role" button');
assert(!htmlOutput.includes('Download PDF'), 'Excludes "Download PDF" button');

// 7. Verify Empty State Handling
const emptyPdfData: RoleProfilePdfData = {
  person: { id: 'empty', displayName: 'New Position', status: 'open' },
  generatedAt: 'July 28, 2026',
  rolesAndResponsibilities: [],
  sopsAndKnowledge: [],
  backupCoverage: []
};

const emptyHtml = ReactDOMServer.renderToStaticMarkup(
  React.createElement(RoleProfilePdfDocument, { data: emptyPdfData })
);

assert(emptyHtml.includes('No responsibilities assigned.'), 'Empty state text for responsibilities');
assert(emptyHtml.includes('No SOPs or Knowledge assigned.'), 'Empty state text for SOPs');
assert(emptyHtml.includes('No backup coverage configured.'), 'Empty state text for backup coverage');

console.log('\n==================================================');
if (passed) {
  console.log('🎉 ALL AUTOMATED ROLE PROFILE PDF TESTS PASSED PERFECTLY!');
  process.exit(0);
} else {
  console.error('💥 SOME TESTS FAILED');
  process.exit(1);
}
