import fs from 'fs';
import path from 'path';

const testDir = path.join(process.cwd(), 'data-tenant_nest_acceptance_20260803_run001');
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
}

const targetFile = path.join(testDir, 'mutex_recovery_test.json');
let writeMutexChain: Promise<any> = Promise.resolve();

function mutexWrite(data: any): Promise<void> {
  writeMutexChain = writeMutexChain.then(async () => {
    if (data && data.__failIntentionally) {
      throw new Error('INTENTIONAL_WRITE_FAILURE_FOR_TESTING');
    }
    const tmpPath = `${targetFile}.tmp.${Math.random().toString(36).substring(7)}`;
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2));
    fs.renameSync(tmpPath, targetFile);
  }).catch((err) => {
    console.warn(`✓ Handled write failure cleanly in mutex chain: ${err.message}`);
  });
  return writeMutexChain;
}

async function runMutexRecoveryTest() {
  console.log('========================================================================');
  console.log('TESTING WRITE MUTEX FAILURE RECOVERY SEQUENCE (6 STEPS)');
  console.log('========================================================================');

  // Step 1: Successful write #1
  console.log('Step 1: Executing initial successful write...');
  await mutexWrite({ status: 'step1_success', value: 100, timestamp: new Date().toISOString() });
  console.log('✓ Step 1 complete.');

  // Step 2: Intentionally failed write #2
  console.log('Step 2: Triggering intentionally failed write...');
  await mutexWrite({ __failIntentionally: true });
  console.log('✓ Step 2 complete (failure caught and suppressed).');

  // Step 3: Successful write #3 after failure
  console.log('Step 3: Executing post-failure successful write...');
  await mutexWrite({ status: 'step3_success_after_failure', value: 300, timestamp: new Date().toISOString() });
  console.log('✓ Step 3 complete.');

  // Step 4: Read record
  console.log('Step 4: Reading state from disk...');
  const diskContent = fs.readFileSync(targetFile, 'utf-8');
  const record = JSON.parse(diskContent);
  console.log(`✓ Record content: ${JSON.stringify(record)}`);

  // Step 5: Simulate process restart
  console.log('Step 5: Simulating process restart & store reload...');
  writeMutexChain = Promise.resolve(); // reset memory chain
  const reloadedContent = fs.readFileSync(targetFile, 'utf-8');
  const reloadedRecord = JSON.parse(reloadedContent);

  // Step 6: Verify persistence
  console.log('Step 6: Verifying final state persistence...');
  if (reloadedRecord.status === 'step3_success_after_failure' && reloadedRecord.value === 300) {
    console.log('✓ VERIFICATION PASSED: Mutex queue recovered cleanly after failure and persisted final write.');
  } else {
    throw new Error('VERIFICATION FAILED: Final record did not match expected value.');
  }
  console.log('========================================================================');
}

runMutexRecoveryTest().catch(console.error);
