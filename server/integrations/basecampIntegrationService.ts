/**
 * Nest Realty Basecamp 5 Integration Service
 * Connects Shapework & Ask Nora with Nest Realty's live Basecamp account (Account: 4351808)
 */

export interface BasecampPerson {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string;
  basecampPersonId: string;
}

export interface BasecampProjectDefinition {
  id: string;
  name: string;
  bucketId: string;
  url: string;
  defaultAssignee: string;
  toDoLists: {
    id: string;
    name: string;
    url: string;
    category: 'signs' | 'marketing' | 'onboarding' | 'recruitment' | 'events';
  }[];
}

export const NEST_BASECAMP_PEOPLE: Record<string, BasecampPerson> = {
  ann_gunn: {
    id: 'ann_gunn',
    name: 'Ann Gunn',
    email: 'ann@nestrealty.com',
    role: 'ATC (Air Traffic Controller) & Operations Lead',
    avatarUrl: 'https://bc3-production-assets-cdn.basecamp-static.com/4351808/people/BAhpBB9etAE=--3d47704783baee4944e5a87fb441a6c5d0f450b1/avatar',
    basecampPersonId: 'BAhpBB9etAE'
  },
  melissa_gagliardi: {
    id: 'melissa_gagliardi',
    name: 'Melissa Gagliardi',
    email: 'melissa.gagliardi@nestrealty.com',
    role: 'Marketing Project Manager',
    avatarUrl: 'https://bc3-production-assets-cdn.basecamp-static.com/4351808/people/BAhpBBFuGgI=--85188633b0fef068c9e41e0bcaedbc07ae701581/avatar',
    basecampPersonId: 'BAhpBBFuGgI'
  },
  eduardo_lovo: {
    id: 'eduardo_lovo',
    name: 'Eduardo Lovo',
    email: 'eduardo.lovo@nestrealty.com',
    role: 'Virtual Assistant & Marketing Production',
    avatarUrl: 'https://bc3-production-assets-cdn.basecamp-static.com/4351808/people/BAhpBEi%2FJQM=--56e9a4f0579d2ebea9c9537c5c84e336d8c2108e/avatar',
    basecampPersonId: 'BAhpBEi%2FJQM'
  },
  taylor_titus: {
    id: 'taylor_titus',
    name: 'Taylor Titus',
    email: 'taylor.titus@nestrealty.com',
    role: 'Head of Strategic Operations',
    avatarUrl: 'https://bc3-production-assets-cdn.basecamp-static.com/4351808/people/BAhpBAm8owE=--88f50d6d45a402bf9c0b974fc55a2d5239cc43a6/avatar',
    basecampPersonId: 'BAhpBAm8owE'
  },
  willy_clair: {
    id: 'willy_clair',
    name: 'Willy Clair',
    email: 'willy.clair@nestrealty.com',
    role: 'Senior Marketing Project Manager',
    avatarUrl: 'https://bc3-production-assets-cdn.basecamp-static.com/4351808/people/BAhpBKMMqAE=--9c3c4980f3b99553779792d6007b2bb44601fcaf/avatar',
    basecampPersonId: 'BAhpBKMMqAE'
  },
  ryan_crecelius: {
    id: 'ryan_crecelius',
    name: 'Ryan Crecelius',
    email: 'ryan@nestrealty.com',
    role: 'Lead Broker / Broker-in-Charge',
    avatarUrl: 'https://bc3-production-assets-cdn.basecamp-static.com/4351808/people/BAhpBC1etAE=--a1464ab003ecd39a3d5bd6fd0ad375268338f430/avatar',
    basecampPersonId: 'BAhpBC1etAE'
  }
};

export const NEST_BASECAMP_CONFIG = {
  accountId: '4351808',
  projects: {
    wilmington: {
      id: 'proj_wilmington',
      name: 'Wilmington',
      bucketId: '15431760',
      url: 'https://app.basecamp.com/4351808/projects/15431760',
      defaultAssignee: 'ann_gunn',
      toDoLists: [
        {
          id: '9877559869',
          name: 'Service Provider Tool & Vendor Network',
          url: 'https://app.basecamp.com/4351808/buckets/15431760/todolists/9877559869',
          category: 'signs'
        },
        {
          id: '9974075803',
          name: 'Listing Marketing & Collateral Production',
          url: 'https://app.basecamp.com/4351808/buckets/15431760/todolists/9974075803',
          category: 'marketing'
        },
        {
          id: '9877667387',
          name: 'Agent Onboarding',
          url: 'https://app.basecamp.com/4351808/buckets/15431760/todolists/9877667387',
          category: 'onboarding'
        },
        {
          id: '10187445135',
          name: 'Recruitment Project',
          url: 'https://app.basecamp.com/4351808/buckets/15431760/todolists/10187445135',
          category: 'recruitment'
        },
        {
          id: '10187428590',
          name: '2027 Nest Summit',
          url: 'https://app.basecamp.com/4351808/buckets/15431760/todolists/10187428590',
          category: 'events'
        }
      ]
    } as BasecampProjectDefinition,
    airTrafficController: {
      id: 'proj_atc',
      name: 'Air Traffic Controller (ATC)',
      bucketId: '15719008',
      url: 'https://app.basecamp.com/4351808/projects/15719008',
      defaultAssignee: 'ann_gunn',
      toDoLists: []
    }
  }
};

export interface StagedBasecampTask {
  title: string;
  description: string;
  assigneeName: string;
  assigneePersonId: string;
  toDoListId: string;
  toDoListName: string;
  projectUrl: string;
  toDoListUrl: string;
  dueAt?: string;
  sourceCallId?: string;
  propertyAddress?: string;
}

/**
 * Maps an inbound call or marketing request into a Basecamp To-Do
 */
export function createBasecampTaskFromCall(call: {
  id: string;
  callerName: string;
  callerPhone?: string;
  requestType: string;
  propertyAddress: string;
  transcript: string;
  assignedDepartment?: string;
  priority?: string;
}): StagedBasecampTask {
  const reqType = (call.requestType || '').toLowerCase();
  const address = call.propertyAddress || 'Wilmington Property';
  const caller = call.callerName || 'Nest Broker';

  let assigneeKey = 'ann_gunn';
  let targetList = NEST_BASECAMP_CONFIG.projects.wilmington.toDoLists[0]; // Service Provider / Vendors

  if (reqType.includes('market') || reqType.includes('flyer') || reqType.includes('social') || reqType.includes('postcard')) {
    assigneeKey = 'melissa_gagliardi';
    targetList = NEST_BASECAMP_CONFIG.projects.wilmington.toDoLists[1]; // Marketing
  } else if (reqType.includes('onboard')) {
    assigneeKey = 'ann_gunn';
    targetList = NEST_BASECAMP_CONFIG.projects.wilmington.toDoLists[2]; // Onboarding
  } else if (reqType.includes('sign') || reqType.includes('lockbox') || reqType.includes('facility')) {
    assigneeKey = 'ann_gunn';
    targetList = NEST_BASECAMP_CONFIG.projects.wilmington.toDoLists[0]; // Service Provider Tool
  } else if (reqType.includes('compliance') || reqType.includes('contract')) {
    assigneeKey = 'ryan_crecelius';
    targetList = NEST_BASECAMP_CONFIG.projects.wilmington.toDoLists[0];
  }

  const person = NEST_BASECAMP_PEOPLE[assigneeKey] || NEST_BASECAMP_PEOPLE.ann_gunn;
  const title = `[${call.requestType || 'Intake'}] ${address} — ${caller}`;
  const description = `📞 Ingested via Ask Nora Voice Intake (Call ID: ${call.id})
Caller: ${caller} (${call.callerPhone || 'Direct'})
Property: ${address}
Urgency: ${call.priority || 'High'}

📝 Summary of Need:
${call.transcript}

⚡ Action Items:
• Verify coordinates & vendor requirements
• Execute collateral/sign dispatch
• Update caller tracker: https://shapework-574544976572.us-central1.run.app/app/marketing?subtab=intake`;

  return {
    title,
    description,
    assigneeName: person.name,
    assigneePersonId: person.basecampPersonId,
    toDoListId: targetList.id,
    toDoListName: targetList.name,
    projectUrl: NEST_BASECAMP_CONFIG.projects.wilmington.url,
    toDoListUrl: targetList.url,
    dueAt: 'Today by 5:00 PM EST',
    sourceCallId: call.id,
    propertyAddress: address
  };
}

/**
 * Returns automated Morning Standup / Check-in summary for Melissa and Ann
 */
export function getNoraDailyCheckInBrief(pendingCallsCount: number = 3, activeTicketsCount: number = 5) {
  return {
    greeting: 'Good morning, Melissa & Ann',
    summary: `Nora has ingested ${pendingCallsCount} inbound phone requests overnight across Signs, Marketing, and Compliance. All tasks are mapped to the Wilmington Basecamp project (15431760).`,
    keyPriorities: [
      '312 Mayfaire Way: Yard sign & custom rider dispatch scheduled with Coastal Sign Post Co.',
      '408 Landfall Dr: Double-sided luxury flyer proof staged for VA Eduardo QA (SOP-008).',
      '117 Colonial Dr: Contract Form 2-T inspection verified with zero compliance flags.'
    ],
    basecampWilmingtonUrl: NEST_BASECAMP_CONFIG.projects.wilmington.url,
    timestamp: new Date().toISOString()
  };
}
