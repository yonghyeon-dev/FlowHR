import { useMemo, useState } from "react";

import type { ContractDocumentStatus } from "@/components/contracts/copy";
import type { AdminContractDocument } from "@/components/contracts/types";
import { formatEmployeeIdForLocaleDisplay } from "@/lib/i18n/employee-id-locale";
import type { FlowLocale } from "@/lib/i18n/locales";

export type ContractDocumentStatusFilter = ContractDocumentStatus | "ALL";

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

export function useAdminContractsDocumentFilters({
  documents,
  locale
}: UseAdminContractsDocumentFiltersInput) {
  const [documentSearchQuery, setDocumentSearchQuery] = useState("");
  const [documentStatusFilter, setDocumentStatusFilter] = useState<ContractDocumentStatusFilter>("ALL");

  const visibleDocuments = useMemo(() => {
    const query = documentSearchQuery.trim().toLowerCase();
    return documents.filter((document) => {
      if (documentStatusFilter !== "ALL" && document.status !== documentStatusFilter) {
        return false;
      }
      if (query.length === 0) {
        return true;
      }
      const displayEmployeeId = formatEmployeeIdForLocaleDisplay(document.employeeId, locale).toLowerCase();
      const haystack = `${document.id} ${document.title} ${document.employeeId} ${displayEmployeeId}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [documentSearchQuery, documentStatusFilter, documents, locale]);

  return {
    documentSearchQuery,
    setDocumentSearchQuery,
    documentStatusFilter,
    setDocumentStatusFilter,
    visibleDocuments
  };
}
