import type {
  BenefitCatalogItem,
  BenefitCatalogStatus,
  BenefitRequestItem,
  BenefitRequestSort,
  BenefitRequestStatus
} from "@/features/benefits/types";
import type { DataAccess } from "@/features/shared/data-access";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";

type BenefitStoreContext = {
  dataAccess: Pick<DataAccess, "benefits">;
};

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

type UpdateCatalogStatusInput = {
  benefitId: string;
  status: BenefitCatalogStatus;
};

type ListRequestsInput = {
  organizationId?: string;
  employeeId?: string;
  status?: BenefitRequestStatus | "all";
  sort?: BenefitRequestSort;
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

type CancelRequestInput = {
  requestId: string;
  actorId: string;
  cancelNote?: string | null;
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

function normalizeStatus<T extends string>(status: T | "all" | undefined) {
  return status && status !== "all" ? status : null;
}

const DEFAULT_REQUEST_SORT: BenefitRequestSort = "updated_desc";
const BENEFIT_REQUEST_STATUS_PRIORITY: Record<BenefitRequestStatus, number> = {
  SUBMITTED: 0,
  APPROVED: 1,
  REJECTED: 2,
  CANCELED: 3
};

function normalizeRequestSort(sort: BenefitRequestSort | undefined): BenefitRequestSort {
  return sort === "pending_priority" ? "pending_priority" : DEFAULT_REQUEST_SORT;
}

function compareBenefitRequestsByUpdatedAtDesc(left: BenefitRequestItem, right: BenefitRequestItem) {
  const byUpdatedAt = Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
  if (Number.isFinite(byUpdatedAt) && byUpdatedAt !== 0) {
    return byUpdatedAt;
  }
  return right.id.localeCompare(left.id);
}

function sortBenefitRequestItems(requests: BenefitRequestItem[], sort: BenefitRequestSort): BenefitRequestItem[] {
  const next = [...requests];
  if (sort !== "pending_priority") {
    next.sort(compareBenefitRequestsByUpdatedAtDesc);
    return next;
  }

  next.sort((left, right) => {
    const statusDelta =
      BENEFIT_REQUEST_STATUS_PRIORITY[left.status] - BENEFIT_REQUEST_STATUS_PRIORITY[right.status];
    if (statusDelta !== 0) {
      return statusDelta;
    }
    if (left.status === "SUBMITTED" && right.status === "SUBMITTED") {
      const leftRequestedAt = Date.parse(left.requestedAt);
      const rightRequestedAt = Date.parse(right.requestedAt);
      const byRequestedAt = leftRequestedAt - rightRequestedAt;
      if (Number.isFinite(byRequestedAt) && byRequestedAt !== 0) {
        return byRequestedAt;
      }
    }
    return compareBenefitRequestsByUpdatedAtDesc(left, right);
  });

  return next;
}

export function sortBenefitRequestQueue(items: BenefitRequestItem[], sort: BenefitRequestSort) {
  return sortBenefitRequestItems(items, normalizeRequestSort(sort));
}

function resolveOrganizationId(inputId?: string) {
  return inputId?.trim() || DEFAULT_ORG_ID;
}

function toCatalogItem(entity: {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  annualLimitKrw: number;
  status: BenefitCatalogStatus;
  createdAt: Date;
  updatedAt: Date;
}): BenefitCatalogItem {
  return {
    id: entity.id,
    organizationId: entity.organizationId,
    name: entity.name,
    description: entity.description,
    annualLimitKrw: entity.annualLimitKrw,
    status: entity.status,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString()
  };
}

function toRequestItem(entity: {
  id: string;
  organizationId: string;
  benefitId: string;
  employeeId: string;
  amountKrw: number;
  reason: string;
  status: BenefitRequestStatus;
  requestedAt: Date;
  reviewedAt: Date | null;
  reviewedByActorId: string | null;
  reviewNote: string | null;
  createdAt: Date;
  updatedAt: Date;
}): BenefitRequestItem {
  return {
    id: entity.id,
    organizationId: entity.organizationId,
    benefitId: entity.benefitId,
    employeeId: entity.employeeId,
    amountKrw: entity.amountKrw,
    reason: entity.reason,
    status: entity.status,
    requestedAt: entity.requestedAt.toISOString(),
    reviewedAt: entity.reviewedAt ? entity.reviewedAt.toISOString() : null,
    reviewedByActorId: entity.reviewedByActorId,
    reviewNote: entity.reviewNote,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString()
  };
}

function resolveContext(context?: BenefitStoreContext): BenefitStoreContext {
  if (context) {
    return context;
  }
  return {
    dataAccess: getRuntimeDataAccess()
  };
}

async function ensureInitialBenefitSeed(context: BenefitStoreContext, organizationId: string) {
  if (organizationId !== DEFAULT_ORG_ID) {
    return;
  }

  const existingCatalog = await context.dataAccess.benefits.listCatalogItems({
    organizationId,
    limit: 1
  });

  if (existingCatalog.length === 0) {
    for (const item of initialCatalogStore) {
      await context.dataAccess.benefits.createCatalogItem({
        organizationId,
        name: item.name,
        description: item.description,
        annualLimitKrw: item.annualLimitKrw,
        status: item.status,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt)
      });
    }
  }

  const existingRequests = await context.dataAccess.benefits.listRequests({
    organizationId,
    limit: 1
  });
  if (existingRequests.length > 0) {
    return;
  }

  const catalog = await context.dataAccess.benefits.listCatalogItems({
    organizationId,
    limit: 500
  });
  if (catalog.length === 0) {
    return;
  }

  const fallbackBenefit =
    catalog.find((item) => item.name.includes("교육")) ??
    catalog.find((item) => item.name.includes("Education")) ??
    catalog[0];
  const initial = initialRequestStore[0];
  if (!initial || !fallbackBenefit) {
    return;
  }

  await context.dataAccess.benefits.createRequest({
    organizationId,
    benefitId: fallbackBenefit.id,
    employeeId: initial.employeeId,
    amountKrw: initial.amountKrw,
    reason: initial.reason,
    status: initial.status,
    requestedAt: new Date(initial.requestedAt),
    reviewedAt: initial.reviewedAt ? new Date(initial.reviewedAt) : null,
    reviewedByActorId: initial.reviewedByActorId,
    reviewNote: initial.reviewNote,
    createdAt: new Date(initial.createdAt),
    updatedAt: new Date(initial.updatedAt)
  });
}

export function listBenefitCatalog(input: ListCatalogInput = {}, context?: BenefitStoreContext) {
  const resolved = resolveContext(context);
  const organizationId = resolveOrganizationId(input.organizationId);
  const status = normalizeStatus(input.status);

  return ensureInitialBenefitSeed(resolved, organizationId).then(() =>
    resolved.dataAccess.benefits
      .listCatalogItems({
        organizationId,
        status: status ?? undefined,
        limit: 5000
      })
      .then((rows) => rows.map(toCatalogItem))
  );
}

export function createBenefitCatalogItem(input: CreateCatalogInput, context?: BenefitStoreContext) {
  const resolved = resolveContext(context);
  const now = new Date();
  return resolved.dataAccess.benefits
    .createCatalogItem({
      organizationId: resolveOrganizationId(input.organizationId),
      name: input.name.trim(),
      description: input.description.trim(),
      annualLimitKrw: Math.max(0, Math.trunc(input.annualLimitKrw)),
      status: input.status ?? "ACTIVE",
      createdAt: now,
      updatedAt: now
    })
    .then(toCatalogItem);
}

export function updateBenefitCatalogItemStatus(input: UpdateCatalogStatusInput, context?: BenefitStoreContext) {
  const resolved = resolveContext(context);
  return resolved.dataAccess.benefits.findCatalogItemById(input.benefitId).then((existing) => {
    if (!existing) {
      return null;
    }

    return resolved.dataAccess.benefits
      .updateCatalogItem(input.benefitId, {
        status: input.status,
        updatedAt: new Date()
      })
      .then(toCatalogItem);
  });
}

export function listBenefitRequests(input: ListRequestsInput = {}, context?: BenefitStoreContext) {
  const resolved = resolveContext(context);
  const organizationId = resolveOrganizationId(input.organizationId);
  const status = normalizeStatus(input.status);
  const sort = normalizeRequestSort(input.sort);

  return ensureInitialBenefitSeed(resolved, organizationId).then(() =>
    resolved.dataAccess.benefits
      .listRequests({
        organizationId,
        employeeId: input.employeeId,
        status: status ?? undefined,
        limit: 5000
      })
      .then((rows) => sortBenefitRequestItems(rows.map(toRequestItem), sort))
  );
}

export function createBenefitRequest(input: CreateRequestInput, context?: BenefitStoreContext) {
  const resolved = resolveContext(context);
  const now = new Date();
  return resolved.dataAccess.benefits
    .createRequest({
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
    })
    .then(toRequestItem);
}

export function decideBenefitRequest(input: DecideRequestInput, context?: BenefitStoreContext) {
  const resolved = resolveContext(context);
  return resolved.dataAccess.benefits.findRequestById(input.requestId).then((existing) => {
    if (!existing) {
      return null;
    }
    if (existing.status !== "SUBMITTED") {
      return null;
    }

    const now = new Date();
    return resolved.dataAccess.benefits
      .updateRequest(existing.id, {
        status: input.decision,
        reviewedAt: now,
        reviewedByActorId: input.actorId,
        reviewNote: input.reviewNote?.trim() ? input.reviewNote.trim() : null,
        updatedAt: now
      })
      .then(toRequestItem);
  });
}

export function cancelBenefitRequest(input: CancelRequestInput, context?: BenefitStoreContext) {
  const resolved = resolveContext(context);
  return resolved.dataAccess.benefits.findRequestById(input.requestId).then((existing) => {
    if (!existing) {
      return null;
    }
    if (existing.status !== "SUBMITTED" || existing.employeeId !== input.actorId) {
      return null;
    }

    const target = toRequestItem(existing);
    target.status = "CANCELED";

    const now = new Date();
    return resolved.dataAccess.benefits
      .updateRequest(existing.id, {
        status: "CANCELED",
        reviewedAt: now,
        reviewedByActorId: input.actorId,
        reviewNote: input.cancelNote?.trim() ? input.cancelNote.trim() : null,
        updatedAt: now
      })
      .then(toRequestItem);
  });
}

export function summarizeBenefitRequests(items: BenefitRequestItem[]) {
  const total = items.length;
  const submitted = items.filter((item) => item.status === "SUBMITTED").length;
  const approved = items.filter((item) => item.status === "APPROVED").length;
  const rejected = items.filter((item) => item.status === "REJECTED").length;
  const canceled = items.filter((item) => item.status === "CANCELED").length;
  return { total, submitted, approved, rejected, canceled };
}

export function findBenefitCatalogItem(benefitId: string, context?: BenefitStoreContext) {
  const resolved = resolveContext(context);
  return resolved.dataAccess.benefits
    .findCatalogItemById(benefitId)
    .then((entity) => (entity ? toCatalogItem(entity) : null));
}

export function findBenefitRequest(requestId: string, context?: BenefitStoreContext) {
  const resolved = resolveContext(context);
  return resolved.dataAccess.benefits
    .findRequestById(requestId)
    .then((entity) => (entity ? toRequestItem(entity) : null));
}

