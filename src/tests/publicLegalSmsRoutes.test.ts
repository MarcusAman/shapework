/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { smsConsentContent } from '../content/legal/smsConsent';
import { smsTermsContent } from '../content/legal/smsTerms';
import { privacyContent } from '../content/legal/privacy';

describe('Public Legal & SMS 10DLC Compliance Pages Suite', () => {
  it('1. Verifies SMS Consent Policy contains all mandatory 10DLC and CTIA compliance elements', () => {
    expect(smsConsentContent).toBeDefined();
    
    // Program Description
    expect(smsConsentContent).toContain('shapework. SMS & Text Messaging Consent Policy');
    expect(smsConsentContent).toContain('(910) 507-2047');
    expect(smsConsentContent).toContain('Ask Nora Operations Hotline');

    // Opt-In and Message Types
    expect(smsConsentContent).toContain('Express Consent & Opt-In Methods');
    expect(smsConsentContent).toContain('Operational Task & Workflow Notifications');
    expect(smsConsentContent).toContain('Marketing Proof & Collateral Reviews');
    
    // STOP Opt-Out Keyword
    expect(smsConsentContent).toContain('STOP');
    expect(smsConsentContent).toContain('CANCEL');
    expect(smsConsentContent).toContain('UNSUBSCRIBE');

    // HELP Support Keyword & Contact
    expect(smsConsentContent).toContain('HELP');
    expect(smsConsentContent).toContain('support@shapework.co');

    // Cost & Frequency Disclosures
    expect(smsConsentContent).toContain('Message & Data Rates');
    expect(smsConsentContent).toContain('Message frequency varies');

    // Carrier Non-Liability
    expect(smsConsentContent).toContain('Mobile carriers are not liable for delayed or undelivered messages');

    // Strict No Third-Party Selling / Sharing Guarantee
    expect(smsConsentContent).toContain('Strict Mobile Information Privacy Guarantee');
    expect(smsConsentContent).toContain('will NOT be sold, rented, leased, traded, or shared with third parties');
  });

  it('2. Verifies SMS Terms of Service contains full terms, carrier disclaimers, and dispute terms', () => {
    expect(smsTermsContent).toBeDefined();
    expect(smsTermsContent).toContain('shapework. SMS & Text Messaging Terms of Service');
    expect(smsTermsContent).toContain('Description of SMS Program');
    expect(smsTermsContent).toContain('Supported Wireless Carriers');
    expect(smsTermsContent).toContain('Carriers and shapework are not liable for delayed, misdirected, or undelivered messages');
    expect(smsTermsContent).toContain('How to Opt Out (STOP)');
    expect(smsTermsContent).toContain('Customer Support & Inquiries (HELP)');
    expect(smsTermsContent).toContain('Mobile Privacy & 10DLC Compliance');
  });

  it('3. Verifies Privacy Policy includes explicit Mobile Information & SMS Privacy protections', () => {
    expect(privacyContent).toContain('Mobile Information & SMS Messaging Privacy');
    expect(privacyContent).toContain('CTIA and 10DLC carrier standards');
    expect(privacyContent).toContain('will **NOT** be sold, rented, leased, or shared with third parties');
    expect(privacyContent).toContain('/sms-consent');
    expect(privacyContent).toContain('/sms-terms');
  });

  it('4. Verifies App.tsx routes /sms-consent, /sms-terms, /privacy, and updates SEO titles', () => {
    const appPath = path.resolve(process.cwd(), 'src/App.tsx');
    const content = fs.readFileSync(appPath, 'utf-8');

    expect(content).toContain("cleanPath === '/sms-consent'");
    expect(content).toContain("cleanPath === '/sms-terms'");
    expect(content).toContain("cleanPath === '/privacy'");
    expect(content).toContain("cleanPath === '/terms'");

    expect(content).toContain('PublicSmsConsent');
    expect(content).toContain('PublicSmsTerms');
    expect(content).toContain('SMS & Text Messaging Consent Policy | shapework.');
    expect(content).toContain('SMS Terms of Service | shapework.');

    expect(content).toContain("currentPath === '/sms-consent'");
    expect(content).toContain("currentPath === '/sms-terms'");
  });

  it('5. Verifies PublicFooter.tsx renders navigation links for all legal and compliance pages', () => {
    const footerPath = path.resolve(process.cwd(), 'src/components/public/PublicFooter.tsx');
    const content = fs.readFileSync(footerPath, 'utf-8');

    expect(content).toContain('Terms of Service');
    expect(content).toContain('Privacy Policy');
    expect(content).toContain('SMS Consent Policy');
    expect(content).toContain('SMS Terms of Service');
    expect(content).toContain('/sms-consent');
    expect(content).toContain('/sms-terms');
  });
});
