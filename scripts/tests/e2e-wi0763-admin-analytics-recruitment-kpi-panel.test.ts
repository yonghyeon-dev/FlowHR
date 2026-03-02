import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const dashboard = readUtf8("src", "components", "admin-kpi", "AdminKpiDashboard.tsx");
  const copy = readUtf8("src", "components", "admin-kpi", "copy.ts");
  const panel = readUtf8("src", "components", "admin-kpi", "AdminRecruitmentKpiPanel.tsx");
  const workItem = readUtf8("work-items", "WI-0763-admin-analytics-recruitment-kpi-panel.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(dashboard, /AdminRecruitmentKpiPanel/);
  assert.match(dashboard, /loadRecruitmentKpi/);
  assert.match(dashboard, /analyticsMode && recruitmentKpi/);

  assert.match(copy, /recruitmentPanel/);
  assert.match(copy, /openOpeningCount/);
  assert.match(copy, /activeReferralCount/);
  assert.match(copy, /stalledReferral7dCount/);

  assert.match(panel, /buildRecruitmentKpiSnapshot/);
  assert.match(panel, /isRecruitmentReferralTerminalStage/);
  assert.match(panel, /stalledThresholdMs = 7 \* 24 \* 60 \* 60 \* 1000/);

  const { buildRecruitmentKpiSnapshot } = await import(
    "../../src/components/admin-kpi/AdminRecruitmentKpiPanel.tsx"
  );
  const now = new Date("2026-03-02T00:00:00.000Z");
  const snapshot = buildRecruitmentKpiSnapshot(
    {
      openings: [
        { status: "OPEN" },
        { status: "CLOSED" },
        { status: "OPEN" }
      ],
      referrals: [
        { stage: "SUBMITTED", updatedAt: "2026-02-20T00:00:00.000Z" },
        { stage: "INTERVIEW", updatedAt: "2026-02-28T00:00:00.000Z" },
        { stage: "HIRED", updatedAt: "2026-02-10T00:00:00.000Z" },
        { stage: "REJECTED", updatedAt: "2026-02-01T00:00:00.000Z" }
      ]
    },
    now
  );
  assert.equal(snapshot.openOpeningCount, 2);
  assert.equal(snapshot.activeReferralCount, 2);
  assert.equal(snapshot.stalledReferral7dCount, 1);

  assert.match(workItem, /WI-0763/i);
  assert.match(workItem, /admin|analytics|recruitment|kpi|panel/i);
  assert.match(roadmap, /WI-0763/i);
}

run()
  .then(() => {
    console.log("e2e-wi0763-admin-analytics-recruitment-kpi-panel.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
