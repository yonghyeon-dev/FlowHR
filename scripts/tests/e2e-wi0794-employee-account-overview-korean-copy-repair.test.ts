import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const overviewPanels = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "EmployeeAccountOverviewPanels.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0794-employee-account-overview-korean-copy-repair.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(
    overviewPanels,
    /출퇴근 섹션 열기/,
    "employee account overview should use readable Korean CTA labels"
  );
  assert.match(
    overviewPanels,
    /세션\/조회 설정/,
    "employee account overview should use readable Korean session settings copy"
  );
  assert.match(
    overviewPanels,
    /근태\/휴가 통합 요약 카드/,
    "employee account overview should use readable Korean summary copy"
  );
  assert.match(
    overviewPanels,
    /정정\/휴가 제출 체크리스트 통합/,
    "employee account overview should use readable Korean checklist copy"
  );
  assert.doesNotMatch(
    overviewPanels,
    /쨌|異쒗눜洹|濡쒖뺄|願\?\?\?뱀뀡/,
    "employee account overview should not include previously corrupted mojibake fragments"
  );

  assert.match(workItem, /WI-0794/i);
  assert.match(workItem, /employee|dashboard|korean|copy|repair|mojibake/i);
  assert.match(roadmap, /WI-0794/i);
}

run();
console.log("e2e-wi0794-employee-account-overview-korean-copy-repair.test passed");
