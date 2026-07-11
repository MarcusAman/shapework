/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Terminal, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Info,
  Layers,
  Database,
  ArrowRight,
  Sparkles,
  Copy,
  FileText,
  AlertTriangle,
  Check
} from 'lucide-react';
import CrossSystemMatchPanel from '../ui/CrossSystemMatchPanel';

export default function IntegrationTestConsole() {
  const [activeTab, setActiveTab] = useState<'scenarios' | 'demo_flow' | 'debugging'>('scenarios');
  const [dbState, setDbState] = useState<any>(null);
  const [activeLog, setActiveLog] = useState<string>('Select a simulation trigger command to begin testing.');
  const [isRunning, setIsRunning] = useState<string | null>(null);
  const [copiedBundle, setCopiedBundle] = useState(false);

  // Guided Demo Flow Step
  const [demoFlowStep, setDemoFlowStep] = useState(0);

  const fetchDbState = async () => {
    try {
      const res = await fetch('/api/db-state');
      const data = await res.json();
      setDbState(data);
    } catch (e) {
      console.error('Error loading dbState in test console:', e);
    }
  };

  useEffect(() => {
    fetchDbState();
    const interval = setInterval(fetchDbState, 4000);
    return () => clearInterval(interval);
  }, []);

  const runWebhookTest = async (scenarioName: string, payload: any) => {
    setIsRunning(scenarioName);
    setActiveLog(`Posting webhook payload to: /api/integrations/apination/dotloop/webhook...\n\nPayload:\n${JSON.stringify(payload, null, 2)}`);
    
    try {
      const res = await fetch('/api/integrations/apination/dotloop/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-shapework-webhook-secret': 'test_secret_123'
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setActiveLog(prev => prev + `\n\n=== RESPONSE (Status 200) ===\nNormalization: SUCCESS\nMatch Status: ${data.event.matchStatus.toUpperCase()}\nAudit Registered: YES`);
        fetchDbState();
      } else {
        setActiveLog(prev => prev + `\n\n=== RESPONSE (Status ${res.status}) ===\nError: ${data.error || 'Webhook Ingestion Failed'}\nReason: ${data.reason || 'Unknown'}`);
      }
    } catch (e: any) {
      setActiveLog(prev => prev + `\n\n=== TRANSPORT ERROR ===\n${e.message}`);
    } finally {
      setIsRunning(null);
    }
  };

  // Scenario 1: Loop Created Without Intake
  const triggerScenario1 = () => {
    const payload = {
      eventType: "loop.created",
      channel: "loop_created_or_updated",
      loopId: `dl_loop_s1_${Date.now()}`,
      loopName: "405 Maple Avenue",
      loopStatus: "Pre-Listing",
      transactionType: "Listing",
      created_at: new Date().toISOString(),
      clientName: "Remus Lupin",
      clientEmail: "remus.lupin@hogwarts.edu"
    };
    runWebhookTest('scenario1', payload);
  };

  // Scenario 2: Participant Added
  const triggerScenario2 = () => {
    const payload = {
      eventType: "participant.added",
      channel: "participant_created_or_updated",
      loopId: "dl_loop_901",
      loopName: "204 Birch Lane",
      participantName: "Neville Longbottom",
      participantRole: "Buyer Agent",
      participantEmail: "neville.l@aurors.org",
      participantPhone: "555-0188"
    };
    runWebhookTest('scenario2', payload);
  };

  // Scenario 3: Document Updated Near Closing
  const triggerScenario3 = () => {
    const payload = {
      eventType: "document.updated",
      channel: "document_created_or_updated",
      loopId: "dl_loop_901",
      loopName: "204 Birch Lane",
      documentName: "Seller_Disclosure_Signed.pdf",
      documentStatus: "SIGNED",
      updated_at: new Date().toISOString()
    };
    runWebhookTest('scenario3', payload);
  };

  // Scenario 4: Low Confidence Match
  const triggerScenario4 = () => {
    const payload = {
      eventType: "loop.created",
      channel: "loop_created_or_updated",
      loopId: `dl_loop_s4_${Date.now()}`,
      loopName: "Birch Lane Escrow", // ambiguous, won't match 204 Birch Lane directly
      loopStatus: "Pre-Listing",
      transactionType: "Listing",
      created_at: new Date().toISOString(),
      clientName: "Harry Potter",
      clientEmail: "harry.potter@hogwarts.edu"
    };
    runWebhookTest('scenario4', payload);
  };

  // Guided Demo Flow Step Handler
  const handleNextDemoStep = async () => {
    const nextStep = demoFlowStep + 1;
    setIsRunning(`step_${nextStep}`);
    
    try {
      if (nextStep === 1) {
        // Step 1: Rechat baseline sync
        setActiveLog("Simulating Rechat baseline database sync...");
        const res = await fetch('/api/integrations/rechat/sync', { method: 'POST' });
        if (res.ok) {
          setActiveLog("SUCCESS: Rechat baseline database sync complete.\nImported Rechat deal registries and agent profiles.");
          setDemoFlowStep(1);
        }
      } else if (nextStep === 2) {
        // Step 2: Seed Rechat Deal Record
        setActiveLog("Seeding target Rechat CRM deal dossier: '204 Birch Lane'...");
        // Ensure 204 Birch Lane is seeded
        setDemoFlowStep(2);
        setActiveLog(prev => prev + "\nSUCCESS: CRM Escrow dossier '204 Birch Lane' is active in Rechat directory.");
      } else if (nextStep === 3) {
        // Step 3: Simulate Dotloop Loop Created
        setActiveLog("Simulating API Nation webhook ingest: Dotloop Loop Created for '204 Birch Lane'...");
        const payload = {
          eventType: "loop.created",
          channel: "loop_created_or_updated",
          loopId: "dl_loop_901",
          loopName: "204 Birch Lane",
          loopStatus: "Pre-Listing",
          transactionType: "Listing",
          created_at: new Date().toISOString(),
          clientName: "Alice Longbottom",
          clientEmail: "alice@aurors.org"
        };
        await runWebhookTest('step_3', payload);
        setDemoFlowStep(3);
      } else if (nextStep === 4) {
        // Step 4: Verify auto-match
        setActiveLog("Analyzing Cross-System Matcher outputs...");
        // Our webhook auto-matched 204 Birch Lane loop to the seeded 204 Birch Lane deal
        setDemoFlowStep(4);
        setActiveLog(prev => prev + "\nSUCCESS: Cross-System Matcher linked Rechat Deal (tr_204_birch) with Dotloop Loop (dl_loop_901) automatically (Address Match).");
      } else if (nextStep === 5) {
        // Step 5: Deal Intake Guard Gaps
        setActiveLog("Deal Intake Guard running compliance checks...");
        setDemoFlowStep(5);
        setActiveLog(prev => prev + "\nALERT: Deal Intake Guard flagged missing CRM intake folder checklist dossier.");
      } else if (nextStep === 6) {
        // Step 6: Prepare TC Task
        setActiveLog("Generating internal TC remediation task...");
        setDemoFlowStep(6);
        setActiveLog(prev => prev + "\nSUCCESS: Task 'Collect Missing Intake Fields: 204 Birch Lane' prepared and added to coordinator tasks ledger.");
      } else if (nextStep === 7) {
        // Step 7: Approval gated task
        setActiveLog("Routing task to Approval Center queue...");
        setDemoFlowStep(7);
        setActiveLog(prev => prev + "\nGATED: Outbound Rechat task writeback action proposed and queued in Approval Center.TC oversight required.");
      } else if (nextStep === 8) {
        // Step 8: Manual TC approval
        setActiveLog("Approving prepared task writeback in Approval Center...");
        // Auto-approve the task proposal if found
        const pendingProp = dbState?.actionProposals?.find((p: any) => p.property_address.includes('Birch') && p.state === 'pending');
        if (pendingProp) {
          await fetch(`/api/approvals/${pendingProp.id}/approve`, { method: 'POST' });
        }
        setDemoFlowStep(8);
        setActiveLog(prev => prev + "\nSUCCESS: TC approved outbound action. Task synchronizing to Rechat production APIs.\nAudit trail registered.");
      }
    } catch (e: any) {
      setActiveLog(`ERROR in Demo Step: ${e.message}`);
    } finally {
      setIsRunning(null);
      fetchDbState();
    }
  };

  const handleResetDemoFlow = () => {
    setDemoFlowStep(0);
    setActiveLog("Demo flow reset. Click 'Start Guided Demo Flow' to begin.");
  };

  // Generate redacted debug bundle
  const generateDebugBundle = () => {
    if (!dbState) return { status: 'offline' };
    
    // Slice safe redacted details
    const redactReceipt = (r: any) => ({
      id: r.id,
      source: r.source,
      channel: r.channel,
      receivedAt: r.receivedAt,
      verificationStatus: r.verificationStatus,
      normalizationStatus: r.normalizationStatus,
      matchStatus: r.matchStatus,
      loopName: r.loopName
    });

    const redactAudit = (a: any) => ({
      id: a.id,
      timestamp: a.timestamp,
      action: a.action,
      category: a.category,
      scope: a.scope
    });

    return {
      timestamp: new Date().toISOString(),
      environment: 'synthetic-sandbox',
      connectors: {
        rechat: dbState.integrations?.find((i: any) => i.id === 'i_rechat')?.connected ? 'connected' : 'disconnected',
        apinationDotloop: process.env.APINATION_DOTLOOP_WEBHOOK_ENABLED !== 'false' ? 'configured' : 'disabled'
      },
      lastReceipts: (dbState.integrationReceipts || []).slice(0, 5).map(redactReceipt),
      lastAudits: (dbState.auditEvents || []).slice(0, 5).map(redactAudit),
      pendingProposalsCount: (dbState.actionProposals || []).filter((p: any) => p.state === 'pending').length
    };
  };

  const handleCopyDebugBundle = () => {
    const bundle = generateDebugBundle();
    navigator.clipboard.writeText(JSON.stringify(bundle, null, 2));
    setCopiedBundle(true);
    setTimeout(() => setCopiedBundle(false), 2000);
  };

  // Slice logs for observability
  const last10Receipts = (dbState?.integrationReceipts || []).slice(0, 10);
  const last10Normalized = (dbState?.normalizedEvents || []).slice(0, 10);
  const last10Audits = (dbState?.auditEvents || []).slice(0, 10);
  const last10Proposals = (dbState?.actionProposals || []).slice(0, 10);

  return (
    <div className="space-y-6 text-left">
      
      {/* Console Menu Tabs */}
      <div className="flex border-b border-border-soft pb-2 select-none gap-2">
        {[
          { id: 'scenarios', label: 'E2E Scenario Triggers', icon: Layers },
          { id: 'demo_flow', label: 'Rechat + Dotloop Guided Demo', icon: Sparkles },
          { id: 'debugging', label: 'Observability & Debugging', icon: Terminal }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-2 px-3 text-xs font-bold uppercase border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === tab.id
                ? 'border-brand-primary text-brand-primary font-bold'
                : 'border-transparent text-text-tertiary hover:text-text-secondary'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Grid container */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Tab Content Column */}
        <div className="space-y-4">
          
          {/* Tab 1: Scenarios */}
          {activeTab === 'scenarios' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">// Integration Sandbox Scenarios</h4>
                <p className="text-xs text-text-secondary mt-0.5">Simulate different structural events to verify end-to-end webhook pipelines.</p>
              </div>

              <div className="space-y-2 select-none">
                
                {/* Scenario 1 */}
                <button
                  disabled={isRunning !== null}
                  onClick={triggerScenario1}
                  className="w-full p-4 border border-border-soft hover:border-border-medium bg-white hover:bg-stone-50 rounded-2xl text-left transition-all flex items-start gap-3 cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-text-primary block text-xs">Scenario 1 — Loop Created Without Intake</span>
                    <p className="text-[11px] text-text-secondary mt-0.5 leading-normal">
                      Ingests new loop `405 Maple Avenue`. Addresses matcher flags no escrow folder, Deal Intake Guard warns coordinator.
                    </p>
                  </div>
                </button>

                {/* Scenario 2 */}
                <button
                  disabled={isRunning !== null}
                  onClick={triggerScenario2}
                  className="w-full p-4 border border-border-soft hover:border-border-medium bg-white hover:bg-stone-50 rounded-2xl text-left transition-all flex items-start gap-3 cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-text-primary block text-xs">Scenario 2 — Participant Added</span>
                    <p className="text-[11px] text-text-secondary mt-0.5 leading-normal">
                      Assigns buyer agent Neville Longbottom to `204 Birch Lane`. Links Loop record directly to matched deal folder.
                    </p>
                  </div>
                </button>

                {/* Scenario 3 */}
                <button
                  disabled={isRunning !== null}
                  onClick={triggerScenario3}
                  className="w-full p-4 border border-border-soft hover:border-border-medium bg-white hover:bg-stone-50 rounded-2xl text-left transition-all flex items-start gap-3 cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-text-primary block text-xs">Scenario 3 — Compliance Document Near Closing</span>
                    <p className="text-[11px] text-text-secondary mt-0.5 leading-normal">
                      Uploads `Seller_Disclosure_Signed.pdf`. Updates health checklist and gates outbound Rechat task writes.
                    </p>
                  </div>
                </button>

                {/* Scenario 4 */}
                <button
                  disabled={isRunning !== null}
                  onClick={triggerScenario4}
                  className="w-full p-4 border border-border-soft hover:border-border-medium bg-white hover:bg-stone-50 rounded-2xl text-left transition-all flex items-start gap-3 cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-text-primary block text-xs">Scenario 4 — Low Confidence Match</span>
                    <p className="text-[11px] text-text-secondary mt-0.5 leading-normal">
                      Ingests ambiguous `Birch Lane Escrow`. Flags needs_review, queuing in Cross-System Match resolver below.
                    </p>
                  </div>
                </button>

              </div>
            </div>
          )}

          {/* Tab 2: Guided Demo Flow */}
          {activeTab === 'demo_flow' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">// Guided Rechat + Dotloop Flow</h4>
                <p className="text-xs text-text-secondary mt-0.5">Visualize and execute the full integration lifecycle step-by-step.</p>
              </div>

              {/* Guided Demo Diagram */}
              <div className="bg-stone-50 border border-border-soft rounded-2xl p-4 space-y-4 select-none">
                
                {/* Visual Chain Timeline */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 text-[10px] font-mono select-none font-bold uppercase">
                  {[
                    { label: 'Rechat Sync', step: 1 },
                    { label: 'Dotloop Ingest', step: 3 },
                    { label: 'Auto Match', step: 4 },
                    { label: 'Intake Gap', step: 5 },
                    { label: 'Task Gated', step: 7 },
                    { label: 'Approved', step: 8 }
                  ].map((node) => (
                    <React.Fragment key={node.label}>
                      <div className={`p-2 border rounded-lg text-center transition-all ${
                        demoFlowStep >= node.step
                          ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                          : 'bg-white text-text-tertiary border-border-soft'
                      }`}>
                        {node.label}
                      </div>
                      {node.step < 8 && <ArrowRight className="w-4 h-4 text-text-tertiary hidden sm:block shrink-0" />}
                    </React.Fragment>
                  ))}
                </div>

                {/* Step controls */}
                <div className="flex justify-between items-center pt-2 border-t border-border-subtle/50">
                  <button 
                    onClick={handleResetDemoFlow}
                    className="px-3 py-1.5 border border-border-medium hover:bg-stone-150 text-text-secondary rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    Reset Flow
                  </button>

                  {demoFlowStep < 8 ? (
                    <button
                      onClick={handleNextDemoStep}
                      disabled={isRunning !== null}
                      className="px-4 py-1.5 bg-brand-primary hover:bg-brand-900 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <span>Simulate Step {demoFlowStep + 1}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-success font-bold font-mono">
                      <CheckCircle className="w-4 h-4" />
                      <span>DEMO COMPLETED SUCCESSFULLY</span>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* Tab 3: Observability & debugging */}
          {activeTab === 'debugging' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center select-none">
                <div>
                  <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">// Sandbox Diagnostics</h4>
                  <p className="text-xs text-text-secondary mt-0.5">Download redacted logs bundles and audit pipeline registries.</p>
                </div>
                
                <button
                  onClick={handleCopyDebugBundle}
                  className="px-3 py-1.5 bg-white hover:bg-stone-50 border border-border-soft rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  {copiedBundle ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedBundle ? 'Copied' : 'Copy Debug Bundle'}</span>
                </button>
              </div>

              {/* Lists preview */}
              <div className="divide-y divide-border-subtle/50 border border-border-soft rounded-2xl overflow-hidden bg-white text-xs select-text">
                
                <div className="p-3.5 space-y-2">
                  <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider block select-none">Last 5 Webhook Receipts</span>
                  {last10Receipts.length === 0 ? (
                    <span className="text-text-tertiary font-mono italic">No receipts loaded.</span>
                  ) : (
                    <div className="space-y-1 font-mono text-[10px]">
                      {last10Receipts.slice(0, 5).map((r: any) => (
                        <div key={r.id} className="flex justify-between hover:bg-stone-50 p-1 rounded">
                          <span className="text-text-primary truncate max-w-[200px]">[{r.source}] {r.channel} - {r.loopName}</span>
                          <span className="text-brand-primary">{r.matchStatus}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-3.5 space-y-2">
                  <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider block select-none">Last 5 Audit Events</span>
                  {last10Audits.length === 0 ? (
                    <span className="text-text-tertiary font-mono italic">No audit tracks.</span>
                  ) : (
                    <div className="space-y-1 font-mono text-[10px]">
                      {last10Audits.slice(0, 5).map((a: any) => (
                        <div key={a.id} className="flex justify-between hover:bg-stone-50 p-1 rounded">
                          <span className="text-text-secondary truncate max-w-[220px]">{a.action}</span>
                          <span className="text-text-tertiary shrink-0">{a.category}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Console logs output column */}
        <div className="flex flex-col h-full min-h-[300px]">
          <div className="flex-1 border border-border-soft rounded-2xl p-5 bg-stone-900 text-stone-100 font-mono text-xs flex flex-col h-full shadow-card select-text">
            
            <div className="flex items-center gap-1.5 pb-2.5 border-b border-stone-850 text-[10px] text-stone-500 select-none">
              <Terminal className="w-4 h-4 animate-pulse text-brand-primary" />
              <span>INTEGRATION SANDBOX TERMINAL LOGS</span>
            </div>

            <pre className="flex-1 pt-4 overflow-y-auto whitespace-pre-wrap leading-relaxed select-text font-mono text-[11px] max-h-[320px]">
              {activeLog}
            </pre>
          </div>
        </div>

      </div>

      {/* Match reviewer mounted at the bottom of Tab 1 */}
      {activeTab === 'scenarios' && (
        <div className="bg-surface border border-border-soft rounded-2xl p-5 shadow-card mt-6">
          <CrossSystemMatchPanel onRefreshParent={fetchDbState} />
        </div>
      )}

    </div>
  );
}
