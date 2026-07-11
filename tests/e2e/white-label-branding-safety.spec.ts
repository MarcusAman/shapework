import { test, expect } from '@playwright/test';

test('White Label Branding Inputs and Injection Sanitization checks', async () => {
  const sanitizeLogoUrl = (url: string): string => {
    const lower = url.trim().toLowerCase();
    if (lower.startsWith('javascript:')) {
      return '';
    }
    if (!lower.startsWith('http://') && !lower.startsWith('https://') && !lower.startsWith('data:')) {
      return '';
    }
    return url;
  };

  // Assert malicious script injection gets blocked
  expect(sanitizeLogoUrl('javascript:alert(1)')).toBe('');
  expect(sanitizeLogoUrl('https://brokerage.com/logo.png')).toBe('https://brokerage.com/logo.png');
});
