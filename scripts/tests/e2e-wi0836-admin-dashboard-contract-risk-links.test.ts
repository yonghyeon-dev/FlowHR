import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const hubsSource = readUtf8("src", "app", "admin", "page-workspace-hubs.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0836-admin-dashboard-contract-risk-links.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(hubsSource, /공지\/복리후생\/채용\/계약/);
  assert.match(hubsSource, /Notices, benefits, recruitment, contracts/);
  assert.match(hubsSource, /\/admin\/contracts\?slaRisk=OVERDUE/);
  assert.match(hubsSource, /\/admin\/contracts\?status=SENT/);
  assert.match(hubsSource, /계약 SLA 초과/);
  assert.match(hubsSource, /계약 응답 대기/);
  assert.match(hubsSource, /Contract SLA overdue/);
  assert.match(hubsSource, /Contract pending responses/);

  const { buildAdminWorkspaceHubs } = await import(
    "../../src/app/admin/page-workspace-hubs.ts"
  );
  const koHubs = buildAdminWorkspaceHubs(true);
  const enHubs = buildAdminWorkspaceHubs(false);
  const koCommunicationHub = koHubs.find((hub) => hub.key === "communication");
  const enCommunicationHub = enHubs.find((hub) => hub.key === "communication");
  assert.ok(koCommunicationHub, "Korean communication hub should exist");
  assert.ok(enCommunicationHub, "English communication hub should exist");
  assert.ok(
    koCommunicationHub?.links.some((link) =>
      link.href.includes("/admin/contracts?slaRisk=OVERDUE")
    )
  );
  assert.ok(
    koCommunicationHub?.links.some((link) =>
      link.href.includes("/admin/contracts?status=SENT")
    )
  );
  assert.ok(
    enCommunicationHub?.links.some((link) =>
      link.href.includes("/admin/contracts?slaRisk=OVERDUE")
    )
  );
  assert.ok(
    enCommunicationHub?.links.some((link) =>
      link.href.includes("/admin/contracts?status=SENT")
    )
  );

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
