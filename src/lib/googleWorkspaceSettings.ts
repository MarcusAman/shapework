/** Keep Google authorization in Workspace settings, retaining the current workspace. */
export function googleWorkspaceSettingsHref(): string {
  const location = typeof window === 'undefined' ? null : window.location;
  const prefix = location?.pathname.startsWith('/demo') ? '/demo' : '/app';
  const params = new URLSearchParams();
  const workspace = location && new URLSearchParams(location.search).get('workspace');
  if (workspace) params.set('workspace', workspace);
  params.set('settingsTab', 'tools');
  params.set('integration', 'google');
  return `${prefix}/settings?${params}`;
}
