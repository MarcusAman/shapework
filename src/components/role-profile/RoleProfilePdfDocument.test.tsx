/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import RoleProfilePdfDocument, { RoleProfilePdfData } from './RoleProfilePdfDocument';

describe('RoleProfilePdfDocument', () => {
  const samplePdfData: RoleProfilePdfData = {
    person: {
      id: 'pos_ryan',
      displayName: 'Ryan Crecelius',
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
      { id: '1', title: 'Recruiting', description: 'Recruiting new agents to the brokerage.' },
      { id: '2', title: 'Coaching', description: 'Mentoring and coaching active agents.' },
      { id: '3', title: 'Leadership Escalation', description: 'Resolving complex operational and leadership bottlenecks.' }
    ],
    sopsAndKnowledge: [
      {
        id: 'sop_leadership',
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

  it('renders complete header and person information', () => {
    const html = renderToStaticMarkup(<RoleProfilePdfDocument data={samplePdfData} />);
    expect(html).toContain('Ryan Crecelius');
    expect(html).toContain('Leadership · Principal Broker');
    expect(html).toContain('July 28, 2026');
  });

  it('renders all reporting and backup assignments without truncation', () => {
    const html = renderToStaticMarkup(<RoleProfilePdfDocument data={samplePdfData} />);
    expect(html).toContain('Jessica Keenan — Broker-in-Charge');
  });

  it('renders all roles and responsibilities', () => {
    const html = renderToStaticMarkup(<RoleProfilePdfDocument data={samplePdfData} />);
    expect(html).toContain('Recruiting');
    expect(html).toContain('Recruiting new agents to the brokerage.');
    expect(html).toContain('Coaching');
    expect(html).toContain('Leadership Escalation');
  });

  it('renders all SOPs and Knowledge items', () => {
    const html = renderToStaticMarkup(<RoleProfilePdfDocument data={samplePdfData} />);
    expect(html).toContain('A task is overdue, sensitive, cross-functional, financial, compliance-related, or unresolved.');
  });

  it('renders all 14 backup coverage items in a clean document list format', () => {
    const html = renderToStaticMarkup(<RoleProfilePdfDocument data={samplePdfData} />);
    expect(html).toContain('Jessica Keenan (Broker-in-Charge)');
    expect(html).toContain('Agent question');
    expect(html).toContain('Compliance');
    expect(html).toContain('Contract / transaction issue');
    expect(html).toContain('Onboarding Assistance');
  });

  it('does NOT contain interactive application buttons or controls', () => {
    const html = renderToStaticMarkup(<RoleProfilePdfDocument data={samplePdfData} />);
    expect(html).not.toContain('<button');
    expect(html).not.toContain('<input');
    expect(html).not.toContain('+ Add Role / Responsibility');
    expect(html).not.toContain('Download PDF');
  });
});
