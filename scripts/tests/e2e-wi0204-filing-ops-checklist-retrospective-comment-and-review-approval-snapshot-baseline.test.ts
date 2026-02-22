import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminLayoutSource = readUtf8("src", "app", "admin", "layout.tsx");
  const messagesSource = readUtf8("src", "lib", "i18n", "messages.ts");
  const reviewLoopSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingOpsChecklistReviewLoop.tsx"
  );
  const snapshotPageSource = readUtf8(
    "src",
    "app",
    "admin",
    "payroll-year-end-filing",
    "ops",
    "checklist",
    "review",
    "snapshot",
    "page.tsx"
  );
  const snapshotSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingOpsReviewApprovalSnapshot.tsx"
  );
  const snapshotCssModuleSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingOpsReviewApprovalSnapshot.module.css"
  );
  const snapshotHelperSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "filing-alert-review-approval-snapshot.ts"
  );
  const roadmapSource = readUtf8("ROADMAP.md");
  const workItemSource = readUtf8(
    "work-items",
    "WI-0204-filing-ops-checklist-retrospective-comment-and-review-approval-snapshot-baseline.md"
  );
  const packageJsonSource = readUtf8("package.json");

  assert.match(
    adminLayoutSource,
    /\/admin\/payroll-year-end-filing\/ops\/checklist\/review\/snapshot/,
    "admin nav should include review approval snapshot route"
  );
  assert.match(
    messagesSource,
    /admin\.nav\.yearEndFilingOpsChecklistReviewSnapshot/,
    "messages should include review approval snapshot nav key"
  );
  assert.match(
    reviewLoopSource,
    /Open Approval Snapshot/,
    "review loop should provide quick link to approval snapshot"
  );
  assert.match(
    reviewLoopSource,
    /buildChecklistReviewSnapshotRouteHref/,
    "review loop should use snapshot route helper"
  );
  assert.match(
    snapshotPageSource,
    /PayrollYearEndFilingOpsReviewApprovalSnapshot/,
    "snapshot page should render dedicated component"
  );
  assert.match(
    snapshotSource,
    /id="filing-alert-review-approval-snapshot"/,
    "snapshot component should expose root section id"
  );
  assert.match(
    snapshotSource,
    /id="filing-alert-retrospective-comments"/,
    "snapshot component should expose retrospective panel id"
  );
  assert.match(
    snapshotSource,
    /id="filing-alert-review-approval-grid"/,
    "snapshot component should expose approval grid panel id"
  );
  assert.match(
    snapshotSource,
    /aria-label="filing retrospective comment list"/,
    "snapshot should expose retrospective comment list aria-label"
  );
  assert.match(
    snapshotSource,
    /aria-label="filing review approval snapshot list"/,
    "snapshot should expose review approval list aria-label"
  );
  assert.match(
    snapshotCssModuleSource,
    /\.snapshotContextGrid/,
    "snapshot css module should include context grid style"
  );
  assert.match(
    snapshotCssModuleSource,
    /\.approvalRow/,
    "snapshot css module should include approval row style"
  );
  assert.match(
    snapshotHelperSource,
    /summarizeReviewApprovalSnapshot/,
    "snapshot helper should expose deterministic summary function"
  );
  assert.match(
    roadmapSource,
    /> \*\*Current version\*\*: 0\.1\.\d+/,
    "roadmap should expose current version header"
  );
  assert.match(roadmapSource, /WI-0204 /, "roadmap should include WI-0204 entry");
  assert.match(workItemSource, /retrospective/i, "work-item should include retrospective scope");
  assert.match(workItemSource, /approval snapshot/i, "work-item should include approval snapshot scope");
  assert.match(
    packageJsonSource,
    /e2e-wi0204-filing-ops-checklist-retrospective-comment-and-review-approval-snapshot-baseline\.test\.ts/,
    "package scripts should include WI-0204 regression test"
  );

  const snapshotModule = await import(
    "../../src/components/payroll-year-end-filing/filing-alert-review-approval-snapshot.ts"
  );

  const snapshotHref = snapshotModule.buildChecklistReviewSnapshotRouteHref({
    metric: "validationFail",
    level: "critical",
    value: 5,
    ownerRole: "manager",
    ownerActorId: "MGR-0204"
  });
  assert.match(
    snapshotHref,
    /^\/admin\/payroll-year-end-filing\/ops\/checklist\/review\/snapshot\?/,
    "snapshot helper should build dedicated snapshot route"
  );
  assert.match(snapshotHref, /metric=validationFail/, "snapshot href should include metric");
  assert.match(snapshotHref, /ownerActorId=MGR-0204/, "snapshot href should include owner actor");

  const comment = snapshotModule.buildRetrospectiveCommentEntry({
    category: "risk",
    comment: "  retry coverage should be expanded  ",
    actorId: "QA-0204",
    now: new Date("2026-02-22T11:30:00.000Z")
  });
  assert.equal(comment.commentId, "risk:QA-0204:2026-02-22T11:30:00.000Z");
  assert.equal(comment.comment, "retry coverage should be expanded");

  const baseEntries = [
    { role: "payroll_operator", decision: "pending", actorId: "", note: "", decidedAt: null },
    { role: "manager", decision: "pending", actorId: "", note: "", decidedAt: null },
    { role: "admin", decision: "pending", actorId: "", note: "", decidedAt: null }
  ] as const;

  const afterOperatorApprove = snapshotModule.applyReviewApprovalDecision({
    entries: baseEntries,
    role: "payroll_operator",
    decision: "approved",
    actorId: "PAY-0204",
    note: "queue checks done",
    now: new Date("2026-02-22T11:45:00.000Z")
  });
  assert.equal(afterOperatorApprove[0].decision, "approved");
  assert.equal(afterOperatorApprove[0].actorId, "PAY-0204");
  assert.equal(afterOperatorApprove[0].decidedAt, "2026-02-22T11:45:00.000Z");

  const summaryWithPending = snapshotModule.summarizeReviewApprovalSnapshot(afterOperatorApprove);
  assert.equal(summaryWithPending.totalCount, 3);
  assert.equal(summaryWithPending.approvedCount, 1);
  assert.equal(summaryWithPending.pendingCount, 2);
  assert.equal(summaryWithPending.readyToClose, false);

  const allApproved = [
    { role: "payroll_operator", decision: "approved", actorId: "PAY-0204", note: "", decidedAt: "2026-02-22T11:45:00.000Z" },
    { role: "manager", decision: "approved", actorId: "MGR-0204", note: "", decidedAt: "2026-02-22T11:50:00.000Z" },
    { role: "admin", decision: "approved", actorId: "ADM-0204", note: "", decidedAt: "2026-02-22T11:55:00.000Z" }
  ] as const;
  const closeReadySummary = snapshotModule.summarizeReviewApprovalSnapshot(allApproved);
  assert.equal(closeReadySummary.approvedCount, 3);
  assert.equal(closeReadySummary.reworkCount, 0);
  assert.equal(closeReadySummary.pendingCount, 0);
  assert.equal(closeReadySummary.readyToClose, true);
}

run()
  .then(() => {
    console.log("e2e-wi0204-filing-ops-checklist-retrospective-comment-and-review-approval-snapshot-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
