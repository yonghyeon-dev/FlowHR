import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { employeeGuideCopyByLocale } from "../../src/components/employee-guide/copy";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const dashboard = readUtf8("src", "components", "employee-guide", "EmployeeGuideDashboard.tsx");
  const sections = readUtf8("src", "components", "employee-guide", "EmployeeGuideSections.tsx");
  const dataHook = readUtf8("src", "components", "employee-guide", "useEmployeeGuideData.ts");
  const workItem = readUtf8("work-items", "WI-0355-employee-guide-locale-dynamic-ui-gap-fix.md");
  const roadmap = readUtf8("ROADMAP.md");
  const koCopy = employeeGuideCopyByLocale.ko;

  assert.equal(koCopy.heroEyebrow, "FlowHR 직원");
  assert.equal(koCopy.okLabel, "성공");
  assert.equal(koCopy.failLabel, "실패");
  assert.equal(koCopy.requestLabels.attendanceRecords, "근태 기록 조회");

  assert.match(dashboard, /requestLabels: copy\.requestLabels/);
  assert.match(dashboard, /copy\.heroEyebrow/);

  assert.match(sections, /copy\.okLabel/);
  assert.match(sections, /copy\.failLabel/);
  assert.doesNotMatch(sections, /log\.ok \? "OK" : "FAIL"/);
  assert.doesNotMatch(sections, /깃났|ㅽ뙣|洹쇳깭/);

  assert.match(dataHook, /input\.requestLabels\.attendanceRecords/);
  assert.match(dataHook, /input\.requestLabels\.leaveRequests/);
  assert.match(dataHook, /input\.requestLabels\.confirmedPayslips/);

  assert.match(workItem, /WI-0355/i);
  assert.match(workItem, /locale/i);
  assert.match(roadmap, /WI-0355/i);
}

run()
  .then(() => {
    console.log("e2e-wi0355-employee-guide-locale-dynamic-ui-gap-fix.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
