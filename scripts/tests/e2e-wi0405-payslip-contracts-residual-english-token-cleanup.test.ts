import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const payslipPageView = readUtf8("src", "app", "employee", "payslips", "page-view.tsx");
  const payslipLocaleHelpers = readUtf8(
    "src",
    "app",
    "employee",
    "payslips",
    "page-locale-helpers.ts"
  );
  const contractsHttp = readUtf8("src", "components", "contracts", "http.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0405-payslip-contracts-residual-english-token-cleanup.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(payslipPageView, /pageCopy\.devTools\.sessionRoleLabel/);
  assert.match(payslipPageView, /pageCopy\.devTools\.sessionOrganizationLabel/);
  assert.match(payslipPageView, /pageCopy\.devTools\.sessionActorLabel/);
  assert.doesNotMatch(payslipPageView, /role=/);
  assert.doesNotMatch(payslipPageView, /org=/);
  assert.doesNotMatch(payslipPageView, /actor=/);

  assert.match(payslipLocaleHelpers, /sessionRoleLabel: string;/);
  assert.match(payslipLocaleHelpers, /sessionOrganizationLabel: string;/);
  assert.match(payslipLocaleHelpers, /sessionActorLabel: string;/);
  assert.match(payslipLocaleHelpers, /sessionRoleLabel:\s*"권한"/);
  assert.match(payslipLocaleHelpers, /sessionOrganizationLabel:\s*"조직 식별자"/);
  assert.match(payslipLocaleHelpers, /sessionActorLabel:\s*"액터 식별자"/);
  assert.match(payslipLocaleHelpers, /sessionRoleLabel:\s*"Role"/);
  assert.match(payslipLocaleHelpers, /sessionOrganizationLabel:\s*"Organization"/);
  assert.match(payslipLocaleHelpers, /sessionActorLabel:\s*"Actor"/);

  assert.match(contractsHttp, /function isKoRuntimeLocale\(\)/);
  assert.match(contractsHttp, /function resolveContractsHttpFallbackMessage\(status: number\)/);
  assert.match(contractsHttp, /요청이 실패했습니다/);
  assert.match(contractsHttp, /request failed/);
  assert.match(contractsHttp, /fallbackMessage \?\? resolveContractsHttpFallbackMessage\(response\.status\)/);

  assert.match(workItem, /WI-0405/i);
  assert.match(workItem, /payslip|contracts|locale|english/i);
  assert.match(roadmap, /WI-0405/i);
}

run()
  .then(() => {
    console.log("e2e-wi0405-payslip-contracts-residual-english-token-cleanup.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
