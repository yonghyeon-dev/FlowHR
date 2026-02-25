import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function countLines(source: string) {
  return source.split(/\r?\n/).length;
}

function assertLineBudget(source: string, limit: number, label: string) {
  const lines = countLines(source);
  assert.ok(lines <= limit, `${label} should stay <= ${limit} lines (current: ${lines})`);
}

async function run() {
  const payslipsPage = readUtf8("src", "app", "employee", "payslips", "page.tsx");
  const payslipsLocaleCopyBarrel = readUtf8("src", "app", "employee", "payslips", "page-locale-copy.ts");
  const payslipsLocalePageCopy = readUtf8("src", "app", "employee", "payslips", "page-locale-page-copy.ts");
  const payslipsApiHook = readUtf8("src", "app", "employee", "payslips", "use-payslip-api.ts");
  const schedulingService = readUtf8("src", "features", "scheduling", "service.ts");
  const workItem = readUtf8("work-items", "WI-0453-core-line-budget-guard-payslip-locale-scheduling.md");
  const roadmap = readUtf8("ROADMAP.md");

  assertLineBudget(payslipsPage, 500, "payslips/page.tsx");
  assertLineBudget(payslipsLocaleCopyBarrel, 20, "payslips/page-locale-copy.ts");
  assertLineBudget(payslipsLocalePageCopy, 350, "payslips/page-locale-page-copy.ts");
  assertLineBudget(payslipsApiHook, 220, "payslips/use-payslip-api.ts");
  assertLineBudget(schedulingService, 5500, "scheduling/service.ts");

  assert.match(payslipsLocalePageCopy, /organizationIdPlaceholder:\s*"예: 조직-00001"/);
  assert.match(payslipsLocalePageCopy, /bearerPlaceholder:\s*"비어 있으면 세션 기반 액터 헤더 모드가 사용됩니다\."/);
  assert.match(payslipsPage, /appendClientLog\(pageCopy\.logs\.copyPayslipId, true, 200/);
  assert.match(schedulingService, /resolveAnomalyIncidentWarningMinutes/);

  assert.match(workItem, /WI-0453/i);
  assert.match(workItem, /line budget|guard|payslip|locale|scheduling/i);
  assert.match(roadmap, /WI-0453/i);
}

run()
  .then(() => {
    console.log("e2e-wi0453-core-line-budget-guard-payslip-locale-scheduling.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
