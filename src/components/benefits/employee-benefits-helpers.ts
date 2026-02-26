import type { BenefitCatalogItem, BenefitRequestItem } from "@/features/benefits/types";

export type EmployeeBenefitRequestSummary = {
  total: number;
  submitted: number;
  approved: number;
  rejected: number;
  canceled: number;
};

export type EmployeeBenefitRequestRiskFilter = "all" | "pending_3d";

export const EMPTY_EMPLOYEE_BENEFIT_REQUEST_SUMMARY: EmployeeBenefitRequestSummary = {
  total: 0,
  submitted: 0,
  approved: 0,
  rejected: 0,
  canceled: 0
};

const PENDING_AGING_THRESHOLD_DAYS = 3;

export function parseBenefitCatalog(payload: unknown) {
  const catalog = (payload as { catalog?: BenefitCatalogItem[] } | null)?.catalog;
  return Array.isArray(catalog) ? catalog : [];
}

export function parseBenefitRequests(payload: unknown) {
  const requests = (payload as { requests?: BenefitRequestItem[] } | null)?.requests;
  return Array.isArray(requests) ? requests : [];
}

export function parseBenefitRequestSummary(payload: unknown) {
  const summary = (payload as { summary?: Partial<EmployeeBenefitRequestSummary> } | null)?.summary;
  if (!summary) {
    return EMPTY_EMPLOYEE_BENEFIT_REQUEST_SUMMARY;
  }
  return {
    total: Number(summary.total ?? 0),
    submitted: Number(summary.submitted ?? 0),
    approved: Number(summary.approved ?? 0),
    rejected: Number(summary.rejected ?? 0),
    canceled: Number(summary.canceled ?? 0)
  };
}

export function buildBenefitsQuery(input: Record<string, string>) {
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

export function resolveBenefitRequestPendingAgingDays(request: BenefitRequestItem) {
  if (request.status !== "SUBMITTED") {
    return null;
  }
  const requestedAtMs = Date.parse(request.requestedAt);
  if (!Number.isFinite(requestedAtMs)) {
    return null;
  }
  const diffMs = Date.now() - requestedAtMs;
  if (diffMs <= 0) {
    return 0;
  }
  return Math.floor(diffMs / (24 * 60 * 60 * 1000));
}

export function isBenefitRequestPendingAgingRisk(request: BenefitRequestItem) {
  const agingDays = resolveBenefitRequestPendingAgingDays(request);
  return typeof agingDays === "number" && agingDays >= PENDING_AGING_THRESHOLD_DAYS;
}

type FilterBenefitRequestsInput = {
  requests: BenefitRequestItem[];
  catalogById: Map<string, BenefitCatalogItem>;
  searchQuery: string;
  riskFilter: EmployeeBenefitRequestRiskFilter;
};

export function filterBenefitRequests({
  requests,
  catalogById,
  searchQuery,
  riskFilter
}: FilterBenefitRequestsInput) {
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  return requests.filter((item) => {
    if (riskFilter === "pending_3d" && !isBenefitRequestPendingAgingRisk(item)) {
      return false;
    }
    if (!normalizedSearchQuery) {
      return true;
    }
    const benefitName = (catalogById.get(item.benefitId)?.name ?? "").toLowerCase();
    const reasonText = item.reason.toLowerCase();
    return benefitName.includes(normalizedSearchQuery) || reasonText.includes(normalizedSearchQuery);
  });
}
