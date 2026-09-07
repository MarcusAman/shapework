import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  resolveTelephonyMediaForCall,
  mapPersistedToMarketingCall,
  extractRequestTypeAndCollateral,
  getCallAudioStream
} from '../../server/integrations/marketingCallsService';

describe('Authoritative Telephony Media & Identity Integrity Test Suite', () => {
  describe('1. Authoritative Server Media Resolver (resolveTelephonyMediaForCall)', () => {
    it('resolves canonical media for a valid call with recording in ws_wilmington', async () => {
      const media = await resolveTelephonyMediaForCall('call_523c291598cdc1d96f1ceaa469a', 'ws_wilmington');
      expect(media).not.toBeNull();
      if (media) {
        expect(media.callId).toBe('call_523c291598cdc1d96f1ceaa469a');
        expect(media.recordingUrlAvailable).toBe(true);
        expect(media.audioEndpoint).toBe('/api/marketing/calls/call_523c291598cdc1d96f1ceaa469a/audio');
        expect(media.callDurationSeconds).toBeGreaterThanOrEqual(100);
        expect(media.recordingStatus).toBe('available');
      }
    });

    it('rejects cross-workspace media requests with null', async () => {
      const foreignMedia = await resolveTelephonyMediaForCall('call_523c291598cdc1d96f1ceaa469a', 'ws_foreign_charlotte');
      expect(foreignMedia).toBeNull();
    });

    it('reports unavailable status without falling back to mock audio when call lacks recording', async () => {
      const noAudioMedia = await resolveTelephonyMediaForCall('call_test_water_test_1788574061633', 'ws_wilmington');
      expect(noAudioMedia).not.toBeNull();
      if (noAudioMedia) {
        expect(noAudioMedia.callId).toBe('call_test_water_test_1788574061633');
        expect(noAudioMedia.recordingUrlAvailable).toBe(false);
        expect(noAudioMedia.audioEndpoint).toBeUndefined();
        expect(noAudioMedia.recordingStatus).toBe('unavailable');
      }
    });
  });

  describe('2. Byte-Range Streaming Audio Proxy', () => {
    it('returns null / 404 for calls that do not possess a recording URL', async () => {
      const streamResult = await getCallAudioStream('call_test_water_test_1788574061633', 'bytes=0-100');
      expect(streamResult).toBeNull();
    });

    it('provides byte-range streaming metadata for valid call with recording', async () => {
      const streamResult = await getCallAudioStream('call_523c291598cdc1d96f1ceaa469a', 'bytes=0-1023');
      expect(streamResult).not.toBeNull();
      if (streamResult) {
        expect(streamResult.acceptRanges).toBe('bytes');
        expect(Number(streamResult.contentLength)).toBe(1024);
        expect(streamResult.contentRange).toContain('bytes 0-1023/');
        expect(typeof streamResult.pipe).toBe('function');
      }
    });
  });

  describe('3. Telephony Identity & Department Segregation', () => {
    it('correctly maps general_ops Mayfaire water bottle calls without real estate contamination', () => {
      const persistedWaterCall: any = {
        id: 'call_test_water_mayfaire_1',
        callerName: 'Matt Orr (REALTOR®)',
        callerPhone: '+12527170595',
        callerOffice: 'Nest Realty Mayfaire',
        direction: 'inbound',
        status: 'completed',
        durationSeconds: 45,
        durationFormatted: '45 sec',
        propertyAddress: 'Mayfaire office, Wilmington NC',
        departmentCategory: 'general_ops',
        requestType: 'Facilities & Office Supplies',
        transcript: 'Matt: We need more water bottles at the Mayfaire office.',
        aiExtractedDetails: {}
      };

      const mapped = mapPersistedToMarketingCall(persistedWaterCall);

      expect(mapped.departmentCategory).toBe('general_ops');
      expect(mapped.assignedLead).toBe('Ann Gunn (Operations Lead)');
      expect(mapped.aiExtractedDetails).toBeNull();
      expect(mapped.requestType).toBe('Facilities & Office Supplies');
      expect(mapped.propertyAddress).toBe('Mayfaire office, Wilmington NC');
    });

    it('sanitizes historical general_ops calls even if legacy row had marketing_collateral tag', () => {
      const legacyRow: any = {
        id: 'call_legacy_water_row',
        callerName: 'Matt Orr (REALTOR®)',
        propertyAddress: 'Mayfaire office, Wilmington NC',
        departmentCategory: 'marketing_collateral', // Old corrupted tag
        transcript: 'Hi there. I need to get some water at the Mayfair office.',
        durationSeconds: 53,
        aiExtractedDetails: {
          price: '$785,000',
          bedrooms: '4 Beds',
          bathrooms: '3 Baths',
          openHouseDate: 'This Weekend (Sat/Sun 1:00 PM - 4:00 PM)',
          requiredCollateral: ['Operational Request Record']
        }
      };

      const mapped = mapPersistedToMarketingCall(legacyRow);

      // Overrides legacy corruption to general_ops and strips fake property details
      expect(mapped.departmentCategory).toBe('general_ops');
      expect(mapped.assignedLead).toBe('Ann Gunn (Operations Lead)');
      expect(mapped.aiExtractedDetails).toBeNull();
    });

    it('extracts real price and beds/baths for legitimate real estate calls', () => {
      const callData: any = {
        id: 'call_eric_oleander',
        transcript: 'Agent: How much is the listing? Eric: One point six million. Agent: Bathrooms? Eric: Five.',
        call_analysis: {
          custom_analysis_data: {
            department: 'marketing',
            category: 'print_collateral'
          }
        }
      };

      const parsed = extractRequestTypeAndCollateral(callData);
      expect(parsed.price).toBe('$1.6 Million');
      expect(parsed.bedsBaths.baths).toBe('5 Baths');
    });
  });

  describe('4. CallsTableView Drawer Frontend Safety & Code Audit', () => {
    const viewPath = path.resolve(process.cwd(), 'src/components/marketing/CallsTableView.tsx');
    const content = fs.readFileSync(viewPath, 'utf-8');

    it('binds key={drawerCall.id} to avoid stale drawer reconciliation', () => {
      expect(content).toContain('key={drawerCall.id}');
      expect(content).toContain('key={`panel-${drawerCall.id}`}');
    });

    it('binds key={`audio-${drawerCall.id}`} and onLoadedMetadata to HTML5 audio player', () => {
      expect(content).toContain('key={`audio-${drawerCall.id}`}');
      expect(content).toContain('onLoadedMetadata');
    });

    it('renders honest unavailable state when call has no audio recording', () => {
      expect(content).toContain('No audio recording available for this call');
      expect(content).toContain('Telephony audio was not captured or has expired upstream.');
      expect(content).toContain('VolumeX');
    });

    it('renders Phase 7 Mismatch Protection banner when integrity is unverified', () => {
      expect(content).toContain('This call’s linked information could not be verified. No action has been taken.');
      expect(content).toContain('isIntegrityMismatched');
    });

    it('disables mutate/assign actions when isIntegrityMismatched is true', () => {
      expect(content).toContain('disabled={isIntegrityMismatched}');
    });

    it('contains no hardcoded $785,000 fallback in drawer JSX', () => {
      expect(content).not.toContain("|| '$785,000'");
      expect(content).not.toContain('|| "4 Beds"');
      expect(content).not.toContain("|| '3 Baths'");
      expect(content).not.toContain("|| 'This Weekend'");
    });

    it('does not assume VA title and presents role-accurate Assign Work action', () => {
      expect(content).not.toContain('<span>Assign to VA Eduardo</span>');
      expect(content).toContain('<span>Assign Work</span>');
      expect(content).toContain("drawerCall.departmentCategory !== 'general_ops'");
    });
  });

  describe('5. Zero Retell Polling & Mutation Invariant', () => {
    it('verifies marketingCallsService does not poll Retell on GET or startup', () => {
      const servicePath = path.resolve(process.cwd(), 'server/integrations/marketingCallsService.ts');
      const serviceContent = fs.readFileSync(servicePath, 'utf-8');

      // No setInterval polling retell
      expect(serviceContent).not.toMatch(/setInterval\s*\([^)]*retell/i);
      // No POST/PATCH/DELETE mutations to Retell API endpoints
      expect(serviceContent).not.toMatch(/fetch\s*\([^)]*retellai\.com\/(?:v2\/)?(?:agents|tools|webhooks|voices)/i);
    });
  });
});
