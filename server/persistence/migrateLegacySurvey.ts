import pg from 'pg';
import { convertKeysToSnake, convertKeysToCamel } from './databaseRepositories.js';

export const TEMPLATE_SURVEY_ID = 'survey_brokerage_operational_intelligence';
export const TEMPLATE_VERSION_ID = 'version_brokerage_operational_intelligence_v1';
export const TEMPLATE_SLUG = 'brokerage-operational-intelligence';

export const LEGACY_SURVEY_SCHEMA = {
  pages: [
    {
      id: 'page_profile',
      title: 'Profile',
      description: 'Brokerage and respondent profile details.',
      blocks: [
        { id: 'q_brokerageName', type: 'short_text', title: 'Brokerage Name', required: true, intelligenceMapping: { field: 'brokerageName', category: 'profile' } },
        { id: 'q_respondentName', type: 'short_text', title: 'Respondent Name', required: true, intelligenceMapping: { field: 'respondentName', category: 'profile' } },
        { id: 'q_emailAddress', type: 'email', title: 'Email Address', required: true, intelligenceMapping: { field: 'emailAddress', category: 'profile' } },
        { id: 'q_role', type: 'dropdown', title: 'Respondent Role', required: true, options: ['Owner', 'Managing Broker', 'Operations Lead', 'Agent', 'Other'], intelligenceMapping: { field: 'role', category: 'profile' } },
        { id: 'q_numberOfAgents', type: 'dropdown', title: 'Number of Agents', required: true, options: ['1–10', '11–25', '26–50', '51–100', '100+'], intelligenceMapping: { field: 'numberOfAgents', category: 'profile' } }
      ]
    },
    {
      id: 'page_health',
      title: 'Operational Health Diagnosis',
      description: 'Assess the frequency of friction signs across daily operations (1 = Never, 5 = Always).',
      blocks: [
        { id: 'q_pulledIntoIssues', type: 'rating', title: 'Leadership is regularly pulled into routine client or transaction execution issues.', required: true, min: 1, max: 5, intelligenceMapping: { category: 'Owner Freedom', field: 'pulledIntoIssues' } },
        { id: 'q_workFallsThroughCracks', type: 'rating', title: 'Important tasks or follow-ups fall through the cracks because we rely on memory or scattered emails.', required: true, min: 1, max: 5, intelligenceMapping: { category: 'Transaction & Compliance', field: 'workFallsThroughCracks' } },
        { id: 'q_infoInSilos', type: 'rating', title: 'Core details about deals or agent preferences live in silos (text messages, personal notebooks).', required: true, min: 1, max: 5, intelligenceMapping: { category: 'Team & People', field: 'infoInSilos' } },
        { id: 'q_processesChange', type: 'rating', title: 'Operational processes change depending on which staff member handles the request.', required: true, min: 1, max: 5, intelligenceMapping: { category: 'Office & Operations', field: 'processesChange' } },
        { id: 'q_waitingOnApprovals', type: 'rating', title: 'We waste hours waiting for managers to approve checklists, signs, or marketing assets.', required: true, min: 1, max: 5, intelligenceMapping: { category: 'Transaction & Compliance', field: 'waitingOnApprovals' } },
        { id: 'q_repeatedQuestions', type: 'rating', title: 'Staff answers the same operational questions from agents repeatedly.', required: true, min: 1, max: 5, intelligenceMapping: { category: 'Team & People', field: 'repeatedQuestions' } },
        { id: 'q_struggleFindInfo', type: 'rating', title: 'Agents struggle to locate forms, compliance files, or vendor lists on their own.', required: true, min: 1, max: 5, intelligenceMapping: { category: 'Office & Operations', field: 'struggleFindInfo' } },
        { id: 'q_sideConversations', type: 'rating', title: 'Workflow steps are kicked off in side conversations rather than a central dashboard.', required: true, min: 1, max: 5, intelligenceMapping: { category: 'Office & Operations', field: 'sideConversations' } },
        { id: 'q_bottleneckPerson', type: 'rating', title: 'Operations depend entirely on one "hero" person, creating a severe bottleneck.', required: true, min: 1, max: 5, intelligenceMapping: { category: 'Owner Freedom', field: 'bottleneckPerson' } },
        { id: 'q_noOperatingRecord', type: 'rating', title: 'Checklist and compliance updates are completed without an audit history.', required: true, min: 1, max: 5, intelligenceMapping: { category: 'Transaction & Compliance', field: 'noOperatingRecord' } }
      ]
    },
    {
      id: 'page_bottlenecks',
      title: 'Friction & Single Point of Failure',
      blocks: [
        { id: 'q_interruptionsParagraph', type: 'long_text', title: 'Describe the routine questions or fire drills that interrupt leadership weekly.', required: false, intelligenceMapping: { category: 'Team & People', field: 'interruptionsParagraph' } },
        { id: 'q_singlePersonDependence', type: 'long_text', title: 'Identify any single point of failure in your current operations desk.', required: false, intelligenceMapping: { category: 'Owner Freedom', field: 'singlePersonDependence' } },
        { id: 'q_unavailabilityBreak', type: 'long_text', title: 'What breaks if the lead coordinator is unavailable for two weeks?', required: false, intelligenceMapping: { category: 'Owner Freedom', field: 'unavailabilityBreak' } }
      ]
    },
    {
      id: 'page_tech',
      title: 'Systems & Duplicate Entries',
      blocks: [
        { id: 'q_frictionAreas', type: 'checkboxes', title: 'Select the highest friction areas in your brokerage:', options: ['Commission Processing', 'Listing Launch', 'Agent Onboarding', 'Compliance Audit', 'Signs & Lockboxes', 'Vendor Payments', 'Other'], required: false, intelligenceMapping: { category: 'Office & Operations', field: 'frictionAreas' } },
        { id: 'q_systemsUsed', type: 'checkboxes', title: 'Select the software tools currently in use:', options: ['Dotloop', 'DocuSign', 'SkySlope', 'Paperless Pipeline', 'QuickBooks', 'Basecamp', 'Trello', 'Google Sheets', 'Other'], required: false, intelligenceMapping: { category: 'Technology Debt', field: 'systemsUsed' } },
        { id: 'q_duplicateDataFlows', type: 'long_text', title: 'Describe any workflows where you re-enter the same deal details in multiple systems.', required: false, intelligenceMapping: { category: 'Technology Debt', field: 'duplicateDataFlows' } }
      ]
    },
    {
      id: 'page_automation',
      title: 'AI & Future Scale',
      blocks: [
        { id: 'q_leadershipHoursLost', type: 'dropdown', title: 'Weekly leadership hours lost to manual operational fire drills:', options: ['0-5', '6-10', '11-20', '21-30', '30+'], required: false, intelligenceMapping: { category: 'Owner Freedom', field: 'leadershipHoursLost' } },
        { id: 'q_aiImplemented', type: 'dropdown', title: 'State of AI/automation implementation inside your back office:', options: ['None', 'Evaluating', 'Partially Implemented', 'Fully Integrated'], required: false, intelligenceMapping: { category: 'Technology Debt', field: 'aiImplemented' } },
        { id: 'q_aiTimeSavingWorkflow', type: 'long_text', title: 'Describe a specific workflow that would save the most hours if automated.', required: false, intelligenceMapping: { category: 'Technology Debt', field: 'aiTimeSavingWorkflow' } },
        { id: 'q_scaleBreakPoints', type: 'long_text', title: 'What is the strategic scale breakpoint that breaks if brokerage size doubled?', required: false, intelligenceMapping: { category: 'Scale Breakpoint', field: 'scaleBreakPoints' } },
        { id: 'q_oneSolveThisYear', type: 'long_text', title: 'If shapework could solve exactly one operational bottleneck this year, what should it be?', required: true, intelligenceMapping: { category: 'Product Opportunity', field: 'oneSolveThisYear' } }
      ]
    }
  ]
};

export async function migrateLegacySurveyData(dbState: any, pool: pg.Pool | null) {
  console.log('[Migration] Beginning legacy brokerage survey schema migration...');

  // 1. Initialize surveys state arrays inside dbState if local JSON
  if (!dbState.surveys) dbState.surveys = [];
  if (!dbState.surveyVersions) dbState.surveyVersions = [];
  if (!dbState.surveyResponses) dbState.surveyResponses = [];

  const surveyExists = dbState.surveys.some((s: any) => s.id === TEMPLATE_SURVEY_ID);
  if (!surveyExists) {
    // Add default template survey
    const newSurvey = {
      id: TEMPLATE_SURVEY_ID,
      workspaceId: 'nest-realty-demo',
      name: 'Brokerage Operational Intelligence Survey',
      internalDescription: 'Standard 24-point operational health, friction, and technology stack diagnostics assessment.',
      publicTitle: 'Brokerage Operational Intelligence Assessment',
      slug: TEMPLATE_SLUG,
      status: 'Published',
      category: 'Operational Intelligence',
      ownerId: 'usr_marcus',
      createdBy: 'usr_marcus',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
      activeVersionId: TEMPLATE_VERSION_ID,
      responseCount: 0,
      settings: {
        allowAnonymous: false,
        requireEmail: true,
        oneResponsePerEmail: true
      },
      theme: {
        preset: 'Nest Realty',
        headingFont: 'serif',
        bodyFont: 'sans',
        accentColor: '#00635C',
        buttonBg: '#01362D',
        buttonText: '#ffffff',
        pageBg: '#F5F5F0',
        cardBg: '#ffffff',
        primaryText: '#1E2520',
        secondaryText: '#536A61'
      },
      sharing: {
        publicLinkEnabled: true
      },
      notifications: {
        emailOnSubmit: true
      }
    };

    const newVersion = {
      id: TEMPLATE_VERSION_ID,
      workspaceId: 'nest-realty-demo',
      surveyId: TEMPLATE_SURVEY_ID,
      versionNumber: 1,
      schema: LEGACY_SURVEY_SCHEMA,
      theme: newSurvey.theme,
      logicRules: [],
      scoringConfiguration: {
        enabled: true,
        calculationModel: 'standard_weights'
      },
      createdAt: new Date().toISOString(),
      createdBy: 'usr_marcus',
      publishedAt: new Date().toISOString()
    };

    dbState.surveys.push(newSurvey);
    dbState.surveyVersions.push(newVersion);
  }

  // Ensure Pilot 30-Day Feedback Survey exists
  if (!dbState.surveys.some((s: any) => s.id === 'survey_pilot_30_day_feedback')) {
    dbState.surveys.push({
      id: 'survey_pilot_30_day_feedback',
      workspaceId: 'nest-realty-demo',
      name: 'First 30-Day Pilot Feedback Survey',
      internalDescription: 'Operator & agent feedback collected 30 days post-launch to evaluate SLA compliance and process adoption.',
      publicTitle: 'Shapework 30-Day Pilot Feedback',
      slug: 'pilot-30-day-feedback',
      status: 'Published',
      category: 'Pilot Evaluation',
      ownerId: 'usr_marcus',
      createdBy: 'usr_marcus',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
      activeVersionId: 'version_pilot_30_day_v1',
      responseCount: 14,
      settings: { allowAnonymous: false, requireEmail: true },
      theme: { preset: 'Nest Realty', primaryText: '#1E2520' },
      sharing: { publicLinkEnabled: true }
    });
  }

  // Ensure BIC Compliance SLA Assessment exists
  if (!dbState.surveys.some((s: any) => s.id === 'survey_bic_compliance_sla')) {
    dbState.surveys.push({
      id: 'survey_bic_compliance_sla',
      workspaceId: 'nest-realty-demo',
      name: 'Broker-in-Charge SLA & Compliance Assessment',
      internalDescription: 'Quarterly review of broker-in-charge signoff turnaround times, CDA approvals, and file audit completeness.',
      publicTitle: 'Broker-in-Charge SLA & Compliance Audit',
      slug: 'bic-compliance-sla',
      status: 'Published',
      category: 'Compliance Audit',
      ownerId: 'usr_marcus',
      createdBy: 'usr_marcus',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
      activeVersionId: 'version_bic_compliance_v1',
      responseCount: 8,
      settings: { allowAnonymous: false, requireEmail: true },
      theme: { preset: 'Nest Realty', primaryText: '#1E2520' },
      sharing: { publicLinkEnabled: true }
    });
  }

  // 2. Fetch responses from assessmentResponses / assessment_responses
  let oldResponses: any[] = [];
  if (pool) {
    try {
      // Ensure local state is synced in DB
      const res = await pool.query('SELECT * FROM assessment_responses ORDER BY created_at DESC');
      oldResponses = res.rows.map(row => convertKeysToCamel(row));
    } catch (e) {
      console.warn('[Migration Warning] assessment_responses query failed, falling back to local state:', e);
      oldResponses = dbState.assessmentResponses || [];
    }
  } else {
    oldResponses = dbState.assessmentResponses || [];
  }

  // 3. Map responses to new schema format
  let addedCount = 0;
  for (const resp of oldResponses) {
    const responseExists = dbState.surveyResponses.some((r: any) => r.id === resp.id);
    if (!responseExists) {
      // Build answers map conforming to question IDs
      const answersMap: Record<string, any> = {};
      const answers = resp.answers || {};

      // Map profiles
      answersMap['q_brokerageName'] = resp.brokerageName || '';
      answersMap['q_respondentName'] = resp.respondentName || '';
      answersMap['q_emailAddress'] = resp.emailAddress || '';
      answersMap['q_role'] = resp.role || '';
      answersMap['q_numberOfAgents'] = resp.numberOfAgents || '';

      // Map health scores
      answersMap['q_pulledIntoIssues'] = answers.pulledIntoIssues ?? 3;
      answersMap['q_workFallsThroughCracks'] = answers.workFallsThroughCracks ?? 3;
      answersMap['q_infoInSilos'] = answers.infoInSilos ?? 3;
      answersMap['q_processesChange'] = answers.processesChange ?? 3;
      answersMap['q_waitingOnApprovals'] = answers.waitingOnApprovals ?? 3;
      answersMap['q_repeatedQuestions'] = answers.repeatedQuestions ?? 3;
      answersMap['q_struggleFindInfo'] = answers.struggleFindInfo ?? 3;
      answersMap['q_sideConversations'] = answers.sideConversations ?? 3;
      answersMap['q_bottleneckPerson'] = answers.bottleneckPerson ?? 3;
      answersMap['q_noOperatingRecord'] = answers.noOperatingRecord ?? 3;

      // Map paragraphs
      answersMap['q_interruptionsParagraph'] = answers.interruptionsParagraph || '';
      answersMap['q_singlePersonDependence'] = answers.singlePersonDependence || '';
      answersMap['q_unavailabilityBreak'] = answers.unavailabilityBreak || '';

      // Map lists & selections
      answersMap['q_frictionAreas'] = answers.frictionAreas || [];
      answersMap['q_systemsUsed'] = answers.systemsUsed || [];
      answersMap['q_duplicateDataFlows'] = answers.duplicateDataFlows || '';

      // Map scales & final strategic values
      answersMap['q_leadershipHoursLost'] = answers.leadershipHoursLost || '0-5';
      answersMap['q_aiImplemented'] = answers.aiImplemented || 'None';
      answersMap['q_aiTimeSavingWorkflow'] = answers.aiTimeSavingWorkflow || '';
      answersMap['q_scaleBreakPoints'] = answers.scaleBreakPoints || '';
      answersMap['q_oneSolveThisYear'] = answers.oneSolveThisYear || '';

      const newResp = {
        id: resp.id,
        workspaceId: 'nest-realty-demo',
        surveyId: TEMPLATE_SURVEY_ID,
        surveyVersionId: TEMPLATE_VERSION_ID,
        respondentId: null,
        respondentEmail: resp.emailAddress || '',
        status: resp.status || 'completed',
        startedAt: resp.createdAt || new Date().toISOString(),
        submittedAt: resp.updatedAt || new Date().toISOString(),
        completionTimeSeconds: 300,
        source: 'web_form',
        answers: answersMap,
        calculatedScores: resp.scores || {},
        followUpStatus: resp.internalClassification?.status || 'new',
        assignedFollowUpOwnerId: resp.internalClassification?.assignedOwner || 'usr_sarah',
        internalTags: resp.internalClassification?.notes ? [resp.internalClassification.notes] : [],
        metadata: {
          brokerageName: resp.brokerageName,
          respondentName: resp.respondentName,
          role: resp.role,
          numberOfAgents: resp.numberOfAgents,
          numberOfOfficeStaff: resp.numberOfOfficeStaff,
          numberOfLocations: resp.numberOfLocations,
          primaryMarket: resp.primaryMarket
        },
        createdAt: resp.createdAt || new Date().toISOString(),
        updatedAt: resp.updatedAt || new Date().toISOString()
      };

      dbState.surveyResponses.push(newResp);
      addedCount++;
    }
  }

  // Update response count on surveys list
  const idx = dbState.surveys.findIndex((s: any) => s.id === TEMPLATE_SURVEY_ID);
  if (idx !== -1) {
    dbState.surveys[idx].responseCount = dbState.surveyResponses.filter((r: any) => r.surveyId === TEMPLATE_SURVEY_ID).length;
  }

  // 4. Save/Sync into relational PostgreSQL if connected
  if (pool) {
    try {
      console.log('[Migration] Syncing migrated surveys and responses into PostgreSQL...');
      
      // Upsert templates and migrated responses to DB
      for (const s of dbState.surveys) {
        const dbRow = convertKeysToSnake(s);
        const keys = Object.keys(dbRow);
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        await pool.query(`
          INSERT INTO surveys (${keys.join(', ')}) VALUES (${placeholders})
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            slug = EXCLUDED.slug,
            status = EXCLUDED.status,
            active_version_id = EXCLUDED.active_version_id,
            response_count = EXCLUDED.response_count,
            settings = EXCLUDED.settings,
            theme = EXCLUDED.theme,
            updated_at = EXCLUDED.updated_at;
        `, Object.values(dbRow));
      }

      for (const sv of dbState.surveyVersions) {
        const dbRow = convertKeysToSnake(sv);
        const keys = Object.keys(dbRow);
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        await pool.query(`
          INSERT INTO survey_versions (${keys.join(', ')}) VALUES (${placeholders})
          ON CONFLICT (id) DO NOTHING;
        `, Object.values(dbRow));
      }

      for (const sr of dbState.surveyResponses) {
        const dbRow = convertKeysToSnake(sr);
        const keys = Object.keys(dbRow);
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        await pool.query(`
          INSERT INTO survey_responses (${keys.join(', ')}) VALUES (${placeholders})
          ON CONFLICT (id) DO UPDATE SET
            status = EXCLUDED.status,
            answers = EXCLUDED.answers,
            calculated_scores = EXCLUDED.calculated_scores,
            follow_up_status = EXCLUDED.follow_up_status,
            assigned_follow_up_owner_id = EXCLUDED.assigned_follow_up_owner_id,
            internal_tags = EXCLUDED.internal_tags,
            metadata = EXCLUDED.metadata,
            updated_at = EXCLUDED.updated_at;
        `, Object.values(dbRow));
      }
      
      console.log('[Migration] Database sync completed successfully.');
    } catch (dbErr) {
      console.error('[Migration Error] Failed to seed migration to PostgreSQL:', dbErr);
    }
  }

  console.log(`[Migration] Completed. Migrated ${addedCount} legacy responses successfully.`);
}
