/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const APP_BASE_URL = (import.meta as any).env?.VITE_APP_BASE_URL || 'http://localhost:3000';
export const DEMO_BASE_PATH = (import.meta as any).env?.VITE_DEMO_BASE_PATH || '/demo';
export const TEST_BASE_URL = (import.meta as any).env?.VITE_TEST_BASE_URL || 'http://localhost:3000/demo';
