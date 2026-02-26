"use client";

import { useMemo, useState } from "react";

import { buildPayrollAccuracyEvidence, type PayrollAccuracyCheckKey } from "@/components/payroll-year-end/accuracy-evidence";
import type { PayrollYearEndCopy } from "@/components/payroll-year-end/copy";
import type {
  PayrollYearEndInsuranceReconciliationReportResponse,
  PayrollYearEndRecalculationResponse,
  PayrollYearEndSettlementResponse
} from "@/components/payroll-year-end/types";

type PayrollAccuracyEvidencePanelProps = {
  locale: "ko" | "en";
  copy: PayrollYearEndCopy;
  settlement: PayrollYearEndSettlementResponse | null;
  recalculation: PayrollYearEndRecalculationResponse | null;
  insuranceReconciliationReport: PayrollYearEndInsuranceReconciliationReportResponse | null;
};

export function PayrollAccuracyEvidencePanel({
  locale,
  copy,
  settlement,
  recalculation,
  insuranceReconciliationReport
}: PayrollAccuracyEvidencePanelProps) {
  const [showFailOnly, setShowFailOnly] = useState(true);

  const evidence = useMemo(
    () =>
      buildPayrollAccuracyEvidence({
        settlement,
        recalculation,
        insuranceReconciliationReport
      }),
    [insuranceReconciliationReport, recalculation, settlement]
  );

  const sortedChecks = useMemo(
    () =>
      [...evidence.checks].sort((left, right) => {
        if (left.passed === right.passed) {
          return 0;
        }
        return left.passed ? 1 : -1;
      }),
    [evidence.checks]
  );

  const visibleChecks = useMemo(
    () => (showFailOnly ? sortedChecks.filter((check) => !check.passed) : sortedChecks),
    [showFailOnly, sortedChecks]
  );

  const failOnlyActionLabel = locale === "ko" ? "실패 항목만 보기" : "Show fail only";
  const showAllActionLabel = locale === "ko" ? "전체 항목 보기" : "Show all";
  const noVisibleChecksLabel = locale === "ko" ? "현재 조건에서 표시할 검증 항목이 없습니다." : "No checks match current filter.";
  const downloadEvidenceActionLabel = locale === "ko" ? "증빙 JSON 다운로드" : "Download evidence JSON";

  function downloadEvidenceJson() {
    const now = new Date().toISOString();
    const payload = JSON.stringify(
      {
        generatedAt: now,
        filter: showFailOnly ? "fail_only" : "all",
        passCount: evidence.passCount,
        failCount: evidence.failCount,
        checkCount: evidence.checks.length,
        checks: visibleChecks
      },
      null,
      2
    );
    const blob = new Blob([payload], { type: "application/json" });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = window.document.createElement("a");
    const stamp = now.replace(/[-:]/g, "").replace(/\..+/, "").replace("T", "-");
    anchor.href = objectUrl;
    anchor.download =
      locale === "ko"
        ? `급여-정확성-증빙-${stamp}.json`
        : `payroll-accuracy-evidence-${stamp}.json`;
    window.document.body.appendChild(anchor);
    anchor.click();
    window.document.body.removeChild(anchor);
    URL.revokeObjectURL(objectUrl);
  }

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
          <div className="panel-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowFailOnly((prev) => !prev)}
            >
              {showFailOnly ? showAllActionLabel : failOnlyActionLabel}
            </button>
            <button type="button" className="btn btn-secondary" onClick={downloadEvidenceJson}>
              {downloadEvidenceActionLabel}
            </button>
          </div>
          <ul className="log-list">
            {visibleChecks.length === 0 ? (
              <li>
                <small className="muted">{noVisibleChecksLabel}</small>
              </li>
            ) : null}
            {visibleChecks.map((check) => (
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
