import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminLayoutSource = readUtf8("src", "app", "admin", "layout.tsx");
  const messagesSource = readUtf8("src", "lib", "i18n", "messages.ts");
  const routingBundleSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingOpsReviewRoutingSignatureBundle.tsx"
  );
  const deliveryLockPageSource = readUtf8(
    "src",
    "app",
    "admin",
    "payroll-year-end-filing",
    "ops",
    "checklist",
    "review",
    "snapshot",
    "handoff",
    "close-off",
    "routing-signature",
    "delivery-lock",
    "page.tsx"
  );
  const deliveryLockSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingOpsReviewDeliveryLockHandover.tsx"
  );
  const deliveryLockCssModuleSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingOpsReviewDeliveryLockHandover.module.css"
  );
  const deliveryLockHelperSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "filing-alert-review-delivery-lock-handover.ts"
  );
  const roadmapSource = readUtf8("ROADMAP.md");
  const workItemSource = readUtf8(
    "work-items",
    "WI-0208-filing-ops-delivery-package-lock-and-final-handover-baseline.md"
  );
  const packageJsonSource = readUtf8("package.json");

  assert.match(
    adminLayoutSource,
    /\/admin\/payroll-year-end-filing\/ops\/checklist\/review\/snapshot\/handoff\/close-off\/routing-signature\/delivery-lock/,
    "admin nav should include delivery lock route"
  );
  assert.match(
    messagesSource,
    /admin\.nav\.yearEndFilingOpsChecklistDeliveryLockHandover/,
    "messages should include delivery lock nav key"
  );
  assert.match(
    routingBundleSource,
    /Open Delivery Lock \+ Final Handover/,
    "routing signature bundle should provide link to delivery lock route"
  );
  assert.match(
    routingBundleSource,
    /buildRoutingSignatureDeliveryLockRouteHref/,
    "routing signature bundle should use delivery lock route helper"
  );
  assert.match(
    deliveryLockPageSource,
    /PayrollYearEndFilingOpsReviewDeliveryLockHandover/,
    "delivery lock page should render dedicated component"
  );
  assert.match(
    deliveryLockSource,
    /id="filing-alert-delivery-lock-handover"/,
    "delivery lock component should expose root section id"
  );
  assert.match(
    deliveryLockSource,
    /id="filing-alert-delivery-package-lock"/,
    "delivery lock component should expose package lock panel id"
  );
  assert.match(
    deliveryLockSource,
    /id="filing-alert-final-handover"/,
    "delivery lock component should expose final handover panel id"
  );
  assert.match(
    deliveryLockSource,
    /id="filing-alert-delivery-lock-readiness"/,
    "delivery lock component should expose readiness panel id"
  );
  assert.match(
    deliveryLockSource,
    /aria-label="filing delivery lock blockers"/,
    "delivery lock component should expose blocker list aria-label"
  );
  assert.match(
    deliveryLockCssModuleSource,
    /\.sectionGrid/,
    "delivery lock css module should include section grid style"
  );
  assert.match(
    deliveryLockCssModuleSource,
    /\.blockerList/,
    "delivery lock css module should include blocker list style"
  );
  assert.match(
    deliveryLockHelperSource,
    /summarizeDeliveryLockHandover/,
    "delivery lock helper should expose deterministic summary function"
  );
  assert.match(
    roadmapSource,
    /> \*\*Current version\*\*: 0\.1\.\d+/,
    "roadmap should expose current version header"
  );
  assert.match(roadmapSource, /WI-0208 /, "roadmap should include WI-0208 entry");
  assert.match(workItemSource, /delivery package lock/i, "work-item should include delivery lock scope");
  assert.match(workItemSource, /final handover/i, "work-item should include final handover scope");
  assert.match(
    packageJsonSource,
    /e2e-wi0208-filing-ops-delivery-package-lock-and-final-handover-baseline\.test\.ts/,
    "package scripts should include WI-0208 regression test"
  );

  const deliveryLockModule = await import(
    "../../src/components/payroll-year-end-filing/filing-alert-review-delivery-lock-handover.ts"
  );

  const deliveryLockHref = deliveryLockModule.buildRoutingSignatureDeliveryLockRouteHref({
    metric: "pending",
    level: "critical",
    value: 11,
    ownerRole: "manager",
    ownerActorId: "MGR-0208",
    handoffReady: true,
    exportReady: true,
    archiveReady: true,
    routingReady: false,
    signatureReady: true
  });
  assert.match(
    deliveryLockHref,
    /^\/admin\/payroll-year-end-filing\/ops\/checklist\/review\/snapshot\/handoff\/close-off\/routing-signature\/delivery-lock\?/,
    "delivery lock helper should build dedicated route"
  );
  assert.match(deliveryLockHref, /routingReady=0/, "delivery lock href should include routing flag");
  assert.match(deliveryLockHref, /signatureReady=1/, "delivery lock href should include signature flag");

  const lockEntry = deliveryLockModule.buildDeliveryPackageLockEntry({
    packageId: " PKG-0208 ",
    status: "locked",
    lockedByRole: "manager",
    lockedByActorId: " MGR-0208 ",
    lockReason: "  validated all signatures ",
    releaseNote: "  "
  });
  assert.equal(lockEntry.packageId, "PKG-0208");
  assert.equal(lockEntry.lockedByActorId, "MGR-0208");
  assert.equal(lockEntry.lockReason, "validated all signatures");
  assert.notEqual(lockEntry.lockedAt, null);

  const releasedLock = deliveryLockModule.applyDeliveryPackageLock({
    current: lockEntry,
    status: "released",
    lockedByRole: "manager",
    lockedByActorId: "MGR-0208",
    lockReason: "",
    releaseNote: "rollback"
  });
  assert.equal(releasedLock.status, "released");
  assert.equal(releasedLock.lockedAt, null);
  assert.equal(releasedLock.releaseNote, "rollback");

  const handoverRecord = deliveryLockModule.buildFinalHandoverRecord({
    targetRole: "admin",
    targetActorId: " ADM-0208 ",
    status: "handover_sent",
    channel: "hometax_bundle",
    note: "  sent package bundle "
  });
  assert.equal(handoverRecord.targetActorId, "ADM-0208");
  assert.equal(handoverRecord.status, "handover_sent");
  assert.notEqual(handoverRecord.sentAt, null);
  assert.equal(handoverRecord.acknowledgedAt, null);

  const ackedHandover = deliveryLockModule.applyFinalHandoverStatus({
    current: handoverRecord,
    status: "acknowledged",
    targetRole: "admin",
    targetActorId: "ADM-0208",
    channel: "hometax_bundle",
    note: "ack received",
    now: new Date("2026-02-22T15:40:00.000Z")
  });
  assert.equal(ackedHandover.status, "acknowledged");
  assert.notEqual(ackedHandover.sentAt, null);
  assert.equal(ackedHandover.acknowledgedAt, "2026-02-22T15:40:00.000Z");

  const blockedSummary = deliveryLockModule.summarizeDeliveryLockHandover({
    lockEntry: releasedLock,
    handoverRecord: handoverRecord,
    handoffReady: true,
    exportReady: true,
    archiveReady: true,
    routingReady: true,
    signatureReady: false
  });
  assert.equal(blockedSummary.readyForCompletion, false);
  assert.equal(blockedSummary.blockers.length >= 1, true);

  const readySummary = deliveryLockModule.summarizeDeliveryLockHandover({
    lockEntry,
    handoverRecord: ackedHandover,
    handoffReady: true,
    exportReady: true,
    archiveReady: true,
    routingReady: true,
    signatureReady: true
  });
  assert.equal(readySummary.packageLocked, true);
  assert.equal(readySummary.handoverAcknowledged, true);
  assert.equal(readySummary.readyForCompletion, true);
  assert.equal(readySummary.blockers.length, 0);
}

run()
  .then(() => {
    console.log("e2e-wi0208-filing-ops-delivery-package-lock-and-final-handover-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
