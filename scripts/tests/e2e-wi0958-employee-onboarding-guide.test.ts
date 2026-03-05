import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const page = readUtf8("src", "app", "employee", "guide", "page.tsx");
  const workItem = readUtf8("work-items", "WI-0958-employee-onboarding-guide.md");

  assert.match(page, /셀프서비스 가이드/);
  assert.match(page, /출퇴근 기록과 정정 요청/);
  assert.match(page, /휴가 신청과 잔여일 확인/);
  assert.match(page, /급여명세서 조회/);
  assert.match(page, /근로계약서 확인/);

  assert.match(page, /href: "\/employee\?focus=attendance"/);
  assert.match(page, /href: "\/employee\?focus=leave"/);
  assert.match(page, /href: "\/employee\/payslips"/);
  assert.match(page, /href: "\/employee\/contracts"/);

  assert.match(workItem, /WI-0958/i);
  assert.match(workItem, /출퇴근/);
  assert.match(workItem, /휴가/);
  assert.match(workItem, /급여명세서/);
  assert.match(workItem, /근로계약서/);
}

run()
  .then(() => {
    console.log("e2e-wi0958-employee-onboarding-guide.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
