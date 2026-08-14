/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Staff SOP Template Modal & Lorena Voice Walkthrough Unit Tests
 */

import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StaffSOPTemplateModal from '../../src/components/sops/StaffSOPTemplateModal';

const mockState = {
  workspaceId: 'nest-realty-wilmington',
  activeProfile: {
    name: 'Matt Orr',
    email: 'matt@nestrealty.com',
    role: 'listing_specialist'
  }
};

describe('Staff SOP Template Modal & Lorena Voice Walkthrough', () => {
  it('1. Renders StaffSOPTemplateModal with correct header title', () => {
    const html = renderToStaticMarkup(
      <StaffSOPTemplateModal isOpen={true} onClose={() => {}} workspaceId="nest-realty-wilmington" />
    );
    expect(html).toContain('Build an SOP together');
    expect(html).toContain('Lorena Audio Walkthrough');
  });

  it('2. Renders dynamic progress badge with percent text', () => {
    const html = renderToStaticMarkup(
      <StaffSOPTemplateModal isOpen={true} onClose={() => {}} workspaceId="nest-realty-wilmington" />
    );
    expect(html).toContain('%');
    expect(html).toContain('SOP Draft Progress:');
  });

  it('3. Renders AI Voice Orb video element for audio walkthrough', () => {
    const html = renderToStaticMarkup(
      <StaffSOPTemplateModal isOpen={true} onClose={() => {}} workspaceId="nest-realty-wilmington" />
    );
    expect(html).toContain('/nest_ops_orb.mp4');
    expect(html).toContain('autoPlay=""');
    expect(html).toContain('muted=""');
    expect(html).toContain('loop=""');
    expect(html).toContain('playsInline=""');
  });

  it('4. Renders voice walkthrough trigger button with microphone icon', () => {
    const html = renderToStaticMarkup(
      <StaffSOPTemplateModal isOpen={true} onClose={() => {}} workspaceId="nest-realty-wilmington" />
    );
    expect(html).toContain('Start Audio Walkthrough with Lorena');
  });

  it('5. Renders live SOP document draft workspace panel sections', () => {
    const html = renderToStaticMarkup(
      <StaffSOPTemplateModal isOpen={true} onClose={() => {}} workspaceId="nest-realty-wilmington" />
    );
    expect(html).toContain('1. The Basics');
    expect(html).toContain('2. Step-by-Step Procedure');
    expect(html).toContain('Add Step');
  });

  it('6. Renders view mode toggle and close controls', () => {
    const html = renderToStaticMarkup(
      <StaffSOPTemplateModal isOpen={true} onClose={() => {}} workspaceId="nest-realty-wilmington" />
    );
    expect(html).toContain('Review draft');
  });

  it('7. Does not render when isOpen is false', () => {
    const html = renderToStaticMarkup(
      <StaffSOPTemplateModal isOpen={false} onClose={() => {}} workspaceId="nest-realty-wilmington" />
    );
    expect(html).toBe('');
  });
});
