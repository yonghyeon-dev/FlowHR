import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

const SOURCES = [
  "src/app/admin/approval-policy/page-locale-helpers.ts",
  "src/app/admin/people/page-view.tsx",
  "src/app/admin/people/page-view-directory-filters-panel.tsx",
  "src/app/admin/people/page-view-logs-panel.tsx",
  "src/components/payslip-receipts/copy.ts",
  "src/components/contracts/copy.ts"
] as const;

const LEGACY_TERMS = [
  /조직 ID/,
  /관리자 액터 ID/,
  /직원 ID/,
  /API 로그/
] as const;

async function run() {
  for (const sourcePath of SOURCES) {
    const source = readUtf8(sourcePath);
    for (const term of LEGACY_TERMS) {
      assert.doesNotMatch(source, term, `legacy korean token remains in ${sourcePath}: ${term}`);
    }
  }

  const approvalPolicyCopy = readUtf8("src/app/admin/approval-policy/page-locale-helpers.ts");
  const peopleFilters = readUtf8("src/app/admin/people/page-view-directory-filters-panel.tsx");
  const peopleLogs = readUtf8("src/app/admin/people/page-view-logs-panel.tsx");
  const payslipReceiptsCopy = readUtf8("src/components/payslip-receipts/copy.ts");
  const contractsCopy = readUtf8("src/components/contracts/copy.ts");
  const workItem = readUtf8(
    "work-items/WI-0458-korean-residual-sweep-admin-people-approval-policy-phase3.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(approvalPolicyCopy, /organizationId:\s*"조직 식별자"/);
  assert.match(approvalPolicyCopy, /adminActorId:\s*"관리자 액터 식별자/);
  assert.match(approvalPolicyCopy, /title:\s*"요청 로그"/);

  assert.match(peopleFilters, /조직 식별자/);
  assert.match(peopleFilters, /관리자 액터 식별자/);
  assert.match(peopleLogs, /요청 로그/);

  assert.match(payslipReceiptsCopy, /organizationIdFallbackLabel:\s*"조직 식별자\(개발 대체값\)"/);
  assert.match(payslipReceiptsCopy, /runsSearchPlaceholder:\s*"실행 번호\/기간\/배포\/수신 검색"/);

  assert.match(contractsCopy, /employeeIdPlaceholder:\s*"직원-0001"/);

  assert.match(workItem, /WI-0458/i);
  assert.match(workItem, /korean|residual|sweep|admin|people|approval-policy/i);
  assert.match(roadmap, /WI-0458/i);
}

run()
  .then(() => {
    console.log("e2e-wi0458-korean-residual-sweep-admin-people-approval-policy-phase3.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
