/**
 * Bind address for the HTTP server.
 * Cloud Run sets APP_MODE=production and must listen on every interface.
 * Everywhere else the default is loopback unless HOST is set explicitly.
 */
export function selectListenHost(env: { HOST?: string; APP_MODE?: string; NODE_ENV?: string }): string {
  const explicit = typeof env.HOST === 'string' ? env.HOST.trim() : '';
  if (explicit) return explicit;
  if (env.APP_MODE === 'production') return '0.0.0.0';
  return '127.0.0.1';
}
