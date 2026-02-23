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
  const workItem = readUtf8("work-items", "WI-0255-mobile-employee-request-follow-up-preset-import-export-baseline.md");
  const followUpScreen = readUtf8("apps", "mobile", "src", "screens", "EmployeeRequestFollowUpScreen.js");
  const transferCard = readUtf8("apps", "mobile", "src", "components", "EmployeeRequestFollowUpPresetTransferCard.js");
  const requestLib = readUtf8("apps", "mobile", "src", "lib", "employeeRequest.js");
  const adminScreen = readUtf8("apps", "mobile", "src", "screens", "AdminHomeScreen.js");
  const employeeScreen = readUtf8("apps", "mobile", "src", "screens", "EmployeeHomeScreen.js");
  const readme = readUtf8("apps", "mobile", "README.md");

  assert.match(roadmap, /WI-0255/);
  assert.match(workItem, /Mobile Employee Request Follow-Up Preset Import\/Export Baseline/);
  assert.match(followUpScreen, /EmployeeRequestFollowUpPresetTransferCard/);
  assert.match(followUpScreen, /onImportPresetState/);
  assert.match(transferCard, /Follow-up preset transfer/);
  assert.match(transferCard, /Generate export payload/);
  assert.match(transferCard, /Import payload/);
  assert.match(requestLib, /serializeEmployeeRequestFollowUpPresetState/);
  assert.match(requestLib, /parseEmployeeRequestFollowUpPresetState/);
  assert.match(requestLib, /EMPLOYEE_REQUEST_FOLLOW_UP_PRESET_TRANSFER_TYPE/);
  assert.match(adminScreen, /WI-0258~/);
  assert.match(employeeScreen, /WI-0258~/);
  assert.match(readme, /Employee request follow-up preset import\/export transfer shell/);

  assert.ok(
    countLines(followUpScreen) <= 560,
    `EmployeeRequestFollowUpScreen.js should stay under 560 lines (current: ${countLines(followUpScreen)})`
  );

  // @ts-expect-error Mobile sub-app baseline currently ships JS modules without d.ts.
  const requestModule = await import("../../apps/mobile/src/lib/employeeRequest.js");
  const {
    EMPLOYEE_REQUEST_FOLLOW_UP_PRESET_TRANSFER_TYPE,
    EMPLOYEE_REQUEST_FOLLOW_UP_PRESET_TRANSFER_VERSION,
    parseEmployeeRequestFollowUpPresetState,
    serializeEmployeeRequestFollowUpPresetState
  } = requestModule;

  const payload = serializeEmployeeRequestFollowUpPresetState({
    pinnedPresetKeys: ["triageQueue", "decisionQueue"],
    recentPresetKeys: ["recoveryQueue", "triageQueue"]
  });
  assert.match(payload, new RegExp(EMPLOYEE_REQUEST_FOLLOW_UP_PRESET_TRANSFER_TYPE));

  const parsed = parseEmployeeRequestFollowUpPresetState(payload);
  assert.equal(parsed.ok, true);
  assert.deepEqual(parsed.state.pinnedPresetKeys, ["triageQueue", "decisionQueue"]);
  assert.deepEqual(parsed.state.recentPresetKeys, ["recoveryQueue"]);

  const invalidJson = parseEmployeeRequestFollowUpPresetState("{broken");
  assert.equal(invalidJson.ok, false);
  assert.equal(invalidJson.code, "invalid_json");

  const wrongType = parseEmployeeRequestFollowUpPresetState(
    JSON.stringify({
      type: "flowhr.notification-history-preset-state",
      version: EMPLOYEE_REQUEST_FOLLOW_UP_PRESET_TRANSFER_VERSION,
      state: { pinnedPresetKeys: ["triageQueue"], recentPresetKeys: [] }
    })
  );
  assert.equal(wrongType.ok, false);
  assert.equal(wrongType.code, "unsupported_type");

  const wrongVersion = parseEmployeeRequestFollowUpPresetState(
    JSON.stringify({
      type: EMPLOYEE_REQUEST_FOLLOW_UP_PRESET_TRANSFER_TYPE,
      version: EMPLOYEE_REQUEST_FOLLOW_UP_PRESET_TRANSFER_VERSION + 1,
      state: { pinnedPresetKeys: ["triageQueue"], recentPresetKeys: [] }
    })
  );
  assert.equal(wrongVersion.ok, false);
  assert.equal(wrongVersion.code, "unsupported_version");

  const missingState = parseEmployeeRequestFollowUpPresetState(
    JSON.stringify({
      type: EMPLOYEE_REQUEST_FOLLOW_UP_PRESET_TRANSFER_TYPE,
      version: EMPLOYEE_REQUEST_FOLLOW_UP_PRESET_TRANSFER_VERSION
    })
  );
  assert.equal(missingState.ok, false);
  assert.equal(missingState.code, "invalid_state");

  const legacy = parseEmployeeRequestFollowUpPresetState(
    JSON.stringify({
      pinnedPresetKeys: ["triageQueue"],
      recentPresetKeys: ["triageQueue", "recoveryQueue"]
    })
  );
  assert.equal(legacy.ok, true);
  assert.deepEqual(legacy.state.pinnedPresetKeys, ["triageQueue"]);
  assert.deepEqual(legacy.state.recentPresetKeys, ["recoveryQueue"]);
}

run()
  .then(() => {
    console.log("e2e-wi0255-mobile-employee-request-follow-up-preset-import-export-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
