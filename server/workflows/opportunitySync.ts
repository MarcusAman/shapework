/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function syncOpportunitiesToWorkItems(wsId: string, dbState: any) {
  if (!dbState.workItems) dbState.workItems = [];
  if (!dbState.transactions) dbState.transactions = [];
  if (!dbState.tasks) dbState.tasks = [];
  if (!dbState.listings) dbState.listings = [];
  if (!dbState.responsibilities) dbState.responsibilities = [];
  if (!dbState.signInventory) dbState.signInventory = [];
  if (!dbState.officeSupplies) dbState.officeSupplies = [];
  if (!dbState.facilitiesIssues) dbState.facilitiesIssues = [];
  if (!dbState.profiles) dbState.profiles = [];
  if (!dbState.actionProposals) dbState.actionProposals = [];
  if (!dbState.capacityMetrics) dbState.capacityMetrics = [];

  const generatedItems: any[] = [];

  // Helper to push or update a work item
  const addGenItem = (item: {
    type: string;
    title: string;
    source?: string;
    relatedType?: string | null;
    relatedId?: string | null;
    relatedLabel?: string;
    ownerRole?: string;
    priority?: string;
    recommendedNextAction?: string;
    approvalRequired?: boolean;
  }) => {
    // Generate deterministic ID
    let key = `wi_gen_${item.type}_${item.relatedId || 'no_id'}`;
    const cleanId = item.relatedId || 'no_id';

    if (item.relatedType === 'transaction') {
      key = `transaction:${cleanId}:${item.type}`;
    } else if (item.relatedType === 'task') {
      const taskObj = dbState.tasks.find((t: any) => t.id === cleanId);
      const txId = taskObj ? taskObj.transaction_id : 'unknown';
      key = `transaction:${txId}:task:${cleanId}:${item.type}`;
    } else if (item.relatedType === 'listing' || item.relatedType === 'listing_step') {
      key = `marketing:${cleanId}:${item.type}`;
    } else if (item.relatedType === 'sign' || item.relatedType === 'supply' || item.relatedType === 'facility') {
      key = `office:${cleanId}:${item.type}`;
    } else if (item.relatedType === 'role' || item.relatedType === 'responsibility') {
      key = `role:${cleanId}:${item.type}`;
    } else if (item.relatedType === 'approval' || item.type === 'approval_needed') {
      key = `approval:${cleanId}:pending`;
    }

    // Check if it already exists in dbState.workItems
    const existing = dbState.workItems.find((w: any) => w.id === key);
    
    if (existing) {
      existing.title = item.title;
      existing.priority = item.priority || existing.priority;
      existing.recommendedNextAction = item.recommendedNextAction || existing.recommendedNextAction;
      existing.updatedAt = new Date().toISOString();
      existing.sourceSignalKey = key;
      existing.sourceRecordType = item.relatedType || '';
      existing.sourceRecordId = cleanId;
      existing.generatedBy = 'opportunity_sync_engine';

      // Reopening rule: if resolved but issue is still active, reopen it
      if (existing.status === 'completed') {
        existing.status = 'pending';
        dbState.auditEvents.push({
          id: `aud_${Date.now()}_reopen_${existing.id}`,
          workspaceId: wsId,
          timestamp: new Date().toISOString(),
          actor: 'System Sync',
          role: 'automated_sync',
          action: `Reopened Work Queue item: "${existing.title}" (Issue re-detected)`,
          context: 'System Check'
        });
      }
      generatedItems.push(existing);
    } else {
      const newItem = {
        id: key,
        workspaceId: wsId,
        type: item.type,
        title: item.title,
        source: item.source || 'system',
        relatedType: item.relatedType || null,
        relatedId: cleanId,
        relatedLabel: item.relatedLabel || '',
        ownerRole: item.ownerRole || 'operations_lead',
        status: 'pending',
        priority: item.priority || 'medium',
        recommendedNextAction: item.recommendedNextAction || '',
        approvalRequired: !!item.approvalRequired,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sourceSignalKey: key,
        sourceRecordType: item.relatedType || '',
        sourceRecordId: cleanId,
        generatedBy: 'opportunity_sync_engine'
      };
      dbState.workItems.unshift(newItem);
      generatedItems.push(newItem);
    }
  };

  // ==========================================
  // 1. People & Ownership Opportunities
  // ==========================================

  // Vacant Role alert check across 8 generic roles
  const rolesToCheck = [
    { role: 'owner', label: 'Owner / Broker of Record' },
    { role: 'operations_lead', label: 'Operations Lead' },
    { role: 'marketing_coordinator', label: 'Marketing Coordinator' },
    { role: 'transaction_coordinator', label: 'Transaction Processing / Accounting' },
    { role: 'events', label: 'Events Coordinator' },
    { role: 'maintenance', label: 'Maintenance / Supplies' },
    { role: 'compliance_partner', label: 'Compliance Partner' },
    { role: 'agent_support', label: 'Agent Support' }
  ];

  rolesToCheck.forEach(r => {
    const hasUser = dbState.profiles.some((u: any) => u.role === r.role);
    if (!hasUser) {
      addGenItem({
        type: 'vacant_role',
        title: `Vacant Role Alert: ${r.label} is unassigned`,
        relatedType: 'role',
        relatedId: r.role,
        relatedLabel: r.label,
        ownerRole: 'operations_lead',
        priority: 'high',
        recommendedNextAction: `Assign a team member to the ${r.label} role in settings directory.`,
        approvalRequired: false
      });
    }
  });

  // Missing Backup Owner & Unclear Escalation
  dbState.responsibilities.forEach((resp: any) => {
    if (!resp.backupOwnerRole || resp.backupOwnerRole === 'None') {
      addGenItem({
        type: 'missing_backup',
        title: `Missing Backup Owner: ${resp.label}`,
        relatedType: 'responsibility',
        relatedId: resp.id,
        relatedLabel: resp.label,
        ownerRole: 'operations_lead',
        priority: 'medium',
        recommendedNextAction: `Assign a backup coordinator role for ${resp.label} to avoid single points of failure.`,
        approvalRequired: false
      });
    }
    if (!resp.escalationRule || resp.escalationRule === 'None') {
      addGenItem({
        type: 'unclear_escalation',
        title: `Unclear Escalation Path: ${resp.label}`,
        relatedType: 'responsibility',
        relatedId: resp.id,
        relatedLabel: resp.label,
        ownerRole: 'operations_lead',
        priority: 'medium',
        recommendedNextAction: `Define a clear SLA threshold and escalation manager for ${resp.label}.`,
        approvalRequired: false
      });
    }
  });

  // Owner-Worthy Decisions
  const pendingProposals = dbState.actionProposals.filter((p: any) => 
    p.state === 'awaiting_approval' || p.state === 'suggested'
  );
  pendingProposals.forEach((prop: any) => {
    addGenItem({
      type: 'owner_worthy_decision',
      title: `Owner-Worthy Decision: ${prop.title}`,
      relatedType: 'proposal',
      relatedId: prop.id,
      relatedLabel: prop.property_address || 'Brokerage',
      ownerRole: 'operations_lead',
      priority: 'high',
      recommendedNextAction: `Review proposal and approve/dismiss in Approvals Center.`,
      approvalRequired: true
    });
  });

  // Staff Workload Capacity Check
  dbState.capacityMetrics.forEach((metric: any) => {
    if (metric.capacity_percentage > 90) {
      addGenItem({
        type: 'staff_workflow_reassignment',
        title: `Staff Capacity Warning: ${metric.coordinator_name} at ${metric.capacity_percentage}% workload`,
        relatedType: 'capacity',
        relatedId: metric.coordinator_name,
        relatedLabel: metric.coordinator_name,
        ownerRole: 'operations_lead',
        priority: 'high',
        recommendedNextAction: metric.suggested_reassignment || `Reallocate active files to balance workload capacity.`,
        approvalRequired: false
      });
    }
  });

  // ==========================================
  // 2. Transaction Opportunities
  // ==========================================
  dbState.transactions.forEach((tx: any) => {
    // Missing referral / source
    if (!tx.source || tx.source === 'Missing' || tx.source === 'Unknown') {
      addGenItem({
        type: 'missing_source',
        title: `Missing referral/source for transaction ${tx.property_address}`,
        relatedType: 'transaction',
        relatedId: tx.id,
        relatedLabel: tx.property_address,
        ownerRole: 'transaction_coordinator',
        priority: 'medium',
        recommendedNextAction: `Contact agent to document commission referral source.`,
        approvalRequired: false
      });
    }

    // Missing expected commission
    if (!tx.revenue || tx.revenue === 0) {
      addGenItem({
        type: 'missing_commission',
        title: `Missing expected commission for transaction ${tx.property_address}`,
        relatedType: 'transaction',
        relatedId: tx.id,
        relatedLabel: tx.property_address,
        ownerRole: 'transaction_coordinator',
        priority: 'high',
        recommendedNextAction: `Log the forecast contract commission value.`,
        approvalRequired: false
      });
    }

    // Closing date missing
    if (!tx.expected_closing_date) {
      addGenItem({
        type: 'missing_closing_date',
        title: `Missing target closing date for transaction ${tx.property_address}`,
        relatedType: 'transaction',
        relatedId: tx.id,
        relatedLabel: tx.property_address,
        ownerRole: 'transaction_coordinator',
        priority: 'high',
        recommendedNextAction: `Supply target escrow closing date to coordinate document chasing.`,
        approvalRequired: false
      });
    } else {
      // Closing soon & Countdown bucket risks
      const closingDate = new Date(tx.expected_closing_date);
      const today = new Date();
      const diffTime = closingDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 0 && diffDays <= 14) {
        addGenItem({
          type: 'closing_soon',
          title: `Transaction closing soon (${diffDays} days): ${tx.property_address}`,
          relatedType: 'transaction',
          relatedId: tx.id,
          relatedLabel: tx.property_address,
          ownerRole: 'transaction_coordinator',
          priority: 'high',
          recommendedNextAction: `Execute pre-closing checklist.`,
          approvalRequired: false
        });

        // Closing risk buckets
        let bucketType = '';
        if (diffDays <= 3) bucketType = 'closing_risk_t3';
        else if (diffDays <= 7) bucketType = 'closing_risk_t7';
        else if (diffDays <= 14) bucketType = 'closing_risk_t14';
        else if (diffDays <= 30) bucketType = 'closing_risk_t30';

        if (bucketType) {
          addGenItem({
            type: bucketType,
            title: `Critical Closing Countdown Alert (${diffDays} days): ${tx.property_address}`,
            relatedType: 'transaction',
            relatedId: tx.id,
            relatedLabel: tx.property_address,
            ownerRole: 'compliance_partner',
            priority: 'critical',
            recommendedNextAction: `Ensure all compliance documents are executed and signed before closing day.`,
            approvalRequired: false
          });
        }
      }
    }

    // Surprise closing risk
    if (tx.risk_level === 'blocked' || tx.risk_level === 'at_risk') {
      addGenItem({
        type: 'surprise_closing_risk',
        title: `Surprise closing risk on transaction ${tx.property_address}`,
        relatedType: 'transaction',
        relatedId: tx.id,
        relatedLabel: tx.property_address,
        ownerRole: 'transaction_coordinator',
        priority: 'high',
        recommendedNextAction: `Review foundation cracking or lender status blocks.`,
        approvalRequired: false
      });
    }

    // Commission readiness gap
    if (tx.compliance_score < 70 || tx.missing_docs_count > 0) {
      addGenItem({
        type: 'commission_readiness_gap',
        title: `Commission readiness gap: ${tx.property_address} has incomplete audit folder`,
        relatedType: 'transaction',
        relatedId: tx.id,
        relatedLabel: tx.property_address,
        ownerRole: 'compliance_partner',
        priority: 'high',
        recommendedNextAction: `Audit outstanding compliance checklists before authorizing commission payout.`,
        approvalRequired: false
      });
    }
  });

  // ==========================================
  // 3. Compliance Opportunities
  // ==========================================
  dbState.tasks.forEach((task: any) => {
    // Missing required document
    if (task.status === 'pending' || task.status === 'missing') {
      const isDoc = task.title.toLowerCase().includes('agreement') || 
                    task.title.toLowerCase().includes('disclosure') || 
                    task.title.toLowerCase().includes('contract');
      if (isDoc) {
        addGenItem({
          type: 'missing_document',
          title: `Missing required compliance document: ${task.title} for ${task.transaction_id}`,
          relatedType: 'task',
          relatedId: task.id,
          relatedLabel: task.title,
          ownerRole: 'compliance_partner',
          priority: 'high',
          recommendedNextAction: `Request signed agreement copy from the agent.`,
          approvalRequired: false
        });
      }
    }
    // Document issue
    if (task.status === 'action_required' || task.status === 'rejected') {
      addGenItem({
        type: 'document_issue',
        title: `Signature or initials issue on document: ${task.title}`,
        relatedType: 'task',
        relatedId: task.id,
        relatedLabel: task.title,
        ownerRole: 'compliance_partner',
        priority: 'high',
        recommendedNextAction: `Notify agent regarding missing page initials.`,
        approvalRequired: false
      });
    }
  });

  // ==========================================
  // 4. Marketing Opportunities
  // ==========================================
  dbState.listings.forEach((listing: any) => {
    // Incomplete marketing request
    if (listing.marketing_readiness === 'incomplete' || listing.marketing_readiness === 'missing_info') {
      addGenItem({
        type: 'incomplete_marketing_request',
        title: `Incomplete marketing request details: ${listing.property_address}`,
        relatedType: 'listing',
        relatedId: listing.id,
        relatedLabel: listing.property_address,
        ownerRole: 'marketing_coordinator',
        priority: 'high',
        recommendedNextAction: `Queue clarification follow-up regarding missing launch assets details.`,
        approvalRequired: false
      });
    }

    // Listing launch checklist item
    if (listing.launch_checklist && listing.launch_checklist.length > 0) {
      listing.launch_checklist.forEach((chk: any) => {
        if (chk.status === 'pending' || chk.status === 'failed') {
          addGenItem({
            type: 'listing_launch_checklist_item',
            title: `Pending launch checklist task: "${chk.step_name}" for ${listing.property_address}`,
            relatedType: 'listing_step',
            relatedId: `${listing.id}_${chk.id}`,
            relatedLabel: chk.step_name,
            ownerRole: 'listing_coordinator',
            priority: 'medium',
            recommendedNextAction: `Coordinate task execution with vendor/agent.`,
            approvalRequired: false
          });
        }
      });
    }

    // Missing photos/vendor
    if (!listing.photography_status || listing.photography_status === 'pending') {
      addGenItem({
        type: 'missing_photo_vendor',
        title: `Missing listing photography: ${listing.property_address}`,
        relatedType: 'listing',
        relatedId: listing.id,
        relatedLabel: listing.property_address,
        ownerRole: 'marketing_coordinator',
        priority: 'high',
        recommendedNextAction: `Confirm photographer appointment or schedule setup task.`,
        approvalRequired: false
      });
    }
  });

  // ==========================================
  // 5. Office, Signage, and Vendor Opportunities
  // ==========================================
  dbState.signInventory.forEach((sign: any) => {
    const isLow = (sign.total - sign.checkedOut) <= sign.lowStockThreshold;
    if (isLow) {
      addGenItem({
        type: 'low_sign_inventory',
        title: `Low stock alert: ${sign.type} (Only ${sign.total - sign.checkedOut} available)`,
        relatedType: 'sign',
        relatedId: sign.id,
        relatedLabel: sign.type,
        ownerRole: 'listing_coordinator',
        priority: 'medium',
        recommendedNextAction: `Order replacement lockboxes or directionals yard posts.`,
        approvalRequired: false
      });
    }
  });

  dbState.officeSupplies.forEach((sup: any) => {
    if (sup.status === 'Low Stock') {
      addGenItem({
        type: 'office_supply_gap',
        title: `Low office supply: ${sup.item}`,
        relatedType: 'supply',
        relatedId: sup.id,
        relatedLabel: sup.item,
        ownerRole: 'operations_lead',
        priority: 'medium',
        recommendedNextAction: `Reorder office supply and restock front desk kits.`,
        approvalRequired: false
      });
    }
  });

  dbState.facilitiesIssues.forEach((fac: any) => {
    if (fac.status === 'pending') {
      addGenItem({
        type: 'facilities_issue',
        title: `Office facilities issue: ${fac.issue}`,
        relatedType: 'facility',
        relatedId: fac.id,
        relatedLabel: fac.issue,
        ownerRole: 'operations_lead',
        priority: 'medium',
        recommendedNextAction: `Assign facility maintenance issue to repair vendor.`,
        approvalRequired: false
      });
    }
  });

  // Reconcile complete items
  dbState.workItems.forEach((w: any) => {
    if (w.generatedBy === 'opportunity_sync_engine') {
      const isStillGen = generatedItems.some(g => g.id === w.id);
      if (!isStillGen && w.status === 'pending') {
        w.status = 'completed';
        w.updatedAt = new Date().toISOString();
        dbState.auditEvents.push({
          id: `aud_${Date.now()}_resolve_${w.id}`,
          workspaceId: wsId,
          timestamp: new Date().toISOString(),
          actor: 'System Sync',
          role: 'automated_sync',
          action: `Resolved Work Queue item: "${w.title}" (Issue cleared)`,
          context: 'System Check'
        });
      }
    }
  });
}
