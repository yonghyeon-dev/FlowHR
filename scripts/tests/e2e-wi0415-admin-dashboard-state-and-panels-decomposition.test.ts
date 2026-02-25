import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function countLines(source: string) {
  return source.split(/\r?\n/).length;
}

async function run() {
  const adminPage = readUtf8("src", "app", "admin", "page.tsx");
  const adminState = readUtf8("src", "app", "admin", "page-state.ts");
  const adminPanels = readUtf8("src", "app", "admin", "page-panels.tsx");
  const workItem = readUtf8("work-items", "WI-0415-admin-dashboard-state-and-panels-decomposition.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(
    adminPage,
    /import \{ AdminDashboardPanels \} from "@\/app\/admin\/page-panels";/
  );
  assert.match(adminPage, /const pageState = useAdminDashboardState\(/);
  assert.match(adminPage, /const queueDerivedState = useMemo\(/);
  assert.match(adminPage, /<AdminDashboardPanels/);
  assert.match(adminPage, /pageState=\{pageState\}/);
  assert.match(adminPage, /queueDerivedState=\{queueDerivedState\}/);
  assert.doesNotMatch(adminPage, /<section className="panel-grid">/);

  assert.match(adminState, /export function useAdminDashboardState\(/);

  assert.match(adminPanels, /export function AdminDashboardPanels\(/);
  assert.match(adminPanels, /<AdminOnboardingAccountPanels/);
  assert.match(adminPanels, /<AdminPeopleInvitePanels/);
  assert.match(adminPanels, /<AdminSchedulingPanel/);
  assert.match(adminPanels, /<ApprovalQueuePanel/);
  assert.match(adminPanels, /<AdminCompensationPanels/);
  assert.match(adminPanels, /formatDateTimeByLocale: \(value: string \| null\) => string;/);

  assert.ok(
    countLines(adminPage) <= 500,
    `admin/page.tsx must stay <= 500 lines after WI-0415 (current: ${countLines(adminPage)})`
  );
  assert.ok(
    countLines(adminState) <= 400,
    `admin/page-state.ts must stay <= 400 lines after WI-0415 (current: ${countLines(adminState)})`
  );
  assert.ok(
    countLines(adminPanels) <= 300,
    `admin/page-panels.tsx must stay <= 300 lines after WI-0415 (current: ${countLines(adminPanels)})`
  );

  assert.match(workItem, /WI-0415/i);
  assert.match(workItem, /admin|dashboard|state|panels|decomposition/i);
  assert.match(roadmap, /WI-0415/i);
}

run()
  .then(() => {
    console.log("e2e-wi0415-admin-dashboard-state-and-panels-decomposition.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
