/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Test Suite for Inbound Voice Caller Gatekeeper & Office Supply Deduplication Engine
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CallerGatekeeperService } from '../../server/integrations/telephony/callerGatekeeperService.js';
import { OfficeSupplyDeduplicationService } from '../../server/services/officeSupplyDeduplicationService.js';

describe('Inbound Voice Caller Gatekeeper & Office Supply Deduplication Suite', () => {
  beforeEach(() => {
    OfficeSupplyDeduplicationService.clearOrders();
  });

  describe('1. Inbound Caller ID Recognition & Gatekeeper', () => {
    it('recognizes known agent phone number and returns personalized greeting without asking for name', () => {
      const result = CallerGatekeeperService.resolveCallerByPhone('+19106128283');

      expect(result.isRecognized).toBe(true);
      expect(result.needsNameVerification).toBe(false);
      expect(result.caller).toBeDefined();
      expect(result.caller?.fullName).toBe('Matt Orr');
      expect(result.caller?.office).toBe('Mayfaire');
      expect(result.greeting).toContain('Hello Matt');
      expect(result.greeting).toContain('This is Nora');
    });

    it('recognizes brokerage key staff and leadership numbers', () => {
      const result = CallerGatekeeperService.resolveCallerByPhone('+12527170595');

      expect(result.isRecognized).toBe(true);
      expect(result.caller?.fullName).toBe('Marcus Aman');
      expect(result.caller?.role).toContain('Tech Lead');
    });

    it('prompts unknown phone number for first and last name', () => {
      const unknownPhone = '+19105559876';
      const result = CallerGatekeeperService.resolveCallerByPhone(unknownPhone);

      expect(result.isRecognized).toBe(false);
      expect(result.needsNameVerification).toBe(true);
      expect(result.caller).toBeNull();
      expect(result.greeting).toContain("I don't recognize this number");
      expect(result.greeting).toContain('What is your first and last name?');
      expect(result.suggestedPrompt).toBe('What is your first and last name?');
    });
  });

  describe('2. Mid-Call Spoken Name Matching & Phone Auto-Linking', () => {
    it('matches spoken name against the 72-Agent Directory and auto-links new phone number', () => {
      const newPhone = '+19105553322';

      // 1. Initial call from new number is unrecognized
      const initial = CallerGatekeeperService.resolveCallerByPhone(newPhone);
      expect(initial.isRecognized).toBe(false);

      // 2. Caller states name: "Matt Orr"
      const verification = CallerGatekeeperService.resolveCallerByName('Matt Orr', newPhone);
      expect(verification.isVerified).toBe(true);
      expect(verification.caller?.fullName).toBe('Matt Orr');
      expect(verification.phoneLinked).toBe(true);
      expect(verification.confirmationMessage).toContain('verified you as Matt Orr from Mayfaire');

      // 3. Subsequent call from that same new number is now instantly recognized
      const subsequent = CallerGatekeeperService.resolveCallerByPhone(newPhone);
      expect(subsequent.isRecognized).toBe(true);
      expect(subsequent.caller?.fullName).toBe('Matt Orr');
      expect(subsequent.greeting).toContain('Hello Matt');
    });

    it('supports common name aliases and nicknames (Matthew -> Matt, Jess -> Jessica)', () => {
      const matthewMatch = CallerGatekeeperService.resolveCallerByName('Matthew Orr');
      expect(matthewMatch.isVerified).toBe(true);
      expect(matthewMatch.caller?.fullName).toBe('Matt Orr');

      const jessMatch = CallerGatekeeperService.resolveCallerByName('Jess Keenan');
      expect(jessMatch.isVerified).toBe(true);
      expect(jessMatch.caller?.fullName).toContain('Jessica Keenan');
    });

    it('restricts authorization for unverified guest callers not in Directory', () => {
      const unverified = CallerGatekeeperService.resolveCallerByName('Unknown GuestPerson');
      expect(unverified.isVerified).toBe(false);
      expect(unverified.caller).toBeNull();

      const auth = CallerGatekeeperService.evaluateCallerAuthorization(unverified.caller);
      expect(auth.isAuthorized).toBe(false);
      expect(auth.permissionLevel).toBe('RESTRICTED_GUEST');
      expect(auth.deniedActions).toContain('order_office_supplies');
      expect(auth.deniedActions).toContain('dispatch_marketing_package');
    });
  });

  describe('3. Office Supply Deduplication & Runaway Prevention (72 Cases of Water)', () => {
    it('creates a single task for Ann Gunn on first call, and consolidates subsequent calls as +1 requesters', () => {
      // Call 1: Matt Orr requests water for Mayfaire office
      const call1 = OfficeSupplyDeduplicationService.checkAndConsolidateSupplyRequest({
        callerName: 'Matt Orr',
        callerRole: 'REALTOR®',
        callerPhone: '+19106128283',
        office: 'Mayfaire',
        requestText: 'We need a case of bottled water for the Mayfaire office.'
      });

      expect(call1.isDuplicate).toBe(false);
      expect(call1.isNewTicketCreated).toBe(true);
      expect(call1.order.assignedTo).toBe('Ann Gunn');
      expect(call1.order.assignedToRole).toBe('Signs & Operations (ATC)');
      expect(call1.order.category).toBe('bottled_water');
      expect(call1.totalRequestersCount).toBe(1);
      expect(call1.spokenMessage).toContain('assigned it to Ann Gunn');
      expect(call1.spokenMessage).toContain('Thursday');

      // Call 2: Jessica Keenan calls for water at Mayfaire office
      const call2 = OfficeSupplyDeduplicationService.checkAndConsolidateSupplyRequest({
        callerName: 'Jessica Keenan',
        callerRole: 'Broker-in-Charge',
        callerPhone: '+19103681507',
        office: 'Mayfaire',
        requestText: 'Can we get more drinking water for the office?'
      });

      expect(call2.isDuplicate).toBe(true);
      expect(call2.isNewTicketCreated).toBe(false);
      expect(call2.totalRequestersCount).toBe(2);
      expect(call2.order.id).toBe(call1.order.id); // Same consolidated ticket
      expect(call2.spokenMessage).toContain('already open with Ann Gunn');
      expect(call2.spokenMessage).toContain('scheduled for delivery this Thursday');
      expect(call2.spokenMessage).toContain('Jessica');

      // Call 3: Julie Brown calls for water at Mayfaire office
      const call3 = OfficeSupplyDeduplicationService.checkAndConsolidateSupplyRequest({
        callerName: 'Julie Brown',
        callerRole: 'REALTOR®',
        callerPhone: '+19105550192',
        office: 'Mayfaire',
        requestText: 'Water restock needed at Mayfaire'
      });

      expect(call3.isDuplicate).toBe(true);
      expect(call3.isNewTicketCreated).toBe(false);
      expect(call3.totalRequestersCount).toBe(3);

      // Verify that Ann Gunn has EXACTLY ONE active order for water at Mayfaire
      const activeOrders = OfficeSupplyDeduplicationService.getActiveOrders('Mayfaire');
      const waterOrders = activeOrders.filter(o => o.category === 'bottled_water');
      expect(waterOrders.length).toBe(1);
      expect(waterOrders[0].totalRequestersCount).toBe(3);
      expect(waterOrders[0].initialRequester.agentName).toBe('Matt Orr');
      expect(waterOrders[0].additionalRequesters.map(r => r.agentName)).toEqual(['Jessica Keenan', 'Julie Brown']);
    });

    it('supports multiple distinct office supply categories independently without collision', () => {
      // Water request
      const water = OfficeSupplyDeduplicationService.checkAndConsolidateSupplyRequest({
        callerName: 'Matt Orr',
        office: 'Mayfaire',
        requestText: 'We need water'
      });
      expect(water.order.category).toBe('bottled_water');

      // Coffee request
      const coffee = OfficeSupplyDeduplicationService.checkAndConsolidateSupplyRequest({
        callerName: 'Matt Orr',
        office: 'Mayfaire',
        requestText: 'We are out of K-Cup coffee and creamer'
      });
      expect(coffee.order.category).toBe('coffee_kcups');
      expect(coffee.isNewTicketCreated).toBe(true);
      expect(coffee.order.id).not.toBe(water.order.id);

      // Paper request
      const paper = OfficeSupplyDeduplicationService.checkAndConsolidateSupplyRequest({
        callerName: 'Ann Gunn',
        office: 'Mayfaire',
        requestText: 'Printer is out of 8.5x11 copy paper reams'
      });
      expect(paper.order.category).toBe('printer_paper');
      expect(paper.isNewTicketCreated).toBe(true);

      const activeOrders = OfficeSupplyDeduplicationService.getActiveOrders('Mayfaire');
      expect(activeOrders.length).toBe(3);
    });

    it('separates orders by distinct office locations (Mayfaire vs Downtown)', () => {
      // Mayfaire water
      const mayfaire = OfficeSupplyDeduplicationService.checkAndConsolidateSupplyRequest({
        callerName: 'Matt Orr',
        office: 'Mayfaire',
        requestText: 'Water for Mayfaire'
      });

      // Downtown water
      const downtown = OfficeSupplyDeduplicationService.checkAndConsolidateSupplyRequest({
        callerName: 'Julie Brown',
        office: 'Downtown',
        requestText: 'Water for Downtown'
      });

      expect(mayfaire.order.id).not.toBe(downtown.order.id);
      expect(mayfaire.isNewTicketCreated).toBe(true);
      expect(downtown.isNewTicketCreated).toBe(true);

      expect(OfficeSupplyDeduplicationService.getActiveOrders('Mayfaire').length).toBe(1);
      expect(OfficeSupplyDeduplicationService.getActiveOrders('Downtown').length).toBe(1);
    });
  });
});
