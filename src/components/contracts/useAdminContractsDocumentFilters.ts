import { useMemo, useState } from "react";

import type { ContractDocumentStatus } from "@/components/contracts/copy";
import {
  resolveAdminContractDocumentNextStep,
  type ContractDocumentNextStepKey
} from "@/components/contracts/document-action-policy";
import type { AdminContractDocument } from "@/components/contracts/types";
import { formatEmployeeIdForLocaleDisplay } from "@/lib/i18n/employee-id-locale";
import type { FlowLocale } from "@/lib/i18n/locales";

export type ContractDocumentStatusFilter = ContractDocumentStatus | "ALL";
export type ContractDocumentExpirationWindow = "ALL" | "7" | "14" | "30";
export type ContractDocumentSlaRiskFilter = "ALL" | "DUE_SOON" | "OVERDUE";
export type ContractDocumentNextStepFilter = ContractDocumentNextStepKey | "ALL";

export const contractDocumentStatusFilters: ContractDocumentStatus[] = [
  "DRAFT",
  "APPROVAL_REQUESTED",
  "SENT",
  "SIGNED",
  "REJECTED",
  "EXPIRED",
  "RENEWED"
];

type UseAdminContractsDocumentFiltersInput = {
  documents: AdminContractDocument[];
  locale: FlowLocale;
};

const renewalCandidateStatuses = new Set<ContractDocumentStatus>(["SIGNED", "REJECTED", "EXPIRED"]);
const slaTrackedStatuses = new Set<ContractDocumentStatus>(["DRAFT", "APPROVAL_REQUESTED", "SENT"]);
const SLA_DUE_SOON_WINDOW_DAYS = 3;

function toExpiryLimitMillis(windowDays: ContractDocumentExpirationWindow, nowMillis: number) {
  if (windowDays === "ALL") {
    return Number.POSITIVE_INFINITY;
  }
  return nowMillis + Number(windowDays) * 24 * 60 * 60 * 1000;
}

function parseExpiresAtToMillis(expiresAt: string | null) {
  if (!expiresAt) {
    return null;
  }
  const millis = new Date(expiresAt).getTime();
  return Number.isFinite(millis) ? millis : null;
}

function isRenewalCandidate(document: AdminContractDocument) {
  return renewalCandidateStatuses.has(document.status);
}

function isSlaTrackedDocument(document: AdminContractDocument) {
  return slaTrackedStatuses.has(document.status);
}

function resolveDocumentNextStep(document: AdminContractDocument) {
  return resolveAdminContractDocumentNextStep({
    status: document.status,
    approvalStatus: document.approvalStatus,
    requiresApproval: document.requiresApproval
  });
}

function isDecisionQueueDocument(document: AdminContractDocument) {
  const nextStep = resolveDocumentNextStep(document);
  return nextStep === "REQUEST_APPROVAL" || nextStep === "APPROVE_OR_REJECT" || nextStep === "SEND_DOCUMENT";
}

function isDueSoonSlaRisk(document: AdminContractDocument, nowMillis: number = Date.now()) {
  if (!isSlaTrackedDocument(document)) {
    return false;
  }
  const expiresAtMillis = parseExpiresAtToMillis(document.expiresAt);
  if (expiresAtMillis === null) {
    return false;
  }
  const dueSoonLimitMillis = nowMillis + SLA_DUE_SOON_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  return expiresAtMillis >= nowMillis && expiresAtMillis <= dueSoonLimitMillis;
}

function isOverdueSlaRisk(document: AdminContractDocument, nowMillis: number = Date.now()) {
  if (!isSlaTrackedDocument(document)) {
    return false;
  }
  const expiresAtMillis = parseExpiresAtToMillis(document.expiresAt);
  if (expiresAtMillis === null) {
    return false;
  }
  return expiresAtMillis < nowMillis;
}

export function useAdminContractsDocumentFilters({
  documents,
  locale
}: UseAdminContractsDocumentFiltersInput) {
  const [documentSearchQuery, setDocumentSearchQuery] = useState("");
  const [documentStatusFilter, setDocumentStatusFilter] = useState<ContractDocumentStatusFilter>("ALL");
  const [expirationWindowDays, setExpirationWindowDays] = useState<ContractDocumentExpirationWindow>("ALL");
  const [slaRiskFilter, setSlaRiskFilter] = useState<ContractDocumentSlaRiskFilter>("ALL");
  const [renewalCandidateOnly, setRenewalCandidateOnly] = useState(false);
  const [decisionQueueOnly, setDecisionQueueOnly] = useState(false);
  const [nextStepFilter, setNextStepFilter] = useState<ContractDocumentNextStepFilter>("ALL");

  const nowMillis = Date.now();
  const expirationLimitMillis = toExpiryLimitMillis(expirationWindowDays, nowMillis);
  const expiringSoonCount = useMemo(
    () =>
      documents.filter((document) => {
        const expiresAtMillis = parseExpiresAtToMillis(document.expiresAt);
        return expiresAtMillis !== null && expiresAtMillis >= nowMillis && expiresAtMillis <= expirationLimitMillis;
      }).length,
    [documents, expirationLimitMillis, nowMillis]
  );
  const renewalCandidateCount = useMemo(
    () => documents.filter((document) => isRenewalCandidate(document)).length,
    [documents]
  );
  const dueSoonSlaCount = useMemo(
    () => documents.filter((document) => isDueSoonSlaRisk(document, nowMillis)).length,
    [documents, nowMillis]
  );
  const overdueSlaCount = useMemo(
    () => documents.filter((document) => isOverdueSlaRisk(document, nowMillis)).length,
    [documents, nowMillis]
  );
  const decisionQueueCount = useMemo(
    () => documents.filter((document) => isDecisionQueueDocument(document)).length,
    [documents]
  );
  const nextStepCounts = useMemo(
    () =>
      documents.reduce<Record<ContractDocumentNextStepKey, number>>(
        (counts, document) => {
          const nextStep = resolveDocumentNextStep(document);
          counts[nextStep] += 1;
          return counts;
        },
        {
          REQUEST_APPROVAL: 0,
          APPROVE_OR_REJECT: 0,
          SEND_DOCUMENT: 0,
          WAIT_EMPLOYEE_RESPONSE: 0,
          RENEW_DOCUMENT: 0,
          NO_ACTION: 0
        }
      ),
    [documents]
  );

  const visibleDocuments = useMemo(() => {
    const query = documentSearchQuery.trim().toLowerCase();
    const expiryLimit = toExpiryLimitMillis(expirationWindowDays, nowMillis);
    return documents.filter((document) => {
      if (documentStatusFilter !== "ALL" && document.status !== documentStatusFilter) {
        return false;
      }
      if (renewalCandidateOnly && !isRenewalCandidate(document)) {
        return false;
      }
      if (decisionQueueOnly && !isDecisionQueueDocument(document)) {
        return false;
      }
      const nextStep = resolveDocumentNextStep(document);
      if (nextStepFilter !== "ALL" && nextStep !== nextStepFilter) {
        return false;
      }
      if (slaRiskFilter === "DUE_SOON" && !isDueSoonSlaRisk(document, nowMillis)) {
        return false;
      }
      if (slaRiskFilter === "OVERDUE" && !isOverdueSlaRisk(document, nowMillis)) {
        return false;
      }
      if (expirationWindowDays !== "ALL") {
        const expiresAtMillis = parseExpiresAtToMillis(document.expiresAt);
        if (expiresAtMillis === null || expiresAtMillis < nowMillis || expiresAtMillis > expiryLimit) {
          return false;
        }
      }
      if (query.length === 0) {
        return true;
      }
      const displayEmployeeId = formatEmployeeIdForLocaleDisplay(document.employeeId, locale).toLowerCase();
      const haystack = `${document.id} ${document.title} ${document.employeeId} ${displayEmployeeId}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [
    documentSearchQuery,
    documentStatusFilter,
    documents,
    expirationWindowDays,
    locale,
    nowMillis,
    decisionQueueOnly,
    nextStepFilter,
    renewalCandidateOnly,
    slaRiskFilter
  ]);

  return {
    documentSearchQuery,
    setDocumentSearchQuery,
    documentStatusFilter,
    setDocumentStatusFilter,
    expirationWindowDays,
    setExpirationWindowDays,
    slaRiskFilter,
    setSlaRiskFilter,
    renewalCandidateOnly,
    setRenewalCandidateOnly,
    decisionQueueOnly,
    setDecisionQueueOnly,
    nextStepFilter,
    setNextStepFilter,
    expiringSoonCount,
    dueSoonSlaCount,
    overdueSlaCount,
    decisionQueueCount,
    nextStepCounts,
    renewalCandidateCount,
    visibleDocuments,
    isDueSoonSlaRisk,
    isOverdueSlaRisk
  };
}
