import type { BenefitRequestStatus, BenefitCatalogItem, BenefitRequestItem } from "@/features/benefits/types";

type RequestSummary = {
  total: number;
  submitted: number;
  approved: number;
  rejected: number;
};

export function parseBenefitCatalog(payload: unknown): BenefitCatalogItem[] {
  const catalog = (payload as { catalog?: BenefitCatalogItem[] } | null)?.catalog;
  return Array.isArray(catalog) ? catalog : [];
}

export function parseBenefitRequests(payload: unknown): BenefitRequestItem[] {
  const requests = (payload as { requests?: BenefitRequestItem[] } | null)?.requests;
  return Array.isArray(requests) ? requests : [];
}

export function parseBenefitRequestSummary(
  payload: unknown,
  emptyRequestSummary: RequestSummary
): RequestSummary {
  const summary = (payload as { summary?: Partial<RequestSummary> } | null)?.summary;
  if (!summary) {
    return emptyRequestSummary;
  }
  return {
    total: Number(summary.total ?? 0),
    submitted: Number(summary.submitted ?? 0),
    approved: Number(summary.approved ?? 0),
    rejected: Number(summary.rejected ?? 0)
  };
}

export function buildBenefitWorkspaceQuery(input: Record<string, string>) {
  const query = new URLSearchParams();
  Object.entries(input).forEach(([key, value]) => {
    if (!value.trim()) {
      return;
    }
    query.set(key, value.trim());
  });
  const text = query.toString();
  return text ? `?${text}` : "";
}

export function isTruthyFlag(value: string | undefined) {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export function normalizeBenefitRequestFilter(value: string | null): BenefitRequestStatus | "all" {
  return value === "SUBMITTED" || value === "APPROVED" || value === "REJECTED" || value === "CANCELED"
    ? value
    : "all";
}

export type AdminBenefitRequestRiskFilter = "all" | "over_limit" | "pending_3d";

export function normalizeBenefitRiskFilter(value: string | null): AdminBenefitRequestRiskFilter {
  return value === "over_limit" || value === "pending_3d" ? value : "all";
}

export function parseBenefitSearchQuery(value: string | null) {
  return (value ?? "").trim();
}
