/**
 * Automated Acceptance Test Suite for the CMS FIR Tracking Workflow Specification
 * Validates all 12 acceptance criteria:
 * 1. Fresh FIR -> FIR Register / Part A (PART_A_FRESH).
 * 2. Authorized direct closure -> Complete cases (COMPLETED).
 * 3. Initial challan issued -> Under checking (PART_B_UNDER_CHECKING).
 * 4. Complete court submission -> Complete cases (COMPLETED).
 * 5. Partial court submission -> Partial (PART_B_PARTIAL).
 * 6. Completed case reopened -> Re-open (PART_B_REOPEN), with no duplicate FIR.
 * 7. Reopened case issues challan -> Under checking (PART_B_UNDER_CHECKING).
 * 8. Its partial court submission -> Partial (PART_B_PARTIAL).
 * 9. Repeated partial supplementary cycles remain supported.
 * 10. Its complete court submission -> Complete cases (COMPLETED).
 * 11. A subsequent reopening repeats the workflow and preserves all previous cycles.
 * 12. Re-open actions are absent from active Part B records and available only for authorized completed records.
 */

const assert = require('assert');

// Mock localStorage if not running in browser
if (typeof localStorage === 'undefined' || localStorage === null) {
  const store = {};
  global.localStorage = {
    getItem: (key) => store[key] || null,
    setItem: (key, val) => { store[key] = String(val); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); }
  };
}

// We import the compiled / transpileable TS files or test directly via firService logic
console.log('--- STARTING CMS FIR TRACKING WORKFLOW ACCEPTANCE SUITE ---');

// In Node environment, test the authoritative transition logic and integrity guards
function runTestSuite() {
  const { firService } = require('../dist_test/bundle.cjs');

  console.log('\n[TEST 1] Fresh FIR -> FIR Register / Part A (PART_A_FRESH)');
  const freshFir = firService.registerFir({
    firYear: 2026,
    firDate: '2026-10-27',
    policeStation: 'PS Chandni Bagh Panipat',
    district: 'Panipat',
    state: 'Haryana',
    category: 'PROPERTY_THEFT_BURGLARY',
    categoryDisplay: 'Theft',
    priority: 'ROUTINE',
    complainantName: 'Ramesh Kumar',
    incidentPlace: 'Panipat Sector 12',
    registeredBy: 'Inspector SHO',
  });
  assert.strictEqual(freshFir.trackingState, 'PART_A_FRESH', 'Fresh FIR must start in PART_A_FRESH');
  console.log('✓ PASS: Fresh FIR starts in PART_A_FRESH (FIR Register / Part A)');

  console.log('\n[TEST 2] Authorized direct closure -> Complete cases (COMPLETED)');
  const closedFir = firService.registerFir({
    firYear: 2026,
    firDate: '2026-10-27',
    policeStation: 'PS City Panipat',
    district: 'Panipat',
    state: 'Haryana',
    category: 'OTHER',
    categoryDisplay: 'Other',
    priority: 'ROUTINE',
    complainantName: 'Sunita Devi',
    incidentPlace: 'Panipat Market',
    registeredBy: 'Inspector SHO',
  });
  const completedDirect = firService.submitFinalForm(
    closedFir.id,
    'CLOSURE',
    'CJM Court Panipat',
    'DSP Subdiv',
    'Direct closure as civil dispute after preliminary inquiry'
  );
  assert.strictEqual(completedDirect.trackingState, 'COMPLETED', 'Direct closure must transition straight to COMPLETED');
  assert.strictEqual(completedDirect.status, 'CLOSURE_REPORT_FILED');
  assert.ok(completedDirect.completionHistory && completedDirect.completionHistory.length > 0, 'Must record completion history');
  console.log('✓ PASS: Direct closure moves straight to COMPLETED without passing through Part B');

  console.log('\n[TEST 3] Initial challan issued -> Under checking (PART_B_UNDER_CHECKING)');
  const challanFir = firService.registerFir({
    firYear: 2026,
    firDate: '2026-10-27',
    policeStation: 'PS Model Town',
    district: 'Panipat',
    state: 'Haryana',
    category: 'ROBBERY',
    categoryDisplay: 'Robbery',
    priority: 'URGENT',
    complainantName: 'Amit Verma',
    incidentPlace: 'Model Town Panipat',
    registeredBy: 'SI Sandeep',
  });
  const underCheckingFir = firService.issueChallan({
    firId: challanFir.id,
    challanType: 'INITIAL',
    challanMode: 'COMPLETE',
    courtName: 'CJM Court Panipat',
    summary: 'Chargesheet prepared against 2 accused',
    issuedBy: 'SI Sandeep',
    issuedByRank: 'Sub Inspector',
  });
  assert.strictEqual(underCheckingFir.trackingState, 'PART_B_UNDER_CHECKING');
  assert.ok(underCheckingFir.pendingChallanId, 'Must set pendingChallanId');
  console.log('✓ PASS: Initial challan issuance moves FIR to Under checking (PART_B_UNDER_CHECKING)');

  console.log('\n[TEST 4] Complete court submission -> Complete cases (COMPLETED)');
  const submittedComplete = firService.recordCourtSubmission({
    firId: underCheckingFir.id,
    courtName: 'CJM Court Panipat',
    courtCaseNumber: 'CC/2026/8841',
    submissionDate: '2026-10-27',
    submittedBy: 'SI Sandeep',
    submittedByRank: 'Sub Inspector',
    judicialOfficer: 'Sh. A.K. Sharma, CJM',
  });
  assert.strictEqual(submittedComplete.trackingState, 'COMPLETED');
  assert.strictEqual(submittedComplete.pendingChallanId, undefined);
  console.log('✓ PASS: Court submission with Complete mode moves to Complete cases (COMPLETED)');

  console.log('\n[TEST 5] Partial court submission -> Part B -> Partial (PART_B_PARTIAL)');
  const partialCase = firService.registerFir({
    firYear: 2026,
    firDate: '2026-10-27',
    policeStation: 'PS Chandni Bagh Panipat',
    district: 'Panipat',
    state: 'Haryana',
    category: 'CYBER_CRIME',
    categoryDisplay: 'Cyber Crime',
    priority: 'URGENT',
    complainantName: 'Kavita Roy',
    incidentPlace: 'Panipat Sector 11',
    registeredBy: 'Inspector SHO',
  });
  // Issue Partial Challan
  firService.issueChallan({
    firId: partialCase.id,
    challanType: 'INITIAL',
    challanMode: 'PARTIAL',
    courtName: 'CJM Court Panipat',
    summary: 'Initial partial challan against arrested suspect; co-accused absconding',
    issuedBy: 'SI Investigating Officer',
  });
  // Submit Partial to court
  const partialSubmitted = firService.recordCourtSubmission({
    firId: partialCase.id,
    courtName: 'CJM Court Panipat',
    courtCaseNumber: 'CC/2026/9012',
    submissionDate: '2026-10-27',
    submittedBy: 'SI Investigating Officer',
  });
  assert.strictEqual(partialSubmitted.trackingState, 'PART_B_PARTIAL');
  console.log('✓ PASS: Partial challan court submission moves to Part B -> Partial (PART_B_PARTIAL)');

  console.log('\n[TEST 6] Completed case reopened -> Part B -> Re-open (PART_B_REOPEN) with no duplicate FIR');
  const reopened = firService.reopenCompletedCase({
    firId: submittedComplete.id,
    reason: 'New forensic clue & absconding accomplice arrested u/s 193(9) BNSS',
    courtName: 'CJM Court Panipat',
    orderNumber: 'ORD/2026/119',
    orderDate: '2026-10-27',
    reopenedBy: 'Superintendent of Police',
    reopenedByRank: 'SP_DISTRICT',
  });
  assert.strictEqual(reopened.id, submittedComplete.id, 'Must preserve exact FIR ID (no duplicate)');
  assert.strictEqual(reopened.firNumber, submittedComplete.firNumber, 'Must preserve exact FIR number');
  assert.strictEqual(reopened.trackingState, 'PART_B_REOPEN');
  assert.strictEqual(reopened.previouslyReopened, true);
  assert.strictEqual(reopened.reopenHistory.length, 1);
  assert.ok(reopened.completionHistory.length > 0, 'Previous completion history must remain intact');
  console.log('✓ PASS: Completed case successfully reopened to PART_B_REOPEN without duplicate FIR');

  console.log('\n[TEST 7] Reopened case issues challan -> Under checking (PART_B_UNDER_CHECKING)');
  const reopenedChallan = firService.issueChallan({
    firId: reopened.id,
    challanType: 'SUPPLEMENTARY',
    challanMode: 'PARTIAL',
    courtName: 'CJM Court Panipat',
    summary: 'Supplementary partial challan following reopening',
    issuedBy: 'SI Neeraj',
  });
  assert.strictEqual(reopenedChallan.trackingState, 'PART_B_UNDER_CHECKING');
  console.log('✓ PASS: Reopened case moves to Under checking upon issuing challan');

  console.log('\n[TEST 8 & 9] Partial court submission -> Partial & Repeated supplementary cycles');
  const reopenedPartialSub = firService.recordCourtSubmission({
    firId: reopenedChallan.id,
    courtName: 'CJM Court Panipat',
    courtCaseNumber: 'CC/2026/8841-SUPP1',
    submissionDate: '2026-10-27',
    submittedBy: 'SI Neeraj',
  });
  assert.strictEqual(reopenedPartialSub.trackingState, 'PART_B_PARTIAL');

  // Cycle 2: Issue another supplementary from Partial
  const supp2 = firService.issueChallan({
    firId: reopenedPartialSub.id,
    challanType: 'SUPPLEMENTARY',
    challanMode: 'COMPLETE',
    courtName: 'CJM Court Panipat',
    summary: 'Final complete supplementary challan after all accused apprehended',
    issuedBy: 'SI Neeraj',
  });
  assert.strictEqual(supp2.trackingState, 'PART_B_UNDER_CHECKING');
  console.log('✓ PASS: Repeated supplementary cycle supported');

  console.log('\n[TEST 10] Complete supplementary court submission -> Complete cases (COMPLETED)');
  const finalComplete = firService.recordCourtSubmission({
    firId: supp2.id,
    courtName: 'CJM Court Panipat',
    courtCaseNumber: 'CC/2026/8841-FINAL',
    submissionDate: '2026-10-27',
    submittedBy: 'SI Neeraj',
  });
  assert.strictEqual(finalComplete.trackingState, 'COMPLETED');
  console.log('✓ PASS: Complete supplementary submission moves back to Complete cases (COMPLETED)');

  console.log('\n[TEST 11] Subsequent reopening preserves all cycles');
  const reopenedAgain = firService.reopenCompletedCase({
    firId: finalComplete.id,
    reason: 'Second reopening based on appellate court directions',
    courtName: 'Sessions Court Panipat',
    orderNumber: 'SESS/2026/502',
    orderDate: '2026-10-27',
    reopenedBy: 'Inspector General of Police',
  });
  assert.strictEqual(reopenedAgain.trackingState, 'PART_B_REOPEN');
  assert.strictEqual(reopenedAgain.reopenHistory.length, 2, 'Should have 2 reopening events');
  assert.ok(reopenedAgain.completionHistory.length >= 2, 'Should preserve both completion events');
  assert.ok(reopenedAgain.challanRecords.length >= 3, 'Should preserve all historical challans');
  console.log('✓ PASS: Subsequent reopening preserves full audit trail of all previous cycles');

  console.log('\n[TEST 12] Reopening guard check (only permitted from COMPLETED)');
  assert.throws(
    () => {
      // Trying to reopen an active case (PART_B_REOPEN)
      firService.reopenCompletedCase({
        firId: reopenedAgain.id,
        reason: 'Illegal attempt to reopen an already active case',
        reopenedBy: 'Unauthorized',
      });
    },
    /Cannot reopen FIR.*current state is PART_B_REOPEN/,
    'Must throw error when attempting to reopen an active case'
  );
  console.log('✓ PASS: Server-side guard prevents reopening active cases');

  console.log('\n=== ALL 12 ACCEPTANCE TESTS PASSED SUCCESSFULLY! ===\n');
}

runTestSuite();
