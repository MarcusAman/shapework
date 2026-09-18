import { describe, it, expect } from 'vitest';
import { NoraCapabilitiesAuditService } from '../../server/services/noraCapabilitiesAuditService';

describe('Nora Capabilities, Skills Matrix & Live Audit Suite', () => {
  it('1. Returns all registered active and gap skills with capabilities', () => {
    const skills = NoraCapabilitiesAuditService.getSkills();
    expect(skills.length).toBeGreaterThanOrEqual(10);

    const ncrecSkill = skills.find(s => s.id === 'skill_ncrec_statutory_grounding');
    expect(ncrecSkill).toBeDefined();
    expect(ncrecSkill?.status).toBe('active');
    expect(ncrecSkill?.capabilities.length).toBeGreaterThan(0);

    const gdriveSkill = skills.find(s => s.id === 'skill_google_workspace_vaults');
    expect(gdriveSkill).toBeDefined();
    expect(gdriveSkill?.status).toBe('active');

    // Verify gap skills are identified
    const docusignGap = skills.find(s => s.id === 'skill_docusign_direct_bridge');
    expect(docusignGap).toBeDefined();
    expect(docusignGap?.status).toBe('gap_missing');

    const showingActive = skills.find(s => s.id === 'skill_showingtime_lockbox_bridge');
    expect(showingActive).toBeDefined();
    expect(showingActive?.status).toBe('active');
  });

  it('2. Returns connected and recommended integration registries', () => {
    const connections = NoraCapabilitiesAuditService.getConnections();
    expect(connections.length).toBeGreaterThanOrEqual(6);

    const gws = connections.find(c => c.id === 'conn_google_workspace');
    expect(gws).toBeDefined();
    expect(gws?.status).toBe('connected');
    expect(gws?.featuresSupported.length).toBeGreaterThan(0);

    const docuSign = connections.find(c => c.id === 'conn_docusign');
    expect(docuSign).toBeDefined();
    expect(docuSign?.status).toBe('recommended');
  });

  it('3. Returns high-impact capability upgrade suggestions', () => {
    const suggestions = NoraCapabilitiesAuditService.getSuggestions();
    expect(suggestions.length).toBeGreaterThanOrEqual(4);

    const showingSug = suggestions.find(s => s.id === 'sug_showingtime_sync');
    expect(showingSug).toBeDefined();
    expect(showingSug?.impactScore).toBeGreaterThanOrEqual(90);
    expect(showingSug?.deliverables.length).toBeGreaterThan(0);
  });

  it('4. Executes live diagnostic audit across all 9 systems with 100% pass rate', async () => {
    const report = await NoraCapabilitiesAuditService.runFullDiagnosticAudit();
    expect(report).toBeDefined();
    expect(report.totalSystemsAudited).toBe(9);
    expect(report.passedCount).toBe(9);
    expect(report.failedCount).toBe(0);
    expect(report.overallScore).toBe(100);
    expect(report.averageLatencyMs).toBeLessThan(1000);
    expect(report.diagnostics.length).toBe(9);

    // Verify specific diagnostic systems passed
    const driveDiag = report.diagnostics.find(d => d.systemId === 'audit_google_drive');
    expect(driveDiag?.status).toBe('passed');

    const stDiag = report.diagnostics.find(d => d.systemId === 'audit_showingtime_supra');
    expect(stDiag?.status).toBe('passed');

    const netSheetDiag = report.diagnostics.find(d => d.systemId === 'audit_net_sheet_math');
    expect(netSheetDiag?.status).toBe('passed');

    const ncrecDiag = report.diagnostics.find(d => d.systemId === 'audit_ncrec_grounding');
    expect(ncrecDiag?.status).toBe('passed');
  });
});
