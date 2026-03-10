import { type WithholdingReceiptCopy } from "@/components/withholding-receipt/copy-runtime";
import {
  formatEmployeeSessionConnectionState,
  formatWorkspaceConnectionState
} from "@/lib/product-language";

type WithholdingReceiptInputPanelProps = {
  copy: WithholdingReceiptCopy;
  locale: "ko" | "en";
  showDevTools: boolean;
  requiresLoginSession: boolean;
  year: string;
  documentFormat: "json" | "text";
  hasWorkspaceSession: boolean;
  hasEmployeeSession: boolean;
  pendingLabel: string | null;
  statusMessage: string;
  normalizedSupabaseSessionError: string | null;
  onYearChange: (value: string) => void;
  onDocumentFormatChange: (value: "json" | "text") => void;
  onPreviewReceipt: () => void;
  onLoadFinalizedSettlement: () => void;
  onLoadIssuedDocument: () => void;
};

export function WithholdingReceiptInputPanel({
  copy,
  locale,
  showDevTools,
  requiresLoginSession,
  year,
  documentFormat,
  hasWorkspaceSession,
  hasEmployeeSession,
  pendingLabel,
  statusMessage,
  normalizedSupabaseSessionError,
  onYearChange,
  onDocumentFormatChange,
  onPreviewReceipt,
  onLoadFinalizedSettlement,
  onLoadIssuedDocument
}: WithholdingReceiptInputPanelProps) {
  return (
    <article className="panel">
      <h2>{copy.inputTitle}</h2>
      <div className="input-grid">
        <label>{copy.yearLabel}<input value={year} onChange={(event) => onYearChange(event.target.value)} /></label>
        <label>
          {copy.documentFormatLabel}
          <select
            value={documentFormat}
            onChange={(event) => onDocumentFormatChange(event.target.value === "text" ? "text" : "json")}
          >
            <option value="json">{copy.formatJsonLabel}</option>
            <option value="text">{copy.formatTextLabel}</option>
          </select>
        </label>
      </div>
      {showDevTools ? (
        <p className="small muted">
          {copy.sessionOrganizationLabel}:{" "}
          <strong>{formatWorkspaceConnectionState(hasWorkspaceSession, locale)}</strong> /{" "}
          {copy.sessionEmployeeLabel}:{" "}
          <strong>{formatEmployeeSessionConnectionState(hasEmployeeSession, locale)}</strong>
        </p>
      ) : null}
      <div className="panel-actions">
        <button className="btn btn-primary" onClick={onPreviewReceipt} disabled={pendingLabel !== null || requiresLoginSession}>
          {copy.actionPreviewReceipt}
        </button>
        <button
          className="btn btn-secondary"
          onClick={onLoadFinalizedSettlement}
          disabled={pendingLabel !== null || requiresLoginSession}
        >
          {copy.actionLoadFinalizedSettlement}
        </button>
        <button
          className="btn btn-secondary"
          onClick={onLoadIssuedDocument}
          disabled={pendingLabel !== null || requiresLoginSession}
        >
          {copy.actionLoadIssuedDocument}
        </button>
      </div>
      {statusMessage ? <p className="small">{statusMessage}</p> : null}
      {normalizedSupabaseSessionError ? (
        <p className="small fail">
          {copy.sessionErrorPrefix}: {normalizedSupabaseSessionError}
        </p>
      ) : null}
    </article>
  );
}
