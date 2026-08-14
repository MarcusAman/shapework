/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Development-Only UI Primitive Sandbox Modal
 * Allows visual inspection of all Phase B1, B2, and B3 primitives in dev.
 */

import React, { useState } from 'react';
import {
  Button,
  IconButton,
  Card,
  Badge,
  StatusBadge,
  TextInput,
  TextArea,
  SearchInput,
  Select,
  Checkbox,
  Tabs,
  SegmentedControl,
  Avatar,
  EmptyState,
  Modal,
  ConfirmDialog,
  Drawer,
  Popover,
  DropdownMenu,
  FormField,
  FormGroup,
  FieldLabel,
  FieldDescription,
  FieldError,
  MetricTile,
  MetricGroup,
  DataTable,
  ResponsiveDataList,
  DataToolbar,
  Pagination,
  ProgressBar,
  Skeleton,
  LoadingState
} from '../ui';
import { Sparkles, Bell, Search, Shield, ArrowRight, User, MoreVertical, SlidersHorizontal, Trash2, Edit3, Eye, Building2, TrendingUp, AlertTriangle, FileCheck, CheckCircle } from 'lucide-react';
import { applyWorkspaceBrandTheme } from '../../styles/workspaceTheme';

export interface PrimitiveSandboxModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FictionalAgentRecord {
  id: string;
  name: string;
  office: string;
  license: string;
  status: string;
  activeContracts: number;
}

export default function PrimitiveSandboxModal({ isOpen, onClose }: PrimitiveSandboxModalProps) {
  const [activeTab, setActiveTab] = useState('b3-data');
  const [activeSegment, setActiveSegment] = useState('all');
  const [activeTheme, setActiveTheme] = useState<'nest-realty-demo' | 'default'>('nest-realty-demo');

  const [textValue, setTextValue] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [selectValue, setSelectValue] = useState('mayfaire');
  const [checkboxChecked, setCheckboxChecked] = useState(true);

  // B2 Overlay States
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // B3 Data Table States
  const [tableSearch, setTableSearch] = useState('');
  const [selectedOffice, setSelectedOffice] = useState('all');
  const [sortColumn, setSortColumn] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  if (!isOpen) return null;

  const mockAgentRecords: FictionalAgentRecord[] = [
    { id: 'agt-1', name: 'Ryan Crecelius', office: 'Mayfaire Town Center', license: '294021', status: 'active', activeContracts: 5 },
    { id: 'agt-2', name: 'Ann Gunn', office: 'Mayfaire Town Center', license: '184920', status: 'approved', activeContracts: 8 },
    { id: 'agt-3', name: 'Melissa Gagliardi', office: 'Carolina Beach Office', license: '302911', status: 'awaiting_approval', activeContracts: 3 },
    { id: 'agt-4', name: 'Jessica Vance', office: 'Mayfaire Town Center', license: '210492', status: 'active', activeContracts: 6 },
    { id: 'agt-5', name: 'David Smith', office: 'Carolina Beach Office', license: '194820', status: 'at_risk', activeContracts: 2 },
  ];

  const filteredRecords = mockAgentRecords.filter((rec) => {
    const matchesSearch = rec.name.toLowerCase().includes(tableSearch.toLowerCase()) || rec.license.includes(tableSearch);
    const matchesOffice = selectedOffice === 'all' || rec.office.toLowerCase().includes(selectedOffice);
    return matchesSearch && matchesOffice;
  });

  const handleThemeChange = (theme: 'nest-realty-demo' | 'default') => {
    setActiveTheme(theme);
    if (typeof document !== 'undefined') {
      applyWorkspaceBrandTheme(document.documentElement, theme);
    }
  };

  const handleSort = (colKey: string) => {
    if (sortColumn === colKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(colKey);
      setSortDirection('asc');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-[var(--sw-surface-elevated)] border border-[var(--sw-border)] rounded-[var(--radius-lg)] shadow-[var(--sw-shadow-modal)] w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden text-[var(--sw-text-primary)]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--sw-border)] flex items-center justify-between bg-[var(--sw-surface)] shrink-0 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[var(--brand-soft)] text-[var(--brand-primary)]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Phase B1, B2 & B3 Primitive Design Sandbox</h3>
              <p className="text-xs text-[var(--sw-text-secondary)]">Development visual inspection harness for canonical UI primitives.</p>
            </div>
          </div>

          {/* Theme Switcher Toggle */}
          <div className="flex items-center gap-2 bg-[var(--sw-canvas)] p-1 rounded-xl border border-[var(--sw-border)]">
            <button
              onClick={() => handleThemeChange('nest-realty-demo')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                activeTheme === 'nest-realty-demo' ? 'bg-white shadow-xs text-[#01362D]' : 'text-[var(--sw-text-secondary)]'
              }`}
            >
              Nest Realty Pilot
            </button>
            <button
              onClick={() => handleThemeChange('default')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                activeTheme === 'default' ? 'bg-white shadow-xs text-slate-900' : 'text-[var(--sw-text-secondary)]'
              }`}
            >
              Neutral Default
            </button>
            <Button variant="tertiary" size="sm" onClick={onClose} className="ml-2">
              Close
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 bg-[var(--sw-surface)] shrink-0">
          <Tabs
            activeTab={activeTab}
            onChange={setActiveTab}
            tabs={[
              { id: 'b3-data', label: 'B3 Data Presentation' },
              { id: 'buttons', label: 'Buttons & Controls' },
              { id: 'inputs', label: 'Form Inputs' },
              { id: 'overlays', label: 'Overlays & Dialogs (B2)' },
              { id: 'badges', label: 'Badges & Status' },
            ]}
          />
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 bg-[var(--sw-canvas)] flex-1">
          {activeTab === 'b3-data' && (
            <div className="space-y-6">
              {/* Metric Tiles Group */}
              <MetricGroup columns={3}>
                <MetricTile
                  label="Active Pipeline Volume"
                  value="$42.5M"
                  sublabel="76 active Wilmington escrow files"
                  trend="Up 12%"
                  trendDirection="up"
                  icon={<TrendingUp className="w-4 h-4" />}
                />
                <MetricTile
                  label="BIC Escalations Pending"
                  value="3"
                  sublabel="Awaiting Ryan Crecelius approval"
                  variant="warning"
                  icon={<AlertTriangle className="w-4 h-4" />}
                />
                <MetricTile
                  label="Compliance Package Status"
                  value="100%"
                  sublabel="Matched against NCREC trust ledger"
                  variant="success"
                  icon={<FileCheck className="w-4 h-4" />}
                />
              </MetricGroup>

              {/* Toolbar & Data Table */}
              <Card>
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--sw-text-secondary)]">Canonical Data Toolbar & DataTable</h4>
                  
                  <DataToolbar
                    searchValue={tableSearch}
                    onSearchChange={setTableSearch}
                    searchPlaceholder="Search agents or license #..."
                    filters={
                      <Select
                        options={[
                          { value: 'all', label: 'All Offices' },
                          { value: 'mayfaire', label: 'Mayfaire Town Center' },
                          { value: 'carolina', label: 'Carolina Beach' },
                        ]}
                        value={selectedOffice}
                        onChange={(e) => setSelectedOffice(e.target.value)}
                        fullWidth={false}
                      />
                    }
                    actions={
                      <Button variant="primary" size="sm" icon={<Building2 className="w-3.5 h-3.5" />}>
                        Add Agent
                      </Button>
                    }
                  />

                  {/* Desktop Table View */}
                  <div className="hidden sm:block">
                    <DataTable
                      columns={[
                        {
                          key: 'name',
                          header: 'Agent Name',
                          accessor: (r) => (
                            <div className="flex items-center gap-2.5">
                              <Avatar name={r.name} size="sm" />
                              <span className="font-bold text-[var(--sw-text-primary)]">{r.name}</span>
                            </div>
                          ),
                          sortable: true
                        },
                        { key: 'office', header: 'Office Location', accessor: (r) => r.office, sortable: true },
                        { key: 'license', header: 'License ID', accessor: (r) => <span className="font-mono">{r.license}</span> },
                        { key: 'status', header: 'Status', accessor: (r) => <StatusBadge status={r.status} /> },
                        { key: 'activeContracts', header: 'Active Deals', accessor: (r) => r.activeContracts, align: 'right' }
                      ]}
                      data={filteredRecords}
                      keyExtractor={(r) => r.id}
                      sortColumn={sortColumn}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                      selectable
                      selectedKeys={selectedRowKeys}
                      onSelectRow={(id, sel) => {
                        setSelectedRowKeys(sel ? [...selectedRowKeys, id] : selectedRowKeys.filter(k => k !== id));
                      }}
                      onSelectAll={(sel) => {
                        setSelectedRowKeys(sel ? filteredRecords.map(r => r.id) : []);
                      }}
                      actions={(r) => [
                        { id: 'view', label: 'View Profile', icon: <Eye className="w-3.5 h-3.5" />, onClick: () => {} },
                        { id: 'edit', label: 'Edit Role Guardrails', icon: <Edit3 className="w-3.5 h-3.5" />, onClick: () => {} }
                      ]}
                    />
                  </div>

                  {/* Mobile Data List View */}
                  <div className="block sm:hidden">
                    <ResponsiveDataList
                      data={filteredRecords}
                      keyExtractor={(r) => r.id}
                      itemConfig={{
                        title: (r) => r.name,
                        subtitle: (r) => r.office,
                        badge: (r) => <StatusBadge status={r.status} size="sm" />,
                        details: [
                          { label: 'License ID', value: (r) => r.license },
                          { label: 'Active Deals', value: (r) => r.activeContracts }
                        ]
                      }}
                    />
                  </div>

                  <Pagination
                    currentPage={currentPage}
                    totalPages={3}
                    totalItems={filteredRecords.length}
                    pageSize={5}
                    onPageChange={setCurrentPage}
                  />
                </div>
              </Card>

              {/* Progress Meters & Loading States */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--sw-text-secondary)]">Operational Capacity Meters</h4>
                  <ProgressBar label="Ann Gunn (Operations Lead)" value={45} max={100} variant="success" />
                  <ProgressBar label="Jessica Vance (Virtual Assistant)" value={78} max={100} variant="warning" />
                  <ProgressBar label="Melissa Gagliardi (Marketing Lead)" value={92} max={100} variant="danger" />
                </Card>

                <Card className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--sw-text-secondary)]">Skeleton Loading Placeholders</h4>
                  <div className="space-y-2">
                    <Skeleton height="1.25rem" width="60%" />
                    <Skeleton height="1rem" width="90%" />
                    <Skeleton height="1rem" width="40%" />
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'buttons' && (
            <div className="space-y-6">
              <Card>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--sw-text-secondary)] mb-4">Button Variants</h4>
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="primary">Primary Action</Button>
                  <Button variant="secondary">Secondary Action</Button>
                  <Button variant="tertiary">Tertiary Action</Button>
                  <Button variant="danger">Danger Action</Button>
                  <Button variant="primary" loading>Loading</Button>
                  <Button variant="primary" disabled>Disabled</Button>
                </div>
              </Card>

              <Card>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--sw-text-secondary)] mb-4">IconButton Variants</h4>
                <div className="flex flex-wrap items-center gap-3">
                  <IconButton icon={<Bell className="w-4 h-4" />} aria-label="Notifications" variant="primary" />
                  <IconButton icon={<Search className="w-4 h-4" />} aria-label="Search" variant="secondary" />
                  <IconButton icon={<Shield className="w-4 h-4" />} aria-label="Security" variant="ghost" />
                  <IconButton icon={<ArrowRight className="w-4 h-4" />} aria-label="Next" variant="danger" />
                  <IconButton icon={<User className="w-4 h-4" />} aria-label="Profile" shape="circle" variant="secondary" />
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'inputs' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="space-y-4">
                <FormGroup title="Agent License Information" description="Verify agent registration status in NCREC">
                  <FormField required>
                    <FieldLabel>Agent Full Name</FieldLabel>
                    <TextInput
                      placeholder="Enter full name..."
                      value={textValue}
                      onChange={(e) => setTextValue(e.target.value)}
                    />
                  </FormField>
                </FormGroup>
              </Card>
            </div>
          )}

          {activeTab === 'overlays' && (
            <div className="space-y-6">
              <Card className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--sw-text-secondary)]">Canonical B2 Overlay Triggers</h4>
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="primary" onClick={() => setIsSubModalOpen(true)}>Open Modal / Dialog</Button>
                  <Button variant="danger" onClick={() => setIsConfirmOpen(true)}>Open ConfirmDialog</Button>
                  <Button variant="secondary" onClick={() => setIsDrawerOpen(true)}>Open Drawer / Sheet</Button>
                </div>
              </Card>

              <Modal
                isOpen={isSubModalOpen}
                onClose={() => setIsSubModalOpen(false)}
                title="Nested Modal Test — Phase B2"
                subtitle="Verifies portal inheritance, focus trap, and Escape handling."
              >
                <p className="text-xs text-[var(--sw-text-secondary)]">Canonical Modal Dialog rendered cleanly.</p>
              </Modal>

              <ConfirmDialog
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={() => setIsConfirmOpen(false)}
                title="Delete Record?"
                message="Are you sure you want to remove this record?"
              />

              <Drawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                title="Detail Sheet"
              >
                <p className="text-xs text-[var(--sw-text-secondary)]">Canonical Drawer Sheet rendered cleanly.</p>
              </Drawer>
            </div>
          )}

          {activeTab === 'badges' && (
            <div className="space-y-6">
              <Card>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--sw-text-secondary)] mb-4">Multi-Tenant Brand & State Badges</h4>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="brand">Nest Realty Wilmington</Badge>
                  <Badge variant="success">Completed</Badge>
                  <Badge variant="warning">Needs Review</Badge>
                  <Badge variant="danger">Overdue Contingency</Badge>
                  <Badge variant="info">NCREC Rule 58A</Badge>
                  <Badge variant="ai">AI Analysis Ready</Badge>
                  <Badge variant="neutral">Draft</Badge>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
