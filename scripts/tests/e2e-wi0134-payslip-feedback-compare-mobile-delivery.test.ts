import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
}

function run() {
  const payslipPage = readUtf8("src", "app", "employee", "payslips", "page.tsx");
  const employeeLayout = readUtf8("src", "app", "employee", "layout.tsx");
  const globalCss = readUtf8("src", "app", "globals.css");

  assert.match(payslipPage, /id="status-feedback"/, "payslip page should include status feedback panel");
  assert.match(payslipPage, /id="compare-view"/, "payslip page should include compare view panel");
  assert.doesNotMatch(payslipPage, /id="mobile-delivery"/, "payslip page should remove mobile delivery panel");
  assert.match(payslipPage, /latestFailedLog/, "payslip page should compute latest failure log");
  assert.match(payslipPage, /compareMetrics/, "payslip page should compute compare metrics");
  assert.match(payslipPage, /copyLatestFailureCause/, "payslip page should support failure-cause copy action");
  assert.match(payslipPage, /copyCompareSnapshot/, "payslip page should support compare snapshot copy action");
  assert.doesNotMatch(payslipPage, /sendMobileDeliverySimulation/, "mobile delivery simulation should be removed");

  assert.match(
    employeeLayout,
    /\/employee\/payslips#status-feedback/,
    "employee nav should include payslip status feedback anchor"
  );
  assert.match(
    employeeLayout,
    /\/employee\/payslips#compare-view/,
    "employee nav should include payslip compare anchor"
  );
  assert.doesNotMatch(
    employeeLayout,
    /\/employee\/payslips#mobile-delivery/,
    "employee nav should remove payslip mobile delivery anchor"
  );

  assert.match(globalCss, /\.panel-payslip-status-feedback/, "status feedback panel style should exist");
  assert.match(globalCss, /\.payslip-status-grid/, "status feedback grid style should exist");
  assert.match(globalCss, /\.payslip-compare-delta-grid/, "compare delta grid style should exist");
  assert.match(globalCss, /#status-feedback \.payslip-status-grid/, "status feedback mobile responsive style should exist");
  assert.match(globalCss, /#compare-view \.payslip-compare-delta-grid/, "compare mobile responsive style should exist");
}

run();
console.log("e2e-wi0134-payslip-feedback-compare-mobile-delivery.test passed");
