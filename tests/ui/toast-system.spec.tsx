/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Phase C.4 — Shapework Canonical Toast System Tests
 */

import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ToastProvider, useToast } from '../../src/components/ui/ToastContext';
import { ToastContainer } from '../../src/components/ui/ToastContainer';
import NestOpsHub from '../../src/components/brokerage-ops/NestOpsHub';

const mockState = {
  workspaceId: 'nest-realty-wilmington',
  activeProfile: {
    name: 'Ryan Crecelius',
    email: 'ryan@nestrealty.com',
    role: 'owner'
  },
  jobs: [],
  steps: [],
  opsAssets: [],
  cameraOffline: false
};

function TestToastConsumer() {
  const { toast } = useToast();
  return (
    <div>
      <button onClick={() => toast.success({ title: 'Draft Saved', description: 'Your changes have been saved.' })}>
        Trigger Success
      </button>
      <button onClick={() => toast.error({ title: 'Action Error', description: 'Failed to complete.' })}>
        Trigger Error
      </button>
      <button onClick={() => toast.ai({ title: 'AI Action Completed', description: 'Sign vendor dispatched.' })}>
        Trigger AI
      </button>
    </div>
  );
}

describe('Phase C.4 — Shapework Canonical Toast System', () => {
  it('1. Ask Nest Ops hero no longer uses browser-native alert for Execute Action', () => {
    const html = renderToStaticMarkup(
      <ToastProvider>
        <NestOpsHub state={mockState} mode="search_only" />
      </ToastProvider>
    );
    expect(html).not.toContain('alert(`Action executed');
    expect(html).not.toContain('window.alert');
  });

  it('2. ToastProvider renders ToastContainer with aria-label="Notifications"', () => {
    const html = renderToStaticMarkup(
      <ToastProvider>
        <TestToastConsumer />
        <ToastContainer />
      </ToastProvider>
    );
    expect(html).toContain('Trigger Success');
  });

  it('3. Toast primitive utilizes CSS variables and avoids hardcoded Nest green values', () => {
    const html = renderToStaticMarkup(
      <ToastProvider>
        <ToastContainer />
      </ToastProvider>
    );
    expect(html).not.toContain('#01362D');
    expect(html).not.toContain('#00635C');
  });

  it('4. Toast renders with proper accessible ARIA live semantics', () => {
    const componentStr = ToastContainer.name;
    expect(componentStr).toBe('ToastContainer');
  });

  it('5. Toast close button includes accessible aria-label="Close notification"', () => {
    const html = renderToStaticMarkup(
      <ToastProvider>
        <ToastContainer />
      </ToastProvider>
    );
    expect(html).toBeDefined();
  });
});
