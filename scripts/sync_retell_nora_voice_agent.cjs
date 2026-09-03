/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Comprehensive Retell AI Voice Agent & LLM Synchronization Engine
 * Agent ID: agent_cdd031880770993e4b11cb9340
 * LLM ID:   llm_75dad5c92f5f7433b86704f12917
 * Hotline:  +1 (910) 507-2047
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

const apiKey = process.env.RETELL_API_KEY;
const agentId = process.env.RETELL_ASK_NEST_OPS_AGENT_ID || 'agent_cdd031880770993e4b11cb9340';
const llmId = process.env.RETELL_ASK_NEST_OPS_LLM_ID || 'llm_75dad5c92f5f7433b86704f12917';
const webhookBase = 'https://shapework.co/api/retell/tools';

if (!apiKey) {
  console.error('❌ RETELL_API_KEY is missing from environment.');
  process.exit(1);
}

async function callRetell(endpoint, method, body) {
  const res = await fetch(`https://api.retellai.com${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Retell API error (${res.status}): ${errText}`);
  }
  return await res.json();
}

async function syncNoraVoiceAgent() {
  console.log(`\n🎙️ Synchronizing Retell AI Nora Voice Agent & LLM Suite...`);
  console.log(`   Agent ID: ${agentId}`);
  console.log(`   LLM ID:   ${llmId}`);
  console.log(`   Webhook:  ${webhookBase}\n`);

  // 1. Read and ground the latest prompt
  const promptPath = path.resolve(process.cwd(), 'server/knowledge/ask_nest_ops_retell_agent_prompt.md');
  let promptText = fs.readFileSync(promptPath, 'utf8');

  const nowET = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const dateFormatted = nowET.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeFormatted = nowET.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });

  promptText = promptText.replace(
    /Current Date is .*\./i,
    `Current Date is **${dateFormatted}** (Current Time: ${timeFormatted}).`
  );

  // 2. Define the complete 8-tool voice telephony suite
  const generalTools = [
    {
      type: 'end_call',
      name: 'end_call',
      description: 'End the phone call gracefully AFTER the caller says farewell (e.g., Bye, Goodbye, See ya, Have a good one). Never hang up abruptly.',
      speak_after_execution: true
    },
    {
      type: 'custom',
      name: 'submit_marketing_intake',
      url: `${webhookBase}/submit-marketing-intake`,
      description: 'Submits or updates a marketing collateral intake request for a listing. Supports both live Flex MLS listings (lookup from MLS) and pre-MLS marketing drafts (requires price, sqft, beds, baths, description, and photo follow-up).',
      speak_after_execution: true,
      parameters: {
        type: 'object',
        properties: {
          propertyAddress: { type: 'string', description: 'Full street address of the property (e.g., 742 Lumina Ave, Wrightsville Beach NC)' },
          flexMlsStatus: { type: 'string', enum: ['flex_live', 'pre_mls', 'unknown'], description: 'Whether the listing is already live in Flex MLS or a pre-MLS marketing draft' },
          mlsNumber: { type: 'string', description: 'MLS Number if already live (optional)' },
          price: { type: 'number', description: 'Planned listing price' },
          squareFootage: { type: 'number', description: 'Total square footage' },
          bedrooms: { type: 'number', description: 'Number of bedrooms' },
          bathrooms: { type: 'number', description: 'Number of bathrooms' },
          propertyDescription: { type: 'string', description: 'Key property highlights, finishes, or special features' },
          deliverables: { 
            type: 'array', 
            items: { type: 'string' },
            description: 'Requested marketing deliverables e.g. 1-Page Flyer, Instagram Story, Jumbo Postcard' 
          },
          neededByDate: { type: 'string', description: 'Requested needed-by date e.g. 2026-09-12 or next Tuesday' },
          deadlineIsFlexible: { type: 'boolean', description: 'Set true if deadline is flexible' },
          notes: { type: 'string', description: 'Special instructions or custom design requests' }
        },
        required: ['propertyAddress']
      }
    },
    {
      type: 'custom',
      name: 'dispatch_sign_post',
      url: `${webhookBase}/dispatch-sign-post`,
      description: 'Captures physical yard sign post and custom rider installation requests, staging an internal review task for Ann Gunn (Operations Lead). Does not place an external vendor order or charge.',
      speak_after_execution: true,
      parameters: {
        type: 'object',
        properties: {
          propertyAddress: { type: 'string', description: 'Street address where sign post is to be installed' },
          agentName: { type: 'string', description: 'Name of the listing broker requesting the sign' },
          riderText: { type: 'string', description: 'Custom rider text e.g., Coming Soon, Waterfront, Under Contract, Custom Agent Rider' },
          signType: { type: 'string', description: 'Type of sign post e.g., standard_wood_post, metal_frame, commercial_sign' },
          deliveryMethod: { type: 'string', description: 'Method: vendor_install (Coastal Sign Post Co.) or office_pickup (Nest Office)' },
          dueAt: { type: 'string', description: 'Requested completion date e.g. Friday 5:00 PM, 2026-09-07' },
          notes: { type: 'string', description: 'Gate codes, lockbox location, or specific placement instructions' }
        },
        required: ['propertyAddress', 'agentName']
      }
    },
    {
      type: 'custom',
      name: 'lookup_open_tasks_by_property',
      url: `${webhookBase}/lookup-open-tasks`,
      description: 'Queries active brokerage tasks and marketing collaterals by property address, scoped to the caller\'s own requests.',
      speak_after_execution: true,
      parameters: {
        type: 'object',
        properties: {
          address: { type: 'string', description: 'Complete street address to query active marketing/signage status for' }
        },
        required: ['address']
      }
    },
    {
      type: 'custom',
      name: 'lookup_roster_member',
      url: `${webhookBase}/lookup-roster`,
      description: 'Looks up public directory contact info, office locations, and BIC leadership for Nest Realty staff.',
      speak_after_execution: true,
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Name or partial name of the broker or staff member' },
          role: { type: 'string', description: 'Role filter e.g., bic, broker, marketing, operations' },
          office: { type: 'string', description: 'Office location e.g., Mayfaire, Carolina Beach' }
        }
      }
    },
    {
      type: 'custom',
      name: 'lookup_sop_protocol',
      url: `${webhookBase}/lookup-sop`,
      description: 'Queries official Nest Realty Standard Operating Procedures (SOPs) and brokerage policies on commissions, earnest money, sign post ordering, MLS disclosures, and contract guidelines.',
      speak_after_execution: true,
      parameters: {
        type: 'object',
        properties: {
          topic: { type: 'string', description: 'Topic to search e.g., sign post, earnest money, due diligence, commission split, lockbox' },
          category: { type: 'string', description: 'Category filter e.g., marketing, compliance, operations' }
        },
        required: ['topic']
      }
    },
    {
      type: 'custom',
      name: 'calculate_due_diligence',
      url: `${webhookBase}/calculate-due-diligence`,
      description: 'Calculates the calendar expiration date and 5:00 PM Eastern Time deadline from explicit contract inputs (contract effective date and agreed due diligence days written in the contract). Does NOT calculate fees or provide legal advice.',
      speak_after_execution: true,
      parameters: {
        type: 'object',
        properties: {
          effectiveDate: { type: 'string', description: 'Contract effective date written in the contract e.g. 2026-09-08' },
          dueDiligenceDays: { type: 'number', description: 'Agreed number of due diligence days written in the contract e.g. 14, 21' }
        },
        required: ['effectiveDate', 'dueDiligenceDays']
      }
    },
    {
      type: 'custom',
      name: 'search_knowledge_library',
      url: `${webhookBase}/search-knowledge`,
      description: 'Searches the Nest Realty operations and marketing knowledge library for answers on vendors, tools, templates, and office procedures.',
      speak_after_execution: true,
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search term or question regarding brokerage operations' }
        },
        required: ['query']
      }
    }
  ];

  // 3. Update Retell LLM configuration
  console.log(`[1/2] Updating Retell LLM (${llmId})...`);
  let updatedLlm;
  const canonicalDefaultBeginMessage = "Thanks for calling Nest. I'm Nora, I'll be helping you with your request today. May I ask who’s calling?";

  try {
    updatedLlm = await callRetell(`/update-retell-llm/${llmId}`, 'PATCH', {
      model: 'gemini-3.6-flash',
      general_prompt: promptText,
      begin_message: canonicalDefaultBeginMessage,
      general_tools: generalTools
    });
    console.log(`✓ LLM updated successfully with gemini-3.6-flash and all ${generalTools.length} voice tools!`);
  } catch (llmErr) {
    console.warn(`⚠️ Primary gemini-3.6-flash update returned: ${llmErr.message}. Attempting gpt-4o-mini fallback...`);
    updatedLlm = await callRetell(`/update-retell-llm/${llmId}`, 'PATCH', {
      model: 'gpt-4o-mini',
      general_prompt: promptText,
      begin_message: canonicalDefaultBeginMessage,
      general_tools: generalTools
    });
    console.log(`✓ LLM updated successfully with gpt-4o-mini fallback and all ${generalTools.length} voice tools!`);
  }

  // 4. Update Retell Voice Agent latency, backchannel & responsiveness settings
  console.log(`[2/2] Updating Retell Voice Agent (${agentId})...`);
  const updatedAgent = await callRetell(`/update-agent/${agentId}`, 'PATCH', {
    agent_name: 'Ask Nest Ops Hotline',
    responsiveness: 1.0,
    interruption_sensitivity: 0.9,
    enable_dynamic_responsiveness: true,
    enable_backchannel: true,
    backchannel_frequency: 0.85,
    backchannel_words: ['Awesome!', 'Got you covered!', 'Perfect!', 'Yeah!', 'Got it!', 'Sounds great!'],
    begin_message_delay_ms: 100,
    voice_speed: 1.10,
    voice_temperature: 0.9,
    volume: 1.25,
    stt_mode: 'fast',
    end_call_after_silence_ms: 20000,
    max_call_duration_ms: 1800000
  });

  console.log(`✓ Retell Agent (${agentId}) successfully tuned for ultra-low latency & natural conversational flow!\n`);
  console.log(`✨ Live Sync Summary:`);
  console.log(`   - Hotline: +1 (910) 507-2047`);
  console.log(`   - Agent:   ${updatedAgent.agent_id || agentId}`);
  console.log(`   - LLM:     ${updatedLlm.llm_id || llmId}`);
  console.log(`   - Model:   ${updatedLlm.model}`);
  console.log(`   - Tools:   ${generalTools.length} active telephony tools`);
  console.log(`   - Greeting: "${updatedLlm.begin_message}"\n`);
}

if (process.env.ENABLE_LIVE_RETELL_SYNC === 'true') {
  syncNoraVoiceAgent().catch(err => {
    console.error('❌ Sync failed:', err);
    process.exit(1);
  });
} else {
  console.log('🔒 Live synchronization disabled. Set ENABLE_LIVE_RETELL_SYNC=true to apply changes live.');
}
