import type {
  BenefitCatalogItem,
  BenefitCatalogStatus,
  BenefitRequestItem,
  BenefitRequestStatus
} from "@/features/benefits/types";

type ListCatalogInput = {
  organizationId?: string;
  status?: BenefitCatalogStatus | "all";
};

type CreateCatalogInput = {
  organizationId: string;
  name: string;
  description: string;
  annualLimitKrw: number;
  status?: BenefitCatalogStatus;
};

type ListRequestsInput = {
  organizationId?: string;
  employeeId?: string;
  status?: BenefitRequestStatus | "all";
};

type CreateRequestInput = {
  organizationId: string;
  benefitId: string;
  employeeId: string;
  amountKrw: number;
  reason: string;
};

type DecideRequestInput = {
  requestId: string;
  decision: "APPROVED" | "REJECTED";
  actorId: string;
  reviewNote?: string | null;
};

const DEFAULT_ORG_ID = "ORG-DEMO";
const initialCatalogStore: BenefitCatalogItem[] = [
  {
    id: "BENEFIT-1001",
    organizationId: DEFAULT_ORG_ID,
    name: "건강검진 지원",
    description: "연 1회 지정 병원 건강검진 비용을 지원합니다.",
    annualLimitKrw: 300000,
    status: "ACTIVE",
    createdAt: "2026-02-01T00:00:00.000Z",
    updatedAt: "2026-02-01T00:00:00.000Z"
  },
  {
    id: "BENEFIT-1002",
    organizationId: DEFAULT_ORG_ID,
    name: "교육비 지원",
    description: "직무 관련 교육 수강료를 연간 한도 내 지원합니다.",
    annualLimitKrw: 500000,
    status: "ACTIVE",
    createdAt: "2026-02-03T00:00:00.000Z",
    updatedAt: "2026-02-03T00:00:00.000Z"
  }
];

const initialRequestStore: BenefitRequestItem[] = [
  {
    id: "BENEFIT-REQ-1001",
    organizationId: DEFAULT_ORG_ID,
    benefitId: "BENEFIT-1002",
    employeeId: "EMP-1001",
    amountKrw: 180000,
    reason: "직무 연관 데이터 분석 교육 신청",
    status: "SUBMITTED",
    requestedAt: "2026-02-20T01:20:00.000Z",
    reviewedAt: null,
    reviewedByActorId: null,
    reviewNote: null,
    createdAt: "2026-02-20T01:20:00.000Z",
    updatedAt: "2026-02-20T01:20:00.000Z"
  }
];

const catalogStore: BenefitCatalogItem[] = [...initialCatalogStore];
const requestStore: BenefitRequestItem[] = [...initialRequestStore];

function normalizeStatus<T extends string>(status: T | "all" | undefined) {
  return status && status !== "all" ? status : null;
}

function nextId(prefix: string) {
  const stamp = Date.now();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `${prefix}-${stamp}-${random}`;
}

function resolveOrganizationId(inputId?: string) {
  return inputId?.trim() || DEFAULT_ORG_ID;
}

export function listBenefitCatalog(input: ListCatalogInput = {}) {
  const organizationId = resolveOrganizationId(input.organizationId);
  const status = normalizeStatus(input.status);

  return catalogStore
    .filter((item) => item.organizationId === organizationId)
    .filter((item) => (status ? item.status === status : true))
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

export function createBenefitCatalogItem(input: CreateCatalogInput) {
  const now = new Date().toISOString();
  const next: BenefitCatalogItem = {
    id: nextId("BENEFIT"),
    organizationId: resolveOrganizationId(input.organizationId),
    name: input.name.trim(),
    description: input.description.trim(),
    annualLimitKrw: Math.max(0, Math.trunc(input.annualLimitKrw)),
    status: input.status ?? "ACTIVE",
    createdAt: now,
    updatedAt: now
  };

  catalogStore.unshift(next);
  return next;
}

export function listBenefitRequests(input: ListRequestsInput = {}) {
  const organizationId = resolveOrganizationId(input.organizationId);
  const status = normalizeStatus(input.status);

  return requestStore
    .filter((item) => item.organizationId === organizationId)
    .filter((item) => (input.employeeId ? item.employeeId === input.employeeId : true))
    .filter((item) => (status ? item.status === status : true))
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

export function createBenefitRequest(input: CreateRequestInput) {
  const now = new Date().toISOString();
  const next: BenefitRequestItem = {
    id: nextId("BENEFIT-REQ"),
    organizationId: resolveOrganizationId(input.organizationId),
    benefitId: input.benefitId,
    employeeId: input.employeeId,
    amountKrw: Math.max(0, Math.trunc(input.amountKrw)),
    reason: input.reason.trim(),
    status: "SUBMITTED",
    requestedAt: now,
    reviewedAt: null,
    reviewedByActorId: null,
    reviewNote: null,
    createdAt: now,
    updatedAt: now
  };

  requestStore.unshift(next);
  return next;
}

export function decideBenefitRequest(input: DecideRequestInput) {
  const target = requestStore.find((item) => item.id === input.requestId);
  if (!target) {
    return null;
  }

  const now = new Date().toISOString();
  target.status = input.decision;
  target.reviewedAt = now;
  target.reviewedByActorId = input.actorId;
  target.reviewNote = input.reviewNote?.trim() ? input.reviewNote.trim() : null;
  target.updatedAt = now;
  return target;
}

export function summarizeBenefitRequests(items: BenefitRequestItem[]) {
  const total = items.length;
  const submitted = items.filter((item) => item.status === "SUBMITTED").length;
  const approved = items.filter((item) => item.status === "APPROVED").length;
  const rejected = items.filter((item) => item.status === "REJECTED").length;
  return { total, submitted, approved, rejected };
}

export function findBenefitCatalogItem(benefitId: string) {
  return catalogStore.find((item) => item.id === benefitId) ?? null;
}
