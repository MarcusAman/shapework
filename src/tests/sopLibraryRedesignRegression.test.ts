import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { getProductProfile } from '../config/productProfiles';
import { SOP_TEMPLATES } from '../components/sops/sopTemplates';

describe('SOP Library Redesign & Phone Number Removal Regression', () => {
  it('verifies productProfiles assigns the clean customer-facing name "Knowledge Library"', () => {
    const profile = getProductProfile('ryan@nestrealty.com', 'owner', 'nest-realty-wilmington');
    expect(profile).toBeDefined();

    const sopModule = profile.modules.find(m => m.moduleId === 'sops');
    expect(sopModule).toBeDefined();
    expect(sopModule?.name).toBe('Knowledge Library');
  });

  it('verifies AppShell does not import or render GlobalNoraVoiceBar', () => {
    const appShellPath = path.resolve(process.cwd(), 'src/components/layout/AppShell.tsx');
    const appShellContent = fs.readFileSync(appShellPath, 'utf-8');

    expect(appShellContent).not.toContain('<GlobalNoraVoiceBar');
    expect(appShellContent).not.toContain("import GlobalNoraVoiceBar from '../voice/GlobalNoraVoiceBar'");
    // NoraVoiceDrawer should remain for intentional triggers
    expect(appShellContent).toContain('<NoraVoiceDrawer');
  });

  it('verifies the unowned phone number (910) 275-6672 is completely eradicated from client and server sources', () => {
    const filesToCheck = [
      'server.ts',
      'server/knowledge/ask_nest_ops_retell_agent_prompt.md',
      'server/knowledge/ask_nest_ops_retell_sop_knowledge_base.md',
      'src/components/layout/TopBar.tsx',
      'src/components/voice/NoraVoiceDrawer.tsx',
      'src/components/voice/GlobalNoraVoiceBar.tsx',
      'src/components/shared/ContactSupportModal.tsx',
      'src/components/pitch-demo/LiveDemoIntro.tsx',
      'src/components/pitch-demo/AgentRequestPanel.tsx',
      'src/components/demo/PitchAhaDemoModal.tsx',
      'src/components/brokerage-ops/NestOpsHub.tsx',
      'src/components/sops/SOPLibrary.tsx',
      'src/components/sops/SOPCreateMenu.tsx',
      'src/components/sops/AskToDocumentModal.tsx'
    ];

    for (const relPath of filesToCheck) {
      const fullPath = path.resolve(process.cwd(), relPath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        expect(content).not.toContain('275-6672');
        expect(content).not.toContain('9102756672');
        expect(content).not.toContain('ASK-NORA');
      }
    }
  });

  it('verifies SOPCreateMenu provides light-mode Build it with NORA, Upload Document, and template options', () => {
    const menuPath = path.resolve(process.cwd(), 'src/components/sops/SOPCreateMenu.tsx');
    const content = fs.readFileSync(menuPath, 'utf-8');

    expect(content).toContain('Build it with NORA');
    expect(content).toContain('Create an SOP');
    expect(content).toContain('Choose how you’d like to begin.');
    expect(content).toContain('Upload Document');
    expect(content).toContain('Use a Template');
    expect(content).toContain('Start Blank');
    expect(content).toContain('Duplicate Existing SOP');
    expect(content).not.toContain('bg-[#01362D]');
    expect(content).not.toContain('bg-[#012a23]');
  });

  it('verifies TopBar and SOPLibrary integrate Knowledge Library naming and Upload Document actions', () => {
    const topBarPath = path.resolve(process.cwd(), 'src/components/layout/TopBar.tsx');
    const topBarContent = fs.readFileSync(topBarPath, 'utf-8');
    expect(topBarContent).toContain('Knowledge Library');
    expect(topBarContent).toContain('Upload SOP Document');
    expect(topBarContent).toContain('Invite Staff to Document an SOP');

    const libPath = path.resolve(process.cwd(), 'src/components/sops/SOPLibrary.tsx');
    const content = fs.readFileSync(libPath, 'utf-8');

    expect(content).toContain('role="tablist"');
    expect(content).toContain('role="tab"');
    // Ensure no black pill styling in tabs
    expect(content).not.toContain('bg-stone-900 text-white shadow-sm');
  });

  it('verifies ActiveRunsDashboard has hideKpis prop and no SLA jargon in customer copy', () => {
    const activePath = path.resolve(process.cwd(), 'src/components/sops/ActiveRunsDashboard.tsx');
    const content = fs.readFileSync(activePath, 'utf-8');

    expect(content).toContain('hideKpis');
    expect(content).toContain('Needs Attention');
    expect(content).not.toContain('Turnaround SLA delays');
  });

  it('verifies standard templates exist and have valid structure', () => {
    expect(SOP_TEMPLATES.length).toBeGreaterThanOrEqual(4);
    for (const tmpl of SOP_TEMPLATES) {
      expect(tmpl.id).toBeDefined();
      expect(tmpl.title).toBeDefined();
      expect(tmpl.steps.length).toBeGreaterThan(0);
    }
  });
});
