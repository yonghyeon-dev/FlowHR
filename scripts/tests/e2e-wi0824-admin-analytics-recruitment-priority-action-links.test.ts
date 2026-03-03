import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const panel = readUtf8("src", "components", "admin-kpi", "AdminRecruitmentKpiPanel.tsx");
  const copy = readUtf8("src", "components", "admin-kpi", "copy.ts");
  const workItem = readUtf8("work-items", "WI-0824-admin-analytics-recruitment-priority-action-links.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(panel, /import Link from "next\/link"/);
  assert.match(panel, /resolveRecruitmentPriorityAction/);
  assert.match(panel, /snapshot\.stalledReferral7dCount > 0/);
  assert.match(panel, /snapshot\.activeReferralCount > 0/);
  assert.match(panel, /snapshot\.openOpeningCount > 0/);
  assert.match(panel, /\/admin\/recruitment\?risk=stalled_7d/);
  assert.match(panel, /\/admin\/recruitment\?stage=SUBMITTED/);
  assert.match(panel, /copy\.recruitmentPanel\.priorityActionLabel/);
  assert.match(panel, /copy\.recruitmentPanel\.quickActionsLabel/);

  assert.match(copy, /priorityActionLabel/);
  assert.match(copy, /quickActionsLabel/);
  assert.match(copy, /actionOpenRecruitmentWorkspace/);
  assert.match(copy, /actionOpenStalledQueue/);
  assert.match(copy, /actionOpenSubmittedQueue/);
  assert.match(copy, /priorityReasonStalled/);
  assert.match(copy, /priorityReasonActive/);
  assert.match(copy, /priorityReasonOpenings/);
  assert.match(copy, /priorityReasonClear/);

  const { buildRecruitmentKpiSnapshot } = await import(
    "../../src/components/admin-kpi/AdminRecruitmentKpiPanel.tsx"
  );
  const now = new Date("2026-03-03T00:00:00.000Z");
  const snapshot = buildRecruitmentKpiSnapshot(
    {
      openings: [{ status: "OPEN" }],
      referrals: [
        { stage: "SUBMITTED", updatedAt: "2026-02-20T00:00:00.000Z" },
        { stage: "HIRED", updatedAt: "2026-02-22T00:00:00.000Z" }
      ]
    },
    now
  );
  assert.equal(snapshot.openOpeningCount, 1);
  assert.equal(snapshot.activeReferralCount, 1);
  assert.equal(snapshot.stalledReferral7dCount, 1);

  assert.match(workItem, /WI-0824/i);
  assert.match(workItem, /recruitment|kpi|priority|action|link/i);
  assert.match(roadmap, /WI-0824/i);
}

run()
  .then(() => {
    console.log("e2e-wi0824-admin-analytics-recruitment-priority-action-links.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
