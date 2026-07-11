import { classifyRequest } from '../server/headless/opsClassifier';
import { can, filterRequestsByAccess } from '../server/auth/opsAuth';
import { UserMembership, OpsRequest } from '../server/headless/opsBlueprintTypes';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

console.log('Running Brokerage Operations Blueprint MVP Tests...');

// 1. Test Classification rules
const req1 = classifyRequest('Need commissions audit on closing splits', 'Closed listing at 102 Pine St');
assert(req1.category === 'accounting_commissions', 'commission should route to accounting');
assert(req1.assignedRole === 'accounting_manager', 'accounting manager should own commission requests');

const req2 = classifyRequest('compliance disclosure file review', 'Agent submitted custom lease agreement');
assert(req2.category === 'compliance', 'compliance keyword routes to compliance category');
assert(req2.assignedRole === 'bic', 'BIC should be assigned to compliance review');

const req3 = classifyRequest('Need open house yard signs and key lockbox', 'Leaving key set on the front desk closet');
assert(req3.category === 'office_supplies', 'signs and lockbox checkouts route to operations/office');
assert(req3.assignedRole === 'operations_manager', 'Operations Manager should own signs/lockboxes');

const req4 = classifyRequest('repeated client complaint regarding rising listing costs', 'Serious feedback regarding commissions structure');
assert(req4.category === 'leadership_decision', 'policy and complaints route to leadership');
assert(req4.assignedRole === 'regional_leader', 'regional leader owns leadership decisions');

// 2. Test RBAC can() helper
assert(can('platform_admin', 'request:delete'), 'admin has wildcard delete');
assert(can('regional_leader', 'request:assign'), 'regional leader can assign requests');
assert(can('agent', 'request:create'), 'agent can submit request');
assert(!can('agent', 'request:delete'), 'agent cannot delete requests');
assert(!can('marketing_manager', 'audit:view'), 'marketing coordinator cannot view security logs');

// 3. Test filterRequestsByAccess scoping
const sampleRequests: OpsRequest[] = [
  {
    id: '1', organizationId: 'nest-realty', title: 'BIC Compliance Audit', description: 'Review transaction',
    category: 'compliance', source: 'dashboard', requesterName: 'Sarah', requesterEmail: 'sarah.j@nestrealty.com',
    requesterRole: 'operations_lead', assignedOwner: 'BIC', assignedRole: 'bic', priority: 'high', status: 'new',
    slaDueAt: '', createdAt: '', updatedAt: '', escalationLevel: 0
  },
  {
    id: '2', organizationId: 'nest-realty', title: 'Comm Auditing check', description: 'Check deposits details',
    category: 'accounting_commissions', source: 'dashboard', requesterName: 'Sarah', requesterEmail: 'sarah.j@nestrealty.com',
    requesterRole: 'operations_lead', assignedOwner: 'James', assignedRole: 'accounting_manager', priority: 'normal', status: 'new',
    slaDueAt: '', createdAt: '', updatedAt: '', escalationLevel: 0
  },
  {
    id: '3', organizationId: 'nest-realty', title: 'My Personal Issue', description: 'Help me reset password',
    category: 'unknown_owner', source: 'dashboard', requesterName: 'Agent Cooper', requesterEmail: 'agent.cooper@nestrealty.com',
    requesterRole: 'agent', assignedOwner: 'Ann', assignedRole: 'operations_manager', priority: 'normal', status: 'new',
    slaDueAt: '', createdAt: '', updatedAt: '', escalationLevel: 0
  }
];

const jamesMembership: UserMembership = {
  id: 'm1', userId: 'james@nestrealty.com', organizationId: 'nest-realty', roleId: 'accounting_manager', status: 'active', createdAt: '', updatedAt: ''
};
const scopedJames = filterRequestsByAccess(jamesMembership, sampleRequests);
assert(scopedJames.length === 1 && scopedJames[0].id === '2', 'accounting manager only sees accounting requests');

const agentMembership: UserMembership = {
  id: 'm2', userId: 'agent.cooper@nestrealty.com', organizationId: 'nest-realty', roleId: 'agent', status: 'active', createdAt: '', updatedAt: ''
};
const scopedAgent = filterRequestsByAccess(agentMembership, sampleRequests);
assert(scopedAgent.length === 1 && scopedAgent[0].id === '3', 'agent only sees own requested items');

console.log('\nAll integration tests passed successfully.');
