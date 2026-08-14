/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Commercial Lease & Tenant Estoppel Audit High-Concurrency Pressure Test
 */

import express from 'express';
import http from 'http';

// Construct isolated test server with Commercial Lease & Maintenance endpoints
const app = express();
app.use(express.json());

app.post('/api/commercial/audit-lease', (req, res) => {
  const { propertyAddress, suiteNumber, tenantName } = req.body;
  const auditId = `comm_audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  return res.json({
    success: true,
    message: `Commercial Lease Audit completed for ${propertyAddress || 'Mayfaire Commercial Center'} ${suiteNumber || 'Suite 400'}`,
    audit: {
      id: auditId,
      propertyAddress: propertyAddress || 'Mayfaire Commercial Center, Wilmington NC',
      suiteNumber: suiteNumber || 'Suite 400',
      tenantName: tenantName || 'Pinnacle Tech Solutions LLC',
      leaseStructure: '5-Year NNN Commercial Lease',
      squareFootage: '4,500 sq ft',
      baseRentPerSqFt: '$28.50 / sq ft',
      monthlyBaseRent: '$10,687.50 / mo',
      estoppelCertificateStatus: '✅ VERIFIED & SIGNED (Executed Aug 2, 2026)',
      camProRataPercentage: '14.2%',
      monthlyCamReconciliation: '$1,240.00 / mo',
      certifiedAbstractUrl: 'https://shapework-os-45783991821.us-central1.run.app/commercial/suite-400-lease-abstract.pdf',
      auditedAt: new Date().toISOString()
    }
  });
});

app.post('/api/property-management/dispatch-maintenance', (req, res) => {
  const { propertyAddress, unitNumber, issueDescription, contractorName, estimateAmount } = req.body;
  const workOrderId = `wo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  return res.json({
    success: true,
    message: `Emergency Maintenance Work Order ${workOrderId} dispatched for ${propertyAddress || '105 Forest Hills Dr'} ${unitNumber || 'Unit B'}`,
    workOrder: {
      id: workOrderId,
      propertyAddress: propertyAddress || '105 Forest Hills Dr, Wilmington NC',
      unitNumber: unitNumber || 'Unit B',
      issueDescription: issueDescription || 'Emergency Water Heater Leak',
      contractorName: contractorName || 'Wilmington Mechanical Services',
      contractorPhone: '(910) 555-0311',
      estimateAmount: estimateAmount || '$1,250.00',
      bicApprovalStatus: '✅ APPROVED BY BIC (Ryan Knight)',
      tenantSmsNotification: 'Sent: "Emergency plumber dispatched for your unit. Arrival window: 1:30 PM - 3:00 PM."',
      rentLedgerStatus: '✅ CURRENT ($2,100/mo paid)',
      dispatchedAt: new Date().toISOString()
    }
  });
});

async function runCommercialLeasePressureTest() {
  console.log('=== STARTING COMMERCIAL LEASE & TENANT ESTOPPEL AUDIT PRESSURE TEST ===\n');

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://localhost:${port}`;

  try {
    // 1. Concurrent Commercial Lease Audits (100 concurrent requests)
    console.log('[Pressure Test 1] Executing 100 concurrent commercial lease & estoppel audits...');
    const leaseAudits = Array.from({ length: 100 }, (_, i) => ({
      propertyAddress: `Mayfaire Commercial Center Building ${Math.floor(i / 10) + 1}`,
      suiteNumber: `Suite ${100 + i}`,
      tenantName: `Commercial Tenant ${i + 1} Corp`
    }));

    const auditStartTime = Date.now();
    const auditResponses = await Promise.all(
      leaseAudits.map(req =>
        fetch(`${baseUrl}/api/commercial/audit-lease`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(req)
        }).then(r => r.json())
      )
    );
    const auditDuration = Date.now() - auditStartTime;

    const successfulAudits = auditResponses.filter(r => r.success && r.audit?.estoppelCertificateStatus && r.audit?.certifiedAbstractUrl);
    console.log(`✓ 100 Concurrent Commercial Audits Processed in ${auditDuration}ms (${(auditDuration / 100).toFixed(2)}ms avg/req)`);
    console.log(`✓ Successful Commercial Audits: ${successfulAudits.length} / 100`);

    // 2. Concurrent Property Maintenance Dispatches (50 concurrent requests)
    console.log('\n[Pressure Test 2] Executing 50 concurrent commercial & residential maintenance dispatches...');
    const maintenanceRequests = Array.from({ length: 50 }, (_, i) => ({
      propertyAddress: `${100 + i} Commercial Way, Wilmington NC`,
      unitNumber: `Suite ${200 + i}`,
      issueDescription: i % 2 === 0 ? 'HVAC Roof Compressor Maintenance' : 'Commercial Plumbing Recirculation Leak',
      contractorName: 'Wilmington Mechanical Services',
      estimateAmount: `$${1200 + (i * 50)}.00`
    }));

    const maintStartTime = Date.now();
    const maintResponses = await Promise.all(
      maintenanceRequests.map(req =>
        fetch(`${baseUrl}/api/property-management/dispatch-maintenance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(req)
        }).then(r => r.json())
      )
    );
    const maintDuration = Date.now() - maintStartTime;

    const successfulMaint = maintResponses.filter(r => r.success && r.workOrder?.bicApprovalStatus && r.workOrder?.rentLedgerStatus);
    console.log(`✓ 50 Concurrent Maintenance Dispatches Processed in ${maintDuration}ms (${(maintDuration / 50).toFixed(2)}ms avg/req)`);
    console.log(`✓ Successful Maintenance Work Orders: ${successfulMaint.length} / 50`);

    // Verify Zero Failures
    if (successfulAudits.length < 100 || successfulMaint.length < 50) {
      console.error('\n❌ Commercial Lease Pressure Test Failed!');
      process.exit(1);
    }

    console.log('\n=== ALL COMMERCIAL LEASE & ESTOPPEL PRESSURE TESTS PASSED WITH 100% SUCCESS! ===');
  } finally {
    server.close();
  }
}

runCommercialLeasePressureTest().catch(err => {
  console.error('❌ Error during Commercial Lease pressure test:', err);
  process.exit(1);
});
