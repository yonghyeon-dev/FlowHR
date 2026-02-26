import type {
  RecruitmentOpeningItem,
  RecruitmentReferralItem,
  RecruitmentReferralStage
} from "@/features/recruitment/types";

export type EmployeeReferralSummary = {
  total: number;
  submitted: number;
  screening: number;
  interview: number;
  offer: number;
  hired: number;
  rejected: number;
  withdrawn: number;
};

export type EmployeeReferralRiskFilter = "all" | "stalled_7d" | "stalled_14d";

export const EMPTY_EMPLOYEE_REFERRAL_SUMMARY: EmployeeReferralSummary = {
  total: 0,
  submitted: 0,
  screening: 0,
  interview: 0,
  offer: 0,
  hired: 0,
  rejected: 0,
  withdrawn: 0
};

export const TERMINAL_REFERRAL_STAGES: RecruitmentReferralStage[] = ["HIRED", "REJECTED", "WITHDRAWN"];
const STALLED_REFERRAL_DAYS = 7;
const CRITICAL_STALLED_REFERRAL_DAYS = 14;

export function parseRecruitmentOpenings(payload: unknown) {
  const openings = (payload as { openings?: RecruitmentOpeningItem[] } | null)?.openings;
  return Array.isArray(openings) ? openings : [];
}

export function parseRecruitmentReferrals(payload: unknown) {
  const referrals = (payload as { referrals?: RecruitmentReferralItem[] } | null)?.referrals;
  return Array.isArray(referrals) ? referrals : [];
}

export function parseRecruitmentReferralSummary(payload: unknown) {
  const summary = (payload as { summary?: Partial<EmployeeReferralSummary> } | null)?.summary;
  if (!summary) {
    return EMPTY_EMPLOYEE_REFERRAL_SUMMARY;
  }
  return {
    total: Number(summary.total ?? 0),
    submitted: Number(summary.submitted ?? 0),
    screening: Number(summary.screening ?? 0),
    interview: Number(summary.interview ?? 0),
    offer: Number(summary.offer ?? 0),
    hired: Number(summary.hired ?? 0),
    rejected: Number(summary.rejected ?? 0),
    withdrawn: Number(summary.withdrawn ?? 0)
  };
}

export function buildRecruitmentQuery(input: Record<string, string>) {
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

export function resolveReferralStalledDays(referral: RecruitmentReferralItem) {
  if (TERMINAL_REFERRAL_STAGES.includes(referral.stage)) {
    return null;
  }
  const updatedAtMs = Date.parse(referral.updatedAt);
  if (!Number.isFinite(updatedAtMs)) {
    return null;
  }
  const diffMs = Date.now() - updatedAtMs;
  if (diffMs <= 0) {
    return 0;
  }
  return Math.floor(diffMs / (24 * 60 * 60 * 1000));
}

export function isReferralStalledForRiskFilter(
  referral: RecruitmentReferralItem,
  riskFilter: EmployeeReferralRiskFilter
) {
  if (riskFilter === "all") {
    return true;
  }
  const stalledDays = resolveReferralStalledDays(referral);
  if (typeof stalledDays !== "number") {
    return false;
  }
  if (riskFilter === "stalled_14d") {
    return stalledDays >= CRITICAL_STALLED_REFERRAL_DAYS;
  }
  return stalledDays >= STALLED_REFERRAL_DAYS;
}

export function countStalledReferrals(
  referrals: RecruitmentReferralItem[],
  riskFilter: Extract<EmployeeReferralRiskFilter, "stalled_7d" | "stalled_14d">
) {
  return referrals.filter((referral) => isReferralStalledForRiskFilter(referral, riskFilter)).length;
}

type FilterEmployeeReferralsInput = {
  referrals: RecruitmentReferralItem[];
  openingById: Map<string, RecruitmentOpeningItem>;
  searchQuery: string;
  riskFilter: EmployeeReferralRiskFilter;
  openingFilter: string;
};

export function filterEmployeeReferrals({
  referrals,
  openingById,
  searchQuery,
  riskFilter,
  openingFilter
}: FilterEmployeeReferralsInput) {
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  return referrals.filter((referral) => {
    if (openingFilter !== "all" && referral.openingId !== openingFilter) {
      return false;
    }
    if (!isReferralStalledForRiskFilter(referral, riskFilter)) {
      return false;
    }
    if (!normalizedSearchQuery) {
      return true;
    }
    const openingTitle = (openingById.get(referral.openingId)?.title ?? "").toLowerCase();
    const candidateNameText = referral.candidateName.toLowerCase();
    const candidateEmailText = referral.candidateEmail.toLowerCase();
    const noteText = referral.note.toLowerCase();
    return (
      openingTitle.includes(normalizedSearchQuery) ||
      candidateNameText.includes(normalizedSearchQuery) ||
      candidateEmailText.includes(normalizedSearchQuery) ||
      noteText.includes(normalizedSearchQuery)
    );
  });
}
