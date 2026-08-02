/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
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
    render(<RoleProfilePdfDocument data={samplePdfData} />);
    expect(screen.getByText('Ryan Crecelius')).toBeInTheDocument();
    expect(screen.getByText(/Leadership · Principal Broker/)).toBeInTheDocument();
    expect(screen.getByText(/July 28, 2026/)).toBeInTheDocument();
  });

  it('renders all reporting and backup assignments without truncation', () => {
    render(<RoleProfilePdfDocument data={samplePdfData} />);
    expect(screen.getByText('Jessica Keenan — Broker-in-Charge')).toBeInTheDocument();
  });

  it('renders all roles and responsibilities', () => {
    render(<RoleProfilePdfDocument data={samplePdfData} />);
    expect(screen.getByText('Recruiting')).toBeInTheDocument();
    expect(screen.getByText(/Recruiting new agents to the brokerage/)).toBeInTheDocument();
    expect(screen.getByText('Coaching')).toBeInTheDocument();
    expect(screen.getByText('Leadership Escalation')).toBeInTheDocument();
  });

  it('renders all SOPs and Knowledge items', () => {
    render(<RoleProfilePdfDocument data={samplePdfData} />);
    expect(screen.getByText('A task is overdue, sensitive, cross-functional, financial, compliance-related, or unresolved.')).toBeInTheDocument();
  });

  it('renders all 14 backup coverage items in a clean document list format', () => {
    render(<RoleProfilePdfDocument data={samplePdfData} />);
    expect(screen.getByText('Jessica Keenan (Broker-in-Charge)')).toBeInTheDocument();
    expect(screen.getByText('Agent question')).toBeInTheDocument();
    expect(screen.getByText('Compliance')).toBeInTheDocument();
    expect(screen.getByText('Contract / transaction issue')).toBeInTheDocument();
    expect(screen.getByText('Onboarding Assistance')).toBeInTheDocument();
  });

  it('does NOT contain interactive application buttons or controls', () => {
    const { container } = render(<RoleProfilePdfDocument data={samplePdfData} />);
    expect(container.querySelector('button')).toBeNull();
    expect(container.querySelector('input')).toBeNull();
    expect(screen.queryByText('+ Add Role / Responsibility')).toBeNull();
    expect(screen.queryByText('Download PDF')).toBeNull();
  });
});
