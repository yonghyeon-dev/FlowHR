export type RecruitmentOpeningStatus = "OPEN" | "CLOSED";
export type RecruitmentReferralStage =
  | "SUBMITTED"
  | "SCREENING"
  | "INTERVIEW"
  | "OFFER"
  | "HIRED"
  | "REJECTED"
  | "WITHDRAWN";
export type RecruitmentReferralSort = "updated_desc" | "stalled_priority";

export type RecruitmentOpeningItem = {
  id: string;
  organizationId: string;
  title: string;
  department: string;
  employmentType: string;
  hiringManagerId?: string;
  status: RecruitmentOpeningStatus;
  createdAt: string;
  updatedAt: string;
};

export type RecruitmentReferralItem = {
  id: string;
  organizationId: string;
  openingId: string;
  candidateName: string;
  candidateEmail: string;
  referrerEmployeeId: string;
  note: string;
  stage: RecruitmentReferralStage;
  stageReason?: string;
  createdAt: string;
  updatedAt: string;
};

const referralStageTransitionMap: Record<RecruitmentReferralStage, readonly RecruitmentReferralStage[]> = {
  SUBMITTED: ["SCREENING", "WITHDRAWN"],
  SCREENING: ["INTERVIEW", "OFFER", "REJECTED", "WITHDRAWN"],
  INTERVIEW: ["OFFER", "REJECTED", "WITHDRAWN"],
  OFFER: ["HIRED", "REJECTED", "WITHDRAWN"],
  HIRED: [],
  REJECTED: [],
  WITHDRAWN: []
};

const terminalReferralStageSet = new Set<RecruitmentReferralStage>([
  "HIRED",
  "REJECTED",
  "WITHDRAWN"
]);

export function listRecruitmentReferralNextStages(stage: RecruitmentReferralStage) {
  return [stage, ...referralStageTransitionMap[stage]];
}

export function isRecruitmentReferralTerminalStage(stage: RecruitmentReferralStage) {
  return terminalReferralStageSet.has(stage);
}

export function isRecruitmentReferralStageTransitionAllowed(
  from: RecruitmentReferralStage,
  to: RecruitmentReferralStage
) {
  if (from === to) {
    return true;
  }
  return referralStageTransitionMap[from].includes(to);
}
