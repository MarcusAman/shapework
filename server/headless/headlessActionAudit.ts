/**
 * Secure logging helper that masks PII and secret tokens in descriptions.
 */
export function maskPII(text: string): string {
  if (!text) return text;
  let masked = text;

  // Mask email addresses (e.g. sarah.j@nest-demo.local -> s***@nest-demo.local)
  masked = masked.replace(/([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, (match, emailUser, emailDomain) => {
    if (emailUser.length <= 1) return `*@${emailDomain}`;
    return `${emailUser[0]}***@${emailDomain}`;
  });

  // Mask phone numbers (e.g. +19195550101 -> +1***0101 or 919-555-0101 -> ***-***-0101)
  masked = masked.replace(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, (match) => {
    const clean = match.replace(/[-.\s()]/g, '');
    if (clean.length >= 4) {
      return `***-***-${clean.slice(-4)}`;
    }
    return '***-***-****';
  });

  // Mask hexadecimal tokens of length 64 (sha256) or 32
  masked = masked.replace(/\b[a-fA-F0-9]{32,64}\b/g, (match) => {
    return `${match.substring(0, 8)}...[masked]`;
  });

  return masked;
}

export function logHeadlessAudit(
  dbState: any,
  userName: string,
  userRole: string,
  description: string,
  category: string
) {
  if (!dbState.auditEvents) dbState.auditEvents = [];
  
  const cleanDescription = maskPII(description);
  
  const event = {
    id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    user_name: userName,
    user_role: userRole,
    action_description: cleanDescription,
    impact_area: category.toLowerCase(),
    action: cleanDescription,
    actor: userName,
    system: 'shapework',
    target_record: '',
    metadata: {}
  };
  dbState.auditEvents.unshift(event);
}
