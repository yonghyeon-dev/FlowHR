import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const hubsSource = readUtf8("src", "app", "admin", "page-workspace-hubs.ts");
  const workItem = readUtf8("work-items", "WI-0836-admin-dashboard-contract-risk-links.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(hubsSource, /\/admin\/contracts\?decisionQueueOnly=true/);
  assert.match(hubsSource, /\/admin\/contracts\?slaRisk=OVERDUE/);
  assert.match(hubsSource, /\/admin\/contracts\?status=SENT/);
  assert.match(hubsSource, /계약 SLA 초과/);
  assert.match(hubsSource, /계약 응답 대기/);
  assert.match(hubsSource, /Contract SLA overdue/);
  assert.match(hubsSource, /Contract pending responses/);

  const { buildAdminWorkspaceHubs } = await import("../../src/app/admin/page-workspace-hubs.ts");
  const t = (key: string) => key;
  const koHubs = buildAdminWorkspaceHubs("ko", t);
  const enHubs = buildAdminWorkspaceHubs("en", t);
  const koContractsHub = koHubs.find((hub) =>
    hub.links.some((link) => link.href.includes("/admin/contracts?decisionQueueOnly=true"))
  );
  const enContractsHub = enHubs.find((hub) =>
    hub.links.some((link) => link.href.includes("/admin/contracts?decisionQueueOnly=true"))
  );

  assert.ok(koContractsHub, "Korean admin hub should keep contract risk links");
  assert.ok(enContractsHub, "English admin hub should keep contract risk links");
  assert.ok(koContractsHub?.links.some((link) => link.href.includes("/admin/contracts?slaRisk=OVERDUE")));
  assert.ok(koContractsHub?.links.some((link) => link.href.includes("/admin/contracts?status=SENT")));
  assert.ok(enContractsHub?.links.some((link) => link.href.includes("/admin/contracts?slaRisk=OVERDUE")));
  assert.ok(enContractsHub?.links.some((link) => link.href.includes("/admin/contracts?status=SENT")));

  assert.match(workItem, /WI-0836/i);
  assert.match(workItem, /admin|dashboard|contract|risk|link/i);
  assert.match(roadmap, /WI-0836/i);
}

run()
  .then(() => {
    console.log("e2e-wi0836-admin-dashboard-contract-risk-links.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
