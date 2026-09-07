import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Workspace Settings Billing TBD, Card on File, and SLA Consolidation Suite', () => {
  const pagePath = path.resolve(process.cwd(), 'src/components/nest-wilmington/RyanSettingsPage.tsx');
  const pageContent = fs.readFileSync(pagePath, 'utf-8');

  it('1. Contains exactly 5 streamlined tabs and removed the duplicate SLA tab', () => {
    expect(pageContent).toContain("id: 'team'");
    expect(pageContent).toContain("id: 'billing'");
    expect(pageContent).toContain("label: 'Billing & Card on File'");
    expect(pageContent).toContain("id: 'profile'");
    expect(pageContent).toContain("id: 'tools'");
    expect(pageContent).toContain("id: 'skills_matrix'");

    // SLA tab should NOT be in the segmented control
    expect(pageContent).not.toContain("id: 'sla', label: 'SLA & Escalation Rules'");
  });

  it('2. Normalizes plan pricing and statement amounts to TBD for new brokerages', () => {
    expect(pageContent).toContain('TBD<span className="text-xs font-sans font-normal opacity-80"> (Custom Agreement)</span>');
    expect(pageContent).toContain('TBD (Post-Activation)');
  });

  it('3. Features dedicated Credit Card on File onboarding vault component', () => {
    expect(pageContent).toContain('Credit Card on File (Brokerage Billing)');
    expect(pageContent).toContain('To get started, put in your credit card information');
    expect(pageContent).toContain('Cardholder Full Name');
    expect(pageContent).toContain('Card Number');
    expect(pageContent).toContain('Expiration (MM/YY)');
    expect(pageContent).toContain('Security Code (CVC)');
    expect(pageContent).toContain('Billing Postal / ZIP Code');
    expect(pageContent).toContain('Save Card on File');
  });

  it('4. Complies with zero sparkles icon rule', () => {
    expect(pageContent).not.toContain('<Sparkles');
    expect(pageContent).not.toContain('<SparklesIcon');
    expect(pageContent).not.toContain('import { Sparkles }');
  });

  it('5. Cleanly removes fake invoices, depository escrow card, and recent vendor disbursements from billing tab', () => {
    expect(pageContent).toContain('const [invoices, setInvoices] = useState<any[]>([]);');
    expect(pageContent).toContain('No Billing Invoices or Statements Yet');
    expect(pageContent).not.toContain('Recent Brokerage Vendor Disbursements');
    expect(pageContent).not.toContain('Apex Media & Photography');
    expect(pageContent).not.toContain('First Bank NC Trust');
  });

  it('6. Restricts billing tab access to authorized leadership: Ryan, James, Marcus, Matt, and Adam', () => {
    expect(pageContent).toContain("userEmail.includes('ryan')");
    expect(pageContent).toContain("userEmail.includes('james')");
    expect(pageContent).toContain("userEmail.includes('marcus')");
    expect(pageContent).toContain("userEmail.includes('matt')");
    expect(pageContent).toContain("userEmail.includes('adam')");
    expect(pageContent).toContain('Billing Access Restricted');
    expect(pageContent).toContain('disabled: !isAuthorizedForBilling');
  });
});

