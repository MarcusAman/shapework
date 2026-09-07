import { GoogleGenAI } from '@google/genai';
import JSZip from 'jszip';
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

  static async extractCleanTextFromPayload(payload: string, fileName: string = ''): Promise<string> {
    if (!payload) return '';
    let buffer: Buffer | null = null;

    // Handle base64 data URLs
    if (payload.startsWith('data:') && payload.includes(';base64,')) {
      try {
        const base64Data = payload.split(';base64,')[1];
        buffer = Buffer.from(base64Data, 'base64');
      } catch {}
    } else if (payload.startsWith('%PDF-') || payload.startsWith('PK\x03\x04')) {
      buffer = Buffer.from(payload, 'latin1');
    }

    if (buffer) {
      // 1. DOCX Handling via JSZip
      if (fileName.toLowerCase().endsWith('.docx') || buffer.slice(0, 4).toString() === 'PK\x03\x04') {
        try {
          const zip = await JSZip.loadAsync(buffer);
          const docXml = await zip.file('word/document.xml')?.async('string');
          if (docXml) {
            const textContent = docXml
              .replace(/<w:p[^>]*>/gi, '\n')
              .replace(/<[^>]+>/g, '')
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'")
              .replace(/\n\s*\n+/g, '\n\n')
              .trim();
            if (textContent.length > 20) {
              return textContent;
            }
          }
        } catch {}
      }

      // 2. PDF Handling via PDFParse (Full FlateDecode & font unmapping)
      if (fileName.toLowerCase().endsWith('.pdf') || buffer.slice(0, 5).toString() === '%PDF-') {
        try {
          const { PDFParse } = await import('pdf-parse');
          const parser = new PDFParse({ data: buffer, verbosity: 0 });
          const parsed = await parser.getText();
          await parser.destroy();
          if (parsed && parsed.text && parsed.text.trim().length > 5) {
            const cleanText = parsed.text
              .replace(/--\s*\d+\s*of\s*\d+\s*--/gi, '')
              .replace(/Skia\/PDF\s+[^\n]*/gi, '')
              .replace(/Google Docs Renderer/gi, '')
              .trim();
            if (cleanText.length > 5) {
              return cleanText;
            }
          }
        } catch (pdfErr) {
          console.warn('[PDF Extractor] PDFParse parsing notice:', pdfErr);
        }
      }
    }

    // Direct plain text cleanup
    let rawText = buffer ? buffer.toString('utf-8') : payload;
    return rawText
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ')
      .replace(/Skia\/PDF\s+[^\n]*/gi, '')
      .replace(/Google Docs Renderer/gi, '')
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .trim();
  }

  static autoMatchExistingSop(allSops: any[], documentText: string, fileName: string): { matchedSop: any | null; confidence: number; reason: string } {
    if (!allSops || allSops.length === 0) {
      return { matchedSop: null, confidence: 0, reason: 'No existing SOPs in library' };
    }

    const norm = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
    const docSample = norm(`${fileName} ${documentText.slice(0, 1500)}`);

    let bestMatch: any = null;
    let highestScore = 0;
    let matchReason = '';

    for (const sop of allSops) {
      const sopTitleNorm = norm(sop.title || '');
      const keywords = sopTitleNorm.split(/\s+/).filter(w => w.length > 3 && !['protocol', 'procedure', 'standard', 'operating', 'guide', 'nest'].includes(w));
      
      let matchedKw = 0;
      for (const kw of keywords) {
        if (docSample.includes(kw)) {
          matchedKw++;
        }
      }

      const kwRatio = keywords.length > 0 ? matchedKw / keywords.length : 0;
      
      // Exact title match in document
      if (sopTitleNorm.length > 6 && docSample.includes(sopTitleNorm)) {
        bestMatch = sop;
        highestScore = 1.0;
        matchReason = `Exact title match with "${sop.title}"`;
        break;
      }

      if (kwRatio > highestScore && kwRatio >= 0.55) {
        highestScore = kwRatio;
        bestMatch = sop;
        matchReason = `High semantic overlap (${Math.round(kwRatio * 100)}%) with existing "${sop.title}"`;
      }
    }

    return {
      matchedSop: highestScore >= 0.55 ? bestMatch : null,
      confidence: highestScore,
      reason: matchReason || 'Content represents a new distinct procedure'
    };
  }

  static generateAuthoritativeSopTitle(cleanText: string, fileName: string, detectedPurpose: string, steps: any[]): string {
    const combined = `${cleanText.slice(0, 2000)} ${fileName} ${detectedPurpose} ${steps.map(s => s.action).join(' ')}`.toLowerCase();

    // Specific domain mapping based on real content
    if (combined.includes('open house') && (combined.includes('photo') || combined.includes('marketing') || combined.includes('sign'))) {
      return 'Open House Preparation & Media Protocol';
    }
    if (combined.includes('waterfront') || (combined.includes('luxury') && combined.includes('listing'))) {
      return 'Luxury Waterfront Listing Intake & Marketing Protocol';
    }
    if (combined.includes('listing launch') || (combined.includes('listing') && combined.includes('mls') && combined.includes('dotloop'))) {
      return 'Residential Listing Launch & MLS Onboarding Protocol';
    }
    if (combined.includes('buyer representation') || combined.includes('working with real estate agents') || combined.includes('buyer agency')) {
      return 'Buyer Representation & Agency Onboarding Protocol';
    }
    if (combined.includes('earnest money') || combined.includes('emd') || combined.includes('due diligence fee') || combined.includes('form 2-t')) {
      return 'Buyer Contract Verification & EMD Audit Protocol';
    }
    if (combined.includes('sign post') || combined.includes('yard sign') || combined.includes('sign vendor') || combined.includes('directional')) {
      return 'Sign Vendor Dispatch & Post Retrieval Protocol';
    }
    if (combined.includes('keybox') || combined.includes('supra') || combined.includes('lockbox')) {
      return 'Emergency Keybox & Lockbox Dispatch Procedure';
    }
    if (combined.includes('marketing intake') || (combined.includes('marketing') && combined.includes('social media'))) {
      return 'Agent Marketing Campaign & Collateral Dispatch Protocol';
    }
    if (combined.includes('commercial lease') || combined.includes('letter of intent') || combined.includes('loi')) {
      return 'Commercial Lease & LOI Verification Protocol';
    }
    if (combined.includes('cda') || combined.includes('commission disbursement') || combined.includes('closing file')) {
      return 'Closing File Compliance & Commission Disbursement Protocol';
    }
    if (combined.includes('nora') || combined.includes('sop guides') || combined.includes('operations manual')) {
      return 'Brokerage Operational Procedures & Staff Execution Guide';
    }

    // Clean generic filename
    let base = fileName
      .replace(/\.[^/.]+$/, '')
      .replace(/^copy\s+of\s+/i, '')
      .replace(/\s+for\s+nora/i, '')
      .replace(/\s+for\s+ryan/i, '')
      .replace(/[-_]+/g, ' ')
      .trim();

    base = base.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.substring(1).toLowerCase());
    if (!/protocol|procedure|guidelines|checklist|sop|guide/i.test(base)) {
      base += ' Protocol';
    }
    return base || 'Standard Operating Procedure';
  }

  static async extractSopFromDocument(
    dbState: any,
    persistFn: (wsId?: string) => Promise<void>,
    wsId: string,
    userId: string,
    documentPayload: string,
    fileName: string = 'Uploaded_SOP_Document.pdf',
    explicitExistingSop?: any
  ): Promise<any> {
    const capability = 'extractSopFromDocument';
    const model = AIModelRouter.getModelForCapability('generateDraft');
    const requestTime = new Date().toISOString();

    // 1. Robust multi-format text extraction (PDF, DOCX, base64 data URLs, plain text)
    const documentText = await AICopilotService.extractCleanTextFromPayload(documentPayload, fileName);
    const cleanLines = (documentText || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    
    // Heuristic document extraction helper
    const parseDocumentLocally = () => {
      let title = '';
      let purpose = '';
      
      const docLower = `${cleanLines.join(' ')} ${fileName}`.toLowerCase();
      let department = 'Operations';
      let processOwner = 'Admin Coordinator';

      if (docLower.includes('marketing') || docLower.includes('rechat') || docLower.includes('postcard') || docLower.includes('flyer') || docLower.includes('social media') || docLower.includes('campaign') || docLower.includes('design')) {
        department = 'Marketing & Design';
        processOwner = 'Marketing Coordinator';
      } else if (docLower.includes('sign post') || docLower.includes('yard sign') || docLower.includes('keybox') || docLower.includes('lockbox') || docLower.includes('nora') || docLower.includes('facilities')) {
        department = 'Office Operations';
        processOwner = 'Admin Coordinator';
      } else if (docLower.includes('contract') || docLower.includes('form 2-t') || docLower.includes('earnest money') || docLower.includes('compliance') || docLower.includes('audit') || docLower.includes('bic')) {
        department = 'Compliance & Risk';
        processOwner = 'Broker-in-Charge';
      } else if (docLower.includes('listing') || docLower.includes('mls') || docLower.includes('open house') || docLower.includes('seller')) {
        department = 'Listing Operations';
        processOwner = 'Listing Agent';
      } else if (docLower.includes('buyer') || docLower.includes('working with real estate agents') || docLower.includes('wwrea')) {
        department = 'Client Services';
        processOwner = 'Buyer Agent';
      } else if (docLower.includes('commission') || docLower.includes('cda') || docLower.includes('accounting') || docLower.includes('escrow')) {
        department = 'Accounting & Finance';
        processOwner = 'Firm Finance';
      }

      let trigger = 'Documented trigger event';
      const steps: Array<{ stepNumber: number; action: string; role: string; systemUsed: string }> = [];
      const decisions: string[] = [];
      const escalationPaths: string[] = [];
      const requiredInputs: string[] = [];
      const prerequisites: string[] = [];

      const isPdfSyntax = (str: string) => {
        const s = str.trim().toLowerCase();
        return (
          /^\d+(\s+\d+)?\s+obj/i.test(s) ||
          /^(endobj|xref|trailer|startxref|\/rect|\/mediabox|\/contents|\/filter|\/length|\/type|\/resources|\/font|\/parent|\/kids|\/subtype|<<|>>|stream|endstream)/i.test(s) ||
          s.includes('[rect [') ||
          s.includes('/rect [') ||
          s.includes('flatedecode') ||
          s.includes('skia/pdf') ||
          s.includes('google docs renderer') ||
          s.startsWith('%pdf-')
        );
      };

      const isDividerOrNonTask = (str: string) => {
        const s = str.trim();
        if (/^[-_=\*\.\s~#|/\\+–—]+$/.test(s)) return true;
        const letterCount = (s.match(/[a-zA-Z]/g) || []).length;
        return letterCount < 3;
      };

      const inferSystemUsed = (actionText: string, contextDept: string): string => {
        const text = actionText.toLowerCase();
        if (/\brechat\b/.test(text)) return 'Rechat';
        if (/\bcanva\b/.test(text)) return 'Canva';
        if (/\bdotloop\b/.test(text)) return 'Dotloop';
        if (/\b(nc regional mls|regional mls|\bmls\b|matrix)\b/.test(text)) return 'NC Regional MLS';
        if (/\b(supra|ekey|lockbox|keybox)\b/.test(text)) return 'Supra eKEY';
        if (/\bshowingtime\b/.test(text)) return 'ShowingTime';
        if (/\b(coastal sign|sign vendor|sign post|coastal post)\b/.test(text)) return 'Coastal Sign Post Co.';
        if (/\b(coastal print|print vendor|print shop)\b/.test(text)) return 'Coastal Print Works';
        if (/\b(mailchimp)\b/.test(text)) return 'Mailchimp';
        if (/\b(meta|facebook|instagram|social ad)\b/.test(text)) return 'Meta Business Suite';
        if (/\b(google drive|drive|folder|google docs)\b/.test(text)) return 'Google Drive';
        if (/\b(quickbooks|payroll|accounting)\b/.test(text)) return 'QuickBooks';
        if (/\b(cda|compliance desk|compliance portal|bic review)\b/.test(text)) return 'Compliance Desk';
        if (/\b(email|inbox|gmail)\b/.test(text)) return 'Email';
        if (/\b(phone|sms|call|text)\b/.test(text)) return 'Phone / SMS';
        if (/\b(postcard|flyer|mailing list|marketing campaign|social blast|artwork)\b/.test(text)) return 'Rechat';
        if (/\b(sign\b.*install|post\b.*order|post\b.*remov)/.test(text)) return 'Coastal Sign Post Co.';
        if (/\b(contract|offer|agreement|disclosure|rpoads|mog)\b/.test(text)) return 'Dotloop';
        if (contextDept.includes('Marketing')) return 'Rechat';
        if (contextDept.includes('Listing')) return 'NC Regional MLS';
        return 'Dotloop';
      };

      const inferStepRole = (actionText: string, fallbackRole: string): string => {
        const text = actionText.toLowerCase();
        if (/\b(marketing|rechat|postcard|flyer|campaign|social|artwork|graphic|brochure|promo|blast|canva)\b/.test(text)) {
          return 'Marketing Coordinator';
        }
        if (/\b(bic|broker[-\s]*in[-\s]*charge|compliance signoff|compliance review|legal review|audit approval)\b/.test(text)) {
          return 'Broker-in-Charge';
        }
        if (/\b(listing agent|seller consultation|open house host|property showing)\b/.test(text)) {
          return 'Listing Agent';
        }
        if (/\b(buyer agent|buyer consultation|showing client)\b/.test(text)) {
          return 'Buyer Agent';
        }
        if (/\b(admin coordinator|sign vendor|lockbox install|office coordinator|nora|ann)\b/.test(text)) {
          return 'Admin Coordinator';
        }
        if (/\b(firm finance|commission|cda|escrow|deposit|trust|james)\b/.test(text)) {
          return 'Firm Finance';
        }
        return fallbackRole;
      };

      for (const line of cleanLines) {
        if (isPdfSyntax(line) || isDividerOrNonTask(line)) continue;

        if (!title && (line.toLowerCase().startsWith('title:') || line.toLowerCase().startsWith('# ') || (line.length < 80 && line.length > 5 && !line.includes(':')))) {
          const candidate = line.replace(/^(title:|\#+)\s*/i, '').trim();
          if (!candidate.toLowerCase().startsWith('copy of') && 
              !candidate.toLowerCase().includes('sop guides') && 
              !isPdfSyntax(candidate) && 
              !isDividerOrNonTask(candidate) &&
              candidate.length > 4) {
            title = candidate;
          }
        }
        if (line.toLowerCase().startsWith('department:') || line.toLowerCase().startsWith('dept:')) {
          const dept = line.replace(/^(department:|dept:)\s*/i, '').trim();
          if (!isPdfSyntax(dept) && !isDividerOrNonTask(dept)) {
            department = dept;
            if (dept.toLowerCase().includes('marketing') && processOwner === 'Admin Coordinator') {
              processOwner = 'Marketing Coordinator';
            }
          }
        } else if (line.toLowerCase().startsWith('owner:') || line.toLowerCase().startsWith('process owner:')) {
          const owner = line.replace(/^(owner:|process owner:)\s*/i, '').trim();
          if (!isPdfSyntax(owner) && !isDividerOrNonTask(owner)) processOwner = owner;
        } else if (line.toLowerCase().startsWith('purpose:') || line.toLowerCase().startsWith('goal:')) {
          const p = line.replace(/^(purpose:|goal:)\s*/i, '').trim();
          if (!isPdfSyntax(p) && !isDividerOrNonTask(p)) purpose = p;
        } else if (line.toLowerCase().startsWith('trigger:')) {
          const tr = line.replace(/^trigger:\s*/i, '').trim();
          if (!isPdfSyntax(tr) && !isDividerOrNonTask(tr)) trigger = tr;
        } else if (/^(step\s*\d+[:\.]?|[\d]+[\.\):]|\-|\*)\s*/i.test(line)) {
          const rawAction = line.replace(/^(step\s*\d+[:\.]?|[\d]+[\.\):]|\-|\*)\s*/i, '').trim();
          if (rawAction.length > 3 && !isPdfSyntax(rawAction) && !isDividerOrNonTask(rawAction)) {
            const role = inferStepRole(rawAction, processOwner);
            const systemUsed = inferSystemUsed(rawAction, department);

            steps.push({
              stepNumber: steps.length + 1,
              action: rawAction,
              role,
              systemUsed
            });
          }
        } else if (/^(if|decision|rule|then):/i.test(line)) {
          const dec = line.replace(/^(if|decision|rule|then):\s*/i, '').trim();
          if (!isPdfSyntax(dec)) decisions.push(dec);
        } else if (/^(escalat|warning):/i.test(line)) {
          const esc = line.replace(/^(escalat|warning):\s*/i, '').trim();
          if (!isPdfSyntax(esc)) escalationPaths.push(esc);
        } else if (line.toLowerCase().startsWith('prerequisites:') || line.toLowerCase().startsWith('prereq:')) {
          const pre = line.replace(/^(prerequisites:|prereq:)\s*/i, '').trim();
          if (!isPdfSyntax(pre)) prerequisites.push(pre);
        } else if (line.toLowerCase().startsWith('required inputs:') || line.toLowerCase().startsWith('inputs:')) {
          const inputs = line.replace(/^(required inputs:|inputs:)\s*/i, '').split(',').map(s => s.trim()).filter(s => s && !isPdfSyntax(s));
          requiredInputs.push(...inputs);
        } else if (!purpose && line.length > 20 && !isPdfSyntax(line)) {
          purpose = line;
        }
      }

      if (!purpose) {
        purpose = `Standard Operating Procedure extracted from ${fileName} for unified execution and compliance auditing.`;
      }
      if (steps.length === 0) {
        steps.push(
          { stepNumber: 1, action: 'Review intake documents and verify required client information.', role: processOwner, systemUsed: inferSystemUsed('intake review', department) },
          { stepNumber: 2, action: 'Process file and record operational milestone in brokerage ledger.', role: processOwner, systemUsed: inferSystemUsed('ledger milestone', department) },
          { stepNumber: 3, action: 'Submit completed checklist package to BIC for compliance signoff.', role: 'Broker-in-Charge', systemUsed: 'Compliance Desk' }
        );
      }

      // Generate intelligent authoritative title if missing or raw
      if (!title) {
        title = AICopilotService.generateAuthoritativeSopTitle(documentText, fileName, purpose, steps);
      }

      return {
        title,
        purpose,
        department,
        processOwner,
        trigger,
        steps,
        decisions: decisions.length > 0 ? decisions : ['If documentation is incomplete, pause execution and request missing items.'],
        escalationPaths: escalationPaths.length > 0 ? escalationPaths : ['Escalate compliance discrepancies to Broker-in-Charge.'],
        prerequisites: prerequisites.length > 0 ? prerequisites : ['Executed representation agreement and property intake details.'],
        requiredInputs: requiredInputs.length > 0 ? requiredInputs : ['Property Address', 'Client Name', 'Agent Notes']
      };
    };

    const callModel = async (prompt: string) => {
      const client = this.getGeminiClient();
      if (!client || process.env.REAL_AI_TEST !== '1') {
        return null;
      }
      try {
        const res = await client.models.generateContent({
          model,
          contents: prompt
        });
        return res.text || '';
      } catch {
        return null;
      }
    };

    let extracted = parseDocumentLocally();

    const client = this.getGeminiClient();
    if (client && process.env.REAL_AI_TEST === '1') {
      const prompt = `Extract a structured real estate Standard Operating Procedure from this uploaded document text:
"""
${documentText.slice(0, 8000)}
"""
Return JSON matching:
{
  "title": string,
  "department": string,
  "processOwner": string,
  "purpose": string,
  "trigger": string,
  "steps": [{"stepNumber": number, "action": string, "role": string, "systemUsed": string}],
  "decisions": [string],
  "escalationPaths": [string],
  "prerequisites": [string],
  "requiredInputs": [string]
}`;
      const rawRes = await callModel(prompt);
      if (rawRes) {
        try {
          const jsonMatch = rawRes.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            extracted = { ...extracted, ...parsed };
          }
        } catch {}
      }
    }

    // 2. Intelligent Auto-Determination: Edit of Existing SOP vs New SOP
    let targetExistingSop = explicitExistingSop;
    let autoMatchResult = { matchedSop: null as any, confidence: 0, reason: '' };

    if (!targetExistingSop) {
      const allSops = (dbState && Array.isArray(dbState.opsSops)) ? dbState.opsSops : [];
      autoMatchResult = AICopilotService.autoMatchExistingSop(allSops, documentText, fileName);
      if (autoMatchResult.matchedSop) {
        targetExistingSop = autoMatchResult.matchedSop;
      }
    }

    const isUpdate = Boolean(targetExistingSop && targetExistingSop.id);
    const targetId = isUpdate ? targetExistingSop.id : `sop_doc_${Date.now()}`;
    const nextVersion = isUpdate ? (typeof targetExistingSop.version === 'number' ? targetExistingSop.version + 1 : 2) : 1;

    // Determine final title
    let finalTitle = extracted.title;
    if (isUpdate) {
      finalTitle = targetExistingSop.title || extracted.title;
    } else if (!finalTitle || finalTitle.toLowerCase().includes('copy of') || finalTitle.toLowerCase().includes('sop guides')) {
      finalTitle = AICopilotService.generateAuthoritativeSopTitle(documentText, fileName, extracted.purpose, extracted.steps);
    }

    const structuredSop: any = {
      id: targetId,
      sopId: targetId,
      workspaceId: wsId || 'ws_wilmington',
      tenantId: 'tenant_nest_uat',
      title: finalTitle,
      department: extracted.department || targetExistingSop?.department || 'Operations',
      ownerRole: extracted.processOwner || targetExistingSop?.ownerRole || targetExistingSop?.processOwner || 'operations_lead',
      processOwner: extracted.processOwner || targetExistingSop?.processOwner || 'Transaction Coordinator',
      purpose: extracted.purpose || targetExistingSop?.purpose || '',
      expectedOutcome: extracted.purpose || targetExistingSop?.expectedOutcome || 'Procedure executed with verifiable audit evidence.',
      scope: targetExistingSop?.scope || 'Brokerage-wide standard operating policy.',
      trigger: extracted.trigger || targetExistingSop?.trigger || 'Executed agreement or client request received.',
      triggerType: targetExistingSop?.triggerType || 'manual_start',
      status: 'draft',
      version: nextVersion,
      orderedSteps: extracted.steps.map((st: any, idx: number) => ({
        id: st.id || `st_${idx + 1}`,
        stepNumber: idx + 1,
        action: st.action || st.instruction || `Execute procedure step ${idx + 1}`,
        role: st.role || st.assignedRole || 'Transaction Coordinator',
        systemUsed: st.systemUsed || 'Dotloop'
      })),
      steps: extracted.steps.map((st: any, idx: number) => ({
        id: `st_${Date.now()}_${idx + 1}`,
        stepNumber: idx + 1,
        title: st.action ? (st.action.length > 75 ? st.action.slice(0, 75) + '...' : st.action) : `Step ${idx + 1}`,
        instruction: st.action || st.instruction || '',
        assignedRole: st.role || st.assignedRole || 'Admin Coordinator',
        role: st.role || st.assignedRole || 'Admin Coordinator',
        backupRole: 'owner',
        type: 'manual',
        evidenceRequired: 'Logged signoff or uploaded document confirmation',
        expectedDuration: '1h',
        connectedTool: st.systemUsed || 'Rechat',
        systemUsed: st.systemUsed || 'Rechat'
      })),
      decisions: extracted.decisions || targetExistingSop?.decisions || [],
      exceptions: targetExistingSop?.exceptions || [],
      escalationPaths: extracted.escalationPaths || targetExistingSop?.escalationPaths || [],
      prerequisites: extracted.prerequisites || targetExistingSop?.prerequisites || [],
      requiredInputs: extracted.requiredInputs || targetExistingSop?.requiredInputs || [],
      completionEvidence: targetExistingSop?.completionEvidence || {
        type: 'manual',
        description: 'Complete all steps and obtain compliance signoff.'
      },
      tags: ['uploaded-doc', isUpdate ? 'updated-revision' : 'new-import'],
      author: userId || 'Ryan Crecelius (Principal Broker)',
      aiAssisted: true,
      changeSummary: isUpdate 
        ? `Updated from uploaded document: ${fileName} (v${nextVersion})`
        : `Created from uploaded document: ${fileName}`,
      sourceDocument: {
        fileName,
        filePayload: documentPayload,
        fileType: fileName.toLowerCase().endsWith('.pdf') ? 'pdf' : fileName.toLowerCase().endsWith('.docx') ? 'docx' : 'text',
        uploadedAt: new Date().toISOString(),
        characterCount: (documentText || '').length
      },
      createdAt: isUpdate && targetExistingSop?.createdAt ? targetExistingSop.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const completionTime = new Date().toISOString();
    AIAuditService.logEvent(dbState, persistFn, {
      workspaceId: wsId,
      userId,
      capability,
      promptId: 'extract_sop_document_v1',
      promptVersion: '1.0',
      model,
      requestTime,
      completionTime,
      success: true,
      metadata: { fileName, isUpdate, targetId, detectedMode: isUpdate ? 'update' : 'create' }
    });

    return {
      success: true,
      mode: isUpdate ? 'update' : 'create',
      detectedMode: isUpdate ? 'update' : 'create',
      matchedExistingSopId: isUpdate ? targetExistingSop.id : null,
      matchedExistingSopTitle: isUpdate ? targetExistingSop.title : null,
      matchReason: autoMatchResult.reason,
      sop: structuredSop,
      extractedSummary: {
        title: structuredSop.title,
        stepsCount: structuredSop.orderedSteps.length,
        department: structuredSop.department,
        processOwner: structuredSop.processOwner,
        fileName
      }
    };
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
