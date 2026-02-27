import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function countLines(source: string) {
  return source.split(/\r?\n/).length;
}

async function run() {
  const service = readUtf8("src", "features", "scheduling", "service.ts");
  const sideEffectsHelper = readUtf8(
    "src",
    "features",
    "scheduling",
    "anomaly-side-effect-helpers.ts"
  );
  const inputHelper = readUtf8(
    "src",
    "features",
    "scheduling",
    "schedule-input-normalization-helpers.ts"
  );
  const statusHelper = readUtf8("src", "components", "contracts", "status-label-helpers.ts");
  const adminWorkspace = readUtf8("src", "components", "contracts", "AdminContractsWorkspace.tsx");
  const employeeResponsePanel = readUtf8(
    "src",
    "components",
    "contracts",
    "EmployeeContractsResponsePanel.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0597-scheduling-side-effect-helper-extraction-and-contract-status-fallbacks.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(service, /from "@\/features\/scheduling\/anomaly-side-effect-helpers"/);
  assert.match(service, /from "@\/features\/scheduling\/schedule-input-normalization-helpers"/);
  assert.doesNotMatch(service, /async function emitAnomalyAlertIfEnabled\(/);
  assert.doesNotMatch(service, /async function emitAnomalyEscalationIfEnabled\(/);
  assert.doesNotMatch(service, /async function emitAnomalyCockpitTicketRequestsIfEnabled\(/);
  assert.doesNotMatch(service, /function ensureValidTemplateMinutes\(/);
  assert.doesNotMatch(service, /function normalizeWeekdays\(/);

  assert.match(sideEffectsHelper, /export async function emitAnomalyAlertIfEnabled\(/);
  assert.match(sideEffectsHelper, /export async function emitAnomalyEscalationIfEnabled\(/);
  assert.match(sideEffectsHelper, /export async function emitAnomalyCockpitTicketRequestsIfEnabled\(/);
  assert.match(inputHelper, /export function ensureValidPeriod\(/);
  assert.match(inputHelper, /export function normalizeLateThresholdMinutes\(/);
  assert.match(inputHelper, /export function normalizeTopN\(/);
  assert.match(inputHelper, /export function toCreateInput\(/);

  assert.match(statusHelper, /export function resolveContractDocumentStatusLabel\(/);
  assert.match(statusHelper, /export function resolveContractApprovalStatusLabel\(/);
  assert.match(statusHelper, /"알 수 없는 상태"/);
  assert.match(statusHelper, /"알 수 없는 승인 상태"/);

  assert.match(adminWorkspace, /resolveContractDocumentStatusLabel\(document\.status, documentStatusLabels, isKoLocale\)/);
  assert.match(adminWorkspace, /resolveContractApprovalStatusLabel\(document\.approvalStatus, approvalStatusLabels, isKoLocale\)/);
  assert.match(employeeResponsePanel, /resolveContractDocumentStatusLabel\(selected\.status, documentStatusLabels, isKoLocale\)/);

  assert.ok(countLines(service) <= 3450, `service.ts should stay <= 3450 lines (current: ${countLines(service)})`);
  assert.ok(
    countLines(sideEffectsHelper) <= 220,
    `anomaly-side-effect-helpers.ts should stay <= 220 lines (current: ${countLines(sideEffectsHelper)})`
  );
  assert.ok(
    countLines(adminWorkspace) <= 260,
    `AdminContractsWorkspace.tsx should stay <= 260 lines (current: ${countLines(adminWorkspace)})`
  );
  assert.ok(
    countLines(employeeResponsePanel) <= 300,
    `EmployeeContractsResponsePanel.tsx should stay <= 300 lines (current: ${countLines(employeeResponsePanel)})`
  );

  assert.match(workItem, /WI-0597/i);
  assert.match(workItem, /scheduling|helper|extraction|contracts|status|fallback/i);
  assert.match(roadmap, /WI-0597/i);
}

run()
  .then(() => {
    console.log("e2e-wi0597-scheduling-side-effect-helper-extraction-and-contract-status-fallbacks.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
