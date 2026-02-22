import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminLayoutSource = readUtf8("src", "app", "admin", "layout.tsx");
  const messagesSource = readUtf8("src", "lib", "i18n", "messages.ts");
  const closeOffSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingOpsReviewCloseOffPackage.tsx"
  );
  const routingPageSource = readUtf8(
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
    "page.tsx"
  );
  const routingSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingOpsReviewRoutingSignatureBundle.tsx"
  );
  const routingCssModuleSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingOpsReviewRoutingSignatureBundle.module.css"
  );
  const routingHelperSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "filing-alert-review-routing-signature-bundle.ts"
  );
  const roadmapSource = readUtf8("ROADMAP.md");
  const workItemSource = readUtf8(
    "work-items",
    "WI-0207-filing-ops-close-off-approval-routing-and-delivery-signature-bundle-baseline.md"
  );
  const packageJsonSource = readUtf8("package.json");

  assert.match(
    adminLayoutSource,
    /\/admin\/payroll-year-end-filing\/ops\/checklist\/review\/snapshot\/handoff\/close-off\/routing-signature/,
    "admin nav should include routing signature bundle route"
  );
  assert.match(
    messagesSource,
    /admin\.nav\.yearEndFilingOpsChecklistRoutingSignatureBundle/,
    "messages should include routing signature bundle nav key"
  );
  assert.match(
    closeOffSource,
    /Open Routing \+ Signature Bundle/,
    "close-off package should provide link to routing signature bundle route"
  );
  assert.match(
    closeOffSource,
    /buildCloseOffRoutingSignatureBundleRouteHref/,
    "close-off package should use routing signature route helper"
  );
  assert.match(
    routingPageSource,
    /PayrollYearEndFilingOpsReviewRoutingSignatureBundle/,
    "routing signature page should render dedicated component"
  );
  assert.match(
    routingSource,
    /id="filing-alert-routing-signature-bundle"/,
    "routing signature component should expose root section id"
  );
  assert.match(
    routingSource,
    /id="filing-alert-approval-routing-grid"/,
    "routing signature component should expose approval routing panel id"
  );
  assert.match(
    routingSource,
    /id="filing-alert-delivery-signature-grid"/,
    "routing signature component should expose delivery signature panel id"
  );
  assert.match(
    routingSource,
    /id="filing-alert-routing-signature-readiness"/,
    "routing signature component should expose readiness panel id"
  );
  assert.match(
    routingSource,
    /aria-label="filing routing signature blockers"/,
    "routing signature component should expose blocker list aria-label"
  );
  assert.match(
    routingCssModuleSource,
    /\.routingGrid/,
    "routing signature css module should include routing grid style"
  );
  assert.match(
    routingCssModuleSource,
    /\.signatureGrid/,
    "routing signature css module should include signature grid style"
  );
  assert.match(
    routingHelperSource,
    /summarizeRoutingSignatureBundle/,
    "routing signature helper should expose deterministic summary function"
  );
  assert.match(
    roadmapSource,
    /> \*\*Current version\*\*: 0\.1\.\d+/,
    "roadmap should expose current version header"
  );
  assert.match(roadmapSource, /WI-0207 /, "roadmap should include WI-0207 entry");
  assert.match(workItemSource, /routing/i, "work-item should include routing scope");
  assert.match(workItemSource, /signature/i, "work-item should include signature scope");
  assert.match(
    packageJsonSource,
    /e2e-wi0207-filing-ops-close-off-approval-routing-and-delivery-signature-bundle-baseline\.test\.ts/,
    "package scripts should include WI-0207 regression test"
  );

  const routingModule = await import(
    "../../src/components/payroll-year-end-filing/filing-alert-review-routing-signature-bundle.ts"
  );

  const bundleHref = routingModule.buildCloseOffRoutingSignatureBundleRouteHref({
    metric: "pending",
    level: "watch",
    value: 9,
    ownerRole: "manager",
    ownerActorId: "MGR-0207",
    handoffReady: true,
    exportReady: true,
    archiveReady: false
  });
  assert.match(
    bundleHref,
    /^\/admin\/payroll-year-end-filing\/ops\/checklist\/review\/snapshot\/handoff\/close-off\/routing-signature\?/,
    "routing signature helper should build dedicated route"
  );
  assert.match(bundleHref, /handoffReady=1/, "routing signature href should include handoff flag");
  assert.match(bundleHref, /archiveReady=0/, "routing signature href should include archive flag");

  const defaultRouting = routingModule.buildDefaultApprovalRoutingEntries("OPS-0207");
  assert.equal(defaultRouting.length, 4);
  assert.equal(defaultRouting[0].stage, "prepare");
  assert.equal(defaultRouting[0].ownerActorId, "OPS-0207");

  const defaultSignatures = routingModule.buildDefaultDeliverySignatureEntries();
  assert.equal(defaultSignatures.length, 3);
  assert.equal(defaultSignatures[0].channel, "hometax_upload");

  const routingStage = routingModule.buildApprovalRoutingEntry({
    stage: "manager_review",
    status: "in_progress",
    ownerRole: "manager",
    ownerActorId: " MGR-0207 ",
    etaHours: 6,
    note: "  waiting final docs  ",
    now: new Date("2026-02-22T14:15:00.000Z")
  });
  assert.equal(routingStage.ownerActorId, "MGR-0207");
  assert.equal(routingStage.note, "waiting final docs");
  assert.equal(routingStage.updatedAt, "2026-02-22T14:15:00.000Z");

  const appliedRouting = routingModule.applyApprovalRoutingStatus({
    entries: defaultRouting,
    stage: "prepare",
    status: "done",
    ownerRole: "payroll_operator",
    ownerActorId: "OPS-0207",
    etaHours: 2,
    note: "prepared",
    now: new Date("2026-02-22T14:20:00.000Z")
  });
  assert.equal(appliedRouting.find((entry: { stage: string }) => entry.stage === "prepare")?.status, "done");

  const signature = routingModule.buildDeliverySignatureEntry({
    channel: "manual_portal",
    status: "signed",
    signerRole: "payroll_operator",
    signerActorId: " OPS-0207 ",
    reference: " REF-0207 ",
    now: new Date("2026-02-22T14:30:00.000Z")
  });
  assert.equal(signature.signerActorId, "OPS-0207");
  assert.equal(signature.reference, "REF-0207");
  assert.equal(signature.signedAt, "2026-02-22T14:30:00.000Z");

  const appliedSignature = routingModule.applyDeliverySignature({
    entries: defaultSignatures,
    channel: "hometax_upload",
    status: "failed",
    signerRole: "manager",
    signerActorId: "MGR-0207",
    reference: "ERR-0207",
    now: new Date("2026-02-22T14:35:00.000Z")
  });
  assert.equal(
    appliedSignature.find((entry: { channel: string }) => entry.channel === "hometax_upload")?.status,
    "failed"
  );

  const blockedSummary = routingModule.summarizeRoutingSignatureBundle({
    routingEntries: appliedRouting,
    signatureEntries: appliedSignature,
    handoffReady: true,
    exportReady: true,
    archiveReady: true
  });
  assert.equal(blockedSummary.readyToDeliver, false);
  assert.equal(blockedSummary.blockers.length >= 1, true);

  const readyRouting = [
    {
      stage: "prepare",
      status: "done",
      ownerRole: "payroll_operator",
      ownerActorId: "OPS-0207",
      etaHours: 1,
      note: "",
      updatedAt: "2026-02-22T14:00:00.000Z"
    },
    {
      stage: "manager_review",
      status: "done",
      ownerRole: "manager",
      ownerActorId: "MGR-0207",
      etaHours: 2,
      note: "",
      updatedAt: "2026-02-22T14:10:00.000Z"
    },
    {
      stage: "admin_signoff",
      status: "done",
      ownerRole: "admin",
      ownerActorId: "ADM-0207",
      etaHours: 3,
      note: "",
      updatedAt: "2026-02-22T14:20:00.000Z"
    },
    {
      stage: "delivery_ack",
      status: "done",
      ownerRole: "manager",
      ownerActorId: "MGR-0207",
      etaHours: 1,
      note: "",
      updatedAt: "2026-02-22T14:30:00.000Z"
    }
  ] as const;

  const readySignatures = [
    {
      channel: "hometax_upload",
      status: "signed",
      signerRole: "manager",
      signerActorId: "MGR-0207",
      reference: "HOMETAX-0207",
      signedAt: "2026-02-22T14:35:00.000Z"
    },
    {
      channel: "manual_portal",
      status: "signed",
      signerRole: "payroll_operator",
      signerActorId: "OPS-0207",
      reference: "MANUAL-0207",
      signedAt: "2026-02-22T14:36:00.000Z"
    },
    {
      channel: "internal_archive",
      status: "signed",
      signerRole: "admin",
      signerActorId: "ADM-0207",
      reference: "ARCHIVE-0207",
      signedAt: "2026-02-22T14:37:00.000Z"
    }
  ] as const;

  const readySummary = routingModule.summarizeRoutingSignatureBundle({
    routingEntries: readyRouting,
    signatureEntries: readySignatures,
    handoffReady: true,
    exportReady: true,
    archiveReady: true
  });
  assert.equal(readySummary.routingReady, true);
  assert.equal(readySummary.signatureReady, true);
  assert.equal(readySummary.readyToDeliver, true);
  assert.equal(readySummary.blockers.length, 0);
}

run()
  .then(() => {
    console.log(
      "e2e-wi0207-filing-ops-close-off-approval-routing-and-delivery-signature-bundle-baseline.test passed"
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
