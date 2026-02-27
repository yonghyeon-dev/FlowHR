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

  return (
    <>
      <article className="panel">
        <h2>{copy.finalizationPanelTitle}</h2>
        {!finalization ? (
          <p className="small">{copy.noFinalizationSummaryYet}</p>
        ) : (
          <ul className="simple-list">
            <li>
              <span>{copy.canFinalizeFinalizedLabel}</span>
              <strong>
                {finalization.settlement.canFinalize ? copy.yesLabel : copy.noLabel} /{" "}
                {finalization.settlement.finalized ? copy.yesLabel : copy.noLabel}
              </strong>
            </li>
            <li><span>{copy.finalizationIdLabel}</span><strong>{finalization.settlement.finalizationId}</strong></li>
            <li><span>{copy.settlementHashLabel}</span><strong>{finalization.settlement.settlementHash}</strong></li>
            <li>
              <span>{copy.taxLiabilityLabel}</span>
              <strong>{formatKrw(finalization.settlement.settlementKrw.annualTaxLiabilityKrw, runtimeLocale)}</strong>
            </li>
            <li>
              <span>{copy.withholdingDeltaLabel}</span>
              <strong>{formatKrw(finalization.settlement.settlementKrw.withholdingDeltaKrw, runtimeLocale)}</strong>
            </li>
            <li>
              <span>{copy.appliedDeductionLabel}</span>
              <strong>{formatKrw(finalization.settlement.deductionItemsKrw.appliedIncomeDeductionKrw, runtimeLocale)}</strong>
            </li>
            <li><span>{copy.blockingReasonsLabel}</span><strong>{finalization.settlement.blockingReasons.join(" | ") || copy.dashLabel}</strong></li>
          </ul>
        )}
      </article>

      <article className="panel">
        <h2>{copy.filingExportPanelTitle}</h2>
        {!filingExport ? (
          <p className="small">{copy.noExportYet}</p>
        ) : (
          <ul className="simple-list">
            <li><span>{copy.finalizationIdLabel}</span><strong>{filingExport.filingData.finalizationId}</strong></li>
            <li><span>{copy.settlementHashLabel}</span><strong>{filingExport.filingData.settlementHash}</strong></li>
            <li><span>{copy.formatLabel}</span><strong>{copy.exportFormatOptionLabels[filingExport.filingData.format] ?? filingExport.filingData.format}</strong></li>
            <li><span>{copy.validationModeDisplayLabel}</span><strong>{copy.validationModeOptionLabels[filingExport.filingData.validationMode] ?? filingExport.filingData.validationMode}</strong></li>
            <li><span>{copy.validationStatusLabel}</span><strong>{copy.validationStatusOptionLabels[filingExport.filingData.validation.status] ?? filingExport.filingData.validation.status}</strong></li>
            <li><span>{copy.exportedRecordsLabel}</span><strong>{filingExport.filingData.records.length}</strong></li>
            <li>
              <span>{copy.taxLiabilityLabel}</span>
              <strong>{formatKrw(filingExport.filingData.settlementKrw.annualTaxLiabilityKrw, runtimeLocale)}</strong>
            </li>
            <li>
              <span>{copy.withholdingDeltaLabel}</span>
              <strong>{formatKrw(filingExport.filingData.settlementKrw.withholdingDeltaKrw, runtimeLocale)}</strong>
            </li>
            <li><span>{copy.csvLabel}</span><strong>{filingExport.filingData.csv ? copy.readyLabel : copy.dashLabel}</strong></li>
            <li><span>{copy.artifactLabel}</span><strong>{filingExport.filingData.artifact.fileName}</strong></li>
            <li><span>{copy.checksumLabel}</span><strong>{filingExport.filingData.artifact.checksumSha256.slice(0, 16)}...</strong></li>
            <li><span>{copy.validationIssuesLabel}</span><strong>{filingExport.filingData.validation.issues.join(" | ") || copy.dashLabel}</strong></li>
          </ul>
        )}
      </article>
    </>
  );
}
