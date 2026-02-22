import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminLayoutSource = readUtf8("src", "app", "admin", "layout.tsx");
  const messagesSource = readUtf8("src", "lib", "i18n", "messages.ts");
  const deliveryLockSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingOpsReviewDeliveryLockHandover.tsx"
  );
  const completionPageSource = readUtf8(
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
    "completion-receipt",
    "page.tsx"
  );
  const completionSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingOpsReviewCompletionReceiptArchiveDigest.tsx"
  );
  const completionReceiptPanelSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingOpsCompletionReceiptPanel.tsx"
  );
  const archiveDigestPanelSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingOpsArchiveDigestPanel.tsx"
  );
  const completionCssModuleSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingOpsReviewCompletionReceiptArchiveDigest.module.css"
  );
  const completionHelperSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "filing-alert-review-completion-receipt-archive-digest.ts"
  );
  const roadmapSource = readUtf8("ROADMAP.md");
  const workItemSource = readUtf8(
    "work-items",
    "WI-0209-filing-ops-completion-receipt-and-archive-digest-baseline.md"
  );
  const packageJsonSource = readUtf8("package.json");

  assert.match(
    adminLayoutSource,
    /\/admin\/payroll-year-end-filing\/ops\/checklist\/review\/snapshot\/handoff\/close-off\/routing-signature\/delivery-lock\/completion-receipt/,
    "admin nav should include completion receipt route"
  );
  assert.match(
    messagesSource,
    /admin\.nav\.yearEndFilingOpsChecklistCompletionReceiptArchiveDigest/,
    "messages should include completion receipt nav key"
  );
  assert.match(
    deliveryLockSource,
    /Open Completion Receipt \+ Archive Digest/,
    "delivery lock component should link to completion receipt route"
  );
  assert.match(
    deliveryLockSource,
    /buildDeliveryLockCompletionReceiptRouteHref/,
    "delivery lock component should use completion receipt route helper"
  );
  assert.match(
    completionPageSource,
    /PayrollYearEndFilingOpsReviewCompletionReceiptArchiveDigest/,
    "completion receipt page should render dedicated component"
  );
  assert.match(
    completionSource,
    /id="filing-alert-completion-receipt-archive-digest"/,
    "completion receipt component should expose root section id"
  );
  assert.match(
    completionSource,
    /PayrollYearEndFilingOpsCompletionReceiptPanel/,
    "completion receipt container should compose dedicated receipt panel"
  );
  assert.match(
    completionReceiptPanelSource,
    /id="filing-alert-completion-receipt"/,
    "completion receipt component should expose receipt panel id"
  );
  assert.match(
    completionSource,
    /PayrollYearEndFilingOpsArchiveDigestPanel/,
    "completion receipt container should compose dedicated archive digest panel"
  );
  assert.match(
    archiveDigestPanelSource,
    /id="filing-alert-archive-digest"/,
    "completion receipt component should expose archive digest panel id"
  );
  assert.match(
    completionSource,
    /id="filing-alert-completion-archive-readiness"/,
    "completion receipt component should expose readiness panel id"
  );
  assert.match(
    completionSource,
    /aria-label="filing completion archive blockers"/,
    "completion receipt component should expose blocker list aria-label"
  );
  assert.match(
    completionCssModuleSource,
    /\.digestGrid/,
    "completion receipt css module should include digest grid style"
  );
  assert.match(
    completionCssModuleSource,
    /\.blockerList/,
    "completion receipt css module should include blocker list style"
  );
  assert.match(
    completionHelperSource,
    /summarizeCompletionReceiptArchiveDigest/,
    "completion receipt helper should expose deterministic summary function"
  );
  assert.match(
    roadmapSource,
    /> \*\*Current version\*\*: 0\.1\.\d+/,
    "roadmap should expose current version header"
  );
  assert.match(roadmapSource, /WI-0209 /, "roadmap should include WI-0209 entry");
  assert.match(workItemSource, /completion receipt/i, "work-item should include completion receipt scope");
  assert.match(workItemSource, /archive digest/i, "work-item should include archive digest scope");
  assert.match(
    packageJsonSource,
    /e2e-wi0209-filing-ops-completion-receipt-and-archive-digest-baseline\.test\.ts/,
    "package scripts should include WI-0209 regression test"
  );

  const completionModule = await import(
    "../../src/components/payroll-year-end-filing/filing-alert-review-completion-receipt-archive-digest.ts"
  );

  const completionHref = completionModule.buildDeliveryLockCompletionReceiptRouteHref({
    metric: "pending",
    level: "critical",
    value: 12,
    ownerRole: "manager",
    ownerActorId: "MGR-0209",
    handoffReady: true,
    exportReady: true,
    archiveReady: true,
    routingReady: true,
    signatureReady: false,
    packageLocked: true,
    handoverAcknowledged: false
  });
  assert.match(
    completionHref,
    /^\/admin\/payroll-year-end-filing\/ops\/checklist\/review\/snapshot\/handoff\/close-off\/routing-signature\/delivery-lock\/completion-receipt\?/,
    "completion receipt helper should build dedicated route"
  );
  assert.match(completionHref, /packageLocked=1/, "completion href should include package lock flag");
  assert.match(
    completionHref,
    /handoverAcknowledged=0/,
    "completion href should include handover acknowledgment flag"
  );

  const pendingReceipt = completionModule.buildCompletionReceiptRecord({
    receiptId: " RCPT-0209 ",
    status: "pending",
    issuedByRole: "manager",
    issuedByActorId: " MGR-0209 ",
    note: "  waiting confirmation "
  });
  assert.equal(pendingReceipt.receiptId, "RCPT-0209");
  assert.equal(pendingReceipt.issuedByActorId, "MGR-0209");
  assert.equal(pendingReceipt.issuedAt, null);
  assert.equal(pendingReceipt.verifiedAt, null);

  const verifiedReceipt = completionModule.applyCompletionReceipt({
    current: pendingReceipt,
    status: "verified",
    issuedByRole: "admin",
    issuedByActorId: " ADM-0209 ",
    note: "  verified and archived ",
    now: new Date("2026-02-22T16:20:00.000Z")
  });
  assert.equal(verifiedReceipt.status, "verified");
  assert.equal(verifiedReceipt.issuedByRole, "admin");
  assert.equal(verifiedReceipt.issuedByActorId, "ADM-0209");
  assert.equal(verifiedReceipt.note, "verified and archived");
  assert.notEqual(verifiedReceipt.issuedAt, null);
  assert.equal(verifiedReceipt.verifiedAt, "2026-02-22T16:20:00.000Z");

  const digestEntries = completionModule.buildDefaultArchiveDigestEntries();
  assert.equal(digestEntries.length, 3);
  assert.equal(digestEntries[0].status, "pending");

  const sealedDigest = completionModule.applyArchiveDigestStatus({
    entries: digestEntries,
    channel: "hometax_bundle",
    status: "sealed",
    artifactId: "ART-0209",
    checksum: "sha256:0209",
    note: "sealed by manager",
    now: new Date("2026-02-22T16:30:00.000Z")
  });
  assert.equal(
    sealedDigest.find((entry: { channel: string }) => entry.channel === "hometax_bundle")?.status,
    "sealed"
  );

  const blockedSummary = completionModule.summarizeCompletionReceiptArchiveDigest({
    receiptRecord: pendingReceipt,
    digestEntries,
    handoffReady: true,
    exportReady: true,
    archiveReady: true,
    routingReady: true,
    signatureReady: true,
    packageLocked: true,
    handoverAcknowledged: false
  });
  assert.equal(blockedSummary.readyForArchiveDigest, false);
  assert.equal(blockedSummary.blockers.length >= 1, true);

  const readyDigestEntries = sealedDigest.map((entry: any) =>
    entry.channel === "internal_archive" || entry.channel === "ops_receipt"
      ? {
          ...entry,
          status: "sealed",
          artifactId: entry.artifactId || `ART-${entry.channel}`,
          checksum: entry.checksum || `sha256:${entry.channel}`,
          updatedAt: entry.updatedAt || "2026-02-22T16:40:00.000Z"
        }
      : entry
  ) as any;

  const readySummary = completionModule.summarizeCompletionReceiptArchiveDigest({
    receiptRecord: verifiedReceipt,
    digestEntries: readyDigestEntries,
    handoffReady: true,
    exportReady: true,
    archiveReady: true,
    routingReady: true,
    signatureReady: true,
    packageLocked: true,
    handoverAcknowledged: true
  });
  assert.equal(readySummary.receiptVerified, true);
  assert.equal(readySummary.digestReady, true);
  assert.equal(readySummary.readyForArchiveDigest, true);
  assert.equal(readySummary.blockers.length, 0);
}

run()
  .then(() => {
    console.log("e2e-wi0209-filing-ops-completion-receipt-and-archive-digest-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
