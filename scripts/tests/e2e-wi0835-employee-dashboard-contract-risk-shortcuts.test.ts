import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const hubsSource = readUtf8("src", "components", "employee-dashboard", "workspace-hubs.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0835-employee-dashboard-contract-risk-shortcuts.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(
    hubsSource,
    /\/employee\/contracts\?status=pending_response&deadline=due_soon/
  );
  assert.match(
    hubsSource,
    /\/employee\/contracts\?status=pending_response&deadline=overdue/
  );
  assert.match(hubsSource, /계약 기한 임박/);
  assert.match(hubsSource, /계약 만료\/지연/);
  assert.match(hubsSource, /Contracts due soon/);
  assert.match(hubsSource, /Contracts overdue/);

  const { buildEmployeeWorkspaceHubs } = await import(
    "../../src/components/employee-dashboard/workspace-hubs.ts"
  );
  const koHubs = buildEmployeeWorkspaceHubs(true);
  const enHubs = buildEmployeeWorkspaceHubs(false);
  const koDocumentsHub = koHubs.find((hub) => hub.key === "documents");
  const enDocumentsHub = enHubs.find((hub) => hub.key === "documents");
  assert.ok(koDocumentsHub, "Korean documents hub should exist");
  assert.ok(enDocumentsHub, "English documents hub should exist");
  assert.ok(
    koDocumentsHub?.secondaryLinks.some((link) =>
      link.href.includes("status=pending_response&deadline=due_soon")
    )
  );
  assert.ok(
    koDocumentsHub?.secondaryLinks.some((link) =>
      link.href.includes("status=pending_response&deadline=overdue")
    )
  );
  assert.ok(
    enDocumentsHub?.secondaryLinks.some((link) =>
      link.href.includes("status=pending_response&deadline=due_soon")
    )
  );
  assert.ok(
    enDocumentsHub?.secondaryLinks.some((link) =>
      link.href.includes("status=pending_response&deadline=overdue")
    )
  );

  assert.match(workItem, /WI-0835/i);
  assert.match(workItem, /employee|dashboard|contract|risk|shortcut/i);
  assert.match(roadmap, /WI-0835/i);
}

run()
  .then(() => {
    console.log("e2e-wi0835-employee-dashboard-contract-risk-shortcuts.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
