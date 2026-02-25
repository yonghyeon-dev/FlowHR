export type RecruitmentOpeningStatus = "OPEN" | "CLOSED";
export type RecruitmentReferralStage =
  | "SUBMITTED"
  | "SCREENING"
  | "INTERVIEW"
  | "OFFER"
  | "HIRED"
  | "REJECTED";

export type RecruitmentOpeningItem = {
  id: string;
  organizationId: string;
  title: string;
  department: string;
  employmentType: string;
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
  createdAt: string;
  updatedAt: string;
};
