import Link from "next/link";

import type {
  ApiLog,
  FinalizedYearEndSettlementResponse,
  WithholdingReceiptDocumentResponse,
  WithholdingReceiptResponse
} from "@/components/withholding-receipt/types";

type WithholdingSummaryPanelProps = {
  title: string;
  copy: {
    noReceiptSummary: string;
    noFinalizedSettlement: string;
    noIssuedDocument: string;
    receiptNumberLabel: string;
    canIssueIssuedLabel: string;
    grossNetLabel: string;
    withholdingSocialLabel: string;
    pendingReceiptRunsLabel: string;
    blockingReasonsLabel: string;
    finalizationIdLabel: string;
    finalizedAtLabel: string;
    settlementHashLabel: string;
    taxLiabilityLabel: string;
    priorWithheldLabel: string;
    withholdingDeltaLabel: string;
    additionalDueRefundLabel: string;
    runGuardSnapshotLabel: string;
    documentFileLabel: string;
    formatTypeLabel: string;
    issuedAtLabel: string;
    generatedAtLabel: string;
    contentSha256Label: string;
    actionDownloadLoadedDocument: string;
    documentPreviewHiddenNotice: string;
    yesLabel: string;
    noLabel: string;
  };
  receipt: WithholdingReceiptResponse | null;
  finalizedSettlement: FinalizedYearEndSettlementResponse | null;
  receiptDocument: WithholdingReceiptDocumentResponse | null;
  blockingReasonText: string;
  runGuardSnapshot: string;
  finalizedAtText: string;
  documentFormatTypeText: string;
  issuedAtText: string;
  generatedAtText: string;
  documentFileNameText: string;
  hideDocumentRawPreview: boolean;
  formatKrwByLocale: (value: number) => string;
  onDownloadDocument: (document: WithholdingReceiptDocumentResponse["document"]) => void;
};

export function WithholdingSummaryPanel({
  title,
  copy,
  receipt,
  finalizedSettlement,
  receiptDocument,
  blockingReasonText,
  runGuardSnapshot,
  finalizedAtText,
  documentFormatTypeText,
  issuedAtText,
  generatedAtText,
  documentFileNameText,
  hideDocumentRawPreview,
  formatKrwByLocale,
  onDownloadDocument
}: WithholdingSummaryPanelProps) {
  return (
    <article className="panel">
      <h2>{title}</h2>
      {!receipt ? (
        <p className="small">{copy.noReceiptSummary}</p>
      ) : (
        <ul className="simple-list">
          <li><span>{copy.receiptNumberLabel}</span><strong>{receipt.receipt.receiptNumber}</strong></li>
          <li><span>{copy.canIssueIssuedLabel}</span><strong>{receipt.receipt.canIssue ? copy.yesLabel : copy.noLabel} / {receipt.receipt.issued ? copy.yesLabel : copy.noLabel}</strong></li>
          <li><span>{copy.grossNetLabel}</span><strong>{formatKrwByLocale(receipt.receipt.annualTotalsKrw.grossPayKrw)} / {formatKrwByLocale(receipt.receipt.annualTotalsKrw.netPayKrw)}</strong></li>
          <li><span>{copy.withholdingSocialLabel}</span><strong>{formatKrwByLocale(receipt.receipt.annualTotalsKrw.withholdingTaxKrw)} / {formatKrwByLocale(receipt.receipt.annualTotalsKrw.socialInsuranceKrw)}</strong></li>
          <li><span>{copy.pendingReceiptRunsLabel}</span><strong>{receipt.receipt.runStates.pendingReceiptRunIds.join(", ") || "-"}</strong></li>
          <li><span>{copy.blockingReasonsLabel}</span><strong>{blockingReasonText}</strong></li>
        </ul>
      )}
      {!finalizedSettlement ? (
        <p className="small">{copy.noFinalizedSettlement}</p>
      ) : (
        <ul className="simple-list">
          <li><span>{copy.finalizationIdLabel}</span><strong>{finalizedSettlement.settlement.finalizationId}</strong></li>
          <li><span>{copy.finalizedAtLabel}</span><strong>{finalizedAtText}</strong></li>
          <li><span>{copy.settlementHashLabel}</span><strong>{finalizedSettlement.settlement.settlementHash.slice(0, 16)}...</strong></li>
          <li><span>{copy.taxLiabilityLabel}</span><strong>{formatKrwByLocale(finalizedSettlement.settlement.settlementKrw.annualTaxLiabilityKrw)}</strong></li>
          <li><span>{copy.priorWithheldLabel}</span><strong>{formatKrwByLocale(finalizedSettlement.settlement.settlementKrw.priorWithheldTaxKrw)}</strong></li>
          <li><span>{copy.withholdingDeltaLabel}</span><strong>{formatKrwByLocale(finalizedSettlement.settlement.settlementKrw.withholdingDeltaKrw)}</strong></li>
          <li><span>{copy.additionalDueRefundLabel}</span><strong>{formatKrwByLocale(finalizedSettlement.settlement.settlementKrw.additionalWithholdingDueKrw)} / {formatKrwByLocale(finalizedSettlement.settlement.settlementKrw.withholdingRefundKrw)}</strong></li>
          <li><span>{copy.runGuardSnapshotLabel}</span><strong>{runGuardSnapshot}</strong></li>
        </ul>
      )}
      {!receiptDocument ? (
        <p className="small">{copy.noIssuedDocument}</p>
      ) : (
        <>
          <ul className="simple-list">
            <li><span>{copy.documentFileLabel}</span><strong>{documentFileNameText}</strong></li>
            <li><span>{copy.formatTypeLabel}</span><strong>{documentFormatTypeText}</strong></li>
            <li><span>{copy.issuedAtLabel}</span><strong>{issuedAtText}</strong></li>
            <li><span>{copy.generatedAtLabel}</span><strong>{generatedAtText}</strong></li>
            <li><span>{copy.contentSha256Label}</span><strong>{receiptDocument.document.contentSha256.slice(0, 16)}...</strong></li>
          </ul>
          <div className="panel-actions">
            <button className="btn btn-secondary" onClick={() => onDownloadDocument(receiptDocument.document)}>
              {copy.actionDownloadLoadedDocument}
            </button>
          </div>
          {hideDocumentRawPreview ? (
            <p className="small muted">{copy.documentPreviewHiddenNotice}</p>
          ) : (
            <pre className="small">{receiptDocument.document.content.slice(0, 1000)}</pre>
          )}
        </>
      )}
    </article>
  );
}

type WithholdingLogsPanelProps = {
  title: string;
  copy: {
    apiLogsTotalLabel: string;
    apiLogsSuccessLabel: string;
    apiLogsFailLabel: string;
    apiLogsRunningLabel: string;
    apiLogsEmpty: string;
    okLabel: string;
    failLabel: string;
    actionBackToEmployee: string;
  };
  logs: ApiLog[];
  stats: { total: number; success: number; fail: number };
  pendingLabel: string | null;
};

export function WithholdingLogsPanel({ title, copy, logs, stats, pendingLabel }: WithholdingLogsPanelProps) {
  return (
    <article className="panel">
      <h2>{title}</h2>
      <p className="small">
        {copy.apiLogsTotalLabel} {stats.total} / {copy.apiLogsSuccessLabel} {stats.success} / {copy.apiLogsFailLabel} {stats.fail}
        {pendingLabel ? ` / ${copy.apiLogsRunningLabel} ${pendingLabel}` : ""}
      </p>
      {logs.length === 0 ? (
        <p className="small">{copy.apiLogsEmpty}</p>
      ) : (
        <ul className="log-list">
          {logs.map((log) => (
            <li key={log.id}>
              <span className={log.ok ? "ok" : "fail"}>{log.ok ? copy.okLabel : copy.failLabel}</span> {log.label} / {log.status}
              <time>{log.at}</time>
            </li>
          ))}
        </ul>
      )}
      <div className="panel-actions">
        <Link href="/employee" className="btn btn-secondary">{copy.actionBackToEmployee}</Link>
      </div>
    </article>
  );
}
