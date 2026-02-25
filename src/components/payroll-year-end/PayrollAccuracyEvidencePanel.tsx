"use client";

import { useMemo } from "react";

import { buildPayrollAccuracyEvidence, type PayrollAccuracyCheckKey } from "@/components/payroll-year-end/accuracy-evidence";
import type { PayrollYearEndCopy } from "@/components/payroll-year-end/copy";
import type {
  PayrollYearEndInsuranceReconciliationReportResponse,
  PayrollYearEndRecalculationResponse,
  PayrollYearEndSettlementResponse
} from "@/components/payroll-year-end/types";

type PayrollAccuracyEvidencePanelProps = {
  copy: PayrollYearEndCopy;
  settlement: PayrollYearEndSettlementResponse | null;
  recalculation: PayrollYearEndRecalculationResponse | null;
  insuranceReconciliationReport: PayrollYearEndInsuranceReconciliationReportResponse | null;
};

export function PayrollAccuracyEvidencePanel({
  copy,
  settlement,
  recalculation,
  insuranceReconciliationReport
}: PayrollAccuracyEvidencePanelProps) {
  const evidence = useMemo(
    () =>
      buildPayrollAccuracyEvidence({
        settlement,
        recalculation,
        insuranceReconciliationReport
      }),
    [insuranceReconciliationReport, recalculation, settlement]
  );

  return (
    <article className="panel">
      <h2>{copy.accuracyEvidenceTitle}</h2>
      {evidence.checks.length === 0 ? (
        <p className="small">{copy.noAccuracyEvidenceYet}</p>
      ) : (
        <>
          <p className="small">
            {copy.accuracySummaryLabel}: {copy.accuracyPassLabel} {evidence.passCount} /{" "}
            {copy.accuracyFailLabel} {evidence.failCount}
          </p>
          <ul className="log-list">
            {evidence.checks.map((check) => (
              <li key={check.key}>
                <strong>{copy.accuracyCheckLabels[check.key as PayrollAccuracyCheckKey]}</strong>{" "}
                <span className={check.passed ? "ok" : "fail"}>
                  {check.passed ? copy.accuracyPassLabel : copy.accuracyFailLabel}
                </span>
                <br />
                <small className="muted">{check.detail}</small>
              </li>
            ))}
          </ul>
        </>
      )}
    </article>
  );
}
