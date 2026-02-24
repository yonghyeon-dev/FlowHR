import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { PreviewPayrollWithDeductionsInput } from "@/features/payroll/service-input-types";
import { calculateStatutoryKrBaselineDeductionPreview } from "@/features/payroll/service-deduction-statutory-preview-helpers";
import { formatKrw } from "@/components/withholding-receipt/types";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const workItem = readUtf8("work-items", "WI-0364-year-end-accuracy-regression-bundle.md");
  const roadmap = readUtf8("ROADMAP.md");

  const input: PreviewPayrollWithDeductionsInput = {
    periodStart: new Date("2025-01-01T00:00:00+09:00"),
    periodEnd: new Date("2025-01-31T23:59:59+09:00"),
    employeeId: "EMP-1001",
    hourlyRateKrw: 12000,
    multipliers: {
      regular: 1,
      overtime: 1.5,
      night: 1.5,
      holiday: 1.5
    },
    deductionMode: "statutory_kr_baseline",
    statutory: {
      nonTaxableIncomeKrw: 500_000,
      additionalTaxCreditKrw: 0,
      dependentCount: 0,
      dependentTaxCreditPerPersonKrw: 0,
      requireMonthlyBoundary: true,
      incomeTaxRate: 0.03,
      localIncomeTaxRate: 0.1,
      nationalPensionRate: 0.045,
      healthInsuranceRate: 0.03545,
      longTermCareRateOnHealth: 0.1295,
      employmentInsuranceRate: 0.009,
      otherDeductionsKrw: 10_000
    }
  };

  const result = calculateStatutoryKrBaselineDeductionPreview(input, 5_000_000);
  assert.equal(result.withholdingTaxKrw, 148_500);
  assert.equal(result.socialInsuranceKrw, 423_183);
  assert.equal(result.otherDeductionsKrw, 10_000);

  const additional = result.additionalBreakdown as Record<string, unknown>;
  const incomeSplit = additional.incomeSplitKrw as { taxableIncomeKrw: number };
  assert.equal(incomeSplit.taxableIncomeKrw, 4_500_000);

  const components = additional.components as { localIncomeTaxKrw: number };
  assert.equal(components.localIncomeTaxKrw, 13_500);

  assert.equal(formatKrw(1_234_567, "de-DE"), "1.234.567 KRW");
  assert.equal(formatKrw(1_234_567, "en-US"), "1,234,567 KRW");

  assert.match(workItem, /WI-0364/i);
  assert.match(workItem, /accuracy/i);
  assert.match(roadmap, /WI-0364/i);
}

run()
  .then(() => {
    console.log("e2e-wi0364-year-end-accuracy-regression-bundle.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
