/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * SOP Library — Phase C Light-Mode Redesign
 * Refactored to canonical Shapework B1/B2/B3 design primitives.
 */

import React, { useState } from 'react';
import { 
  BookOpen, Plus, Play, Eye, FileText, CheckCircle, Clock, AlertCircle, 
  HelpCircle, ArrowRight, Search, Check, Layers
} from 'lucide-react';
import {
  Card,
  Button,
  IconButton,
  Badge,
  StatusBadge,
  MetricTile,
  MetricGroup,
  SegmentedControl,
  TextInput
} from '../ui';

interface SOPLibraryProps {
  sops: any[];
  runs: any[];
  readOnly?: boolean;
  onStartCreate?: () => void;
  onOpenStaffTemplate?: () => void;
  onOpenAskModal?: () => void;
  onSelectSop?: (sop: any, tab: 'sop' | 'run' | 'history') => void;
  onSelectRun?: (run: any) => void;
  onCompareVersions?: (verA: any, verB: any) => void;
  onSelectTemplate?: (template: any) => void;
}

export default function SOPLibrary({
  sops,
  runs,
  readOnly = false,
  onStartCreate,
  onOpenStaffTemplate,
  onOpenAskModal,
  onSelectSop,
  onSelectRun,
  onCompareVersions,
  onSelectTemplate
}: SOPLibraryProps) {
  const [activeLibraryTab, setActiveLibraryTab] = useState<'published' | 'tuesday_review' | 'draft' | 'template' | 'retired'>('published');
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');

  const filteredSops = sops.filter(sop => {
    if (activeLibraryTab === 'tuesday_review') {
      if (sop.status !== 'draft' && sop.status !== 'under_review') return false;
    } else if (activeLibraryTab === 'template') {
      if (!sop.isTemplate && !sop.tags?.includes('template')) return false;
    } else if (activeLibraryTab !== 'published' && sop.status !== activeLibraryTab) {
      return false;
    }

    if (deptFilter !== 'all' && sop.department !== deptFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = sop.title?.toLowerCase().includes(q);
      const matchPurpose = sop.purpose?.toLowerCase().includes(q);
      if (!matchTitle && !matchPurpose) return false;
    }
    return true;
  });

  const uniqueSopsMap = new Map();
  filteredSops.forEach(sop => {
    const existing = uniqueSopsMap.get(sop.sopId);
    if (!existing || parseFloat(sop.version || '1.0') >= parseFloat(existing.version || '1.0')) {
      uniqueSopsMap.set(sop.sopId, sop);
    }
  });
  const uniqueSops = Array.from(uniqueSopsMap.values());

  return (
    <div className="space-y-6 text-left select-none">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--sw-border)] pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="brand" icon={<BookOpen className="w-3.5 h-3.5" />}>
              SOP Library & Checklist Workflows
            </Badge>
            <span className="text-xs text-[var(--sw-text-secondary)] font-medium">{runs.filter(r => r.status === 'in_progress').length} Active Checklist Runs</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--sw-text-primary)] mt-1.5">
            Standard Operating Procedures Library
          </h1>
          <p className="text-xs text-[var(--sw-text-secondary)] mt-0.5 max-w-3xl leading-relaxed">
            Executable process manuals, checklist runs, and operational governance rules for Nest Realty Wilmington.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenStaffTemplate && (
            <Button variant="secondary" size="sm" icon={<FileText className="w-3.5 h-3.5" />} onClick={onOpenStaffTemplate}>
              Staff SOP Template
            </Button>
          )}
          {!readOnly && onStartCreate && (
            <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={onStartCreate}>
              New SOP
            </Button>
          )}
        </div>
      </div>

      {/* Toolbar & Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <SegmentedControl
          value={activeLibraryTab}
          onChange={(v) => setActiveLibraryTab(v as any)}
          options={[
            { id: 'published', label: 'Published' },
            { id: 'tuesday_review', label: 'Tuesday Review Queue' },
            { id: 'draft', label: 'Drafts' },
            { id: 'template', label: 'Templates' },
          ]}
        />

        <div className="flex items-center gap-3">
          <div className="w-64">
            <TextInput
              placeholder="Search procedures..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* SOP Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {uniqueSops.map((sop) => (
          <Card key={sop.id} className="p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <StatusBadge status={sop.status === 'published' ? 'healthy' : 'pending'} size="sm" />
                <span className="text-[11px] font-mono text-[var(--sw-text-secondary)]">{sop.department}</span>
              </div>
              <h3 className="font-bold text-sm text-[var(--sw-text-primary)]">{sop.title}</h3>
              <p className="text-xs text-[var(--sw-text-secondary)] line-clamp-2">{sop.purpose || 'Executable operational procedure checklist.'}</p>
            </div>

            <div className="pt-3 border-t border-[var(--sw-border)] flex items-center justify-between gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onSelectSop && onSelectSop(sop, 'sop')}
              >
                View Doc
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<Play className="w-3.5 h-3.5" />}
                onClick={() => onSelectSop && onSelectSop(sop, 'run')}
              >
                Start Run
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
