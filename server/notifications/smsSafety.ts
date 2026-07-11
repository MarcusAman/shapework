/**
 * Helper to mask phone numbers and verify allowlist status.
 */
export function maskPhoneNumber(phone: string): string {
  if (!phone) return '';
  const clean = phone.replace(/[-.\s()]/g, '');
  if (clean.length >= 4) {
    return `***-***-${clean.slice(-4)}`;
  }
  return '***-***-****';
}

export function isPhoneAllowlisted(phone: string, allowlistStr: string): boolean {
  if (!allowlistStr) return false;
  const allowlist = allowlistStr.split(',').map(num => num.trim()).filter(Boolean);
  return allowlist.includes(phone);
}
