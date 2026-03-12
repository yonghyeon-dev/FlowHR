import type { PayrollYearEndFilingCopy } from "@/components/payroll-year-end-filing/copy";
import type {
  PayrollYearEndFilingExportResponse,
  PayrollYearEndFinalizationResponse
} from "@/components/payroll-year-end-filing/types";
import { formatKrw } from "@/components/payroll-year-end/types";

type FilingSettlementSummaryPanelsProps = {
  copy: PayrollYearEndFilingCopy;
  runtimeLocale: string;
  finalization: PayrollYearEndFinalizationResponse | null;
  filingExport: PayrollYearEndFilingExportResponse | null;
};

export default function FilingSettlementSummaryPanels(props: FilingSettlementSummaryPanelsProps) {
  const { copy, runtimeLocale, finalization, filingExport } = props;
  const blockingReasons = finalization?.settlement.blockingReasons.filter(Boolean) ?? [];
  const validationIssues = filingExport?.filingData.validation.issues.filter(Boolean) ?? [];

  return (
    <>
      <article className="panel workspace-section-card workspace-note-card v2-surface-card admin-payroll-summary-card">
        <p className="eyebrow admin-payroll-summary-eyebrow">
          {runtimeLocale.startsWith("ko") ? "정산 스냅샷" : "Settlement snapshot"}
        </p>
        <h2>{copy.finalizationPanelTitle}</h2>
        {!finalization ? (
          <p className="small">{copy.noFinalizationSummaryYet}</p>
        ) : (
          <>
            <div className="v2-stat-list admin-payroll-summary-list">
              <div className="v2-stat-row">
                <div className="v2-stat-copy">
                  <strong>{copy.canFinalizeFinalizedLabel}</strong>
                  <p>{runtimeLocale.startsWith("ko") ? "정산 가능 여부와 완료 여부를 함께 봅니다." : "Review readiness and completion together."}</p>
                </div>
                <strong>
                  {finalization.settlement.canFinalize ? copy.yesLabel : copy.noLabel} /{" "}
                  {finalization.settlement.finalized ? copy.yesLabel : copy.noLabel}
                </strong>
              </div>
              <div className="v2-stat-row">
                <div className="v2-stat-copy">
                  <strong>{copy.taxLiabilityLabel}</strong>
                  <p>{runtimeLocale.startsWith("ko") ? "연간 세액 기준" : "Annual tax position"}</p>
                </div>
                <strong>{formatKrw(finalization.settlement.settlementKrw.annualTaxLiabilityKrw, runtimeLocale)}</strong>
              </div>
              <div className="v2-stat-row">
                <div className="v2-stat-copy">
                  <strong>{copy.withholdingDeltaLabel}</strong>
                  <p>{runtimeLocale.startsWith("ko") ? "원천징수 차이" : "Withholding delta"}</p>
                </div>
                <strong>{formatKrw(finalization.settlement.settlementKrw.withholdingDeltaKrw, runtimeLocale)}</strong>
              </div>
              <div className="v2-stat-row">
                <div className="v2-stat-copy">
                  <strong>{copy.appliedDeductionLabel}</strong>
                  <p>{runtimeLocale.startsWith("ko") ? "적용된 공제 요약" : "Applied deduction total"}</p>
                </div>
                <strong>{formatKrw(finalization.settlement.deductionItemsKrw.appliedIncomeDeductionKrw, runtimeLocale)}</strong>
              </div>
            </div>
            <div className="admin-payroll-summary-detail">
              <span>{copy.blockingReasonsLabel}</span>
              <div className="admin-payroll-summary-chip-list">
                {(blockingReasons.length > 0 ? blockingReasons : [copy.dashLabel]).map((reason) => (
                  <span key={reason} className="admin-payroll-summary-chip">
                    {reason}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
      </article>

      <article className="panel workspace-section-card workspace-note-card v2-surface-card admin-payroll-summary-card">
        <p className="eyebrow admin-payroll-summary-eyebrow">
          {runtimeLocale.startsWith("ko") ? "제출 스냅샷" : "Submission snapshot"}
        </p>
        <h2>{copy.filingExportPanelTitle}</h2>
        {!filingExport ? (
          <p className="small">{copy.noExportYet}</p>
        ) : (
          <>
            <div className="v2-stat-list admin-payroll-summary-list">
              <div className="v2-stat-row">
                <div className="v2-stat-copy">
                  <strong>{copy.formatLabel}</strong>
                  <p>{runtimeLocale.startsWith("ko") ? "제출 산출물 형식" : "Package format"}</p>
                </div>
                <strong>{copy.exportFormatOptionLabels[filingExport.filingData.format] ?? filingExport.filingData.format}</strong>
              </div>
              <div className="v2-stat-row">
                <div className="v2-stat-copy">
                  <strong>{copy.validationStatusLabel}</strong>
                  <p>{copy.validationModeOptionLabels[filingExport.filingData.validationMode] ?? filingExport.filingData.validationMode}</p>
                </div>
                <strong>{copy.validationStatusOptionLabels[filingExport.filingData.validation.status] ?? filingExport.filingData.validation.status}</strong>
              </div>
              <div className="v2-stat-row">
                <div className="v2-stat-copy">
                  <strong>{copy.exportedRecordsLabel}</strong>
                  <p>{runtimeLocale.startsWith("ko") ? "포함된 제출 건수" : "Records in this package"}</p>
                </div>
                <strong>{filingExport.filingData.records.length}</strong>
              </div>
              <div className="v2-stat-row">
                <div className="v2-stat-copy">
                  <strong>{copy.taxLiabilityLabel}</strong>
                  <p>{runtimeLocale.startsWith("ko") ? "패키지 기준 세액" : "Package tax position"}</p>
                </div>
                <strong>{formatKrw(filingExport.filingData.settlementKrw.annualTaxLiabilityKrw, runtimeLocale)}</strong>
              </div>
            </div>
            <div className="admin-payroll-summary-detail">
              <span>{copy.artifactLabel}</span>
              <strong>{filingExport.filingData.artifact.fileName}</strong>
            </div>
            <div className="admin-payroll-summary-detail">
              <span>{copy.validationIssuesLabel}</span>
              <div className="admin-payroll-summary-chip-list">
                {(validationIssues.length > 0 ? validationIssues : [copy.dashLabel]).map((issue) => (
                  <span key={issue} className="admin-payroll-summary-chip">
                    {issue}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
      </article>
    </>
  );
}
