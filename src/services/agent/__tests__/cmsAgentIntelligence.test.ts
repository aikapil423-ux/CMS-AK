import { CmsCapabilityRegistry } from "../cmsCapabilityRegistry";
import { CmsAgentService } from "../cmsAgentService";

async function runVerificationTests() {
  console.log("=================================================================");
  console.log("HARYANA POLICE CMS AI OPERATING AGENT - DEEP INTELLIGENCE TESTS");
  console.log("=================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} - ${detail || "Condition not met"}`);
      failed++;
    }
  }

  // TEST 1: Capability Registry Architecture & Coverage
  console.log("--- 1. Application Knowledge Graph & Registry Verification ---");
  const caps = CmsAgentService.getApplicationCapabilities();
  assert(caps.routes.length >= 10, "Website Architecture Routes Loaded", `Found ${caps.routes.length} routes`);
  assert(caps.fieldsCount >= 15, "CMS Fields Metadata Registered", `Found ${caps.fieldsCount} fields`);
  assert(caps.actionsCount >= 10, "CMS Actions Metadata Registered", `Found ${caps.actionsCount} actions`);
  assert(caps.workflowsCount >= 4, "Composite Workflows Registered", `Found ${caps.workflowsCount} workflows`);

  // TEST 2: Page Schema Understanding
  console.log("\n--- 2. Page Schema Understanding ---");
  const schema = CmsAgentService.understandPageSchema("/complaints/register");
  assert(schema !== undefined && schema.title.includes("शिकायत"), "Understands /complaints/register schema");
  assert(schema.forms.length > 0 && schema.forms[0].fields.length > 0, "Discovers form fields on complaints register");
  assert(schema.availableActions.length > 0, "Discovers actions on complaints register");

  // TEST 3: Field & Action Metadata Deep Discovery
  console.log("\n--- 3. Field & Action Semantic Discovery ---");
  const phoneField = CmsAgentService.getFieldMetadata("comp_complainant_phone");
  assert(phoneField?.validFormat !== undefined, "Finds validation format for mobile number");
  const transferAction = CmsAgentService.getActionMetadata("act_comp_transfer");
  assert(transferAction?.operationType === "STATE_CHANGING", "Classifies transfer as STATE_CHANGING");
  assert(transferAction?.requiresOfficialApproval === true, "Enforces official approval on transfer");

  // TEST 4: Semantic Matching Engine (Hindi, Hinglish, Police terminology)
  console.log("\n--- 4. Semantic Intent Matching Tests ---");
  const match1 = CmsCapabilityRegistry.semanticMatch("register complaint form kholo", "/dashboard");
  assert(match1.length > 0 && match1[0].operationType === "READ_ONLY", "register complaint form kholo -> READ_ONLY navigation");

  const match2 = CmsCapabilityRegistry.semanticMatch("is complaint ko Sadar Karnal transfer karo", "/complaints");
  assert(match2.some(m => m.capabilityId.includes("transfer") && m.operationType === "STATE_CHANGING"), "Transfer query matches STATE_CHANGING action");

  // TEST 5: Model Identification Query (Gemini 3.6 Flash)
  console.log("\n--- 5. Active Model Identification ---");
  const modelQueryRes = await CmsAgentService.processUserInput("CSM AI agent kis model se juda hua hai?");
  assert(modelQueryRes.text.includes("Gemini 3.6 Flash"), "Correctly states Gemini 3.6 Flash model");

  // TEST 6: Read-Only Navigation - Immediate Execution (Zero Permission Delay)
  console.log("\n--- 6. Zero-Permission Navigation Commands ---");
  const navRes = await CmsAgentService.processUserInput("register complaint form kholo");
  assert(navRes.actionPlan?.steps[0]?.requiresOfficialApproval === false, "Navigation action does NOT require approval prompt");
  assert(navRes.actionPlan?.executablePayload?.parameters?.url === "/complaints/register", "Correct navigation URL resolved");

  const modalRes = await CmsAgentService.processUserInput("Add entry daailogue box kholo");
  assert(modalRes.actionPlan?.executablePayload?.toolName === "navigate", "Add entry dialog resolves to GD new form");

  const roleSwitcherRes = await CmsAgentService.processUserInput("Role switcher dialogue kholo");
  assert(roleSwitcherRes.actionPlan?.executablePayload?.toolName === "open_modal", "Role switcher opens modal dialog");

  // TEST 7: Preparation & Detailed Intake (Intelligent Field Understanding & Autofill)
  console.log("\n--- 7. Field Understanding & Form Intake ---");
  const intakeRes = await CmsAgentService.processUserInput("Anil Kumar ki complaint likho, uska address Hisar hai aur mobile 9812345678");
  assert(intakeRes.actionPlan?.status === "AWAITING_APPROVAL", "Complaint intake prepares plan awaiting approval");
  assert(intakeRes.actionPlan?.executablePayload?.toolName === "save_complaint_record", "Resolves to save_complaint_record tool");
  assert(intakeRes.actionPlan?.executablePayload?.parameters?.complainantMobile === "9812345678", "Correctly parsed mobile number");

  // TEST 8: State Changing - Police Station Transfer with Explicit Approval
  console.log("\n--- 8. Police Station Transfer Workflow ---");
  const trfRes = await CmsAgentService.processUserInput("Is complaint ko Sadar thane bhejo");
  assert(trfRes.actionPlan?.status === "AWAITING_APPROVAL", "Transfer requires explicit approval");
  assert(trfRes.actionPlan?.steps[0]?.isDestructive === true, "Marks transfer as destructive/state-changing");

  // TEST 9: Cross-Module Integrated Workflow (Complaint -> EO -> Notice 35(3) -> GD Rapat)
  console.log("\n--- 9. Cross-Module Multi-Step Workflow ---");
  const crossRes = await CmsAgentService.processUserInput("Anil ki complaint search karo, uska EO dekho, notice draft karo aur related GD entry bhi prepare karo");
  assert(crossRes.actionPlan?.steps.length === 3, "Cross-module plan has 3 steps");
  assert(crossRes.actionPlan?.proposedDocuments?.some(d => d.templateType === "BNSS_35_3_NOTICE") === true, "Drafts Section 35(3) BNSS Notice");
  assert(crossRes.actionPlan?.proposedDocuments?.some(d => d.templateType === "GD_RAPAT_ENTRY") === true, "Drafts GD Rapat Entry");

  // TEST 10: Contextual Field Operation ("ismein date aaj ki kar do")
  console.log("\n--- 10. Contextual Operations ---");
  const dateRes = await CmsAgentService.processUserInput("ismein date aaj ki kar do");
  const today = new Date().toISOString().split("T")[0];
  assert(dateRes.actionPlan?.executablePayload?.parameters?.value === today, "Correctly sets date to today");

  // TEST 11: Roznamcha / General Diary Add Entry — GD Type Select & Field Fill
  console.log("\n--- 11. Roznamcha Add Entry GD Type Select (Criminal Case / Arrival) ---");
  const gdTypeRes1 = await CmsAgentService.processUserInput(
    "roznamcha module me add entry me GD type select me criminal case fill kr do",
    "/general-diary/new"
  );
  assert(
    gdTypeRes1.actionPlan?.executablePayload?.toolName === "fill_gd_form",
    "Resolves full Hinglish Roznamcha command to fill_gd_form tool"
  );
  assert(
    gdTypeRes1.actionPlan?.executablePayload?.parameters?.typeCode === "CRIMINAL_CASE",
    "Selects official CCTNS GD Type code CRIMINAL_CASE"
  );
  assert(
    gdTypeRes1.actionPlan?.status === "EXECUTED",
    "Executes UI form field fill immediately without permission prompt"
  );

  const gdTypeRes2 = await CmsAgentService.processUserInput(
    "criminal case fill kr do",
    "/general-diary/new"
  );
  assert(
    gdTypeRes2.actionPlan?.executablePayload?.parameters?.typeCode === "CRIMINAL_CASE",
    "Selects CRIMINAL_CASE when user simply says 'criminal case fill kr do' on /general-diary/new"
  );

  const gdTypeRes3 = await CmsAgentService.processUserInput(
    "GD type select me arrival fill kr do",
    "/general-diary/new"
  );
  assert(
    gdTypeRes3.actionPlan?.executablePayload?.parameters?.typeCode === "ARRIVAL",
    "Selects ARRIVAL when user says 'GD type select me arrival fill kr do'"
  );

  // Summary
  console.log("\n=================================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runVerificationTests().catch((err) => {
  console.error("Test runner crashed:", err);
  process.exit(1);
});
