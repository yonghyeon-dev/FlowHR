"use client";

import {
  type ContractApprovalStatus,
  type ContractDocumentStatus,
  type EmployeeContractsCopy,
  toDateText
} from "@/components/contracts/copy";
import { resolveEmployeeContractsUrgencyBadge } from "@/components/contracts/employee-inbox-journey-helpers";
import { normalizeContractsEntityTitle } from "@/components/contracts/runtime-copy-helpers";
import {
  resolveContractApprovalStatusLabel,
  resolveContractDocumentStatusLabel
} from "@/components/contracts/status-label-helpers";
import { type EmployeeContractDocument as ContractDocument } from "@/components/contracts/types";

type EmployeeContractsInboxListCopy = Pick<
  EmployeeContractsCopy,
  | "approvalPrefix"
  | "dueSoonBadgeLabel"
  | "expiresPrefix"
  | "inboxAria"
  | "inboxFilteredEmpty"
  | "noDocumentMessage"
  | "overdueBadgeLabel"
  | "selectAction"
>;

type EmployeeContractsInboxListProps = {
  documents: ContractDocument[];
  filteredDocuments: ContractDocument[];
  selectedDocumentId: string | null;
  copy: EmployeeContractsInboxListCopy;
  documentStatusLabels: Record<ContractDocumentStatus, string>;
  approvalStatusLabels: Record<ContractApprovalStatus, string>;
  runtimeLocale: string;
  isKoLocale: boolean;
  onSelectDocument: (documentId: string) => void;
};

const unknownDocumentStatusLabelKo = "알 수 없는 상태";
const unknownApprovalStatusLabelKo = "알 수 없는 승인 상태";

function resolveDocumentTone(status: ContractDocumentStatus) {
  if (status === "SIGNED") return "ready";
  if (status === "REJECTED") return "risk";
  return "watch";
}

function resolveDocumentStatusLabel(
  status: ContractDocumentStatus,
  labels: Record<ContractDocumentStatus, string>,
  isKoLocale: boolean
) {
  const resolved = resolveContractDocumentStatusLabel(status, labels, isKoLocale);
  return isKoLocale && resolved === status ? unknownDocumentStatusLabelKo : resolved;
}

function resolveApprovalStatusLabel(
  status: ContractApprovalStatus,
  labels: Record<ContractApprovalStatus, string>,
  isKoLocale: boolean
) {
  const resolved = resolveContractApprovalStatusLabel(status, labels, isKoLocale);
  return isKoLocale && resolved === status ? unknownApprovalStatusLabelKo : resolved;
}

export function EmployeeContractsInboxList({
  documents,
  filteredDocuments,
  selectedDocumentId,
  copy,
  documentStatusLabels,
  approvalStatusLabels,
  runtimeLocale,
  isKoLocale,
  onSelectDocument
}: EmployeeContractsInboxListProps) {
  if (documents.length === 0) {
    return <p className="small muted">{copy.noDocumentMessage}</p>;
  }
  if (filteredDocuments.length === 0) {
    return <p className="small muted">{copy.inboxFilteredEmpty}</p>;
  }
  return (
    <ul className="contract-template-list" aria-label={copy.inboxAria}>
      {filteredDocuments.map((document) => {
        const urgencyBadge = resolveEmployeeContractsUrgencyBadge(document, copy);
        return (
          <li
            key={document.id}
            className={`${selectedDocumentId === document.id ? "is-selected " : ""}tone-${resolveDocumentTone(
              document.status
            )}`}
          >
            <div className="contract-template-head">
              <strong>{normalizeContractsEntityTitle(document.title, document.id, isKoLocale)}</strong>
              <span className="queue-history-chip">
                {resolveDocumentStatusLabel(document.status, documentStatusLabels, isKoLocale)}
              </span>
            </div>
            <p>
              {copy.approvalPrefix}{" "}
              {resolveApprovalStatusLabel(document.approvalStatus, approvalStatusLabels, isKoLocale)} |{" "}
              {copy.expiresPrefix}{" "}
              {toDateText(document.expiresAt, runtimeLocale)}
            </p>
            {urgencyBadge ? (
              <p className="small" style={{ color: "var(--danger)" }}>
                {urgencyBadge}
              </p>
            ) : null}
            <button type="button" className="btn btn-secondary btn-small" onClick={() => onSelectDocument(document.id)}>
              {copy.selectAction}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
