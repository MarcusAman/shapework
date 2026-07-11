/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  History, 
  Database,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

type ImportType = 'roster' | 'transactions' | 'compliance' | 'marketing_backlog' | 'signage' | 'office_readiness';

interface DataImportCenterProps {
  state?: any;
}

const TEMPLATES: Record<ImportType, { title: string; headers: string[]; example: string; filename: string }> = {
  roster: {
    title: 'Agent Roster Template',
    headers: ['agent_name', 'email', 'phone'],
    example: 'John Doe,john.doe@brokerage.local,555-0190\nJane Smith,jane.smith@brokerage.local,555-0191',
    filename: 'agent-roster-template.csv'
  },
  transactions: {
    title: 'Active Transactions Template',
    headers: ['property', 'client_name', 'side', 'stage', 'closing_date', 'expected_commission'],
    example: '456 Oak Avenue,Jane Smith,buyer,contract_to_close,2026-07-15,15000\n123 Pine Street,John Doe,buyer,contract_to_close,,12000',
    filename: 'active-transactions-template.csv'
  },
  compliance: {
    title: 'Compliance Checklist Template',
    headers: ['property', 'required_document', 'status', 'responsible_person'],
    example: '456 Oak Avenue,Buyer Agency Agreement,missing,Jane Smith\n123 Pine Street,Purchase Contract,completed,John Doe',
    filename: 'compliance-checklist-template.csv'
  },
  marketing_backlog: {
    title: 'Marketing Request Backlog Template',
    headers: ['property', 'asset_type', 'due_date'],
    example: '456 Oak Avenue,flyer,2026-07-10\n123 Pine Street,social_post,2026-07-05',
    filename: 'marketing-request-backlog-template.csv'
  },
  signage: {
    title: 'Sign Inventory Template',
    headers: ['sign_type', 'status'],
    example: 'Premium Post Sign,installed\nDirectional Sign,available',
    filename: 'sign-inventory-template.csv'
  },
  office_readiness: {
    title: 'Office Readiness Supplies Template',
    headers: ['supply_item', 'status'],
    example: 'Lockboxes,Low Stock\nSold Riders,In Stock',
    filename: 'office-readiness-template.csv'
  }
};

export default function DataImportCenter({ state = {} }: DataImportCenterProps) {
  const { fetchState } = state;
  const [importType, setImportType] = useState<ImportType>('roster');
  const [csvText, setCsvText] = useState('');
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [importSummary, setImportSummary] = useState<any | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleParse = () => {
    const template = TEMPLATES[importType];
    const lines = csvText.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      setValidationErrors(['CSV must contain a header row and at least one data row.']);
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const missingHeaders = template.headers.filter(h => !headers.includes(h));

    if (missingHeaders.length > 0) {
      setValidationErrors([`Missing required column headers: ${missingHeaders.join(', ')}`]);
      return;
    }

    const errors: string[] = [];
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map(p => p.trim());
      if (parts.length !== headers.length) {
        errors.push(`Row ${i + 1} has ${parts.length} values (expected ${headers.length})`);
        continue;
      }

      const rowObj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        rowObj[h] = parts[idx];
      });

      // Simple validations
      if (!rowObj[template.headers[0]]) {
        errors.push(`Row ${i + 1} is missing key identifier: ${template.headers[0]}`);
      }

      rows.push(rowObj);
    }

    setValidationErrors(errors);
    setParsedRows(rows);
  };

  const handleImportSubmit = async () => {
    if (parsedRows.length === 0 || validationErrors.length > 0) return;
    setIsImporting(true);
    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          importType,
          rows: parsedRows
        })
      });
      if (res.ok) {
        const data = await res.json();
        setImportSummary(data.summary);
        setIsSuccess(true);
        setCsvText('');
        setParsedRows([]);
        if (fetchState) await fetchState();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsImporting(false);
    }
  };

  const activeTemplate = TEMPLATES[importType];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left items-start font-sans">
      
      {/* CSV paste and configure */}
      <div className="lg:col-span-2 bg-surface border border-border-soft rounded-2xl p-5 shadow-sm space-y-4">
        
        <div className="border-b border-border-soft pb-2 flex justify-between items-center select-none">
          <div>
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">CSV Data Ingestion Panel</h3>
            <p className="text-[10px] text-text-secondary mt-0.5">Quickly import structured lists before setting up live webhooks.</p>
          </div>
          <span className="text-[9px] bg-brand-soft text-brand-primary px-2 py-0.5 rounded font-bold uppercase">Manual Triage Mode</span>
        </div>

        <div className="grid grid-cols-3 gap-2 flex-wrap">
          {(Object.keys(TEMPLATES) as ImportType[]).map((type) => (
            <button
              key={type}
              onClick={() => {
                setImportType(type);
                setCsvText('');
                setParsedRows([]);
                setValidationErrors([]);
                setIsSuccess(false);
              }}
              className={`py-2 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                importType === type 
                  ? 'bg-brand-soft border-brand-primary text-brand-primary' 
                  : 'border-border-soft text-text-secondary hover:bg-stone-50'
              }`}
            >
              {type.replace(/_/g, ' ').toUpperCase()}
            </button>
          ))}
        </div>

        {/* Template info */}
        <div className="bg-stone-50 border border-border-soft rounded-xl p-3.5 space-y-2">
          <div className="flex justify-between items-center text-[10px] text-text-tertiary select-none font-bold">
            <span>{activeTemplate.title}</span>
            <span className="text-brand-primary">Standard Header CSV</span>
          </div>
          <div className="text-[10px] text-text-secondary font-mono leading-relaxed bg-white border border-border-subtle p-2.5 rounded-lg select-all">
            {activeTemplate.headers.join(',')}<br/>
            {activeTemplate.example}
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setCsvText(activeTemplate.headers.join(',') + '\n' + activeTemplate.example)}
              className="text-[9px] text-brand-primary font-bold hover:underline mt-1 cursor-pointer block select-none"
            >
              [ Load Example Template Text ]
            </button>
            <a
              href={`/templates/${activeTemplate.filename}`}
              download
              className="text-[9px] text-brand-primary font-bold hover:underline mt-1 block select-none"
            >
              [ Download CSV Template File ]
            </a>
          </div>
        </div>

        {/* Paste Area */}
        <div className="space-y-1">
          <label className="text-[10px] text-text-tertiary font-bold uppercase select-none">Paste CSV Data Stream</label>
          <textarea
            value={csvText}
            onChange={(e) => {
              setCsvText(e.target.value);
              setIsSuccess(false);
            }}
            placeholder="Paste comma-separated rows here..."
            className="w-full p-3 font-mono text-[10px] border border-border-soft rounded-xl focus:outline-none focus:border-brand-primary bg-stone-50/50"
            rows={8}
          />
        </div>

        {/* Parse controls */}
        <div className="flex gap-3">
          <button
            onClick={handleParse}
            disabled={!csvText.trim()}
            className="px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Validate Schema & Parse Rows</span>
          </button>

          {parsedRows.length > 0 && validationErrors.length === 0 && (
            <button
              onClick={handleImportSubmit}
              disabled={isImporting}
              className="px-4 py-2 bg-status-success text-white hover:bg-status-success/80 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              {isImporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
              <span>Import {parsedRows.length} Rows to Workspace</span>
            </button>
          )}
        </div>

        {/* Success toast */}
        {isSuccess && importSummary && (
          <div className="p-4 bg-status-success-soft/20 border border-status-success/15 text-text-secondary rounded-xl text-xs font-medium space-y-2 select-text">
            <div className="flex items-center gap-2 text-status-success font-bold">
              <CheckCircle className="w-4 h-4" />
              <span>CSV Import Complete</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-[10px] bg-white border border-border-soft p-3 rounded-lg font-mono">
              <div>Imported: <span className="font-bold text-text-primary">{importSummary.importedRows}</span></div>
              <div>Skipped: <span className="font-bold text-text-primary">{importSummary.skippedRows}</span></div>
              <div>Duplicates: <span className="font-bold text-text-primary">{importSummary.duplicateRows}</span></div>
              <div>Warnings: <span className="font-bold text-text-primary">{importSummary.rowsWithWarnings}</span></div>
              <div>Tasks Created: <span className="font-bold text-text-primary">{importSummary.workItemsCreated}</span></div>
            </div>
            <p className="text-[9px] text-text-tertiary">
              Audit Stamp: <span className="font-mono">{importSummary.auditEventId}</span>
            </p>
          </div>
        )}

      </div>

      {/* Preview and Validation errors */}
      <div className="space-y-4">
        {(validationErrors.length > 0 || parsedRows.length > 0) && (
          <div className="bg-surface border border-border-soft rounded-2xl p-4 shadow-sm space-y-3">
            <h4 className="text-[10px] text-text-tertiary font-bold uppercase select-none tracking-wider">Validation Feedback</h4>
            
            {validationErrors.length > 0 ? (
              <div className="space-y-2">
                {validationErrors.map((err, idx) => (
                  <div key={idx} className="flex gap-2 text-[10px] text-risk-red font-semibold leading-relaxed bg-risk-red-soft/25 p-2 rounded-lg">
                    <AlertTriangle className="w-3.5 h-3.5 text-risk-red shrink-0" />
                    <span>{err}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-[10px] text-status-success font-bold select-none bg-status-success-soft/20 p-2 rounded-lg">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Validation passed. {parsedRows.length} rows verified.</span>
                </div>
                <div className="max-h-[250px] overflow-y-auto border border-border-soft rounded-lg divide-y divide-border-soft bg-stone-50 font-mono text-[9px] text-text-secondary p-1">
                  {parsedRows.map((row, idx) => (
                    <div key={idx} className="p-1.5 truncate">
                      {idx + 1}. {Object.values(row).join(' | ')}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
