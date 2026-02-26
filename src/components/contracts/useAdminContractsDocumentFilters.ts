import { useMemo, useState } from "react";

import type { ContractDocumentStatus } from "@/components/contracts/copy";
import type { AdminContractDocument } from "@/components/contracts/types";
import { formatEmployeeIdForLocaleDisplay } from "@/lib/i18n/employee-id-locale";
import type { FlowLocale } from "@/lib/i18n/locales";

export type ContractDocumentStatusFilter = ContractDocumentStatus | "ALL";
export type ContractDocumentExpirationWindow = "ALL" | "7" | "14" | "30";

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

export function useAdminContractsDocumentFilters({
  documents,
  locale
}: UseAdminContractsDocumentFiltersInput) {
  const [documentSearchQuery, setDocumentSearchQuery] = useState("");
  const [documentStatusFilter, setDocumentStatusFilter] = useState<ContractDocumentStatusFilter>("ALL");
  const [expirationWindowDays, setExpirationWindowDays] = useState<ContractDocumentExpirationWindow>("ALL");
  const [renewalCandidateOnly, setRenewalCandidateOnly] = useState(false);

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
  }, [documentSearchQuery, documentStatusFilter, documents, expirationWindowDays, locale, nowMillis, renewalCandidateOnly]);

  return {
    documentSearchQuery,
    setDocumentSearchQuery,
    documentStatusFilter,
    setDocumentStatusFilter,
    expirationWindowDays,
    setExpirationWindowDays,
    renewalCandidateOnly,
    setRenewalCandidateOnly,
    expiringSoonCount,
    renewalCandidateCount,
    visibleDocuments
  };
}
