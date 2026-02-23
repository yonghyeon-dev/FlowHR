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
  const workItem = readUtf8("work-items", "WI-0257-mobile-analytics-dashboard-share-filter-preset-baseline.md");
  const analyticsScreen = readUtf8("apps", "mobile", "src", "screens", "MobileAnalyticsDashboardScreen.js");
  const presetCard = readUtf8("apps", "mobile", "src", "components", "MobileAnalyticsFilterPresetCard.js");
  const analyticsLib = readUtf8("apps", "mobile", "src", "lib", "mobileAnalytics.js");
  const analyticsStore = readUtf8("apps", "mobile", "src", "lib", "mobileAnalyticsStore.js");
  const adminScreen = readUtf8("apps", "mobile", "src", "screens", "AdminHomeScreen.js");
  const employeeScreen = readUtf8("apps", "mobile", "src", "screens", "EmployeeHomeScreen.js");
  const readme = readUtf8("apps", "mobile", "README.md");

  assert.match(roadmap, /WI-0257/);
  assert.match(workItem, /Mobile Analytics Dashboard Share\/Filter Preset Baseline/);
  assert.match(analyticsScreen, /MobileAnalyticsFilterPresetCard/);
  assert.match(analyticsScreen, /resolveMobileAnalyticsFilterFromPreset/);
  assert.match(analyticsScreen, /loadMobileAnalyticsFilterPresetState/);
  assert.match(analyticsScreen, /focus:/);
  assert.match(presetCard, /Filter presets/);
  assert.match(presetCard, /Pinned presets/);
  assert.match(presetCard, /Recent presets/);
  assert.match(presetCard, /Generate export payload/);
  assert.match(presetCard, /Import payload/);
  assert.match(analyticsLib, /MOBILE_ANALYTICS_FILTER_PRESET_OPTIONS/);
  assert.match(analyticsLib, /resolveMobileAnalyticsFilterFromPreset/);
  assert.match(analyticsLib, /serializeMobileAnalyticsFilterPresetTransfer/);
  assert.match(analyticsLib, /parseMobileAnalyticsFilterPresetTransfer/);
  assert.match(analyticsStore, /flowhr\.mobile\.analytics\.filter-preset-state\.v1/);
  assert.match(analyticsStore, /loadMobileAnalyticsFilterPresetState/);
  assert.match(analyticsStore, /saveMobileAnalyticsFilterPresetState/);
  assert.match(adminScreen, /WI-0258~/);
  assert.match(employeeScreen, /WI-0258~/);
  assert.match(readme, /Mobile analytics dashboard share\/filter preset shell/);

  assert.ok(
    countLines(analyticsScreen) <= 380,
    `MobileAnalyticsDashboardScreen.js should stay under 380 lines (current: ${countLines(analyticsScreen)})`
  );
  assert.ok(
    countLines(presetCard) <= 320,
    `MobileAnalyticsFilterPresetCard.js should stay under 320 lines (current: ${countLines(presetCard)})`
  );

  // @ts-expect-error Mobile sub-app baseline currently ships JS modules without d.ts.
  const analyticsModule = await import("../../apps/mobile/src/lib/mobileAnalytics.js");
  const {
    MOBILE_ANALYTICS_FILTER_PRESET_TRANSFER_TYPE,
    MOBILE_ANALYTICS_FILTER_PRESET_TRANSFER_VERSION,
    buildMobileAnalyticsFilterPresetStats,
    normalizeMobileAnalyticsFilterPresetState,
    parseMobileAnalyticsFilterPresetTransfer,
    pushMobileAnalyticsFilterPresetRecent,
    resolveMobileAnalyticsFilterFromPreset,
    serializeMobileAnalyticsFilterPresetTransfer,
    toggleMobileAnalyticsFilterPresetPin
  } = analyticsModule;

  const source = {
    approvals: [
      { id: "a1", status: "pending", priority: "high", stalledHours: 30, submittedAt: "2026-02-23T09:00:00.000Z" },
      { id: "a2", status: "approved", priority: "normal", stalledHours: 0, submittedAt: "2026-02-22T09:00:00.000Z" }
    ],
    requests: [
      { id: "r1", requestType: "attendanceCorrection", status: "submitted", createdAt: "2026-02-23T08:00:00.000Z" },
      { id: "r2", requestType: "leaveRequest", status: "inReview", createdAt: "2026-02-22T08:00:00.000Z" }
    ],
    notifications: [
      { id: "n1", category: "approvalRequest", read: false, archivedAt: null, createdAt: "2026-02-23T07:00:00.000Z" },
      { id: "n2", category: "approvalResult", read: true, archivedAt: null, createdAt: "2026-02-22T07:00:00.000Z" }
    ]
  };

  const stats = buildMobileAnalyticsFilterPresetStats(source, { now: new Date("2026-02-23T12:00:00.000Z") });
  assert.equal(stats.length, 4);
  assert.ok(stats.every((item: any) => typeof item.count === "number"));
  assert.ok(stats.some((item: any) => item.key === "approvalRisk"));

  const resolved = resolveMobileAnalyticsFilterFromPreset("requestFlow", { periodKey: "7d", focus: "all" });
  assert.equal(resolved.periodKey, "14d");
  assert.equal(resolved.focus, "request");

  const toggled = toggleMobileAnalyticsFilterPresetPin(["allActionRequired"], "approvalRisk");
  assert.deepEqual(toggled, ["allActionRequired", "approvalRisk"]);
  const untoggled = toggleMobileAnalyticsFilterPresetPin(toggled, "allActionRequired");
  assert.deepEqual(untoggled, ["approvalRisk"]);

  const recent = pushMobileAnalyticsFilterPresetRecent(["allActionRequired"], "requestFlow", 4);
  assert.deepEqual(recent, ["requestFlow", "allActionRequired"]);

  const normalized = normalizeMobileAnalyticsFilterPresetState({
    pinnedPresetKeys: ["allActionRequired", "unknown", "allActionRequired"],
    recentPresetKeys: ["approvalRisk", "allActionRequired", "notificationPulse"]
  });
  assert.deepEqual(normalized.pinnedPresetKeys, ["allActionRequired"]);
  assert.deepEqual(normalized.recentPresetKeys, ["approvalRisk", "notificationPulse"]);

  const payload = serializeMobileAnalyticsFilterPresetTransfer({
    presetState: { pinnedPresetKeys: ["allActionRequired"], recentPresetKeys: ["approvalRisk"] },
    filterState: { periodKey: "14d", focus: "request" }
  });
  assert.match(payload, new RegExp(MOBILE_ANALYTICS_FILTER_PRESET_TRANSFER_TYPE));

  const parsed = parseMobileAnalyticsFilterPresetTransfer(payload);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.state.filterState.periodKey, "14d");
  assert.equal(parsed.state.filterState.focus, "request");
  assert.deepEqual(parsed.state.presetState.pinnedPresetKeys, ["allActionRequired"]);

  const wrongVersion = parseMobileAnalyticsFilterPresetTransfer(
    JSON.stringify({
      type: MOBILE_ANALYTICS_FILTER_PRESET_TRANSFER_TYPE,
      version: MOBILE_ANALYTICS_FILTER_PRESET_TRANSFER_VERSION + 1,
      state: {
        presetState: { pinnedPresetKeys: ["allActionRequired"], recentPresetKeys: [] },
        filterState: { periodKey: "7d", focus: "all" }
      }
    })
  );
  assert.equal(wrongVersion.ok, false);
  assert.equal(wrongVersion.code, "unsupported_version");
}

run()
  .then(() => {
    console.log("e2e-wi0257-mobile-analytics-dashboard-share-filter-preset-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
