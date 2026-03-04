import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const payslipsPage = readUtf8("src", "app", "employee", "payslips", "page.tsx");
  const payslipsApi = readUtf8("src", "app", "employee", "payslips", "use-payslip-api.ts");
  const payslipsFilterPanel = readUtf8(
    "src",
    "app",
    "employee",
    "payslips",
    "page-view-filter-panel.tsx"
  );
  const yearEndConsole = readUtf8(
    "src",
    "components",
    "payroll-year-end",
    "EmployeeYearEndInputConsole.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0892-employee-pay-self-service-production-session-gate-completion.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(
    payslipsPage,
    /const allowHeaderActorFallback = showDevTools \|\| !isProductionRuntime;/
  );
  assert.match(
    payslipsPage,
    /const requiresLoginSession = isProductionRuntime && !usesBearerToken && !showDevTools;/
  );
  assert.match(payslipsPage, /allowHeaderActorFallback,/);
  assert.match(payslipsPage, /requiresLoginSession,/);
  assert.match(payslipsPage, /productionSessionRequiredNotice,/);
  assert.match(payslipsPage, /requiresLoginSession=\{requiresLoginSession\}/);
  assert.match(
    payslipsPage,
    /productionSessionRequiredNotice=\{productionSessionRequiredNotice\}/
  );
  assert.match(payslipsPage, /if \(requiresLoginSession\) \{\s*return;\s*\}/);

  assert.match(payslipsApi, /allowHeaderActorFallback: boolean;/);
  assert.match(payslipsApi, /requiresLoginSession: boolean;/);
  assert.match(payslipsApi, /productionSessionRequiredNotice: string;/);
  assert.match(payslipsApi, /\} else if \(allowHeaderActorFallback\) \{/);
  assert.match(payslipsApi, /if \(requiresLoginSession\) \{/);
  assert.match(payslipsApi, /reason: "requires_login_session"/);

  assert.match(payslipsFilterPanel, /requiresLoginSession: boolean;/);
  assert.match(payslipsFilterPanel, /productionSessionRequiredNotice: string;/);
  assert.match(
    payslipsFilterPanel,
    /\{productionSessionRequiredNotice\} <Link href="\/login">\/login<\/Link>/
  );
  assert.match(payslipsFilterPanel, /disabled=\{requiresLoginSession\}/);
  assert.match(
    payslipsFilterPanel,
    /disabled=\{!hasRuns \|\| requiresLoginSession\}/
  );

  assert.match(
    yearEndConsole,
    /const allowHeaderActorFallback = showDevTools \|\| !isProductionRuntime;/
  );
  assert.match(
    yearEndConsole,
    /const requiresLoginSession = isProductionRuntime && !usesBearerToken && !showDevTools;/
  );
  assert.match(yearEndConsole, /\} else if \(allowHeaderActorFallback\) \{/);
  assert.match(
    yearEndConsole,
    /if \(requiresLoginSession\) \{\s*setStatusMessage\(productionSessionRequiredNotice\);\s*return;\s*\}/
  );
  assert.match(
    yearEndConsole,
    /\{productionSessionRequiredNotice\} <Link href="\/login">\/login<\/Link>/
  );
  assert.match(
    yearEndConsole,
    /disabled=\{pendingLabel !== null \|\| !coreLoadValid \|\| requiresLoginSession\}/
  );

  assert.match(workItem, /WI-0892/i);
  assert.match(
    workItem,
    /employee|payslips|year-end|production|session|login|devtools/i
  );
  assert.match(roadmap, /WI-0892/i);
}

run()
  .then(() => {
    console.log(
      "e2e-wi0892-employee-pay-self-service-production-session-gate-completion.test passed"
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
