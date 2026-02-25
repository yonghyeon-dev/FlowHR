import type {
  RecruitmentOpeningItem,
  RecruitmentOpeningStatus,
  RecruitmentReferralItem,
  RecruitmentReferralStage
} from "@/features/recruitment/types";

type ListOpeningsInput = {
  organizationId?: string;
  status?: RecruitmentOpeningStatus | "all";
};

type CreateOpeningInput = {
  organizationId: string;
  title: string;
  department: string;
  employmentType: string;
  status?: RecruitmentOpeningStatus;
};

type ListReferralsInput = {
  organizationId?: string;
  referrerEmployeeId?: string;
  stage?: RecruitmentReferralStage | "all";
};

type CreateReferralInput = {
  organizationId: string;
  openingId: string;
  candidateName: string;
  candidateEmail: string;
  referrerEmployeeId: string;
  note: string;
};

type UpdateReferralStageInput = {
  referralId: string;
  stage: RecruitmentReferralStage;
};

const DEFAULT_ORG_ID = "ORG-DEMO";

const initialOpeningsStore: RecruitmentOpeningItem[] = [
  {
    id: "OPENING-1001",
    organizationId: DEFAULT_ORG_ID,
    title: "백엔드 엔지니어",
    department: "플랫폼",
    employmentType: "정규직",
    status: "OPEN",
    createdAt: "2026-02-01T00:00:00.000Z",
    updatedAt: "2026-02-01T00:00:00.000Z"
  },
  {
    id: "OPENING-1002",
    organizationId: DEFAULT_ORG_ID,
    title: "프로덕트 디자이너",
    department: "제품",
    employmentType: "정규직",
    status: "OPEN",
    createdAt: "2026-02-04T00:00:00.000Z",
    updatedAt: "2026-02-04T00:00:00.000Z"
  }
];

const initialReferralsStore: RecruitmentReferralItem[] = [
  {
    id: "REFERRAL-1001",
    organizationId: DEFAULT_ORG_ID,
    openingId: "OPENING-1001",
    candidateName: "김민준",
    candidateEmail: "minjun@example.com",
    referrerEmployeeId: "EMP-1001",
    note: "대규모 트래픽 서비스 운영 경험 보유",
    stage: "SCREENING",
    createdAt: "2026-02-21T03:10:00.000Z",
    updatedAt: "2026-02-22T02:00:00.000Z"
  }
];

const openingsStore: RecruitmentOpeningItem[] = [...initialOpeningsStore];
const referralsStore: RecruitmentReferralItem[] = [...initialReferralsStore];

function normalizeStatus<T extends string>(status: T | "all" | undefined) {
  return status && status !== "all" ? status : null;
}

function resolveOrganizationId(organizationId?: string) {
  return organizationId?.trim() || DEFAULT_ORG_ID;
}

function nextId(prefix: string) {
  const stamp = Date.now();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `${prefix}-${stamp}-${random}`;
}

export function listRecruitmentOpenings(input: ListOpeningsInput = {}) {
  const organizationId = resolveOrganizationId(input.organizationId);
  const status = normalizeStatus(input.status);
  return openingsStore
    .filter((opening) => opening.organizationId === organizationId)
    .filter((opening) => (status ? opening.status === status : true))
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

export function createRecruitmentOpening(input: CreateOpeningInput) {
  const now = new Date().toISOString();
  const next: RecruitmentOpeningItem = {
    id: nextId("OPENING"),
    organizationId: resolveOrganizationId(input.organizationId),
    title: input.title.trim(),
    department: input.department.trim(),
    employmentType: input.employmentType.trim(),
    status: input.status ?? "OPEN",
    createdAt: now,
    updatedAt: now
  };
  openingsStore.unshift(next);
  return next;
}

export function listRecruitmentReferrals(input: ListReferralsInput = {}) {
  const organizationId = resolveOrganizationId(input.organizationId);
  const stage = normalizeStatus(input.stage);
  return referralsStore
    .filter((referral) => referral.organizationId === organizationId)
    .filter((referral) => (input.referrerEmployeeId ? referral.referrerEmployeeId === input.referrerEmployeeId : true))
    .filter((referral) => (stage ? referral.stage === stage : true))
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

export function createRecruitmentReferral(input: CreateReferralInput) {
  const now = new Date().toISOString();
  const next: RecruitmentReferralItem = {
    id: nextId("REFERRAL"),
    organizationId: resolveOrganizationId(input.organizationId),
    openingId: input.openingId,
    candidateName: input.candidateName.trim(),
    candidateEmail: input.candidateEmail.trim(),
    referrerEmployeeId: input.referrerEmployeeId,
    note: input.note.trim(),
    stage: "SUBMITTED",
    createdAt: now,
    updatedAt: now
  };
  referralsStore.unshift(next);
  return next;
}

export function updateRecruitmentReferralStage(input: UpdateReferralStageInput) {
  const target = referralsStore.find((referral) => referral.id === input.referralId);
  if (!target) {
    return null;
  }

  const now = new Date().toISOString();
  target.stage = input.stage;
  target.updatedAt = now;
  return target;
}

export function findRecruitmentOpening(openingId: string) {
  return openingsStore.find((opening) => opening.id === openingId) ?? null;
}

export function summarizeRecruitmentReferrals(items: RecruitmentReferralItem[]) {
  const total = items.length;
  const submitted = items.filter((item) => item.stage === "SUBMITTED").length;
  const screening = items.filter((item) => item.stage === "SCREENING").length;
  const interview = items.filter((item) => item.stage === "INTERVIEW").length;
  const offer = items.filter((item) => item.stage === "OFFER").length;
  const hired = items.filter((item) => item.stage === "HIRED").length;
  const rejected = items.filter((item) => item.stage === "REJECTED").length;
  return { total, submitted, screening, interview, offer, hired, rejected };
}
