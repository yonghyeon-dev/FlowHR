import { type WithholdingReceiptCopy } from "@/components/withholding-receipt/copy-runtime";

type WithholdingReceiptInputPanelProps = {
  copy: WithholdingReceiptCopy;
  year: string;
  employeeId: string;
  documentFormat: "json" | "text";
  accessToken: string;
  organizationId: string;
  pendingLabel: string | null;
  statusMessage: string;
  normalizedSupabaseSessionError: string | null;
  onYearChange: (value: string) => void;
  onEmployeeIdChange: (value: string) => void;
  onEmployeeIdBlur: () => void;
  onDocumentFormatChange: (value: "json" | "text") => void;
  onAccessTokenChange: (value: string) => void;
  onOrganizationIdChange: (value: string) => void;
  onPreviewReceipt: () => void;
  onLoadFinalizedSettlement: () => void;
  onLoadIssuedDocument: () => void;
};

export function WithholdingReceiptInputPanel({
  copy,
  year,
  employeeId,
  documentFormat,
  accessToken,
  organizationId,
  pendingLabel,
  statusMessage,
  normalizedSupabaseSessionError,
  onYearChange,
  onEmployeeIdChange,
  onEmployeeIdBlur,
  onDocumentFormatChange,
  onAccessTokenChange,
  onOrganizationIdChange,
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
          {copy.employeeIdLabel}
          <input value={employeeId} onChange={(event) => onEmployeeIdChange(event.target.value)} onBlur={onEmployeeIdBlur} />
        </label>
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
      <label>
        {copy.accessTokenLabel}
        <input value={accessToken} onChange={(event) => onAccessTokenChange(event.target.value)} placeholder={copy.bearerTokenPlaceholder} />
      </label>
      <label>
        {copy.organizationIdFallbackLabel}
        <input value={organizationId} onChange={(event) => onOrganizationIdChange(event.target.value)} />
      </label>
      <div className="panel-actions">
        <button className="btn btn-primary" onClick={onPreviewReceipt} disabled={pendingLabel !== null}>{copy.actionPreviewReceipt}</button>
        <button className="btn btn-secondary" onClick={onLoadFinalizedSettlement} disabled={pendingLabel !== null}>{copy.actionLoadFinalizedSettlement}</button>
        <button className="btn btn-secondary" onClick={onLoadIssuedDocument} disabled={pendingLabel !== null}>{copy.actionLoadIssuedDocument}</button>
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
