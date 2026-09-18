import { describe, it, expect } from 'vitest';
import { processUserUtterance } from '../services/voice-agent/transcriptRouter';
import { initialRuntimeState } from '../services/voice-agent/agentRuntimeReducer';

describe('Ask Nora Universal Text Box Intelligence & Database Grounding Suite', () => {
  const baseState = { ...initialRuntimeState };

  describe('1. Roster & Team Leadership Intelligence', () => {
    it('answers who is our BIC with designated BICs', () => {
      const result = processUserUtterance('Who is our BIC?', baseState, 'Ryan');
      expect(result.intentType).toBe('ROSTER_BIC_LOOKUP');
      expect(result.spokenResponse).toContain('Ryan Crecelius');
      expect(result.displayResponse).toContain('Ryan Crecelius');
      expect(result.displayResponse).toContain('Jessica Keenan');
      expect(result.displayResponse).toContain('Eric Knight');
      expect(result.displayResponse).toContain('SOP-BIC-001');
    });

    it('answers who is Ryan Crecelius with exact phone, email, and license #29184', () => {
      const result = processUserUtterance('Who is Ryan Crecelius?', baseState, 'Ryan');
      expect(result.intentType).toBe('ROSTER_PERSON_LOOKUP');
      expect(result.spokenResponse).toContain('Principal Broker');
      expect(result.spokenResponse).toContain('392-4100');
      expect(result.displayResponse).toContain('ryan@nestrealty.com');
      expect(result.displayResponse).toContain('#29184');
      expect(result.displayResponse).toContain('SOP-GOV-001');
    });

    it('answers who is Marcus Aman with phone and email', () => {
      const result = processUserUtterance('Who is Marcus Aman?', baseState, 'Ryan');
      expect(result.intentType).toBe('ROSTER_PERSON_LOOKUP');
      expect(result.spokenResponse).toContain('Marcus Aman');
      expect(result.displayResponse).toContain('marcus@shapework.co');
      expect(result.displayResponse).toContain('(910) 507-2047');
    });

    it('answers who handles marketing with Melissa Gagliardi and SOP-MKT-001', () => {
      const result = processUserUtterance('Who handles marketing?', baseState, 'Ryan');
      expect(result.intentType).toBe('ROSTER_PERSON_LOOKUP');
      expect(result.spokenResponse).toContain('Melissa Gagliardi');
      expect(result.displayResponse).toContain('melissa.gagliardi@nestrealty.com');
      expect(result.displayResponse).toContain('SOP-MKT-001');
    });

    it('answers who is Eduardo Lovo with VA production and SOP-MKT-003', () => {
      const result = processUserUtterance('Who is Eduardo Lovo?', baseState, 'Ryan');
      expect(result.intentType).toBe('ROSTER_PERSON_LOOKUP');
      expect(result.spokenResponse).toContain('Eduardo Lovo');
      expect(result.displayResponse).toContain('eduardo.lovo@nestrealty.com');
      expect(result.displayResponse).toContain('SOP-MKT-003');
    });

    it('answers who handles signs with Ann Gunn and Coastal Sign Post Co.', () => {
      const result = processUserUtterance('Who handles signs and lockboxes?', baseState, 'Ryan');
      expect(result.intentType).toBe('ROSTER_PERSON_LOOKUP');
      expect(result.spokenResponse).toContain('Ann Gunn');
      expect(result.displayResponse).toContain('Coastal Sign Post Co.');
      expect(result.displayResponse).toContain('SOP-OPS-001');
    });
  });

  describe('2. Live Marketing & Property Listing Status', () => {
    it('answers status of 1104 Arboretum Dr with $1.25M and 300 DPI staged proofs', () => {
      const result = processUserUtterance('What is the status of 1104 Arboretum?', baseState, 'Ryan');
      expect(result.intentType).toBe('MARKETING_PROPERTY_STATUS');
      expect(result.spokenResponse).toContain('1104 Arboretum');
      expect(result.spokenResponse).toContain('1,250,000');
      expect(result.spokenResponse).toContain('Sarah Jenkins');
      expect(result.displayResponse).toContain('Ready for Review');
      expect(result.displayResponse).toContain('300 DPI Vector PDF');
    });

    it('answers status of 742 Lumina with $1.95M and Ryan Crecelius listing', () => {
      const result = processUserUtterance('Tell me about 742 Lumina Ave', baseState, 'Ryan');
      expect(result.intentType).toBe('MARKETING_PROPERTY_STATUS');
      expect(result.spokenResponse).toContain('742 Lumina Avenue');
      expect(result.spokenResponse).toContain('1,950,000');
      expect(result.displayResponse).toContain('Ryan Crecelius');
      expect(result.displayResponse).toContain('Wrightsville Beach');
    });

    it('answers status of 126 Parkwood Ave with $625k and Matt Orr listing', () => {
      const result = processUserUtterance('What is the status of 126 Parkwood?', baseState, 'Ryan');
      expect(result.intentType).toBe('MARKETING_PROPERTY_STATUS');
      expect(result.spokenResponse).toContain('126 Parkwood Avenue');
      expect(result.spokenResponse).toContain('625,000');
      expect(result.displayResponse).toContain('Matt Orr');
    });
  });

  describe('3. SOP Governance & Deletion Permissions', () => {
    it('explains who can delete a published SOP (Ryan, Adam, Marcus, Matt)', () => {
      const result = processUserUtterance('Who can delete a published SOP?', baseState, 'Ryan');
      expect(result.intentType).toBe('SOP_DELETION_GOVERNANCE');
      expect(result.spokenResponse).toContain('Ryan Crecelius');
      expect(result.spokenResponse).toContain('Marcus Aman');
      expect(result.displayResponse).toContain('Adam');
      expect(result.displayResponse).toContain('Matt Orr');
      expect(result.displayResponse).toContain('sops.delete');
    });

    it('explains SOP-MKT-003 Maxa production protocol owned by Eduardo', () => {
      const result = processUserUtterance('What is SOP-MKT-003?', baseState, 'Ryan');
      expect(result.intentType).toBe('SOP_DETAILS_LOOKUP');
      expect(result.spokenResponse).toContain('SOP-MKT-003');
      expect(result.spokenResponse).toContain('Eduardo Lovo');
      expect(result.displayResponse).toContain('300 DPI vector PDF');
      expect(result.displayResponse).toContain('Double Flyer #229058');
    });

    it('explains SOP-OPS-001 sign post protocol owned by Ann Gunn', () => {
      const result = processUserUtterance('How do we handle SOP-OPS-001?', baseState, 'Ryan');
      expect(result.intentType).toBe('SOP_DETAILS_LOOKUP');
      expect(result.spokenResponse).toContain('SOP-OPS-001');
      expect(result.spokenResponse).toContain('Ann Gunn');
      expect(result.displayResponse).toContain('Coastal Sign Post Co.');
      expect(result.displayResponse).toContain('$65.00');
    });
  });

  describe('4. Vendor Directory & Dispatch', () => {
    it('answers approved sign vendor with Coastal Sign Post Co. details', () => {
      const result = processUserUtterance('Who is our approved sign vendor?', baseState, 'Ryan');
      expect(result.intentType).toBe('VENDOR_LOOKUP');
      expect(result.spokenResponse).toContain('Coastal Sign Post Co.');
      expect(result.displayResponse).toContain('(910) 555-7446');
      expect(result.displayResponse).toContain('$65.00');
      expect(result.displayResponse).toContain('Ann Gunn');
    });

    it('answers approved photography vendor with Cape Fear Real Estate Media', () => {
      const result = processUserUtterance('Find an approved photographer', baseState, 'Ryan');
      expect(result.intentType).toBe('VENDOR_LOOKUP');
      expect(result.spokenResponse).toContain('Cape Fear Real Estate Media');
      expect(result.displayResponse).toContain('Matterport 3D');
      expect(result.displayResponse).toContain('$225.00');
    });
  });
});
