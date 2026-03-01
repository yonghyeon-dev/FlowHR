import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const withholdingCopy = readUtf8(
    "src",
    "components",
    "withholding-receipt",
    "copy-runtime.ts"
  );
  const payslipReceiptCopy = readUtf8(
    "src",
    "components",
    "payslip-receipts",
    "copy.ts"
  );
  const contractsCopy = readUtf8(
    "src",
    "components",
    "contracts",
    "copy.ts"
  );
  const payslipSearchSortCopy = readUtf8(
    "src",
    "app",
    "employee",
    "payslips",
    "page-locale-search-sort-copy.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0713-ko-runtime-copy-guard-finance-contracts.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  const koWithholdingTitle = "\uC6D0\uCC9C\uC9D5\uC218\uC601\uC218\uC99D";
  const koSessionOrganization = "\uC138\uC158 \uC870\uC9C1";
  const koValidationSummary = "\uAC80\uC99D \uC694\uC57D";
  const koPayslipReceiptTitle = "\uAE09\uC5EC\uBA85\uC138 \uC218\uC2E0 \uD655\uC778";
  const koFilter = "\uD544\uD130";
  const koPayslipSearch = "\uBA85\uC138\uC11C \uAC80\uC0C9";
  const koMyContracts = "\uB0B4 \uACC4\uC57D\uD568";
  const koInbox = "\uBC1B\uC740\uD568";
  const koResponse = "\uC751\uB2F5";
  const koQueryLabel = "\uAC80\uC0C9\uC5B4";
  const koSortLabel = "\uC815\uB82C";

  assert.ok(withholdingCopy.includes(`title: "${koWithholdingTitle}"`));
  assert.ok(withholdingCopy.includes(`sessionOrganizationLabel: "${koSessionOrganization}"`));
  assert.ok(withholdingCopy.includes(`validationSummaryTitle: "${koValidationSummary}"`));

  assert.ok(payslipReceiptCopy.includes(`title: "${koPayslipReceiptTitle}"`));
  assert.ok(payslipReceiptCopy.includes(`filtersTitle: "${koFilter}"`));
  assert.ok(payslipReceiptCopy.includes(`runsSearchLabel: "${koPayslipSearch}"`));

  assert.ok(contractsCopy.includes(`title: "${koMyContracts}"`));
  assert.ok(contractsCopy.includes(`inboxTitle: "${koInbox}"`));
  assert.ok(contractsCopy.includes(`responseTitle: "${koResponse}"`));

  assert.ok(payslipSearchSortCopy.includes(`queryLabel: "${koQueryLabel}"`));
  assert.ok(payslipSearchSortCopy.includes(`sortLabel: "${koSortLabel}"`));

  assert.match(workItem, /WI-0713/i);
  assert.match(workItem, /korean|copy|withholding|payslip|contracts|guard/i);
  assert.match(roadmap, /WI-0713/i);
}

run()
  .then(() => {
    console.log("e2e-wi0713-ko-runtime-copy-guard-finance-contracts.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
