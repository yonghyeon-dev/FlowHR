import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const payslipLocaleHelpers = readUtf8("src", "app", "employee", "payslips", "page-locale-helpers.ts");
  const payslipPage = readUtf8("src", "app", "employee", "payslips", "page.tsx");
  const payslipView = readUtf8("src", "app", "employee", "payslips", "page-view.tsx");
  const withholdingConsole = readUtf8(
    "src",
    "components",
    "withholding-receipt",
    "WithholdingReceiptConsole.tsx"
  );
  const contractsHttp = readUtf8("src", "components", "contracts", "http.ts");
  const contractsInbox = readUtf8("src", "components", "contracts", "EmployeeContractsInbox.tsx");
  const contractsAdmin = readUtf8("src", "components", "contracts", "AdminContractsWorkspace.tsx");
  const workItem = readUtf8(
    "work-items",
    "WI-0416-korean-runtime-english-residual-sweep-withholding-payslip-contracts.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(payslipLocaleHelpers, /runtimeLabel: string;/);
  assert.match(payslipLocaleHelpers, /runtimeLabel:\s*"운영"/);
  assert.match(payslipLocaleHelpers, /runtimeLabel:\s*"production"/);
  assert.match(payslipLocaleHelpers, /export function normalizeRuntimeDiagnosticMessage\(/);
  assert.match(
    payslipLocaleHelpers,
    /export function resolvePayslipRunStateLabel\(state: PayslipRunState \| string, isKoLocale: boolean\)/
  );
  assert.match(payslipLocaleHelpers, /return isKoLocale \? "알 수 없음" : state;/);

  assert.match(payslipPage, /normalizeRuntimeDiagnosticMessage,/);
  assert.match(payslipPage, /const localizedSupabaseSessionError = useMemo\(/);
  assert.match(payslipPage, /supabaseSessionError=\{localizedSupabaseSessionError\}/);
  assert.match(payslipView, /<strong>\{pageCopy\.productionNotice\.runtimeLabel\}<\/strong>/);

  assert.match(withholdingConsole, /const withholdingBlockingReasonKoMap: Record<string, string> = \{/);
  assert.match(withholdingConsole, /resolveWithholdingBlockingReasons\(receipt\.receipt\.blockingReasons, locale\)/);
  assert.match(withholdingConsole, /const normalizedSupabaseSessionError = useMemo\(/);
  assert.match(withholdingConsole, /formatDateTimeByLocale\(finalizedSettlement\.settlement\.finalizedAt, runtimeLocale\)/);

  assert.match(contractsHttp, /function extractErrorText\(body: unknown\)/);
  assert.match(contractsHttp, /const errorKeys = \["error", "message", "reason", "detail"\];/);
  assert.match(contractsHttp, /export function normalizeContractsErrorMessageForRuntime\(/);

  assert.match(contractsInbox, /normalizeContractsErrorMessageForRuntime, readJson/);
  assert.match(contractsInbox, /normalizeContractsErrorMessageForRuntime\(loadError\.message, copy\.loadError\)/);
  assert.match(contractsInbox, /function normalizeContractTitle\(title: string, documentId: string\)/);
  assert.match(contractsInbox, /normalizeContractTitle\(document\.title, document\.id\)/);

  assert.match(contractsAdmin, /normalizeContractsErrorMessageForRuntime, readJson/);
  assert.match(contractsAdmin, /normalizeContractsErrorMessageForRuntime\(loadError\.message, copy\.loadError\)/);
  assert.match(contractsAdmin, /function normalizeContractTitle\(title: string, stableId: string\)/);
  assert.match(contractsAdmin, /normalizeContractTitle\(template\.name, template\.id\)/);

  assert.match(workItem, /WI-0416/i);
  assert.match(workItem, /korean|runtime|english|withholding|payslip|contracts/i);
  assert.match(roadmap, /WI-0416/i);
}

run()
  .then(() => {
    console.log("e2e-wi0416-korean-runtime-english-residual-sweep-withholding-payslip-contracts.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
