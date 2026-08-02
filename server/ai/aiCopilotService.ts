import { GoogleGenAI } from '@google/genai';
import { AIModelRouter } from './aiModelRouter';
import { AIContextBuilder } from './aiContextBuilder';
import { AIOutputValidator } from './aiOutputValidator';
import { AIAuditService } from './aiAuditService';

import { sopDraftSchema } from './schemas/sopDraftSchema';
import { sopReviewSchema } from './schemas/sopReviewSchema';
import { textSuggestionSchema } from './schemas/textSuggestionSchema';
import { knowledgeAnalysisSchema } from './schemas/knowledgeAnalysisSchema';
import { groundedAnswerSchema } from './schemas/groundedAnswerSchema';

import { sopDraftPrompt } from './prompts/sopDraft';
import { improveTextPrompt } from './prompts/improveText';
import { suggestSopStepsPrompt } from './prompts/suggestSopSteps';
import { reviewSopPrompt } from './prompts/reviewSop';
import { analyzeKnowledgePrompt } from './prompts/analyzeKnowledge';
import { answerFromKnowledgePrompt } from './prompts/answerFromKnowledge';

export class AICopilotService {
  private static getGeminiClient(): GoogleGenAI | null {
    if (process.env.GEMINI_API_KEY) {
      return new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return null;
  }

  static async generateDraft(
    dbState: any,
    persistFn: (wsId?: string) => Promise<void>,
    wsId: string,
    userId: string,
    roughDescription: string
  ): Promise<any> {
    const capability = 'generateDraft';
    const model = AIModelRouter.getModelForCapability(capability);
    const context = AIContextBuilder.buildWorkspaceContext(dbState, wsId);
    const rolesList = context.positions.map(p => p.title);
    
    const promptText = sopDraftPrompt.template(roughDescription, rolesList);
    const requestTime = new Date().toISOString();

    const callModel = async (prompt: string) => {
      const client = this.getGeminiClient();
      if (!client || process.env.REAL_AI_TEST !== '1') {
        // Fallback to deterministic mock
        return JSON.stringify({
          title: `SOP: Listing Launch Checklist`,
          department: 'Marketing',
          ownerRole: 'marketing_coordinator',
          backupRole: 'operations_lead',
          purpose: `Establish a consistent process derived from rough brief: "${roughDescription}"`,
          expectedOutcome: 'Standard verification criteria completed and listing activated in MLS.',
          scope: 'All listings handled by the Wilmington office.',
          exclusions: 'Commercial sales or short term leasing.',
          tags: ['listing', 'marketing', 'launch'],
          triggerType: 'request_received',
          trigger: 'When a new listing agreement is signed.',
          requiredInfo: [
            {
              name: 'property_address',
              description: 'The street address of the listing.',
              dataType: 'address',
              required: 'yes'
            },
            {
              name: 'agreement_signed',
              description: 'Confirmation that the agreement is signed.',
              dataType: 'choice',
              required: 'yes'
            }
          ],
          steps: [
            {
              title: 'Verify Signed Agreement',
              instruction: 'Collect the signed listing agreement and verify all initials.',
              assignedRole: 'marketing_coordinator',
              type: 'review',
              evidenceRequired: 'Signed agreement PDF uploaded'
            },
            {
              title: 'BIC Review',
              instruction: 'Submit the files to the BIC for legal compliance review.',
              assignedRole: 'bic',
              type: 'approval',
              evidenceRequired: 'BIC signoff logged'
            },
            {
              title: 'Notify Agent',
              instruction: 'Notify the listing agent that the listing is live.',
              assignedRole: 'marketing_coordinator',
              type: 'manual',
              evidenceRequired: 'Email sent'
            }
          ],
          decisions: [
            {
              title: 'Escalate to BIC',
              condition: 'If agreement is not signed within 48 hours',
              action: 'Escalate to the BIC for review'
            }
          ],
          escalationBehavior: {
            expectedResponse: 'Expected Response: 2 hours',
            followUpDue: 'Follow-up Due: 24 hours',
            escalateAfter: 'Escalate After: 48 hours',
            recipientRole: 'bic'
          },
          completionEvidence: {
            type: 'manual',
            description: 'MLS number and confirmation email logged.'
          },
          governance: {
            reviewFrequencyDays: 90,
            visibility: 'workspace',
            trainingRequired: false
          }
        });
      }

      const res = await client.models.generateContent({
        model,
        contents: prompt,
      });
      return res.text || '';
    };

    try {
      const rawRes = await callModel(promptText);
      const repairFn = async (malformed: string, error: string) => {
        const repairPrompt = `The following JSON failed validation with error: ${error}.\nJSON Content:\n${malformed}\nFix the JSON format to strictly match the schema. Respond only with raw JSON.`;
        return await callModel(repairPrompt);
      };

      const validated = await AIOutputValidator.validateAndRepair(rawRes, sopDraftSchema, repairFn);

      const completionTime = new Date().toISOString();
      AIAuditService.logEvent(dbState, persistFn, {
        workspaceId: wsId,
        userId,
        capability,
        promptId: sopDraftPrompt.id,
        promptVersion: sopDraftPrompt.version,
        model,
        requestTime,
        completionTime,
        success: true,
        suggestionApplied: 'pending',
      });

      return {
        suggestionId: `sug_draft_${Date.now()}`,
        capability,
        result: validated,
        explanation: 'Generated SOP template draft from rough description.',
        warnings: [],
        sources: [],
        promptVersion: sopDraftPrompt.version,
        model,
        requiresReview: true
      };
    } catch (err: any) {
      const completionTime = new Date().toISOString();
      AIAuditService.logEvent(dbState, persistFn, {
        workspaceId: wsId,
        userId,
        capability,
        promptId: sopDraftPrompt.id,
        promptVersion: sopDraftPrompt.version,
        model,
        requestTime,
        completionTime,
        success: false,
        error: err.message,
      });
      throw err;
    }
  }

  static async improveField(
    dbState: any,
    persistFn: (wsId?: string) => Promise<void>,
    wsId: string,
    userId: string,
    field: string,
    value: string,
    actionType: string,
    sopForm: any
  ): Promise<any> {
    const capability = 'improveText';
    const model = AIModelRouter.getModelForCapability(capability);
    const sopContext = `SOP Title: "${sopForm.title || ''}"\nPurpose: "${sopForm.purpose || ''}"`;
    
    const promptText = improveTextPrompt.template(field, value, actionType, sopContext);
    const requestTime = new Date().toISOString();

    const callModel = async (prompt: string) => {
      const client = this.getGeminiClient();
      if (!client || process.env.REAL_AI_TEST !== '1') {
        return JSON.stringify({
          suggestion: `Suggested improvements for ${field}: ${value} (optimized for ${actionType})`,
          explanation: 'Clearer instructions and measurable outcomes improve operational compliance.',
          missingInfo: ['Additional timing specifications'],
          examples: ['Example value or format']
        });
      }
      const res = await client.models.generateContent({
        model,
        contents: prompt,
      });
      return res.text || '';
    };

    try {
      const rawRes = await callModel(promptText);
      const repairFn = async (malformed: string, error: string) => {
        return await callModel(`Fix JSON: ${malformed}\nError: ${error}`);
      };

      const validated = await AIOutputValidator.validateAndRepair(rawRes, textSuggestionSchema, repairFn);
      const completionTime = new Date().toISOString();

      AIAuditService.logEvent(dbState, persistFn, {
        workspaceId: wsId,
        userId,
        capability,
        promptId: improveTextPrompt.id,
        promptVersion: improveTextPrompt.version,
        model,
        requestTime,
        completionTime,
        success: true,
      });

      return {
        suggestionId: `sug_field_${Date.now()}`,
        capability,
        result: validated,
        promptVersion: improveTextPrompt.version,
        model,
        requiresReview: true,
        warnings: [],
        sources: []
      };
    } catch (err: any) {
      const completionTime = new Date().toISOString();
      AIAuditService.logEvent(dbState, persistFn, {
        workspaceId: wsId,
        userId,
        capability,
        promptId: improveTextPrompt.id,
        promptVersion: improveTextPrompt.version,
        model,
        requestTime,
        completionTime,
        success: false,
        error: err.message,
      });
      throw err;
    }
  }

  static async suggestStage(
    dbState: any,
    persistFn: (wsId?: string) => Promise<void>,
    wsId: string,
    userId: string,
    stage: number,
    sopForm: any
  ): Promise<any> {
    const capability = 'stageSuggest';
    const model = AIModelRouter.getModelForCapability(capability);
    const context = AIContextBuilder.buildWorkspaceContext(dbState, wsId);
    
    const promptText = suggestSopStepsPrompt.template(stage, sopForm, context);
    const requestTime = new Date().toISOString();

    const callModel = async (prompt: string) => {
      const client = this.getGeminiClient();
      if (!client || process.env.REAL_AI_TEST !== '1') {
        // Return stage specific mock suggestions
        if (stage === 1) {
          return JSON.stringify({
            purpose: 'Pre-schedule photographer and order yard signs automatically.',
            expectedOutcome: 'Clear confirmation of media delivery and listing signs placed on site.',
            scope: 'Standard residential listings.',
            exclusions: 'Leases and short term listings.'
          });
        }
        if (stage === 2) {
          return JSON.stringify({
            trigger: 'When client signs exclusive right to sell.',
            ambiguousConditions: ['Is the signed agreement uploaded yet?'],
            overlappingSop: ['Commercial listing onboarding']
          });
        }
        if (stage === 3) {
          // Suggest owner from real workspace roles if available
          const hasMarketing = context.positions.some(p => p.title === 'marketing_coordinator');
          return JSON.stringify({
            ownerRole: hasMarketing ? 'marketing_coordinator' : 'operations_lead',
            backupRole: 'operations_lead',
            explanation: hasMarketing 
              ? 'marketing_coordinator is suggested because they own Listing Launch responsibilities in the current Operating Model.'
              : 'operations_lead is suggested for operational safety.',
            warnings: []
          });
        }
        if (stage === 4) {
          return JSON.stringify({
            suggestedFields: [
              { name: 'earnest_amount', description: 'Total deposit amount', dataType: 'number', required: 'yes' }
            ]
          });
        }
        if (stage === 5) {
          return JSON.stringify({
            suggestedSteps: [
              {
                title: 'Collect Property Info',
                instruction: 'Retrieve tax records and MLS draft worksheet.',
                assignedRole: 'marketing_coordinator',
                type: 'manual',
                expectedDuration: '10 minutes',
                evidenceRequired: 'Worksheet copy'
              }
            ]
          });
        }
        if (stage === 6) {
          return JSON.stringify({
            suggestedDecisions: [
              { title: 'Incomplete paperwork exception', condition: 'If listing agreement is not signed', action: 'Notify BIC immediately and halt marketing setup.' }
            ]
          });
        }
        if (stage === 7) {
          return JSON.stringify({
            expectedResponse: 'Expected Response: 2 hours',
            followUpDue: 'Follow-up Due: 24 hours',
            escalateAfter: 'Escalate After: 48 hours',
            recipientRole: 'bic'
          });
        }
        if (stage === 8) {
          return JSON.stringify({
            evidenceDescription: 'MLS activation receipt and PDF listing sheet uploaded.'
          });
        }
        if (stage === 9) {
          return JSON.stringify({
            reviewFrequencyDays: 90,
            reviewers: ['marketing_coordinator', 'bic']
          });
        }
        return JSON.stringify({});
      }

      const res = await client.models.generateContent({
        model,
        contents: prompt,
      });
      return res.text || '';
    };

    try {
      const rawRes = await callModel(promptText);
      const parsed = JSON.parse(rawRes.replace(/```json/g, '').replace(/```/g, '').trim());
      const completionTime = new Date().toISOString();

      AIAuditService.logEvent(dbState, persistFn, {
        workspaceId: wsId,
        userId,
        capability,
        promptId: suggestSopStepsPrompt.id,
        promptVersion: suggestSopStepsPrompt.version,
        model,
        requestTime,
        completionTime,
        success: true,
      });

      return {
        suggestionId: `sug_stage_${stage}_${Date.now()}`,
        capability,
        result: parsed,
        promptVersion: suggestSopStepsPrompt.version,
        model,
        requiresReview: true,
        warnings: [],
        sources: []
      };
    } catch (err: any) {
      const completionTime = new Date().toISOString();
      AIAuditService.logEvent(dbState, persistFn, {
        workspaceId: wsId,
        userId,
        capability,
        promptId: suggestSopStepsPrompt.id,
        promptVersion: suggestSopStepsPrompt.version,
        model,
        requestTime,
        completionTime,
        success: false,
        error: err.message,
      });
      throw err;
    }
  }

  static async reviewSop(
    dbState: any,
    persistFn: (wsId?: string) => Promise<void>,
    wsId: string,
    userId: string,
    sop: any
  ): Promise<any> {
    const capability = 'reviewSop';
    const model = AIModelRouter.getModelForCapability(capability);
    const context = AIContextBuilder.buildWorkspaceContext(dbState, wsId);
    
    const promptText = reviewSopPrompt.template(sop, context);
    const requestTime = new Date().toISOString();

    const callModel = async (prompt: string) => {
      const client = this.getGeminiClient();
      if (!client || process.env.REAL_AI_TEST !== '1') {
        // Return deterministic mock findings
        const findings = [];
        
        // Find real positions from context
        const hasOps = (context.positions || []).some((p: any) => p.id === 'operations_manager');
        const backupRec = hasOps ? 'operations_manager' : 'owner';
        const backupLabel = hasOps ? 'Operations Manager — Ann Gunn' : 'Regional Leader — Ryan Crecelius';

        // Check for historical feedback and improvement requests for this SOP
        const relatedFeedback = (dbState.opsFeedback || []).filter((f: any) => 
          f.workspaceId === wsId && (f.sopId === sop.sopId || f.objectId === sop.id || f.objectId === sop.sopId)
        );
        const relatedRequests = (dbState.opsImprovementRequests || []).filter((r: any) => 
          r.workspaceId === wsId && (r.sopId === sop.sopId || r.sopId === sop.id)
        );

        if (relatedFeedback.length > 0 || relatedRequests.length > 0) {
          const sampleComment = relatedFeedback[0]?.comment || relatedRequests[0]?.comment || 'Checklist step instruction is unclear during execution.';
          findings.push({
            level: 'critical',
            section: 'Historical Run Feedback Analysis',
            problem: `Execution Feedback Flagged: "${sampleComment}"`,
            reason: `Team members flagged issues during live checklist runs on version ${sop.version}.`,
            proposedImprovement: `Refine step instruction and clarify prerequisites to address feedback: "${sampleComment}".`
          });
        }

        if (!sop.ownerRole) {
          findings.push({
            level: 'critical',
            section: 'Ownership',
            problem: 'Process lacks a defined owner role',
            reason: 'Without a defined owner, steps in this SOP cannot be automatically routed.',
            proposedImprovement: `Assign "${backupRec}" as the owner.`
          });
        }
        if (!sop.steps || sop.steps.length === 0) {
          findings.push({
            level: 'critical',
            section: 'Steps',
            problem: 'No action steps defined',
            reason: 'An SOP must have at least one checklist step to execute.',
            proposedImprovement: 'Add basic steps: "Verify Info", "Upload Files", "Complete Task".'
          });
        }
        
        // 3-Category Finding Breakdown & Version Impact Scorecard
        const prerequisiteGaps = [
          { field: 'lockbox_code', reason: 'Missing lockbox code field on intake causes 40% of initial checklist blocks.' }
        ];
        const bottleneckSteps = [
          { stepId: 'step_2', title: 'Upload Documentation & Signatures', avgDuration: '2.4 hrs', targetSla: '2.0 hrs', suggestion: 'Automate contract signature verification via Dotloop.' }
        ];
        const roleConflicts = [
          { stepId: 'step_3', assignedRole: 'general_staff', recommendedRole: 'marketing_coordinator', reason: 'Role does not match Request Routing matrix for Listing Launch.' }
        ];

        const impactScorecard = {
          estimatedSlaReductionPercent: 35,
          completionRateProjection: 18,
          deltaSummary: 'Added lockbox_code prerequisite, re-aligned Step 3 to Marketing Coordinator, and reduced SLA bottleneck duration by 0.4 hrs.'
        };

        return JSON.stringify({
          findings,
          prerequisiteGaps,
          bottleneckSteps,
          roleConflicts,
          impactScorecard
        });
      }

      const res = await client.models.generateContent({
        model,
        contents: prompt,
      });
      return res.text || '';
    };

    try {
      const rawRes = await callModel(promptText);
      const repairFn = async (malformed: string, error: string) => {
        return await callModel(`Fix JSON: ${malformed}\nError: ${error}`);
      };

      const validated = await AIOutputValidator.validateAndRepair(rawRes, sopReviewSchema, repairFn);
      const completionTime = new Date().toISOString();

      AIAuditService.logEvent(dbState, persistFn, {
        workspaceId: wsId,
        userId,
        capability,
        promptId: reviewSopPrompt.id,
        promptVersion: reviewSopPrompt.version,
        model,
        requestTime,
        completionTime,
        success: true,
      });

      return {
        suggestionId: `sug_review_${Date.now()}`,
        capability,
        result: validated,
        promptVersion: reviewSopPrompt.version,
        model,
        requiresReview: true,
        warnings: [],
        sources: []
      };
    } catch (err: any) {
      const completionTime = new Date().toISOString();
      AIAuditService.logEvent(dbState, persistFn, {
        workspaceId: wsId,
        userId,
        capability,
        promptId: reviewSopPrompt.id,
        promptVersion: reviewSopPrompt.version,
        model,
        requestTime,
        completionTime,
        success: false,
        error: err.message,
      });
      throw err;
    }
  }

  static async analyzeKnowledge(
    dbState: any,
    persistFn: (wsId?: string) => Promise<void>,
    wsId: string,
    userId: string,
    documentText: string
  ): Promise<any> {
    const capability = 'analyzeKnowledge';
    const model = AIModelRouter.getModelForCapability(capability);
    
    const promptText = analyzeKnowledgePrompt.template(documentText);
    const requestTime = new Date().toISOString();

    const callModel = async (prompt: string) => {
      const client = this.getGeminiClient();
      if (!client || process.env.REAL_AI_TEST !== '1') {
        // Return deterministic mock analysis
        return JSON.stringify({
          title: 'Wilmington Listing Onboarding Guide',
          summary: 'This guide outlines standard procedures for onboarding new property listings, scheduling photography, and obtaining Broker-in-Charge approval.',
          purpose: 'Provide agents and transaction coordinators with unified steps for listing entry and marketing launch.',
          audience: 'marketing_coordinator, agent',
          topics: ['onboarding', 'listings', 'marketing'],
          tags: ['marketing', 'listing', 'compliance'],
          rolesMentioned: ['marketing_coordinator', 'bic', 'listing_agent'],
          procedures: [
            'Obtain a signed exclusive right to sell agreement',
            'Schedule photography within 24 hours of agreement signing',
            'Submit copies of agreements to the BIC'
          ],
          importantPolicies: [
            'All listings must have a signed listing agreement prior to any public marketing.'
          ],
          requiredForms: ['Exclusive Right to Sell Agreement', 'MLS Draft Sheet'],
          deadlines: ['Photography: 24h from signed agreement', 'MLS upload: 48h from photo delivery'],
          escalationInstructions: ['Contact the BIC immediately if agent fails to supply correct listing files'],
          relatedSops: ['Listing Launch Checklist'],
          requestCategories: ['marketing_request', 'compliance'],
          questionsAnswered: [
            'When should photography be scheduled?',
            'What forms are required for a listing launch?'
          ],
          potentialConflicts: [],
          outdatedWarnings: [],
          sensitiveContentWarning: ['Contains broker pricing and lockbox location protocols']
        });
      }

      const res = await client.models.generateContent({
        model,
        contents: prompt,
      });
      return res.text || '';
    };

    try {
      const rawRes = await callModel(promptText);
      const repairFn = async (malformed: string, error: string) => {
        return await callModel(`Fix JSON: ${malformed}\nError: ${error}`);
      };

      const validated = await AIOutputValidator.validateAndRepair(rawRes, knowledgeAnalysisSchema, repairFn);
      const completionTime = new Date().toISOString();

      AIAuditService.logEvent(dbState, persistFn, {
        workspaceId: wsId,
        userId,
        capability,
        promptId: analyzeKnowledgePrompt.id,
        promptVersion: analyzeKnowledgePrompt.version,
        model,
        requestTime,
        completionTime,
        success: true,
      });

      return {
        suggestionId: `sug_know_${Date.now()}`,
        capability,
        result: validated,
        promptVersion: analyzeKnowledgePrompt.version,
        model,
        requiresReview: true,
        warnings: [],
        sources: []
      };
    } catch (err: any) {
      const completionTime = new Date().toISOString();
      AIAuditService.logEvent(dbState, persistFn, {
        workspaceId: wsId,
        userId,
        capability,
        promptId: analyzeKnowledgePrompt.id,
        promptVersion: analyzeKnowledgePrompt.version,
        model,
        requestTime,
        completionTime,
        success: false,
        error: err.message,
      });
      throw err;
    }
  }

  static async answerFromKnowledge(
    dbState: any,
    persistFn: (wsId?: string) => Promise<void>,
    wsId: string,
    userId: string,
    question: string
  ): Promise<any> {
    const capability = 'answerFromKnowledge';
    const model = AIModelRouter.getModelForCapability(capability);
    const requestTime = new Date().toISOString();

    // Retrieve knowledge sources
    const docs = (dbState.opsKnowledgeDocuments || [])
      .filter((d: any) => d.workspaceId === wsId && d.status === 'indexed');
    
    // Find matching passages (simple substring match on terms or semantic fallback)
    const matchedPassages = docs.filter((d: any) => {
      const textToSearch = `${d.title} ${d.content} ${d.metadata?.topics?.join(' ') || ''}`.toLowerCase();
      const stopWords = new Set(['what', 'who', 'how', 'when', 'where', 'why', 'the', 'and', 'for', 'with', 'from', 'this', 'that', 'office', 'about', 'must', 'have']);
      const queryTerms = question.toLowerCase().split(/[\s\?\!\,\.\:\;]+/).filter(t => t.length > 2 && !stopWords.has(t));
      return queryTerms.length > 0 && queryTerms.some(term => textToSearch.includes(term));
    });

    const callModel = async (prompt: string) => {
      const client = this.getGeminiClient();
      if (!client || process.env.REAL_AI_TEST !== '1') {
        if (matchedPassages.length === 0) {
          return JSON.stringify({
            answer: 'No approved Shapework knowledge source currently answers this question.',
            unsupportedQuestion: true,
            sources: [],
            warnings: []
          });
        }
        return JSON.stringify({
          answer: `Based on the approved ${matchedPassages[0].title}, here is the information: The procedure is fully supported.`,
          unsupportedQuestion: false,
          sources: matchedPassages.map((p: any) => ({
            objectType: 'document',
            objectId: p.id,
            title: p.title
          })),
          warnings: []
        });
      }

      const res = await client.models.generateContent({
        model,
        contents: prompt,
      });
      return res.text || '';
    };

    const passagesContext = matchedPassages.map((p: any) => ({
      title: p.title,
      content: p.content
    }));

    const promptText = answerFromKnowledgePrompt.template(question, passagesContext);

    try {
      const rawRes = await callModel(promptText);
      const repairFn = async (malformed: string, error: string) => {
        return await callModel(`Fix JSON: ${malformed}\nError: ${error}`);
      };

      const validated = await AIOutputValidator.validateAndRepair(rawRes, groundedAnswerSchema, repairFn);
      const completionTime = new Date().toISOString();

      AIAuditService.logEvent(dbState, persistFn, {
        workspaceId: wsId,
        userId,
        capability,
        promptId: answerFromKnowledgePrompt.id,
        promptVersion: answerFromKnowledgePrompt.version,
        model,
        requestTime,
        completionTime,
        success: true,
      });

      return {
        suggestionId: `sug_ans_${Date.now()}`,
        capability,
        result: {
          ...validated,
          citations: validated.sources,
          unsupportedFlags: validated.unsupportedQuestion
        },
        promptVersion: answerFromKnowledgePrompt.version,
        model,
        requiresReview: true,
        warnings: validated.warnings,
        sources: validated.sources
      };
    } catch (err: any) {
      const completionTime = new Date().toISOString();
      AIAuditService.logEvent(dbState, persistFn, {
        workspaceId: wsId,
        userId,
        capability,
        promptId: answerFromKnowledgePrompt.id,
        promptVersion: answerFromKnowledgePrompt.version,
        model,
        requestTime,
        completionTime,
        success: false,
        error: err.message,
      });
      throw err;
    }
  }

  static async findKnowledgeGaps(dbState: any, wsId: string): Promise<any[]> {
    const sops = (dbState.opsSops || []).filter((s: any) => s.workspaceId === wsId);
    const docs = (dbState.opsKnowledgeDocuments || []).filter((d: any) => d.workspaceId === wsId && d.status === 'indexed');
    const requests = (dbState.opsRequests || []).filter((r: any) => r.workspaceId === wsId);

    const gaps: any[] = [];

    // 1. request category with no SOP
    const categories = ['compliance', 'accounting_commissions', 'marketing_request', 'office_supplies', 'leadership_decision'];
    categories.forEach(cat => {
      const hasSop = sops.some((s: any) => s.department?.toLowerCase() === cat.replace('_', ' ').toLowerCase() || s.tags?.includes(cat));
      if (!hasSop) {
        gaps.push({
          type: 'category_no_sop',
          title: `No SOP exists for category: ${cat.replace('_', ' ')}`,
          description: `Agents submitted requests matching category "${cat}", but there is no structured SOP checklist mapped to this department.`,
          action: 'Create SOP Draft',
          targetCategory: cat
        });
      }
    });

    // 2. SOP with no supporting document
    sops.forEach((sop: any) => {
      const titleTerms = sop.title.toLowerCase().split(/\s+/).filter((t: string) => t.length > 3);
      const hasDoc = docs.some((d: any) => {
        const text = `${d.title} ${d.content}`.toLowerCase();
        return titleTerms.every((term: string) => text.includes(term));
      });
      if (!hasDoc) {
        gaps.push({
          type: 'sop_no_document',
          title: `SOP "${sop.title}" lacks reference knowledge articles`,
          description: `This active procedure runs without any supporting policy guides or manuals in the Knowledge Base.`,
          action: 'Create Knowledge Article Draft',
          targetSop: sop.title
        });
      }
    });

    return gaps;
  }
}
