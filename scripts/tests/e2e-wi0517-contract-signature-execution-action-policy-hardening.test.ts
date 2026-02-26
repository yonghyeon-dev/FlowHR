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
  const actionPolicy = readUtf8("src", "components", "contracts", "document-action-policy.ts");
  const adminWorkspace = readUtf8("src", "components", "contracts", "AdminContractsWorkspace.tsx");
  const employeeInbox = readUtf8("src", "components", "contracts", "EmployeeContractsInbox.tsx");
  const copy = readUtf8("src", "components", "contracts", "copy.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0517-contract-signature-execution-action-policy-hardening.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.ok(
    countLines(adminWorkspace) <= 260,
    `AdminContractsWorkspace.tsx should stay <= 260 lines (current: ${countLines(adminWorkspace)})`
  );
  assert.ok(
    countLines(employeeInbox) <= 300,
    `EmployeeContractsInbox.tsx should stay <= 300 lines (current: ${countLines(employeeInbox)})`
  );
  assert.ok(
    countLines(actionPolicy) <= 120,
    `document-action-policy.ts should stay <= 120 lines (current: ${countLines(actionPolicy)})`
  );

  assert.match(actionPolicy, /export function resolveAllowedContractDocumentActions\(/);
  assert.match(actionPolicy, /export function resolveAdminContractDocumentNextStep\(/);
  assert.match(actionPolicy, /export function canEmployeeRespondToContractDocument\(/);
  assert.match(actionPolicy, /return status === "SENT"/);

  assert.match(adminWorkspace, /resolveAllowedContractDocumentActions/);
  assert.match(adminWorkspace, /resolveAdminContractDocumentNextStep/);
  assert.match(adminWorkspace, /copy\.nextStepLabel/);
  assert.match(adminWorkspace, /copy\.nextStepNoAction/);

  assert.match(employeeInbox, /canEmployeeRespondToContractDocument/);
  assert.match(employeeInbox, /copy\.responseDisabledHint/);
  assert.match(employeeInbox, /disabled=\{!canRespondSelected\}/);

  assert.match(copy, /nextStepLabel: "Next step"/);
  assert.match(copy, /nextStepLabel: "다음 단계"/);
  assert.match(copy, /responseDisabledHint: "You can respond only after admin sends this document\."/);
  assert.match(copy, /responseDisabledHint: "관리자가 문서를 발송한 뒤에만 응답할 수 있습니다\."/);

  assert.match(workItem, /WI-0517/i);
  assert.match(workItem, /contracts|signature|action|policy|hardening/i);
  assert.match(roadmap, /WI-0517/i);
}

run()
  .then(() => {
    console.log("e2e-wi0517-contract-signature-execution-action-policy-hardening.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
