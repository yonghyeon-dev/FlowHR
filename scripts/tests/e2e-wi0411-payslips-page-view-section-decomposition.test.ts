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
  const payslipPage = readUtf8("src", "app", "employee", "payslips", "page.tsx");
  const payslipView = readUtf8("src", "app", "employee", "payslips", "page-view.tsx");
  const sharedSections = readUtf8(
    "src",
    "app",
    "employee",
    "payslips",
    "page-view-shared-sections.tsx"
  );
  const detailPanel = readUtf8("src", "app", "employee", "payslips", "page-view-detail-panel.tsx");
  const workItem = readUtf8("work-items", "WI-0411-payslips-page-view-section-decomposition.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(payslipPage, /import \{ EmployeePayslipsPageView \} from "@\/app\/employee\/payslips\/page-view";/);

  assert.match(payslipView, /import \{ PayslipDetailPanel \} from "@\/app\/employee\/payslips\/page-view-detail-panel";/);
  assert.match(payslipView, /import \{\s*PayslipComparePanelContent,\s*PayslipSearchSortPanelContent,\s*PayslipStatusFeedbackPanelContent/);
  assert.match(payslipView, /id="payslip-search-sort"/);
  assert.match(payslipView, /id="status-feedback"/);
  assert.match(payslipView, /id="compare-view"/);
  assert.match(payslipView, /resolvePayslipRunStateLabel\(selectedRun\.state, isKoLocale\)/);
  assert.match(payslipView, /formatKrw\(selectedRun\.netPayKrw\)/);
  assert.match(payslipView, /const compareInsightClassName = "payslip-compare-insight";/);

  assert.match(sharedSections, /export function PayslipSearchSortPanelContent/);
  assert.match(sharedSections, /export function PayslipStatusFeedbackPanelContent/);
  assert.match(sharedSections, /export function PayslipComparePanelContent/);
  assert.match(sharedSections, /className=\{compareInsightClassName\}/);

  assert.match(detailPanel, /export function PayslipDetailPanel/);
  assert.match(detailPanel, /window\.print\(\)/);
  assert.match(detailPanel, /className="payslip-sheet"/);
  assert.match(detailPanel, /selectedRunStateLabel/);
  assert.match(detailPanel, /selectedRunNetPayText/);

  assert.ok(countLines(payslipView) < 500, `page-view.tsx must stay under 500 lines (current: ${countLines(payslipView)})`);
  assert.ok(
    countLines(sharedSections) <= 300,
    `page-view-shared-sections.tsx must stay <= 300 lines (current: ${countLines(sharedSections)})`
  );
  assert.ok(
    countLines(detailPanel) <= 300,
    `page-view-detail-panel.tsx must stay <= 300 lines (current: ${countLines(detailPanel)})`
  );

  assert.match(workItem, /WI-0411/i);
  assert.match(workItem, /payslip|page-view|decomposition|section/i);
  assert.match(roadmap, /WI-0411/i);
}

run()
  .then(() => {
    console.log("e2e-wi0411-payslips-page-view-section-decomposition.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
