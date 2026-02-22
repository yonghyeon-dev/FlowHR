import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminLayoutSource = readUtf8("src", "app", "admin", "layout.tsx");
  const messagesSource = readUtf8("src", "lib", "i18n", "messages.ts");
  const stepRouteSource = readUtf8(
    "src",
    "app",
    "admin",
    "payroll-year-end-filing",
    "ops",
    "[step]",
    "page.tsx"
  );
  const stepPageSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "FilingOpsWorkflowStepPage.tsx"
  );
  const stepPanelSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "FilingStepPanel.tsx"
  );
  const gateCardSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "FilingGateCard.tsx"
  );
  const actionLogSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "FilingActionLog.tsx"
  );
  const exportBundleSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "FilingExportBundle.tsx"
  );
  const dashboardSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "FilingDashboard.tsx"
  );
  const contextSource = readUtf8("src", "contexts", "FilingWorkflowContext.tsx");
  const helperSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "filing-workflow-helpers.ts"
  );
  const typesSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "filing-types.ts"
  );
  const roadmapSource = readUtf8("ROADMAP.md");
  const workItemSource = readUtf8(
    "work-items",
    "WI-0217-filing-ops-flat-workflow-route-context-baseline.md"
  );
  const packageJsonSource = readUtf8("package.json");
  const lineBudgetTargets: Array<{ pathParts: string[]; max: number }> = [
    {
      pathParts: [
        "src",
        "components",
        "payroll-year-end-filing",
        "FilingDashboard.tsx"
      ],
      max: 300
    },
    {
      pathParts: [
        "src",
        "components",
        "payroll-year-end-filing",
        "FilingStepPanel.tsx"
      ],
      max: 300
    },
    {
      pathParts: [
        "src",
        "components",
        "payroll-year-end-filing",
        "FilingGateCard.tsx"
      ],
      max: 300
    },
    {
      pathParts: [
        "src",
        "components",
        "payroll-year-end-filing",
        "FilingActionLog.tsx"
      ],
      max: 300
    },
    {
      pathParts: [
        "src",
        "components",
        "payroll-year-end-filing",
        "FilingExportBundle.tsx"
      ],
      max: 300
    }
  ];

  assert.match(
    adminLayoutSource,
    /\/admin\/payroll-year-end-filing\/ops\/alert/,
    "admin nav should expose flat alert step link"
  );
  assert.match(
    adminLayoutSource,
    /\/admin\/payroll-year-end-filing\/ops\/checklist-flow/,
    "admin nav should expose flat checklist-flow step link"
  );
  assert.match(
    messagesSource,
    /admin\.nav\.yearEndFilingOpsFlatAlert/,
    "messages should include flat-step nav keys"
  );
  assert.match(
    stepRouteSource,
    /resolveFilingWorkflowStepFromSegment/,
    "step route should resolve step from path segment"
  );
  assert.match(
    stepPageSource,
    /FilingWorkflowProvider/,
    "step page should wrap content with FilingWorkflowProvider"
  );
  assert.match(stepPanelSource, /FilingGateCard/, "step panel should compose gate card");
  assert.match(stepPanelSource, /FilingActionLog/, "step panel should compose action log");
  assert.match(stepPanelSource, /FilingExportBundle/, "step panel should compose metadata bundle");
  assert.match(gateCardSource, /id="filing-workflow-gates"/, "gate card should expose panel id");
  assert.match(
    actionLogSource,
    /id="filing-workflow-action-log"/,
    "action log should expose panel id"
  );
  assert.match(
    exportBundleSource,
    /id="filing-workflow-export-bundle"/,
    "metadata bundle should expose panel id"
  );
  assert.match(
    dashboardSource,
    /id="filing-workflow-dashboard"/,
    "dashboard should expose panel id"
  );
  assert.match(
    contextSource,
    /advanceStep/,
    "workflow context should expose advanceStep action"
  );
  assert.match(typesSource, /FILING_WORKFLOW_STEPS/, "workflow types should define steps");
  assert.match(
    helperSource,
    /buildFilingOpsStepHref/,
    "workflow helpers should build flat step route href"
  );
  assert.match(roadmapSource, /WI-0217 /, "roadmap should include WI-0217 entry");
  assert.match(workItemSource, /flat workflow/i, "work-item should describe flat workflow scope");
  assert.match(workItemSource, /FilingWorkflowContext/i, "work-item should mention shared context");
  assert.match(
    packageJsonSource,
    /e2e-wi0217-filing-ops-flat-workflow-route-context-baseline\.test\.ts/,
    "package scripts should include WI-0217 regression test"
  );
  for (const target of lineBudgetTargets) {
    const source = readUtf8(...target.pathParts);
    const lineCount = source.split("\n").length;
    assert.equal(
      lineCount <= target.max,
      true,
      `${target.pathParts.join("/")} should stay within ${target.max} lines`
    );
  }

  const module = await import(
    "../../src/components/payroll-year-end-filing/filing-workflow-helpers.ts"
  );

  assert.equal(module.isFilingWorkflowStep("alert"), true);
  assert.equal(module.isFilingWorkflowStep("unknown"), false);
  assert.equal(module.resolveFilingWorkflowStepFromSegment("checklist-flow"), "checklist");
  assert.equal(module.getFilingWorkflowStepSegment("checklist"), "checklist-flow");

  const defaultGates = module.buildDefaultFilingWorkflowGates();
  assert.equal(defaultGates.handoffReady, false);
  assert.equal(defaultGates.exceptionLogClosed, false);

  const parsed = module.buildFilingWorkflowStateFromSearchParams(
    {
      get(key: string) {
        const mock = new Map<string, string>([
          ["metric", "pending"],
          ["level", "critical"],
          ["ownerRole", "manager"],
          ["ownerActorId", "MGR-0217"],
          ["value", "17"],
          ["handoffReady", "1"],
          ["exceptionLogClosed", "1"],
          ["allExceptionsResolved", "0"]
        ]);
        return mock.get(key) ?? null;
      }
    },
    "review"
  );
  assert.equal(parsed.currentStep, "review");
  assert.equal(parsed.metadata.level, "critical");
  assert.equal(parsed.metadata.value, 17);
  assert.equal(parsed.gates.handoffReady, true);
  assert.equal(parsed.gates.exceptionLogClosed, true);
  assert.equal(parsed.gates.allExceptionsResolved, false);

  const href = module.buildFilingOpsStepHref({
    step: "checklist",
    metadata: parsed.metadata,
    gates: {
      ...defaultGates,
      handoffReady: true,
      exportReady: true
    }
  });
  assert.match(
    href,
    /^\/admin\/payroll-year-end-filing\/ops\/checklist-flow\?/,
    "flat checklist route should use checklist-flow segment"
  );
  assert.match(href, /handoffReady=1/, "href should include gate flag");
  assert.match(href, /exceptionLogClosed=0/, "href should include default gate flag");
}

run()
  .then(() => {
    console.log("e2e-wi0217-filing-ops-flat-workflow-route-context-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
