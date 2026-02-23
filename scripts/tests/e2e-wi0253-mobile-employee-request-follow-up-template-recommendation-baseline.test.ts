import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function countLines(source: string) {
  return source.trimEnd().split(/\r?\n/).length;
}

async function run() {
  const roadmap = readUtf8("ROADMAP.md");
  const workItem = readUtf8("work-items", "WI-0253-mobile-employee-request-follow-up-template-recommendation-baseline.md");
  const followUpScreen = readUtf8("apps", "mobile", "src", "screens", "EmployeeRequestFollowUpScreen.js");
  const requestLib = readUtf8("apps", "mobile", "src", "lib", "employeeRequest.js");
  const adminScreen = readUtf8("apps", "mobile", "src", "screens", "AdminHomeScreen.js");
  const employeeScreen = readUtf8("apps", "mobile", "src", "screens", "EmployeeHomeScreen.js");
  const readme = readUtf8("apps", "mobile", "README.md");

  assert.match(roadmap, /WI-0253/);
  assert.match(workItem, /Mobile Employee Request Follow-Up Template Recommendation Baseline/);
  assert.match(followUpScreen, /Recommendation templates/);
  assert.match(followUpScreen, /recommended template:/);
  assert.match(followUpScreen, /applyTemplateActionToFirst/);
  assert.match(requestLib, /EMPLOYEE_REQUEST_FOLLOW_UP_TEMPLATE_OPTIONS/);
  assert.match(requestLib, /recommendEmployeeRequestFollowUpTemplate/);
  assert.match(requestLib, /buildEmployeeRequestFollowUpTemplateStats/);
  assert.match(adminScreen, /WI-0256~/);
  assert.match(employeeScreen, /WI-0256~/);
  assert.match(readme, /Employee request follow-up recommendation template shell/);

  assert.ok(
    countLines(followUpScreen) <= 560,
    `EmployeeRequestFollowUpScreen.js should stay under 560 lines (current: ${countLines(followUpScreen)})`
  );

  // @ts-expect-error Mobile sub-app baseline currently ships JS modules without d.ts.
  const requestModule = await import("../../apps/mobile/src/lib/employeeRequest.js");
  const {
    buildEmployeeRequestFollowUpTemplateStats,
    buildEmployeeRequestFollowUps,
    recommendEmployeeRequestFollowUpTemplate
  } = requestModule;

  const followUps = buildEmployeeRequestFollowUps([
    {
      id: "req-1",
      requestType: "attendanceCorrection",
      status: "submitted",
      reason: "late checkout",
      createdAt: "2026-02-23T08:00:00.000Z",
      statusTimeline: [{ status: "submitted", at: "2026-02-23T08:00:00.000Z" }]
    },
    {
      id: "req-2",
      requestType: "leaveRequest",
      status: "inReview",
      reason: "vacation",
      createdAt: "2026-02-23T08:20:00.000Z",
      statusTimeline: [{ status: "inReview", at: "2026-02-23T08:30:00.000Z" }]
    },
    {
      id: "req-3",
      requestType: "leaveRequest",
      status: "rejected",
      reason: "quota",
      createdAt: "2026-02-23T08:40:00.000Z",
      statusTimeline: [{ status: "rejected", at: "2026-02-23T08:50:00.000Z" }]
    }
  ]);

  const templates = followUps.map((item: any) => recommendEmployeeRequestFollowUpTemplate(item));
  assert.equal(templates[0].key, "recovery");
  assert.equal(templates[1].key, "decision");
  assert.equal(templates[2].key, "triage");

  const stats = buildEmployeeRequestFollowUpTemplateStats(followUps);
  const recovery = stats.find((item: any) => item.key === "recovery");
  const decision = stats.find((item: any) => item.key === "decision");
  const triage = stats.find((item: any) => item.key === "triage");
  assert.equal(recovery?.count, 1);
  assert.equal(decision?.count, 1);
  assert.equal(triage?.count, 1);
}

run()
  .then(() => {
    console.log("e2e-wi0253-mobile-employee-request-follow-up-template-recommendation-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
