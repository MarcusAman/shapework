/**
 * Reusable Operational Intelligence Assessment Scoring Engine
 */

export interface AssessmentAnswers {
  // Section 1 - Profile
  brokerageName: string;
  respondentName: string;
  emailAddress: string;
  role: string;
  numberOfAgents: string;
  numberOfOfficeStaff?: number;
  numberOfLocations?: number;
  primaryMarket?: string;

  // Section 2 - Operational Health (Scales 1-5, all representing high friction)
  pulledIntoIssues?: number;          // Leadership pulled into local issues
  workFallsThroughCracks?: number;    // Ownership unclear
  infoInSilos?: number;               // Text messages, memory
  processesChange?: number;           // Depends on person
  waitingOnApprovals?: number;        // Agents wait
  repeatedQuestions?: number;         // Same queries
  struggleFindInfo?: number;          // Where is info
  sideConversations?: number;         // Handled offline
  bottleneckPerson?: number;          // One person bottleneck
  noOperatingRecord?: number;         // Completed without record

  // Section 3 - Operational Ownership
  ownershipClarity?: number;          // Scale 1-5
  recurringIssueOwner?: string;       // Yes, Mostly, Sometimes, Rarely, No
  escalationFrequency?: string;       // Never, Rarely, Monthly, Weekly, Daily
  interruptionsParagraph?: string;
  singlePersonDependence?: string;
  unavailabilityBreak?: string;

  // Section 4 - Pain Points
  frictionAreas?: string[];           // max 5
  greatestCostArea?: string;
  greatestFrustrationArea?: string;
  payToSolveFirstArea?: string;
  frictionFrequency?: string;
  currentWorkaround?: string;

  // Section 5 - Tech & Systems
  systemsUsed?: string[];
  frustratingSystem?: string;
  underutilizedSystem?: string;
  duplicateDataFlows?: string;
  spreadsheetDependencies?: string;
  systemsConfidence?: number;         // Scale 1-5

  // Section 6 - Leadership Load
  leadershipHoursLost?: string;       // 0-5, 6-10, 11-20, 21-30, 30+
  leadershipInterrupts?: string;
  leadershipApprovals?: string;
  leadershipHandsOff?: string;

  // Section 7 - AI & Automation
  aiImplemented?: string;             // Yes broadly, Yes few areas, Testing, Planning, No
  aiTimeSavingWorkflow?: string;
  aiDreamWorkflow?: string;
  aiConcerns?: string[];
  aiAdoptionReady?: number;           // Scale 1-5

  // Section 8 - Growth
  scaleBreakPoints?: string;
  growthLimitWorkflow?: string;
  growthCostMoney?: string;
  agentFrustrations?: string;
  leadershipFrustrations?: string;
  locationScaleEase?: number;         // Scale 1-5

  // Section 9 - Priorities
  oneSolveThisYear?: string;
  pilotInterest?: string;             // Yes, Maybe, Not currently
  reportConsent?: string;             // Yes, No
  followUpConsent?: string;           // Yes, No
}

export interface AssessmentScores {
  overallScore: number;
  categoryScores: {
    ownershipClarity: number;
    leadershipLoad: number;
    workflowConsistency: number;
    technologyReadiness: number;
    aiReadiness: number;
    scalability: number;
    operationalVisibility: number;
  };
  topRisks: string[];
  topOpportunities: string[];
  recommendedCategory: string;
}

export function calculateAssessmentScore(answers: Partial<AssessmentAnswers>): AssessmentScores {
  // Helper to safely extract number defaults
  const num = (val: any, def: number = 3): number => {
    const parsed = Number(val);
    return isNaN(parsed) ? def : parsed;
  };

  // 1. Workflow Consistency (Operational Health Scale Questions - All 10 are negative conditions)
  // Higher value (e.g. 5 = Daily) means WORSE operation. Let's invert: 1=100, 5=0
  const q1 = 100 - (num(answers.pulledIntoIssues) - 1) * 25;
  const q2 = 100 - (num(answers.workFallsThroughCracks) - 1) * 25;
  const q3 = 100 - (num(answers.infoInSilos) - 1) * 25;
  const q4 = 100 - (num(answers.processesChange) - 1) * 25;
  const q5 = 100 - (num(answers.waitingOnApprovals) - 1) * 25;
  const q6 = 100 - (num(answers.repeatedQuestions) - 1) * 25;
  const q7 = 100 - (num(answers.struggleFindInfo) - 1) * 25;
  const q8 = 100 - (num(answers.sideConversations) - 1) * 25;
  const q9 = 100 - (num(answers.bottleneckPerson) - 1) * 25;
  const q10 = 100 - (num(answers.noOperatingRecord) - 1) * 25;
  const workflowConsistency = Math.round((q1 + q2 + q3 + q4 + q5 + q6 + q7 + q8 + q9 + q10) / 10);

  // 2. Ownership Clarity
  const ownershipClarityRating = (num(answers.ownershipClarity, 3) / 5) * 100;
  let definedOwnerBonus = 50;
  if (answers.recurringIssueOwner === 'Yes') definedOwnerBonus = 100;
  else if (answers.recurringIssueOwner === 'Mostly') definedOwnerBonus = 80;
  else if (answers.recurringIssueOwner === 'Sometimes') definedOwnerBonus = 50;
  else if (answers.recurringIssueOwner === 'Rarely') definedOwnerBonus = 20;
  else if (answers.recurringIssueOwner === 'No') definedOwnerBonus = 0;

  let escalationPenalty = 50;
  if (answers.escalationFrequency === 'Never') escalationPenalty = 100;
  else if (answers.escalationFrequency === 'Rarely') escalationPenalty = 85;
  else if (answers.escalationFrequency === 'Monthly') escalationPenalty = 70;
  else if (answers.escalationFrequency === 'Weekly') escalationPenalty = 40;
  else if (answers.escalationFrequency === 'Daily') escalationPenalty = 10;
  const ownershipClarity = Math.round((ownershipClarityRating + definedOwnerBonus + escalationPenalty) / 3);

  // 3. Leadership Load
  let hoursPenalty = 50;
  if (answers.leadershipHoursLost === '0-5') hoursPenalty = 100;
  else if (answers.leadershipHoursLost === '6-10') hoursPenalty = 80;
  else if (answers.leadershipHoursLost === '11-20') hoursPenalty = 50;
  else if (answers.leadershipHoursLost === '21-30') hoursPenalty = 25;
  else if (answers.leadershipHoursLost === '30+') hoursPenalty = 5;
  const leadershipLoad = Math.round((q1 + hoursPenalty) / 2); // Combines hours lost and leadership being pulled into local tasks

  // 4. Technology Readiness
  const systemsConfidence = (num(answers.systemsConfidence, 3) / 5) * 100;
  const duplicateDataPenalty = answers.duplicateDataFlows && answers.duplicateDataFlows.trim().length > 10 ? 40 : 100;
  const spreadsheetPenalty = answers.spreadsheetDependencies && answers.spreadsheetDependencies.trim().length > 10 ? 50 : 100;
  const technologyReadiness = Math.round((systemsConfidence + duplicateDataPenalty + spreadsheetPenalty) / 3);

  // 5. AI Readiness
  let aiStageScore = 20;
  if (answers.aiImplemented === 'Yes, broadly') aiStageScore = 100;
  else if (answers.aiImplemented === 'Yes, in a few areas') aiStageScore = 80;
  else if (answers.aiImplemented === 'Testing') aiStageScore = 60;
  else if (answers.aiImplemented === 'Planning') aiStageScore = 40;
  else if (answers.aiImplemented === 'No') aiStageScore = 20;

  const aiAdoptionReady = (num(answers.aiAdoptionReady, 3) / 5) * 100;
  const aiReadiness = Math.round((aiStageScore + aiAdoptionReady) / 2);

  // 6. Scalability
  const scaleLocationEase = (num(answers.locationScaleEase, 3) / 5) * 100;
  const bottleneckScale = q9; // bottleneck person
  const processesConsistencyScale = q4; // processes changing
  const scalability = Math.round((scaleLocationEase + bottleneckScale + processesConsistencyScale) / 3);

  // 7. Operational Visibility
  const recordsConfidence = q10; // no operating record
  const visibilityConfidence = (num(answers.systemsConfidence, 3) / 5) * 100;
  const infoInSilosScale = q3; // information living in texts/emails
  const operationalVisibility = Math.round((recordsConfidence + visibilityConfidence + infoInSilosScale) / 3);

  // Overall Score (average of all seven categories)
  const overallScore = Math.round(
    (ownershipClarity + leadershipLoad + workflowConsistency + technologyReadiness + aiReadiness + scalability + operationalVisibility) / 7
  );

  // Categories list to compare
  const cats = [
    { key: 'ownershipClarity', label: 'Ownership Clarity', score: ownershipClarity },
    { key: 'leadershipLoad', label: 'Leadership Load', score: leadershipLoad },
    { key: 'workflowConsistency', label: 'Workflow Consistency', score: workflowConsistency },
    { key: 'technologyReadiness', label: 'Technology Readiness', score: technologyReadiness },
    { key: 'aiReadiness', label: 'AI & Automation Readiness', score: aiReadiness },
    { key: 'scalability', label: 'Growth Scalability', score: scalability },
    { key: 'operationalVisibility', label: 'Operational Visibility', score: operationalVisibility },
  ];

  // Sort lowest to highest
  cats.sort((a, b) => a.score - b.score);

  const topRisks = cats.slice(0, 3).map(c => `${c.label} (Score: ${c.score}/100)`);
  
  // Opportunities maps to areas where scores are low but solvable, or AI readiness presents leverage
  const topOpportunities: string[] = [];
  if (leadershipLoad < 60) {
    topOpportunities.push('Leadership Deflection and Task Delegator');
  }
  if (ownershipClarity < 65) {
    topOpportunities.push('Departmental Escalation Routing System');
  }
  if (aiReadiness >= 40) {
    topOpportunities.push('Background AI Agents for File Compliance Checklists');
  }
  if (workflowConsistency < 60) {
    topOpportunities.push('Standardized Digital Handoff Manuals');
  }
  if (topOpportunities.length < 3) {
    topOpportunities.push('Central Brokerage Operational Log System');
  }

  // Slice to top 3 opportunities
  const opportunities = topOpportunities.slice(0, 3);

  // Recommendation Category
  const recommendedCategory = cats[0].label;

  return {
    overallScore,
    categoryScores: {
      ownershipClarity,
      leadershipLoad,
      workflowConsistency,
      technologyReadiness,
      aiReadiness,
      scalability,
      operationalVisibility
    },
    topRisks,
    topOpportunities: opportunities,
    recommendedCategory
  };
}
