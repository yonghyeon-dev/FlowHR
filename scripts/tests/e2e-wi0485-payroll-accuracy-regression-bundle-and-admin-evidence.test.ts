import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { buildPayrollAccuracyEvidence } from "@/components/payroll-year-end/accuracy-evidence";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const yearEndConsoleSource = readUtf8(
    "src",
    "components",
    "payroll-year-end",
    "PayrollYearEndConsole.tsx"
  );
  const yearEndCopySource = readUtf8("src", "components", "payroll-year-end", "copy.ts");
  const workItemSource = readUtf8(
    "work-items",
    "WI-0485-payroll-accuracy-regression-bundle-and-admin-evidence.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  const settlement = {
    summary: {
      annualTotalsKrw: {
        grossPayKrw: 1_000_000,
        withholdingTaxKrw: 100_000,
        socialInsuranceKrw: 50_000,
        otherDeductionsKrw: 10_000,
        totalDeductionsKrw: 160_000,
        netPayKrw: 840_000
      },
      settlementKrw: {
        annualTaxLiabilityKrw: 120_000,
        priorWithheldTaxKrw: 100_000,
        withholdingDeltaKrw: 20_000,
        additionalWithholdingDueKrw: 20_000,
        withholdingRefundKrw: 0,
        totalTaxCreditAppliedKrw: 30_000,
        taxCreditAppliedByItemKrw: {
          earnedIncomeTaxCreditKrw: {
            inputKrw: 20_000,
            capKrw: 20_000,
            appliedKrw: 20_000,
            capped: false,
            applicationReasonCode: "APPLIED_AS_ENTERED"
          },
          childTaxCreditKrw: {
            inputKrw: 10_000,
            capKrw: 10_000,
            appliedKrw: 10_000,
            capped: false,
            applicationReasonCode: "APPLIED_AS_ENTERED"
          },
          additionalTaxCreditKrw: {
            inputKrw: 0,
            capKrw: 0,
            appliedKrw: 0,
            capped: false,
            applicationReasonCode: "NO_INPUT"
          }
        }
      }
    }
  } as const;

  const recalculation = {
    recalculation: {
      deductionItemsKrw: {
        taxableAnnualIncomeBeforeDeductionKrw: 1_000_000,
        appliedIncomeDeductionKrw: 100_000,
        taxableAnnualIncomeAfterDeductionKrw: 900_000
      },
      baselineSettlementKrw: {
        annualTaxLiabilityKrw: 120_000,
        withholdingDeltaKrw: 20_000
      },
      recalculatedSettlementKrw: {
        annualTaxLiabilityKrw: 100_000,
        withholdingDeltaKrw: 0
      },
      deltaKrw: {
        annualTaxLiabilityDeltaKrw: -20_000,
        withholdingDeltaChangeKrw: -20_000,
        taxableIncomeReductionKrw: 100_000
      }
    }
  } as const;

  const insuranceReconciliationReport = {
    report: {
      annualRunSocialInsuranceKrw: 120_000,
      finalization: {
        finalized: true
      },
      reconciliation: {
        status: "matched",
        deltaKrw: 0
      },
      monthlyBreakdown: [
        { socialInsuranceKrw: 50_000 },
        { socialInsuranceKrw: 70_000 }
      ]
    }
  } as const;

  const passEvidence = buildPayrollAccuracyEvidence({
    settlement: settlement as never,
    recalculation: recalculation as never,
    insuranceReconciliationReport: insuranceReconciliationReport as never
  });
  assert.ok(passEvidence.checks.length >= 10);
  assert.equal(passEvidence.failCount, 0);

  const failEvidence = buildPayrollAccuracyEvidence({
    settlement: {
      ...settlement,
      summary: {
        ...settlement.summary,
        annualTotalsKrw: {
          ...settlement.summary.annualTotalsKrw,
          netPayKrw: 999_999
        }
      }
    } as never,
    recalculation: null,
    insuranceReconciliationReport: null
  });
  const grossNetBalance = failEvidence.checks.find((check) => check.key === "gross_net_balance");
  assert.ok(grossNetBalance);
  assert.equal(grossNetBalance?.passed, false);

  assert.match(yearEndConsoleSource, /<PayrollAccuracyEvidencePanel/);
  assert.match(yearEndCopySource, /accuracyEvidenceTitle:/);
  assert.match(yearEndCopySource, /계산 정확성 증빙/);
  assert.match(yearEndCopySource, /Calculation Accuracy Evidence/);

  assert.match(workItemSource, /WI-0485/i);
  assert.match(workItemSource, /accuracy|evidence|payroll|year-end/i);
  assert.match(roadmap, /WI-0485/i);
}

run()
  .then(() => {
    console.log("e2e-wi0485-payroll-accuracy-regression-bundle-and-admin-evidence.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
