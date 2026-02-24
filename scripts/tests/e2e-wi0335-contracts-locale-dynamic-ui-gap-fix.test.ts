import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminContractsWorkspace = readUtf8(
    "src",
    "components",
    "contracts",
    "AdminContractsWorkspace.tsx"
  );
  const contractTemplateBuilder = readUtf8(
    "src",
    "components",
    "contracts",
    "ContractTemplateBuilder.tsx"
  );
  const employeeContractsInbox = readUtf8(
    "src",
    "components",
    "contracts",
    "EmployeeContractsInbox.tsx"
  );
  const contractsCopy = readUtf8("src", "components", "contracts", "copy.ts");
  const workItem = readUtf8("work-items", "WI-0335-contracts-locale-dynamic-ui-gap-fix.md");
  const roadmap = readUtf8("ROADMAP.md");
  const packageJson = readUtf8("package.json");

  assert.match(adminContractsWorkspace, /const \{ locale \} = useI18n\(\);/);
  assert.match(adminContractsWorkspace, /const runtimeLocale = locale === "ko" \? "ko-KR" : "en-US";/);
  assert.match(adminContractsWorkspace, /const copy = adminContractsCopyByLocale\[locale\];/);
  assert.match(adminContractsWorkspace, /contractCategoryLabelByLocale\[locale\]/);
  assert.match(adminContractsWorkspace, /contractDocumentStatusLabelByLocale\[locale\]/);
  assert.match(adminContractsWorkspace, /contractApprovalStatusLabelByLocale\[locale\]/);
  assert.match(adminContractsWorkspace, /toDateText\(document\.expiresAt, runtimeLocale\)/);
  assert.doesNotMatch(adminContractsWorkspace, /<h1 className="page-title">E-Contract Workspace<\/h1>/);

  assert.match(contractTemplateBuilder, /const \{ locale \} = useI18n\(\);/);
  assert.match(contractTemplateBuilder, /const copy = contractTemplateBuilderCopyByLocale\[locale\];/);
  assert.match(contractTemplateBuilder, /buildTemplateBody\(clauses,/);
  assert.match(contractTemplateBuilder, /aria-label=\{copy\.clauseBuilderAria\}/);
  assert.doesNotMatch(contractTemplateBuilder, /<h1 className="page-title">Contract Template Builder<\/h1>/);

  assert.match(employeeContractsInbox, /const \{ locale \} = useI18n\(\);/);
  assert.match(employeeContractsInbox, /const runtimeLocale = locale === "ko" \? "ko-KR" : "en-US";/);
  assert.match(employeeContractsInbox, /const copy = employeeContractsCopyByLocale\[locale\];/);
  assert.match(employeeContractsInbox, /toDateText\(signatureEvidence\.generatedAt, runtimeLocale\)/);
  assert.doesNotMatch(employeeContractsInbox, /<h2>Inbox<\/h2>/);

  assert.match(contractsCopy, /export const adminContractsCopyByLocale/);
  assert.match(contractsCopy, /export const contractTemplateBuilderCopyByLocale/);
  assert.match(contractsCopy, /export const employeeContractsCopyByLocale/);
  assert.match(contractsCopy, /title: "전자계약 워크스페이스"/);
  assert.match(contractsCopy, /title: "E-Contract Workspace"/);
  assert.match(contractsCopy, /title: "내 계약함"/);
  assert.match(contractsCopy, /title: "My Contracts"/);

  assert.match(workItem, /WI-0335/i);
  assert.match(workItem, /locale/i);
  assert.match(roadmap, /WI-0335/i);
  assert.match(packageJson, /e2e-wi0335-contracts-locale-dynamic-ui-gap-fix\.test\.ts/);
}

run()
  .then(() => {
    console.log("e2e-wi0335-contracts-locale-dynamic-ui-gap-fix.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
