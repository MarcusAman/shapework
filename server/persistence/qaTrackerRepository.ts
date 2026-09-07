import fs from 'fs';
import path from 'path';

export interface QaIssue {
  id: string;
  dateReported: string;
  reportedBy: string;
  areaModule: string;
  summary: string;
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'New' | 'In Progress' | 'In Review' | 'Resolved' | 'Closed' | 'Won\'t Fix';
  owner: string;
  dateResolved?: string;
  resolutionNotes?: string;
  screenshotLink?: string;
  relatedComponent?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QaFeatureIdea {
  id: string;
  dateAdded: string;
  addedBy: string;
  areaModule: string;
  idea: string;
  problemSolved: string;
  valueImpact: 'High' | 'Medium' | 'Low';
  effort: 'XS' | 'S' | 'M' | 'L' | 'XL';
  status: 'New' | 'Planned' | 'In Development' | 'Completed' | 'Deferred';
  owner: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_ISSUES: QaIssue[] = [
  {
    id: 'ISS-001',
    dateReported: '2026-08-13',
    reportedBy: 'Matt',
    areaModule: 'Role & Escalation Map',
    summary: 'Need ability to "Edit" the cards once clicked on',
    description: 'Allow inline editing of escalation role cards directly from modal preview.',
    severity: 'Medium',
    status: 'Resolved',
    owner: 'Marcus',
    dateResolved: '2026-08-18',
    resolutionNotes: 'Added 2-way sync interactive role card editing drawer in RoleEscalationMapPage for all delegation, responsibility tags, backup handlers, and escalation thresholds.',
    screenshotLink: '',
    relatedComponent: 'RoleEscalationMapPage.tsx',
    createdAt: '2026-08-13T10:00:00Z',
    updatedAt: '2026-08-18T12:00:00Z'
  },
  {
    id: 'ISS-002',
    dateReported: '2026-08-13',
    reportedBy: 'Matt',
    areaModule: 'SOP Builder',
    summary: 'Ability to "Delete" Draft SOPs',
    description: 'After completing a creation, there is not an option to delete a draft of the SOP.',
    severity: 'Medium',
    status: 'Resolved',
    owner: 'Marcus',
    dateResolved: '2026-08-16',
    resolutionNotes: 'Added draft deletion capability and revoke action in SOP Library and Studio.',
    screenshotLink: 'https://drive.google.com/file/d/17sb6Lh0aAGtqGRITkstsGeIN8AVMZpj4/view?usp=drive_link',
    relatedComponent: 'SOPStudio.tsx / SOPLibrary.tsx',
    createdAt: '2026-08-13T10:15:00Z',
    updatedAt: '2026-08-16T16:00:00Z'
  },
  {
    id: 'ISS-003',
    dateReported: '2026-08-13',
    reportedBy: 'Matt',
    areaModule: 'Role & Escalation Map',
    summary: 'Print Map Header Clipping',
    description: 'When you hit Print Map, the document produced cuts off the top of the graph.',
    severity: 'Low',
    status: 'Resolved',
    owner: 'Marcus',
    dateResolved: '2026-08-18',
    resolutionNotes: 'Fixed print stylesheet with 10mm margins, landscape orientation, and dedicated non-clipping printable header.',
    screenshotLink: '',
    relatedComponent: 'RoleEscalationMapPage.tsx',
    createdAt: '2026-08-13T10:30:00Z',
    updatedAt: '2026-08-18T12:00:00Z'
  },
  {
    id: 'ISS-004',
    dateReported: '2026-08-13',
    reportedBy: 'Matt',
    areaModule: 'Role & Escalation Map',
    summary: 'Position View Responsibilities Click-Through',
    description: 'Should "Responsibilities" be a click through to see what they are or edit?',
    severity: 'Low',
    status: 'Resolved',
    owner: 'Marcus',
    dateResolved: '2026-08-18',
    resolutionNotes: 'Enabled interactive click-through on responsibility tags across Role Cards and Position Views opening dedicated Duty Detail modal.',
    screenshotLink: '',
    relatedComponent: 'RoleEscalationMapPage.tsx',
    createdAt: '2026-08-13T11:00:00Z',
    updatedAt: '2026-08-18T12:00:00Z'
  },
  {
    id: 'ISS-005',
    dateReported: '2026-08-13',
    reportedBy: 'Matt',
    areaModule: 'Role & Escalation Map',
    summary: '"Reports to" hierarchy persistence on logout',
    description: 'When you change a Reporting to line in a card, it doesn\'t save when logout and comeback. Tried to change Lindsey from Reporting to Eric Knight to Ryan.',
    severity: 'Medium',
    status: 'Resolved',
    owner: 'Marcus',
    dateResolved: '2026-08-18',
    resolutionNotes: 'Wired supervisory "Reports To" hierarchy dropdown with durable 2-way sync to orgChartService and persistent storage.',
    screenshotLink: '',
    relatedComponent: 'orgChartService.ts / RoleEscalationMapPage.tsx',
    createdAt: '2026-08-13T11:30:00Z',
    updatedAt: '2026-08-18T12:00:00Z'
  },
  {
    id: 'ISS-006',
    dateReported: '2026-08-13',
    reportedBy: 'Matt',
    areaModule: 'Role & Escalation Map',
    summary: 'Request Routing - Delete Rule Capability',
    description: 'In Request Routing, should be able to delete a rule?',
    severity: 'Medium',
    status: 'Resolved',
    owner: 'Marcus',
    dateResolved: '2026-08-18',
    resolutionNotes: 'Added route rule deletion with instant state removal and toast audit in Request Routing matrix.',
    screenshotLink: '',
    relatedComponent: 'RoleEscalationMapPage.tsx',
    createdAt: '2026-08-13T12:00:00Z',
    updatedAt: '2026-08-18T12:00:00Z'
  },
  {
    id: 'ISS-007',
    dateReported: '2026-08-13',
    reportedBy: 'Matt',
    areaModule: 'Directory',
    summary: 'Directory Profile Info Editing not Updating Card',
    description: 'When you "edit" and add information, it does not add to the card when you click on it.',
    severity: 'Medium',
    status: 'Resolved',
    owner: 'Marcus',
    dateResolved: '2026-08-18',
    resolutionNotes: 'Fixed WorkspaceDirectoryPage person save callback to immediately mutate local directory state and synchronize selected profile modal.',
    screenshotLink: '',
    relatedComponent: 'WorkspaceDirectoryPage.tsx',
    createdAt: '2026-08-13T12:30:00Z',
    updatedAt: '2026-08-18T12:00:00Z'
  },
  {
    id: 'ISS-008',
    dateReported: '2026-08-14',
    reportedBy: 'Matt',
    areaModule: 'Directory',
    summary: 'Profile Photo URL Upload Handling',
    description: 'Tried to put in a photo using this URL, but it did not update the picture for the profile.',
    severity: 'Low',
    status: 'Resolved',
    owner: 'Marcus',
    dateResolved: '2026-08-18',
    resolutionNotes: 'Added dual image URL and local file upload (base64 Data URL) picker with live avatar preview and clear actions.',
    screenshotLink: '',
    relatedComponent: 'WorkspaceDirectoryPage.tsx',
    createdAt: '2026-08-14T09:00:00Z',
    updatedAt: '2026-08-18T12:00:00Z'
  },
  {
    id: 'ISS-009',
    dateReported: '2026-08-14',
    reportedBy: 'Matt',
    areaModule: 'Marketing Intake',
    summary: 'New Marketing Request Button Verbiage & Fields',
    description: 'When open it says Request Marketing Change (different verbiage) - also let\'s discuss what this is actually, if requesting a new marketing piece we should probably add fields to this.',
    severity: 'Medium',
    status: 'Resolved',
    owner: 'Marcus',
    dateResolved: '2026-08-18',
    resolutionNotes: 'Standardized button verbiage to "New Marketing Request" and expanded modal with Request Type, Property Address, and Directives.',
    screenshotLink: 'https://drive.google.com/file/d/1NPWA3gLjdzGTeQtqt2n9s1hvUJ32eNgO/view?usp=drive_link',
    relatedComponent: 'MarketingIntakeConsole.tsx',
    createdAt: '2026-08-14T09:30:00Z',
    updatedAt: '2026-08-18T12:00:00Z'
  },
  {
    id: 'ISS-010',
    dateReported: '2026-08-14',
    reportedBy: 'Matt',
    areaModule: 'Marketing Intake',
    summary: 'Work Board / All Stages Project Click-Through',
    description: 'When you click all stages, should we be able to click on each project inside the stage boxes?',
    severity: 'Medium',
    status: 'Resolved',
    owner: 'Marcus',
    dateResolved: '2026-08-18',
    resolutionNotes: 'Made all stage cards in Work Board / All Stages interactive and clickable directly into package review and delivery flows.',
    screenshotLink: '',
    relatedComponent: 'MarketingHomeInbox.tsx / MarketingIntakeConsole.tsx',
    createdAt: '2026-08-14T10:00:00Z',
    updatedAt: '2026-08-18T12:00:00Z'
  },
  {
    id: 'ISS-011',
    dateReported: '2026-08-14',
    reportedBy: 'Matt',
    areaModule: 'Authentication',
    summary: 'Reset Password at Login Email Delivery',
    description: 'Tried to reset my password for personal login and does not send anything to my email.',
    severity: 'Medium',
    status: 'Resolved',
    owner: 'Marcus',
    dateResolved: '2026-08-18',
    resolutionNotes: 'Implemented dual-mode password reset with simulated email dispatch and instant on-screen copyable reset token banner for pilot testing.',
    screenshotLink: '',
    relatedComponent: 'PublicForgotPassword.tsx / invitationService.ts',
    createdAt: '2026-08-14T10:30:00Z',
    updatedAt: '2026-08-18T12:00:00Z'
  },
  {
    id: 'ISS-012',
    dateReported: '2026-08-14',
    reportedBy: 'Matt',
    areaModule: 'SOP Builder',
    summary: 'AI Voice & Text Conversation Interpretation Speed & Fidelity',
    description: 'Not recognizing sentences correctly or maybe interpreting what is said. It takes answers verbatim and slow to reply once you get about 2 questions in.',
    severity: 'Medium',
    status: 'Resolved',
    owner: 'Marcus',
    dateResolved: '2026-08-16',
    resolutionNotes: 'Migrated NORA to ElevenLabs WebSocket Conversational AI with server turn owner and barge-in VAD for instant response.',
    screenshotLink: '',
    relatedComponent: 'useNoraOmnichannelSession.ts / EmployeeAuthoringPortal.tsx',
    createdAt: '2026-08-14T11:00:00Z',
    updatedAt: '2026-08-16T18:00:00Z'
  },
  {
    id: 'ISS-013',
    dateReported: '2026-08-14',
    reportedBy: 'Matt',
    areaModule: 'SOP Builder',
    summary: 'Step-by-step procedure wizard transition to Decision Rules',
    description: 'When putting in the Step-by-step procedure you can\'t get out once done entering the steps, does not go to Decision Rules and Exceptions.',
    severity: 'High',
    status: 'Resolved',
    owner: 'Marcus',
    dateResolved: '2026-08-16',
    resolutionNotes: 'Updated step wizard transition logic and rebuilt modal controls with explicit Next Stage button in SOPStudio.',
    screenshotLink: '',
    relatedComponent: 'SOPStudio.tsx / SOPWizard.tsx',
    createdAt: '2026-08-14T11:30:00Z',
    updatedAt: '2026-08-16T18:30:00Z'
  },
  {
    id: 'ISS-014',
    dateReported: '2026-08-14',
    reportedBy: 'Matt',
    areaModule: 'SOP Builder',
    summary: 'Review Draft - Save Draft and Publish Persistence',
    description: '"Save Draft" button does not work, can only publish the SOP, Publish SOP does not save either.',
    severity: 'Medium',
    status: 'Resolved',
    owner: 'Marcus',
    dateResolved: '2026-08-16',
    resolutionNotes: 'Wired single-source API save and publish endpoints to durable SOP repository with toast feedback.',
    screenshotLink: '',
    relatedComponent: 'SOPStudio.tsx / sopRepository.ts',
    createdAt: '2026-08-14T12:00:00Z',
    updatedAt: '2026-08-16T19:00:00Z'
  },
  {
    id: 'ISS-015',
    dateReported: '2026-08-14',
    reportedBy: 'Matt',
    areaModule: 'Role & Escalation Map',
    summary: 'Escalation Map Font Colors and Contrast',
    description: 'Need to use a different color, lighter green / neon makes text blurry on dark cards.',
    severity: 'Low',
    status: 'Resolved',
    owner: 'Marcus',
    dateResolved: '2026-08-16',
    resolutionNotes: 'Applied Apple light-mode typography tokens with dark neutral text on crisp white surfaces (#FFFFFF on #F7F8F5).',
    screenshotLink: 'https://drive.google.com/file/d/15W6Wzf7PC0KxYNQ8aG8Xu35wDX4sIAiB/view?usp=drive_link',
    relatedComponent: 'RoleEscalationMapPage.tsx',
    createdAt: '2026-08-14T12:30:00Z',
    updatedAt: '2026-08-16T19:30:00Z'
  },
  {
    id: 'ISS-016',
    dateReported: '2026-08-14',
    reportedBy: 'Matt',
    areaModule: 'Ask Nest Ops',
    summary: 'AI Voice SOP Guide Playback Cutoff',
    description: 'AI just starts reading the SOP rather than having deciphered it, and only makes it to step #1 then cuts off.',
    severity: 'Medium',
    status: 'Resolved',
    owner: 'Marcus',
    dateResolved: '2026-08-16',
    resolutionNotes: 'Refactored NORA SOP Guide with active step execution, natural summary explanation, and multi-turn audio streaming.',
    screenshotLink: 'https://drive.google.com/file/d/1RBlVw3m6Cebx38SWGDksDhnoLISGj6xY/view?usp=drive_link',
    relatedComponent: 'useNoraOmnichannelSession.ts / NoraVoiceDrawer.tsx',
    createdAt: '2026-08-14T13:00:00Z',
    updatedAt: '2026-08-16T20:00:00Z'
  },
  {
    id: 'ISS-017',
    dateReported: '2026-08-14',
    reportedBy: 'Matt',
    areaModule: 'Directory',
    summary: 'Directory Dropdown Font Colors',
    description: 'Need to change the font color in the box for the Office, Type, BIC, Contact dropdowns.',
    severity: 'Low',
    status: 'Resolved',
    owner: 'Marcus',
    dateResolved: '2026-08-16',
    resolutionNotes: 'Standardized dropdown styling to 42px light containers with stone-800 text.',
    screenshotLink: 'https://drive.google.com/file/d/1hgQslYhWtYODsrD66tjSuUnGbSBPknw-/view?usp=drive_link',
    relatedComponent: 'WorkspaceDirectoryPage.tsx',
    createdAt: '2026-08-14T13:30:00Z',
    updatedAt: '2026-08-16T20:30:00Z'
  },
  {
    id: 'ISS-018',
    dateReported: '2026-08-14',
    reportedBy: 'Matt',
    areaModule: 'Owner Briefing',
    summary: 'Owner Brief Category Click-Through Navigation',
    description: 'Do we want each box / category to be "clickable" to go to these items?',
    severity: 'Low',
    status: 'Resolved',
    owner: 'Marcus',
    dateResolved: '2026-08-18',
    resolutionNotes: 'Added interactive click-through navigation to all summary metrics, categories, and escalation cards in Owner Weekly Brief.',
    screenshotLink: '',
    relatedComponent: 'OwnerWeeklyBriefPage.tsx',
    createdAt: '2026-08-14T14:00:00Z',
    updatedAt: '2026-08-18T12:00:00Z'
  },
  {
    id: 'ISS-019',
    dateReported: '2026-08-14',
    reportedBy: 'Matt',
    areaModule: 'Org Chart',
    summary: 'Add Team Member Role Options Flexibility',
    description: 'When adding team member, should not be limited to just these 4 options.',
    severity: 'Medium',
    status: 'Resolved',
    owner: 'Marcus',
    dateResolved: '2026-08-18',
    resolutionNotes: 'Added custom role creation form with free-text title, department picker, and expanded 8-preset template library.',
    screenshotLink: 'https://drive.google.com/file/d/1-GAYfdQS9uJluQsHQHM-CNv5AaYxeipu/view?usp=drive_link',
    relatedComponent: 'OrgChartWizardPage.tsx / RoleEscalationMapPage.tsx',
    createdAt: '2026-08-14T14:30:00Z',
    updatedAt: '2026-08-18T12:00:00Z'
  },
  {
    id: 'ISS-020',
    dateReported: '2026-08-14',
    reportedBy: 'Matt',
    areaModule: 'Org Chart',
    summary: 'Org Chart vs Interactive Map Differentiation',
    description: 'Need to discuss this tab, as we have the Interactive Map and then directory so what is this doing that\'s different?',
    severity: 'Low',
    status: 'Resolved',
    owner: 'Marcus',
    dateResolved: '2026-08-18',
    resolutionNotes: 'Added clear visual differentiation banners and tooltips distinguishing operational Interactive Map from supervisory Org Chart.',
    screenshotLink: '',
    relatedComponent: 'OrgChartWizardPage.tsx / RoleEscalationMapPage.tsx',
    createdAt: '2026-08-14T15:00:00Z',
    updatedAt: '2026-08-18T12:00:00Z'
  },
  {
    id: 'ISS-021',
    dateReported: '2026-08-14',
    reportedBy: 'Matt',
    areaModule: 'Role & Escalation Map',
    summary: 'Escalation Map Overview Tab Clickability',
    description: 'Can we make the overview summary cards and nodes clickable into detail views?',
    severity: 'Low',
    status: 'Resolved',
    owner: 'Marcus',
    dateResolved: '2026-08-18',
    resolutionNotes: 'Made Overview tab KPI metric tiles and department cards clickable to filter and drill down into By Position view.',
    screenshotLink: '',
    relatedComponent: 'RoleEscalationMapPage.tsx',
    createdAt: '2026-08-14T15:30:00Z',
    updatedAt: '2026-08-18T12:00:00Z'
  },
  {
    id: 'ISS-022',
    dateReported: '2026-08-14',
    reportedBy: 'Matt',
    areaModule: 'Role & Escalation Map',
    summary: 'By Position "View Details" and Duty Assignment',
    description: 'View Details does not work, should we have this with a filter to select? If we "View Details" is this where we could add duties?',
    severity: 'High',
    status: 'Resolved',
    owner: 'Marcus',
    dateResolved: '2026-08-18',
    resolutionNotes: 'Built Position Details & Duty Assignment Drawer with duty inspection and department allocation.',
    screenshotLink: '',
    relatedComponent: 'RoleEscalationMapPage.tsx',
    createdAt: '2026-08-14T16:00:00Z',
    updatedAt: '2026-08-18T12:00:00Z'
  },
  {
    id: 'ISS-023',
    dateReported: '2026-08-14',
    reportedBy: 'Matt',
    areaModule: 'Role & Escalation Map',
    summary: 'Add Route Rule Button & Deletion',
    description: 'Add Route Rule button does not work. Let\'s discuss this screen, not sure what it is doing. Need ability to delete route?',
    severity: 'Low',
    status: 'Resolved',
    owner: 'Marcus',
    dateResolved: '2026-08-18',
    resolutionNotes: 'Wired Add Route Rule button to interactive modal with SLA, primary, and backup role inputs.',
    screenshotLink: '',
    relatedComponent: 'RoleEscalationMapPage.tsx',
    createdAt: '2026-08-14T16:30:00Z',
    updatedAt: '2026-08-18T12:00:00Z'
  },
  {
    id: 'ISS-024',
    dateReported: '2026-08-14',
    reportedBy: 'Matt',
    areaModule: 'Role & Escalation Map',
    summary: 'Connected Tools Add Button Link Redirection',
    description: 'When you click add in Connected Tools, it takes you to adding a team member instead of a tool integration.',
    severity: 'Low',
    status: 'Resolved',
    owner: 'Marcus',
    dateResolved: '2026-08-18',
    resolutionNotes: 'Added "+ Add Tool Integration" modal in Connected Tools tab with software category, protocol, and description fields.',
    screenshotLink: '',
    relatedComponent: 'RoleEscalationMapPage.tsx',
    createdAt: '2026-08-14T17:00:00Z',
    updatedAt: '2026-08-18T12:00:00Z'
  }
];

const DEFAULT_FEATURES: QaFeatureIdea[] = [
  {
    id: 'FEAT-001',
    dateAdded: '2026-08-10',
    addedBy: 'Adam',
    areaModule: 'Dashboard & Briefing',
    idea: 'Weekly Owner Digest Email',
    problemSolved: 'Owners want a Monday morning email summarizing open requests, overdue items, and what got resolved last week. Saves them from needing to log in daily.',
    valueImpact: 'High',
    effort: 'M',
    status: 'Planned',
    owner: 'Marcus',
    notes: 'Rollup logic implemented in OwnerWeeklyBriefPage. Add cron email dispatcher.',
    createdAt: '2026-08-10T09:00:00Z',
    updatedAt: '2026-08-16T10:00:00Z'
  }
];

class QaTrackerRepository {
  private dataDir = path.resolve(process.cwd(), 'data');
  private issuesFile = path.resolve(this.dataDir, 'qa_issues.json');
  private featuresFile = path.resolve(this.dataDir, 'qa_features.json');

  constructor() {
    this.ensureFiles();
  }

  private ensureFiles() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    if (!fs.existsSync(this.issuesFile)) {
      fs.writeFileSync(this.issuesFile, JSON.stringify(DEFAULT_ISSUES, null, 2));
    }
    if (!fs.existsSync(this.featuresFile)) {
      fs.writeFileSync(this.featuresFile, JSON.stringify(DEFAULT_FEATURES, null, 2));
    }
  }

  public async getAllIssues(): Promise<QaIssue[]> {
    try {
      this.ensureFiles();
      const content = fs.readFileSync(this.issuesFile, 'utf-8');
      return JSON.parse(content);
    } catch (err) {
      console.error('Failed to read QA issues:', err);
      return DEFAULT_ISSUES;
    }
  }

  public async createIssue(data: Partial<QaIssue>): Promise<QaIssue> {
    const issues = await this.getAllIssues();
    const nextNum = issues.length + 1;
    const newIssue: QaIssue = {
      id: `ISS-${String(nextNum).padStart(3, '0')}`,
      dateReported: data.dateReported || new Date().toISOString().split('T')[0],
      reportedBy: data.reportedBy || 'Matt',
      areaModule: data.areaModule || 'General',
      summary: data.summary || 'Untitled Issue',
      description: data.description || '',
      severity: data.severity || 'Medium',
      status: data.status || 'New',
      owner: data.owner || 'Marcus',
      dateResolved: data.dateResolved,
      resolutionNotes: data.resolutionNotes,
      screenshotLink: data.screenshotLink || '',
      relatedComponent: data.relatedComponent || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    issues.unshift(newIssue);
    fs.writeFileSync(this.issuesFile, JSON.stringify(issues, null, 2));
    return newIssue;
  }

  public async updateIssue(id: string, updates: Partial<QaIssue>): Promise<QaIssue | null> {
    const issues = await this.getAllIssues();
    const idx = issues.findIndex(i => i.id === id);
    if (idx === -1) return null;
    issues[idx] = {
      ...issues[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    fs.writeFileSync(this.issuesFile, JSON.stringify(issues, null, 2));
    return issues[idx];
  }

  public async getIssueById(id: string): Promise<QaIssue | null> {
    const issues = await this.getAllIssues();
    return issues.find(i => i.id === id) || null;
  }

  public async dispatchToAi(id: string): Promise<{ issue: QaIssue; prompt: string } | null> {
    const issue = await this.getIssueById(id);
    if (!issue) return null;

    const dispatchNote = `[Antigravity AI] Auto-dispatched on ${new Date().toISOString().split('T')[0]} for diagnosis and auto-fix.`;
    const updated = await this.updateIssue(id, {
      status: 'In Progress',
      owner: 'Marcus / Antigravity AI',
      resolutionNotes: issue.resolutionNotes ? `${issue.resolutionNotes} | ${dispatchNote}` : dispatchNote
    });

    const prompt = `Please fix QA Issue [${issue.id}] reported during pilot testing by ${issue.reportedBy}:
- Summary: ${issue.summary}
- Module: ${issue.areaModule}
- Severity: ${issue.severity}
- Description: ${issue.description}
${issue.screenshotLink ? `- Attached Screenshot: ${issue.screenshotLink}` : ''}
${issue.relatedComponent ? `- Target Component: ${issue.relatedComponent}` : ''}

Task Instructions:
1. Inspect the relevant frontend and backend code for the ${issue.areaModule} module.
2. Implement the required bugfix or feature according to the reproduction steps.
3. Ensure no regressions by running and passing all relevant Vitest test suites.
4. Update QA Issue ${issue.id} status to 'Resolved' with resolution notes.`;

    return {
      issue: updated!,
      prompt
    };
  }

  public async deleteIssue(id: string): Promise<boolean> {
    const issues = await this.getAllIssues();
    const filtered = issues.filter(i => i.id !== id);
    if (filtered.length === issues.length) return false;
    fs.writeFileSync(this.issuesFile, JSON.stringify(filtered, null, 2));
    return true;
  }

  public async getAllFeatures(): Promise<QaFeatureIdea[]> {
    try {
      this.ensureFiles();
      const content = fs.readFileSync(this.featuresFile, 'utf-8');
      return JSON.parse(content);
    } catch (err) {
      console.error('Failed to read QA feature ideas:', err);
      return DEFAULT_FEATURES;
    }
  }

  public async createFeature(data: Partial<QaFeatureIdea>): Promise<QaFeatureIdea> {
    const features = await this.getAllFeatures();
    const nextNum = features.length + 1;
    const newFeat: QaFeatureIdea = {
      id: `FEAT-${String(nextNum).padStart(3, '0')}`,
      dateAdded: data.dateAdded || new Date().toISOString().split('T')[0],
      addedBy: data.addedBy || 'Adam',
      areaModule: data.areaModule || 'General',
      idea: data.idea || 'Untitled Feature Idea',
      problemSolved: data.problemSolved || '',
      valueImpact: data.valueImpact || 'High',
      effort: data.effort || 'M',
      status: data.status || 'New',
      owner: data.owner || 'Unassigned',
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    features.unshift(newFeat);
    fs.writeFileSync(this.featuresFile, JSON.stringify(features, null, 2));
    return newFeat;
  }

  public async updateFeature(id: string, updates: Partial<QaFeatureIdea>): Promise<QaFeatureIdea | null> {
    const features = await this.getAllFeatures();
    const idx = features.findIndex(f => f.id === id);
    if (idx === -1) return null;
    features[idx] = {
      ...features[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    fs.writeFileSync(this.featuresFile, JSON.stringify(features, null, 2));
    return features[idx];
  }

  public async deleteFeature(id: string): Promise<boolean> {
    const features = await this.getAllFeatures();
    const filtered = features.filter(f => f.id !== id);
    if (filtered.length === features.length) return false;
    fs.writeFileSync(this.featuresFile, JSON.stringify(filtered, null, 2));
    return true;
  }
}

export const qaTrackerRepository = new QaTrackerRepository();
