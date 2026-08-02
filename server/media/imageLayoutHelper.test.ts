/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { calculateCoverPlacement } from './imageLayoutHelper.js';

export function runImageLayoutHelperTests() {
  console.log('Running imageLayoutHelper unit tests...');

  // 1. Landscape photo into portrait region
  const t1 = calculateCoverPlacement(1920, 1080, 0, 0, 612, 792, 'cover');
  if (t1.width < 612 || t1.height < 792) {
    throw new Error(`Test 1 Failed: Landscape into portrait region did not cover target bounds. Result: ${JSON.stringify(t1)}`);
  }
  console.log('✓ Test 1 Passed: Landscape photo into portrait region');

  // 2. Landscape photo into landscape region
  const t2 = calculateCoverPlacement(1920, 1080, 0, 0, 648, 432, 'cover');
  if (t2.width < 648 || t2.height < 432) {
    throw new Error(`Test 2 Failed: Landscape into landscape region did not cover target bounds. Result: ${JSON.stringify(t2)}`);
  }
  console.log('✓ Test 2 Passed: Landscape photo into landscape region');

  // 3. Square photo into square region
  const t3 = calculateCoverPlacement(1080, 1080, 0, 0, 1080, 1080, 'cover');
  if (t3.width !== 1080 || t3.height !== 1080) {
    throw new Error(`Test 3 Failed: Square photo placement incorrect. Result: ${JSON.stringify(t3)}`);
  }
  console.log('✓ Test 3 Passed: Square photo into square region');

  // 4. Very wide photo into tall region
  const t4 = calculateCoverPlacement(3000, 500, 0, 0, 400, 800, 'cover');
  if (t4.width < 400 || t4.height < 800) {
    throw new Error(`Test 4 Failed: Very wide photo placement failed. Result: ${JSON.stringify(t4)}`);
  }
  console.log('✓ Test 4 Passed: Very wide photo into tall region');

  // 5. Invalid dimensions check
  try {
    calculateCoverPlacement(0, 1080, 0, 0, 612, 792);
    throw new Error('Test 5 Failed: Did not throw error on 0 width input');
  } catch (err: any) {
    if (!err.message.includes('Invalid dimensions')) {
      throw err;
    }
  }
  console.log('✓ Test 5 Passed: Invalid dimensions throw error');

  console.log('✅ All imageLayoutHelper tests passed successfully!');
}

if (process.argv[1] && process.argv[1].endsWith('imageLayoutHelper.test.ts')) {
  runImageLayoutHelperTests();
}
