import { OwnerBriefItem } from './runtimeTypes.js';

export function createOwnerBriefItem(dbState: any, params: Partial<OwnerBriefItem>): OwnerBriefItem {
  if (!dbState.ownerBriefItems) dbState.ownerBriefItems = [];

  const item: OwnerBriefItem = {
    id: params.id || `bi_${Math.random().toString(36).substring(2, 11)}`,
    workspace_id: params.workspace_id || 'nest-realty-demo',
    source_type: params.source_type || 'job',
    source_id: params.source_id || '',
    title: params.title || 'Brief Update',
    summary: params.summary || 'Summary of action',
    category: params.category || 'completed_work',
    priority: params.priority || 'medium',
    created_at: new Date().toISOString()
  };

  dbState.ownerBriefItems.unshift(item);
  return item;
}
