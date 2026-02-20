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

  assert.match(payslipPage, /payslipSearchRows/, "payslip page should compute search/sort rows");
  assert.match(
    payslipPage,
    /filteredPayslipSearchRows/,
    "payslip page should compute filtered payslip search/sort rows"
  );
  assert.match(
    payslipPage,
    /payslipConfirmationPredictionCards/,
    "payslip page should compute confirmation prediction cards"
  );
  assert.match(
    payslipPage,
    /payslipMobileFollowUpCards/,
    "payslip page should compute mobile follow-up guide cards"
  );
  assert.match(payslipPage, /payslipSearchScope/, "payslip page should track search scope");
  assert.match(payslipPage, /payslipSearchQuery/, "payslip page should track search query");
  assert.match(payslipPage, /payslipSortOption/, "payslip page should track sort option");
  assert.match(
    payslipPage,
    /id="payslip-search-sort"/,
    "payslip page should expose payslip search/sort section"
  );
  assert.match(
    payslipPage,
    /id="payslip-confirmation-prediction"/,
    "payslip page should expose confirmation prediction section"
  );
  assert.match(
    payslipPage,
    /id="payslip-mobile-follow-up-guide"/,
    "payslip page should expose mobile follow-up guide section"
  );
  assert.match(
    payslipPage,
    /aria-label="payslip search and sort list"/,
    "payslip page should render search/sort list"
  );
  assert.match(
    payslipPage,
    /aria-label="payslip confirmation prediction feedback list"/,
    "payslip page should render confirmation prediction list"
  );
  assert.match(
    payslipPage,
    /aria-label="payslip mobile follow-up action guide list"/,
    "payslip page should render mobile follow-up guide list"
  );

  assert.match(
    employeeLayout,
    /\/employee\/payslips#payslip-search-sort/,
    "employee nav should include payslip search/sort anchor"
  );
  assert.match(
    employeeLayout,
    /\/employee\/payslips#payslip-confirmation-prediction/,
    "employee nav should include payslip confirmation prediction anchor"
  );
  assert.match(
    employeeLayout,
    /\/employee\/payslips#payslip-mobile-follow-up-guide/,
    "employee nav should include payslip mobile follow-up guide anchor"
  );

  assert.match(globalCss, /\.panel-payslip-search-sort/, "payslip search/sort panel style should exist");
  assert.match(globalCss, /\.payslip-search-list/, "payslip search list style should exist");
  assert.match(
    globalCss,
    /\.panel-payslip-confirmation-prediction/,
    "payslip confirmation prediction panel style should exist"
  );
  assert.match(
    globalCss,
    /\.payslip-confirmation-prediction-list/,
    "payslip confirmation prediction list style should exist"
  );
  assert.match(
    globalCss,
    /\.panel-payslip-mobile-follow-up-guide/,
    "payslip mobile follow-up panel style should exist"
  );
  assert.match(
    globalCss,
    /\.payslip-mobile-follow-up-guide-list/,
    "payslip mobile follow-up list style should exist"
  );
  assert.match(
    globalCss,
    /#payslip-search-sort \.payslip-search-list/,
    "responsive rule for payslip search list should exist"
  );
  assert.match(
    globalCss,
    /#payslip-confirmation-prediction \.payslip-confirmation-prediction-list/,
    "responsive rule for confirmation prediction list should exist"
  );
  assert.match(
    globalCss,
    /#payslip-mobile-follow-up-guide \.payslip-mobile-follow-up-guide-list/,
    "responsive rule for payslip mobile follow-up list should exist"
  );
}

run();
console.log(
  "e2e-wi0145-payslip-ux-phase3-search-sort-confirmation-prediction-mobile-follow-up-guide.test passed"
);
