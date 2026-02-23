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
  const workItem = readUtf8("work-items", "WI-0254-mobile-employee-request-follow-up-action-bundle-saved-preset-baseline.md");
  const followUpScreen = readUtf8("apps", "mobile", "src", "screens", "EmployeeRequestFollowUpScreen.js");
  const requestLib = readUtf8("apps", "mobile", "src", "lib", "employeeRequest.js");
  const requestStore = readUtf8("apps", "mobile", "src", "lib", "employeeRequestStore.js");
  const adminScreen = readUtf8("apps", "mobile", "src", "screens", "AdminHomeScreen.js");
  const employeeScreen = readUtf8("apps", "mobile", "src", "screens", "EmployeeHomeScreen.js");
  const readme = readUtf8("apps", "mobile", "README.md");

  assert.match(roadmap, /WI-0254/);
  assert.match(workItem, /Mobile Employee Request Follow-Up Action Bundle Saved Preset Baseline/);
  assert.match(followUpScreen, /Action bundle presets/);
  assert.match(followUpScreen, /Pinned presets/);
  assert.match(followUpScreen, /Recent presets/);
  assert.match(followUpScreen, /Apply preset/);
  assert.match(followUpScreen, /runBundleQuickAction/);

  assert.match(requestLib, /EMPLOYEE_REQUEST_FOLLOW_UP_BUNDLE_PRESET_OPTIONS/);
  assert.match(requestLib, /resolveEmployeeRequestFollowUpFilterFromPreset/);
  assert.match(requestLib, /toggleEmployeeRequestFollowUpPresetPin/);
  assert.match(requestLib, /pushEmployeeRequestFollowUpPresetRecent/);
  assert.match(requestLib, /buildEmployeeRequestFollowUpBundleStats/);

  assert.match(requestStore, /flowhr\.mobile\.employee\.request\.follow-up\.preset\.v1/);
  assert.match(requestStore, /loadEmployeeRequestFollowUpPresetState/);
  assert.match(requestStore, /saveEmployeeRequestFollowUpPresetState/);

  assert.match(adminScreen, /WI-0258~/);
  assert.match(employeeScreen, /WI-0258~/);
  assert.match(readme, /Employee request follow-up action bundle saved preset shell/);

  assert.ok(
    countLines(followUpScreen) <= 560,
    `EmployeeRequestFollowUpScreen.js should stay under 560 lines (current: ${countLines(followUpScreen)})`
  );

  // @ts-expect-error Mobile sub-app baseline currently ships JS modules without d.ts.
  const requestModule = await import("../../apps/mobile/src/lib/employeeRequest.js");
  const {
    buildEmployeeRequestFollowUpBundleStats,
    buildEmployeeRequestFollowUps,
    getEmployeeRequestFollowUpBundlePreset,
    normalizeEmployeeRequestFollowUpPresetState,
    pushEmployeeRequestFollowUpPresetRecent,
    resolveEmployeeRequestFollowUpFilterFromPreset,
    toggleEmployeeRequestFollowUpPresetPin
  } = requestModule;

  const decisionPreset = getEmployeeRequestFollowUpBundlePreset("decisionQueue");
  assert.equal(decisionPreset?.key, "decisionQueue");
  assert.equal(decisionPreset?.quickAction, "approve");

  const resolved = resolveEmployeeRequestFollowUpFilterFromPreset("recoveryQueue");
  assert.equal(resolved.severity, "critical");
  assert.equal(resolved.status, "rejected");
  assert.equal(resolved.sortKey, "priority");

  const toggled = toggleEmployeeRequestFollowUpPresetPin(["triageQueue"], "decisionQueue");
  assert.deepEqual(toggled, ["triageQueue", "decisionQueue"]);
  const untoggled = toggleEmployeeRequestFollowUpPresetPin(toggled, "triageQueue");
  assert.deepEqual(untoggled, ["decisionQueue"]);

  const recent = pushEmployeeRequestFollowUpPresetRecent(["triageQueue"], "decisionQueue", 4);
  assert.deepEqual(recent, ["decisionQueue", "triageQueue"]);

  const normalizedState = normalizeEmployeeRequestFollowUpPresetState({
    pinnedPresetKeys: ["triageQueue", "unknown", "triageQueue"],
    recentPresetKeys: ["decisionQueue", "triageQueue", "recoveryQueue"]
  });
  assert.deepEqual(normalizedState.pinnedPresetKeys, ["triageQueue"]);
  assert.deepEqual(normalizedState.recentPresetKeys, ["decisionQueue", "recoveryQueue"]);

  const followUps = buildEmployeeRequestFollowUps([
    {
      id: "req-1",
      requestType: "attendanceCorrection",
      status: "submitted",
      reason: "missed checkout",
      createdAt: "2026-02-23T08:00:00.000Z",
      statusTimeline: [{ status: "submitted", at: "2026-02-23T08:00:00.000Z" }]
    },
    {
      id: "req-2",
      requestType: "leaveRequest",
      status: "rejected",
      reason: "quota exceeded",
      createdAt: "2026-02-23T08:20:00.000Z",
      statusTimeline: [{ status: "rejected", at: "2026-02-23T08:30:00.000Z" }]
    }
  ]);
  const bundleStats = buildEmployeeRequestFollowUpBundleStats(followUps);
  const triage = bundleStats.find((item: any) => item.key === "triageQueue");
  const recovery = bundleStats.find((item: any) => item.key === "recoveryQueue");
  assert.equal(triage?.count, 1);
  assert.equal(recovery?.count, 1);
}

run()
  .then(() => {
    console.log("e2e-wi0254-mobile-employee-request-follow-up-action-bundle-saved-preset-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
