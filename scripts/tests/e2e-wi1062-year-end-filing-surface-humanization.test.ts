import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const yearEndConsole = readUtf8("src", "components", "payroll-year-end", "PayrollYearEndConsole.tsx");
  const preflightConsole = readUtf8("src", "components", "payroll-year-end", "PayrollYearEndPreflightConsole.tsx");
  const employeeYearEndConsole = readUtf8(
    "src",
    "components",
    "payroll-year-end",
    "EmployeeYearEndInputConsole.tsx"
  );
  const filingSummaryPanels = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "FilingSettlementSummaryPanels.tsx"
  );
  const filingPreflightPanel = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "FilingPreflightBlockerPanel.tsx"
  );
  const filingTimelinePanel = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "FilingSubmissionTimelinePanel.tsx"
  );
  const filingValueHelpers = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "value-helpers.ts"
  );
  const filingConsole = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingConsole.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-1062-year-end-filing-surface-humanization.md"
  );
  const progress = readUtf8("docs", "production-operating-progress.md");
  const gapInventory = readUtf8("docs", "production-gap-inventory.md");

  assert.doesNotMatch(yearEndConsole, /copy\.inputVectorHashLabel/, "year-end summary must not render raw input hash rows");
  assert.doesNotMatch(yearEndConsole, /copy\.finalizationHashLabel/, "insurance reconciliation must not render raw finalization/hash rows");
  assert.doesNotMatch(preflightConsole, /copy\.settlementHashLabel/, "preflight summary must not render raw settlement hash");

  assert.doesNotMatch(
    employeeYearEndConsole,
    /setStatusMessage\(`\$\{copy\.loadedStatusPrefix\} \$\{body\.settlement\.finalizationId\}`\)/,
    "employee year-end load status must not append raw finalization id"
  );
  assert.doesNotMatch(
    employeeYearEndConsole,
    /copy\.summaryFinalization/,
    "employee year-end simulation summary must not render raw finalization id"
  );

  assert.doesNotMatch(filingSummaryPanels, /copy\.finalizationIdLabel/, "filing summaries must not render raw finalization id rows");
  assert.doesNotMatch(filingSummaryPanels, /copy\.settlementHashLabel/, "filing summaries must not render raw settlement hash rows");
  assert.doesNotMatch(filingSummaryPanels, /copy\.checksumLabel/, "filing summaries must not render raw checksum rows");

  assert.doesNotMatch(filingPreflightPanel, /copySettlementHash/, "preflight blocker panel must not expose settlement-hash copy action");
  assert.doesNotMatch(filingPreflightPanel, /copy\.settlementHashLabel/, "preflight blocker panel must not render settlement hash");

  assert.doesNotMatch(filingTimelinePanel, /entry\.submissionId/, "filing timeline must not print raw submission ids");
  assert.doesNotMatch(filingValueHelpers, /entry\.ackCode/, "filing timeline formatter must not print raw ack codes");

  assert.doesNotMatch(
    filingConsole,
    /statusSubmittedPrefix\} \$\{body\.submission\.submissionId\}/,
    "filing submit status must not append raw submission id"
  );
  assert.doesNotMatch(
    filingConsole,
    /statusAcknowledgedPrefix\} \$\{body\.submission\.submissionId\}/,
    "filing acknowledge status must not append raw submission id"
  );
  assert.doesNotMatch(
    filingConsole,
    /statusAddedEvidencePrefix\} \$\{body\.evidenceNote\.submissionId\}/,
    "evidence note status must not append raw submission id"
  );
  assert.doesNotMatch(
    filingConsole,
    /submission\.submissionId} \/ /,
    "filing submission list must not print raw submission ids in the visible summary line"
  );
  assert.doesNotMatch(
    filingConsole,
    /submission\.ack\.ackCode/,
    "filing submission list must not print raw ack codes in the visible summary line"
  );
  assert.doesNotMatch(
    filingConsole,
    /submission\.ack\.rejectionReasonCode/,
    "filing submission list must not print raw rejection reason codes in the visible summary line"
  );

  assert.match(workItem, /WI-1062/i);
  assert.match(progress, /WI-1062/i);
  assert.match(gapInventory, /WI-1062/i);
}

run()
  .then(() => {
    console.log("e2e-wi1062-year-end-filing-surface-humanization.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
