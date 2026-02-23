import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminPage = readUtf8("src", "app", "admin", "page.tsx");
  const employeePage = readUtf8("src", "app", "employee", "page.tsx");
  const workItem = readUtf8(
    "work-items",
    "WI-0303-admin-employee-locale-dynamic-ui-gap-fix-phase3.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(
    adminPage,
    /isKoLocale\s*\?\s*"현재 환경은 "\s*:\s*"Current environment is "/
  );
  assert.match(adminPage, /<p>\{isKoLocale \? "API 호출" : "API calls"\}<\/p>/);
  assert.match(adminPage, /\{isKoLocale \? "조직 ID" : "Organization ID"\}/);
  assert.match(adminPage, /\{isKoLocale \? "액터 ID \(선택\)" : "Actor ID \(optional\)"\}/);
  assert.match(
    adminPage,
    /\{isKoLocale \? "법정공제\(한국 baseline\)" : "Statutory deductions \(KR baseline\)"\}/
  );
  assert.doesNotMatch(adminPage, /Organization ID가 필요합니다\./);

  assert.match(
    employeePage,
    /aria-label=\{isKoLocale \? "재제출 후보 목록" : "resubmit candidate list"\}/
  );
  assert.match(
    employeePage,
    /\{isKoLocale\s*\?\s*"조직 ID \(선택\)"\s*:\s*"Organization ID \(optional\)"\}/
  );
  assert.match(employeePage, /<option value="ANNUAL">\{toLeaveTypeLabel\("ANNUAL"\)\}<\/option>/);
  assert.match(employeePage, /<h2>\{isKoLocale \? "API 실행 로그" : "API execution logs"\}<\/h2>/);
  assert.doesNotMatch(employeePage, /\?\?\? \?\? \?\?/);

  assert.match(workItem, /WI-0303/i);
  assert.match(workItem, /locale/i);
  assert.match(workItem, /broken mojibake string|깨진 문자열/i);
  assert.match(roadmap, /WI-0303/i);
}

run()
  .then(() => {
    console.log("e2e-wi0303-admin-employee-locale-dynamic-ui-gap-fix-phase3.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
