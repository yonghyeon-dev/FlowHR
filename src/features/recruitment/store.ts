import type {
  DataAccess,
  RecruitmentOpeningEntity,
  RecruitmentReferralEntity
} from "@/features/shared/data-access";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import type {
  RecruitmentOpeningItem,
  RecruitmentOpeningStatus,
  RecruitmentReferralItem,
  RecruitmentReferralSort,
  RecruitmentReferralStage
} from "@/features/recruitment/types";
import { isRecruitmentReferralTerminalStage } from "@/features/recruitment/types";

type RecruitmentStoreContext = {
  dataAccess: Pick<DataAccess, "recruitment">;
};

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

type UpdateOpeningStatusInput = {
  openingId: string;
  status: RecruitmentOpeningStatus;
  organizationId?: string;
};

type ListReferralsInput = {
  organizationId?: string;
  referrerEmployeeId?: string;
  stage?: RecruitmentReferralStage | "all";
  sort?: RecruitmentReferralSort;
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

type WithdrawReferralInput = {
  referralId: string;
  actorId: string;
};

const DEFAULT_ORG_ID = "ORG-DEMO";
const initialOpeningsStore: RecruitmentOpeningItem[] = [];
const initialReferralsStore: RecruitmentReferralItem[] = [];

function normalizeStatus<T extends string>(status: T | "all" | undefined) {
  return status && status !== "all" ? status : null;
}
const DEFAULT_REFERRAL_SORT: RecruitmentReferralSort = "updated_desc";
const STALLED_THRESHOLD_7D_MS = 7 * 24 * 60 * 60 * 1000;
const STALLED_THRESHOLD_14D_MS = 14 * 24 * 60 * 60 * 1000;
const ACTIVE_REFERRAL_STAGE_PRIORITY: Record<RecruitmentReferralStage, number> = {
  SUBMITTED: 0,
  SCREENING: 1,
  INTERVIEW: 2,
  OFFER: 3,
  HIRED: 4,
  REJECTED: 5,
  WITHDRAWN: 6
};

function normalizeReferralSort(sort: RecruitmentReferralSort | undefined): RecruitmentReferralSort {
  return sort === "stalled_priority" ? "stalled_priority" : DEFAULT_REFERRAL_SORT;
}

function compareReferralsByUpdatedAtDesc(left: RecruitmentReferralItem, right: RecruitmentReferralItem) {
  const byUpdatedAt = Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
  if (Number.isFinite(byUpdatedAt) && byUpdatedAt !== 0) {
    return byUpdatedAt;
  }
  return right.id.localeCompare(left.id);
}

function sortRecruitmentReferralItems(
  items: RecruitmentReferralItem[],
  sort: RecruitmentReferralSort,
  nowMs = Date.now()
) {
  const next = [...items];
  if (sort !== "stalled_priority") {
    next.sort(compareReferralsByUpdatedAtDesc);
    return next;
  }

  next.sort((left, right) => {
    const leftTerminal = isRecruitmentReferralTerminalStage(left.stage);
    const rightTerminal = isRecruitmentReferralTerminalStage(right.stage);
    if (leftTerminal !== rightTerminal) {
      return leftTerminal ? 1 : -1;
    }
    if (!leftTerminal && !rightTerminal) {
      const leftUpdatedAtMs = Date.parse(left.updatedAt);
      const rightUpdatedAtMs = Date.parse(right.updatedAt);
      const leftAgeMs = Number.isFinite(leftUpdatedAtMs) ? nowMs - leftUpdatedAtMs : 0;
      const rightAgeMs = Number.isFinite(rightUpdatedAtMs) ? nowMs - rightUpdatedAtMs : 0;
      const leftRiskBand = leftAgeMs >= STALLED_THRESHOLD_14D_MS ? 0 : leftAgeMs >= STALLED_THRESHOLD_7D_MS ? 1 : 2;
      const rightRiskBand =
        rightAgeMs >= STALLED_THRESHOLD_14D_MS ? 0 : rightAgeMs >= STALLED_THRESHOLD_7D_MS ? 1 : 2;
      const riskBandDelta = leftRiskBand - rightRiskBand;
      if (riskBandDelta !== 0) {
        return riskBandDelta;
      }
      const stageDelta = ACTIVE_REFERRAL_STAGE_PRIORITY[left.stage] - ACTIVE_REFERRAL_STAGE_PRIORITY[right.stage];
      if (stageDelta !== 0) {
        return stageDelta;
      }
      const byUpdatedAtAsc = leftUpdatedAtMs - rightUpdatedAtMs;
      if (Number.isFinite(byUpdatedAtAsc) && byUpdatedAtAsc !== 0) {
        return byUpdatedAtAsc;
      }
      return left.id.localeCompare(right.id);
    }
    return compareReferralsByUpdatedAtDesc(left, right);
  });

  return next;
}

export function sortRecruitmentReferralQueue(items: RecruitmentReferralItem[], sort: RecruitmentReferralSort) {
  return sortRecruitmentReferralItems(items, normalizeReferralSort(sort));
}

function resolveOrganizationId(organizationId?: string) {
  return organizationId?.trim() || DEFAULT_ORG_ID;
}

function toOpeningItem(entity: RecruitmentOpeningEntity): RecruitmentOpeningItem {
  return {
    id: entity.id,
    organizationId: entity.organizationId,
    title: entity.title,
    department: entity.department,
    employmentType: entity.employmentType,
    status: entity.status,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString()
  };
}

function toReferralItem(entity: RecruitmentReferralEntity): RecruitmentReferralItem {
  return {
    id: entity.id,
    organizationId: entity.organizationId,
    openingId: entity.openingId,
    candidateName: entity.candidateName,
    candidateEmail: entity.candidateEmail,
    referrerEmployeeId: entity.referrerEmployeeId,
    note: entity.note,
    stage: entity.stage,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString()
  };
}

function resolveContext(context?: RecruitmentStoreContext): RecruitmentStoreContext {
  if (context) {
    return context;
  }
  return {
    dataAccess: getRuntimeDataAccess()
  };
}

export function listRecruitmentOpenings(input: ListOpeningsInput = {}, context?: RecruitmentStoreContext) {
  const dataAccess = resolveContext(context).dataAccess;
  void initialOpeningsStore;
  const organizationId = resolveOrganizationId(input.organizationId);
  const status = normalizeStatus(input.status);
  return dataAccess.recruitment
    .listOpenings({
      organizationId,
      status: status ?? undefined,
      limit: 5000
    })
    .then((rows) => rows.map(toOpeningItem));
}

export function createRecruitmentOpening(input: CreateOpeningInput, context?: RecruitmentStoreContext) {
  const dataAccess = resolveContext(context).dataAccess;
  const now = new Date();
  return dataAccess.recruitment
    .createOpening({
      organizationId: resolveOrganizationId(input.organizationId),
      title: input.title.trim(),
      department: input.department.trim(),
      employmentType: input.employmentType.trim(),
      status: input.status ?? "OPEN",
      createdAt: now,
      updatedAt: now
    })
    .then(toOpeningItem);
}

export function updateRecruitmentOpeningStatus(
  input: UpdateOpeningStatusInput,
  context?: RecruitmentStoreContext
) {
  const dataAccess = resolveContext(context).dataAccess;
  const requestedOrgId = input.organizationId?.trim();
  return dataAccess.recruitment.findOpeningById(input.openingId).then((existing) => {
    if (!existing) {
      return null;
    }
    if (requestedOrgId && existing.organizationId !== requestedOrgId) {
      return null;
    }
    return dataAccess.recruitment
      .updateOpening(existing.id, {
        status: input.status,
        updatedAt: new Date()
      })
      .then(toOpeningItem);
  });
}

export function listRecruitmentReferrals(input: ListReferralsInput = {}, context?: RecruitmentStoreContext) {
  const dataAccess = resolveContext(context).dataAccess;
  void initialReferralsStore;
  const organizationId = resolveOrganizationId(input.organizationId);
  const stage = normalizeStatus(input.stage);
  const sort = normalizeReferralSort(input.sort);
  return dataAccess.recruitment
    .listReferrals({
      organizationId,
      referrerEmployeeId: input.referrerEmployeeId,
      stage: stage ?? undefined,
      limit: 5000
    })
    .then((rows) => sortRecruitmentReferralItems(rows.map(toReferralItem), sort));
}

export function createRecruitmentReferral(input: CreateReferralInput, context?: RecruitmentStoreContext) {
  const dataAccess = resolveContext(context).dataAccess;
  const now = new Date();
  return dataAccess.recruitment
    .createReferral({
      organizationId: resolveOrganizationId(input.organizationId),
      openingId: input.openingId,
      candidateName: input.candidateName.trim(),
      candidateEmail: input.candidateEmail.trim(),
      referrerEmployeeId: input.referrerEmployeeId,
      note: input.note.trim(),
      stage: "SUBMITTED",
      createdAt: now,
      updatedAt: now
    })
    .then(toReferralItem);
}

export function updateRecruitmentReferralStage(input: UpdateReferralStageInput, context?: RecruitmentStoreContext) {
  const dataAccess = resolveContext(context).dataAccess;
  return dataAccess.recruitment
    .findReferralById(input.referralId)
    .then((existing) => {
      if (!existing) {
        return null;
      }
      return dataAccess.recruitment
        .updateReferral(existing.id, {
          stage: input.stage,
          updatedAt: new Date()
        })
        .then(toReferralItem);
    });
}

export function withdrawRecruitmentReferral(input: WithdrawReferralInput, context?: RecruitmentStoreContext) {
  const dataAccess = resolveContext(context).dataAccess;
  return dataAccess.recruitment
    .findReferralById(input.referralId)
    .then((existing) => {
      if (!existing) {
        return null;
      }
      if (existing.referrerEmployeeId !== input.actorId) {
        return null;
      }
      if (!(existing.stage === "SUBMITTED" || existing.stage === "SCREENING")) {
        return null;
      }
      // target.stage = "WITHDRAWN"
      return dataAccess.recruitment
        .updateReferral(existing.id, {
          stage: "WITHDRAWN",
          updatedAt: new Date()
        })
        .then(toReferralItem);
    });
}

export function findRecruitmentOpening(openingId: string, context?: RecruitmentStoreContext) {
  const dataAccess = resolveContext(context).dataAccess;
  return dataAccess.recruitment.findOpeningById(openingId).then((entity) => (entity ? toOpeningItem(entity) : null));
}

export function findRecruitmentReferral(referralId: string, context?: RecruitmentStoreContext) {
  const dataAccess = resolveContext(context).dataAccess;
  return dataAccess.recruitment
    .findReferralById(referralId)
    .then((entity) => (entity ? toReferralItem(entity) : null));
}

export function summarizeRecruitmentReferrals(items: RecruitmentReferralItem[]) {
  const total = items.length;
  const submitted = items.filter((item) => item.stage === "SUBMITTED").length;
  const screening = items.filter((item) => item.stage === "SCREENING").length;
  const interview = items.filter((item) => item.stage === "INTERVIEW").length;
  const offer = items.filter((item) => item.stage === "OFFER").length;
  const hired = items.filter((item) => item.stage === "HIRED").length;
  const rejected = items.filter((item) => item.stage === "REJECTED").length;
  const withdrawn = items.filter((item) => item.stage === "WITHDRAWN").length;
  return { total, submitted, screening, interview, offer, hired, rejected, withdrawn };
}
