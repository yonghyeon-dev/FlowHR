"use client";
import { useEffect, useMemo, useState } from "react";
import { EmployeeContractJourneyPanel } from "@/components/contracts/EmployeeContractJourneyPanel";
import { type ContractDocumentStatus, type EmployeeContractsCopy, toDateText } from "@/components/contracts/copy";
import { normalizeContractsEvidenceFileName } from "@/components/contracts/runtime-copy-helpers";
import { type ContractSignatureEvidenceResponse, type EmployeeContractDocument } from "@/components/contracts/types";
type ResponseHistoryEntryType = "SIGNED" | "REJECTED" | "EVIDENCE";
type ResponseHistoryFilter = "ALL" | ResponseHistoryEntryType;
type EmployeeContractsResponsePanelProps = {
  copy: EmployeeContractsCopy;
  selected: EmployeeContractDocument | null;
  documentStatusLabels: Record<ContractDocumentStatus, string>;
  runtimeLocale: string;
  isKoLocale: boolean;
  nextActionHint: string;
  signatureInput: string;
  comment: string;
  onSignatureInputChange: (value: string) => void;
  onCommentChange: (value: string) => void;
  canRespondSelected: boolean;
  onRespond: (action: "SIGN" | "REJECT") => void;
  onLoadSignatureEvidence: (format: "json" | "text") => void;
  signatureEvidence: ContractSignatureEvidenceResponse["evidence"] | null;
  onDownloadEvidence: (
    evidence: ContractSignatureEvidenceResponse["evidence"],
    downloadFileName: string
  ) => void;
  onCopyEvidenceMetadata: (
    evidence: ContractSignatureEvidenceResponse["evidence"],
    displayFileName: string
  ) => void;
};
export function EmployeeContractsResponsePanel({
  copy,
  selected,
  documentStatusLabels,
  runtimeLocale,
  isKoLocale,
  nextActionHint,
  signatureInput,
  comment,
  onSignatureInputChange,
  onCommentChange,
  canRespondSelected,
  onRespond,
  onLoadSignatureEvidence,
  signatureEvidence,
  onDownloadEvidence,
  onCopyEvidenceMetadata
}: EmployeeContractsResponsePanelProps) {
  const quickCommentTemplates = [
    copy.quickCommentTemplateConfirmTerms,
    copy.quickCommentTemplateNeedClarification,
    copy.quickCommentTemplateRequestRevision
  ];
  const isSignatureInputReady = signatureInput.trim().length > 0;
  const [copyStatusMessage, setCopyStatusMessage] = useState<string | null>(null);
  const [copyStatusError, setCopyStatusError] = useState<string | null>(null);
  const [responseHistoryFilter, setResponseHistoryFilter] = useState<ResponseHistoryFilter>("ALL");
  const evidenceDisplayFileName = selected && signatureEvidence
    ? normalizeContractsEvidenceFileName(signatureEvidence.fileName, selected.id, isKoLocale)
    : null;
  const hasSignatureHash = Boolean(selected?.signatureHash);
  const hasEvidenceHash = Boolean(selected?.signatureEvidenceHash);
  const responseHistoryEntries = useMemo(() => {
    if (!selected) {
      return [];
    }
    const entries: {
      id: string;
      type: ResponseHistoryEntryType;
      label: string;
      occurredAt: string;
      detail: string | null;
    }[] = [];
    if (selected.respondedAt && selected.status === "SIGNED") {
      entries.push({
        id: `signed-${selected.id}-${selected.respondedAt}`,
        type: "SIGNED",
        label: copy.responseHistorySignedLabel,
        occurredAt: selected.respondedAt,
        detail: selected.responseComment
      });
    }
    if (selected.respondedAt && selected.status === "REJECTED") {
      entries.push({
        id: `rejected-${selected.id}-${selected.respondedAt}`,
        type: "REJECTED",
        label: copy.responseHistoryRejectedLabel,
        occurredAt: selected.respondedAt,
        detail: selected.responseComment
      });
    }
    if (signatureEvidence) {
      entries.push({
        id: `evidence-${selected.id}-${signatureEvidence.generatedAt}-${signatureEvidence.format}`,
        type: "EVIDENCE",
        label: copy.responseHistoryEvidenceLoadedLabel,
        occurredAt: signatureEvidence.generatedAt,
        detail: signatureEvidence.format.toUpperCase()
      });
    }
    return entries.sort(
      (left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime()
    );
  }, [
    copy.responseHistoryEvidenceLoadedLabel,
    copy.responseHistoryRejectedLabel,
    copy.responseHistorySignedLabel,
    selected,
    signatureEvidence
  ]);
  const responseHistoryCounts = useMemo(() => {
    const counts: Record<ResponseHistoryEntryType, number> = { SIGNED: 0, REJECTED: 0, EVIDENCE: 0 };
    responseHistoryEntries.forEach((entry) => {
      counts[entry.type] += 1;
    });
    return counts;
  }, [responseHistoryEntries]);
  const responseHistoryFilterOptions = [
    { value: "ALL" as const, label: copy.responseHistoryFilterAllAction, count: responseHistoryEntries.length },
    { value: "SIGNED" as const, label: copy.responseHistoryFilterSignedAction, count: responseHistoryCounts.SIGNED },
    { value: "REJECTED" as const, label: copy.responseHistoryFilterRejectedAction, count: responseHistoryCounts.REJECTED },
    { value: "EVIDENCE" as const, label: copy.responseHistoryFilterEvidenceAction, count: responseHistoryCounts.EVIDENCE }
  ];
  const filteredResponseHistoryEntries = useMemo(
    () => (responseHistoryFilter === "ALL"
      ? responseHistoryEntries
      : responseHistoryEntries.filter((entry) => entry.type === responseHistoryFilter)),
    [responseHistoryEntries, responseHistoryFilter]
  );
  useEffect(() => {
    setCopyStatusMessage(null);
    setCopyStatusError(null);
    setResponseHistoryFilter("ALL");
  }, [selected?.id]);
  async function copyHash(hashType: "signature" | "evidence") {
    const hashValue = hashType === "signature" ? selected?.signatureHash : selected?.signatureEvidenceHash;
    if (!hashValue) {
      return;
    }
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      setCopyStatusMessage(null);
      setCopyStatusError(copy.copyHashClipboardError);
      return;
    }
    try {
      await navigator.clipboard.writeText(hashValue);
      setCopyStatusError(null);
      setCopyStatusMessage(
        hashType === "signature" ? copy.copiedSignatureHashStatus : copy.copiedEvidenceHashStatus
      );
    } catch {
      setCopyStatusMessage(null);
      setCopyStatusError(copy.copyHashClipboardError);
    }
  }

  return (
    <article className="panel panel-contract-template-detail">
      <h2>{copy.responseTitle}</h2>
      <p className="small muted">{copy.nextActionTitle}</p>
      <p className="small">{nextActionHint}</p>
      {!selected ? (
        <p className="small muted">{copy.noDocumentMessage}</p>
      ) : (
        <>
          <ul className="contract-template-detail-list" aria-label={copy.detailAria}>
            <li><span>{copy.idLabel}</span><strong>{selected.id}</strong></li>
            <li><span>{copy.statusLabel}</span><strong>{documentStatusLabels[selected.status]}</strong></li>
            <li><span>{copy.hashLabel}</span><strong>{selected.documentHash.slice(0, 16)}...</strong></li>
            <li><span>{copy.updatedLabel}</span><strong>{toDateText(selected.updatedAt, runtimeLocale)}</strong></li>
            <li><span>{copy.respondedLabel}</span><strong>{toDateText(selected.respondedAt, runtimeLocale)}</strong></li>
            <li><span>{copy.signatureHashLabel}</span><strong>{selected.signatureHash ? `${selected.signatureHash.slice(0, 16)}...` : "-"}</strong></li>
            <li><span>{copy.evidenceHashLabel}</span><strong>{selected.signatureEvidenceHash ? `${selected.signatureEvidenceHash.slice(0, 16)}...` : "-"}</strong></li>
          </ul>
          {hasSignatureHash || hasEvidenceHash ? (
            <div className="contract-action-row">
              {hasSignatureHash ? (
                <button type="button" className="btn btn-secondary btn-small" onClick={() => void copyHash("signature")}>
                  {copy.copySignatureHashAction}
                </button>
              ) : null}
              {hasEvidenceHash ? (
                <button type="button" className="btn btn-secondary btn-small" onClick={() => void copyHash("evidence")}>
                  {copy.copyEvidenceHashAction}
                </button>
              ) : null}
            </div>
          ) : null}
          {copyStatusError ? <p className="inline-error">{copyStatusError}</p> : null}
          {copyStatusMessage ? <p className="small">{copyStatusMessage}</p> : null}
          <EmployeeContractJourneyPanel selected={selected} isKoLocale={isKoLocale} runtimeLocale={runtimeLocale} />
          <section className="contract-recovery-guide">
            <h3>{copy.responseHistoryTitle}</h3>
            <div className="contract-action-row">
              <span className="small muted">{copy.responseHistoryFilterLabel}</span>
              {responseHistoryFilterOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={responseHistoryFilter === option.value ? "btn btn-small" : "btn btn-secondary btn-small"}
                  onClick={() => setResponseHistoryFilter(option.value)}
                >
                  {option.label} ({option.count})
                </button>
              ))}
            </div>
            <p className="small muted">{copy.responseHistoryVisibleCountLabel}: {filteredResponseHistoryEntries.length}/{responseHistoryEntries.length}</p>
            <p className="small muted">
              {copy.responseHistorySignedLabel}: {responseHistoryCounts.SIGNED} / {copy.responseHistoryRejectedLabel}: {responseHistoryCounts.REJECTED} / {copy.responseHistoryEvidenceLoadedLabel}: {responseHistoryCounts.EVIDENCE}
            </p>
            {responseHistoryEntries.length === 0 ? (
              <p className="small muted">{copy.responseHistoryEmpty}</p>
            ) : filteredResponseHistoryEntries.length === 0 ? (
              <p className="small muted">{copy.responseHistoryFilteredEmpty}</p>
            ) : (
              <ul className="simple-list">
                {filteredResponseHistoryEntries.map((entry) => (
                  <li key={entry.id}>
                    <span>{entry.label}</span>
                    <strong>{toDateText(entry.occurredAt, runtimeLocale)}</strong>
                    {entry.detail ? <p className="small muted">{entry.detail}</p> : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
          <label>
            {copy.signatureInputLabel}
            <input
              value={signatureInput}
              placeholder={copy.signatureInputPlaceholder}
              onChange={(event) => onSignatureInputChange(event.target.value)}
            />
          </label>
          {canRespondSelected && !isSignatureInputReady ? (
            <p className="small muted">{copy.signatureInputRequiredHint}</p>
          ) : null}
          <label>{copy.commentLabel}<textarea rows={3} value={comment} onChange={(event) => onCommentChange(event.target.value)} /></label>
          <div className="contract-action-row">
            <span className="small muted">{copy.quickCommentTemplatesLabel}</span>
            {quickCommentTemplates.map((template) => (
              <button
                key={template}
                type="button"
                className="btn btn-secondary btn-small"
                onClick={() => onCommentChange(template)}
              >
                {template}
              </button>
            ))}
          </div>
          {!canRespondSelected ? <p className="small muted">{copy.responseDisabledHint}</p> : null}
          <div className="contract-action-row">
            <button
              type="button"
              className="btn"
              onClick={() => onRespond("SIGN")}
              disabled={!canRespondSelected || !isSignatureInputReady}
            >
              {copy.signAction}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => onRespond("REJECT")} disabled={!canRespondSelected}>{copy.rejectAction}</button>
            <button type="button" className="btn btn-secondary" onClick={() => onLoadSignatureEvidence("json")} disabled={selected.status !== "SIGNED"}>{copy.loadEvidenceJsonAction}</button>
            <button type="button" className="btn btn-secondary" onClick={() => onLoadSignatureEvidence("text")} disabled={selected.status !== "SIGNED"}>{copy.loadEvidenceTextAction}</button>
          </div>
          {signatureEvidence && evidenceDisplayFileName ? (
            <>
              <ul className="simple-list">
                <li><span>{copy.evidenceFileLabel}</span><strong>{evidenceDisplayFileName}</strong></li>
                <li><span>{copy.generatedAtLabel}</span><strong>{toDateText(signatureEvidence.generatedAt, runtimeLocale)}</strong></li>
                <li><span>{copy.contentShaLabel}</span><strong>{signatureEvidence.contentSha256.slice(0, 16)}...</strong></li>
              </ul>
              <div className="contract-action-row">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => onDownloadEvidence(signatureEvidence, evidenceDisplayFileName)}
                >
                  {copy.downloadEvidenceAction}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => onCopyEvidenceMetadata(signatureEvidence, evidenceDisplayFileName)}
                >
                  {copy.copyEvidenceMetadataAction}
                </button>
              </div>
            </>
          ) : null}
        </>
      )}
    </article>
  );
}


