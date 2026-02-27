"use client";

import { EmployeeContractJourneyPanel } from "@/components/contracts/EmployeeContractJourneyPanel";
import { type ContractDocumentStatus, type EmployeeContractsCopy, toDateText } from "@/components/contracts/copy";
import { normalizeContractsEvidenceFileName } from "@/components/contracts/runtime-copy-helpers";
import { type ContractSignatureEvidenceResponse, type EmployeeContractDocument } from "@/components/contracts/types";

type EmployeeContractsResponsePanelProps = {
  copy: EmployeeContractsCopy;
  selected: EmployeeContractDocument | null;
  documentStatusLabels: Record<ContractDocumentStatus, string>;
  runtimeLocale: string;
  isKoLocale: boolean;
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
};

export function EmployeeContractsResponsePanel({
  copy,
  selected,
  documentStatusLabels,
  runtimeLocale,
  isKoLocale,
  signatureInput,
  comment,
  onSignatureInputChange,
  onCommentChange,
  canRespondSelected,
  onRespond,
  onLoadSignatureEvidence,
  signatureEvidence,
  onDownloadEvidence
}: EmployeeContractsResponsePanelProps) {
  const quickCommentTemplates = [
    copy.quickCommentTemplateConfirmTerms,
    copy.quickCommentTemplateNeedClarification,
    copy.quickCommentTemplateRequestRevision
  ];

  return (
    <article className="panel panel-contract-template-detail">
      <h2>{copy.responseTitle}</h2>
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
          <EmployeeContractJourneyPanel selected={selected} isKoLocale={isKoLocale} runtimeLocale={runtimeLocale} />
          <label>{copy.signatureInputLabel}<input value={signatureInput} onChange={(event) => onSignatureInputChange(event.target.value)} /></label>
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
            <button type="button" className="btn" onClick={() => onRespond("SIGN")} disabled={!canRespondSelected}>{copy.signAction}</button>
            <button type="button" className="btn btn-secondary" onClick={() => onRespond("REJECT")} disabled={!canRespondSelected}>{copy.rejectAction}</button>
            <button type="button" className="btn btn-secondary" onClick={() => onLoadSignatureEvidence("json")} disabled={selected.status !== "SIGNED"}>{copy.loadEvidenceJsonAction}</button>
            <button type="button" className="btn btn-secondary" onClick={() => onLoadSignatureEvidence("text")} disabled={selected.status !== "SIGNED"}>{copy.loadEvidenceTextAction}</button>
          </div>
          {signatureEvidence ? (
            <>
              <ul className="simple-list">
                <li><span>{copy.evidenceFileLabel}</span><strong>{normalizeContractsEvidenceFileName(signatureEvidence.fileName, selected.id, isKoLocale)}</strong></li>
                <li><span>{copy.generatedAtLabel}</span><strong>{toDateText(signatureEvidence.generatedAt, runtimeLocale)}</strong></li>
                <li><span>{copy.contentShaLabel}</span><strong>{signatureEvidence.contentSha256.slice(0, 16)}...</strong></li>
              </ul>
              <div className="contract-action-row">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() =>
                    onDownloadEvidence(
                      signatureEvidence,
                      normalizeContractsEvidenceFileName(signatureEvidence.fileName, selected.id, isKoLocale)
                    )
                  }
                >
                  {copy.downloadEvidenceAction}
                </button>
              </div>
            </>
          ) : null}
        </>
      )}
    </article>
  );
}
