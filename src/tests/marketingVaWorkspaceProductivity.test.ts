import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('VA Workspace Productivity Hub & Task Workstation Test Suite', () => {
  it('1. Verifies VAWorkspaceView contains interactive master task table and workstation panels', () => {
    const filePath = path.resolve(process.cwd(), 'src/components/marketing/VAWorkspaceView.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Master Table Headers
    expect(content).toContain('Task ID');
    expect(content).toContain('Required Deliverables');
    expect(content).toContain('AI Recommendation');
    expect(content).toContain('Due Time');

    // 4 Workstation Tabs
    expect(content).toContain('1. Deliverables & Copy');
    expect(content).toContain('2. Photos & Media');
    expect(content).toContain('3. Brand SOP Checklist');
    expect(content).toContain('4. Proof & Staging');

    // Key Actions
    expect(content).toContain('Requester');
    expect(content).toContain('Copy Link');
    expect(content).toContain('Submit Proof for Review');
    expect(content).toContain('Copy All Details');
  });

  it('2. Verifies pre-populated real listing tasks (1104 Arboretum, 304 Ocean, 990 Inspiration, 312 Mayfaire)', () => {
    const filePath = path.resolve(process.cwd(), 'src/components/marketing/VAWorkspaceView.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('1104 Arboretum Dr');
    expect(content).toContain('Jessica Keenan');
    expect(content).not.toContain('Sarah Jenkins');
    expect(content).toContain('304 Ocean Blvd');
    expect(content).toContain('Eric Miller');
    expect(content).toContain('990 Inspiration Drive');
    expect(content).toContain('Melissa Gagliardi');
    expect(content).toContain('312 Mayfaire Way');
    expect(content).toContain('Ann Gunn');
  });

  it('3. Verifies strictly zero sparkles icons in VAWorkspaceView.tsx', () => {
    const filePath = path.resolve(process.cwd(), 'src/components/marketing/VAWorkspaceView.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Ensure sparkles icon is never rendered in JSX
    expect(content).not.toContain('<Sparkles');
    expect(content).not.toContain('<SparklesIcon');
  });
});
