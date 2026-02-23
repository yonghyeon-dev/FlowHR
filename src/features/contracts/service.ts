import { createHash, randomUUID } from "node:crypto";

import type { Actor } from "@/lib/actor";
import { applyApprovalExecutionAction } from "@/features/approval/service";
import type { AuditLogEntity, DataAccess } from "@/features/shared/data-access";
import { requireEmployeeWithinTenant } from "@/features/shared/tenant-scope";
import { ensureTenantMatch, resolveTenantScope } from "@/features/shared/tenant-scope";
import { ServiceError } from "@/features/shared/service-error";

import type {
  contractApprovalActionSchema,
  contractApprovalStatusSchema,
  contractDocumentStatusSchema,
  contractTemplateCategorySchema,
  contractTemplateStatusSchema,
  contractEmployeeResponseActionSchema
} from "@/features/contracts/schemas";

type ContractTemplateCategory = (typeof contractTemplateCategorySchema)["_type"];
type ContractTemplateStatus = (typeof contractTemplateStatusSchema)["_type"];
type ContractDocumentStatus = (typeof contractDocumentStatusSchema)["_type"];
type ContractApprovalStatus = (typeof contractApprovalStatusSchema)["_type"];
type ContractApprovalAction = (typeof contractApprovalActionSchema)["_type"];
type ContractEmployeeResponseAction = (typeof contractEmployeeResponseActionSchema)["_type"];

type ServiceContext = {
  actor: Actor | null;
  dataAccess: DataAccess;
};

type ContractTemplateRecord = {
  id: string;
  organizationId: string;
  name: string;
  category: ContractTemplateCategory;
  body: string;
  status: ContractTemplateStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
  updatedByActorId: string | null;
};

type ContractDocumentRecord = {
  id: string;
  organizationId: string;
  templateId: string;
  templateVersion: number;
  title: string;
  employeeId: string;
  status: ContractDocumentStatus;
  approvalStatus: ContractApprovalStatus;
  approvalExecutionId: string | null;
  approvalCycle: number;
  requiresApproval: boolean;
  documentHash: string;
  sentAt: string | null;
  sentByActorId: string | null;
  respondedAt: string | null;
  respondedByActorId: string | null;
  employeeDecision: "SIGNED" | "REJECTED" | null;
  signatureHash: string | null;
  signatureEvidenceHash: string | null;
  responseComment: string | null;
  expiresAt: string | null;
  expiredAt: string | null;
  renewalOfDocumentId: string | null;
  createdAt: string;
  updatedAt: string;
  updatedByActorId: string | null;
};

type ListContractTemplatesInput = {
  organizationId?: string;
  category?: ContractTemplateCategory;
  status?: ContractTemplateStatus;
  search?: string;
};

type CreateContractTemplateInput = {
  organizationId?: string;
  name: string;
  category: ContractTemplateCategory;
  body: string;
  status?: ContractTemplateStatus;
};

type UpdateContractTemplateInput = {
  name?: string;
  category?: ContractTemplateCategory;
  body?: string;
  status?: ContractTemplateStatus;
};

type ListContractDocumentsInput = {
  organizationId?: string;
  employeeId?: string;
  templateId?: string;
  status?: ContractDocumentStatus;
  approvalStatus?: ContractApprovalStatus;
  expiresWithinDays?: number;
};

type CreateContractDocumentInput = {
  organizationId?: string;
  templateId: string;
  employeeId: string;
  title?: string;
  expiresAt?: Date;
  requiresApproval?: boolean;
};

type RequestContractDocumentApprovalInput = {
  requestedAt?: Date;
};

type DecideContractDocumentApprovalInput = {
  action: ContractApprovalAction;
  decidedAt?: Date;
};

type SendContractDocumentInput = {
  sentAt?: Date;
  bypassApproval?: boolean;
};

type RespondContractDocumentInput = {
  action: ContractEmployeeResponseAction;
  comment?: string;
  signatureInput?: string;
  expectedDocumentHash?: string;
  respondedAt?: Date;
};

type RenewContractDocumentInput = {
  newExpiresAt?: Date;
  copyRequiresApproval?: boolean;
};

type ExpireContractDocumentInput = {
  reason?: string;
  expiredAt?: Date;
};

const CONTRACT_TEMPLATE_ENTITY_TYPE = "ContractTemplate";
const CONTRACT_DOCUMENT_ENTITY_TYPE = "ContractDocument";
const CONTRACT_APPROVAL_DOMAIN = "PAYROLL";

const CONTRACT_TEMPLATE_ACTIONS = {
  created: "contract.template.created",
  updated: "contract.template.updated"
} as const;

const CONTRACT_DOCUMENT_ACTIONS = {
  created: "contract.document.created",
  approvalRequested: "contract.document.approval.requested",
  approvalDecided: "contract.document.approval.decided",
  sent: "contract.document.sent",
  responded: "contract.document.responded",
  expired: "contract.document.expired",
  renewed: "contract.document.renewed"
} as const;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readNumber(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }
  return value;
}

function readBoolean(value: unknown): boolean | null {
  if (typeof value !== "boolean") {
    return null;
  }
  return value;
}

function normalizeIsoString(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ServiceError(400, "invalid datetime value");
  }
  return date.toISOString();
}

function nowIso(): string {
  return new Date().toISOString();
}

function hash(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function toId(prefix: "CT" | "CD"): string {
  return `${prefix}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

function isContractAdminRole(role: Actor["role"]) {
  return role === "admin" || role === "system" || role === "manager" || role === "payroll_operator";
}

function requireActor(context: ServiceContext): Actor {
  if (!context.actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }
  return context.actor;
}

function requireContractAdmin(context: ServiceContext): Actor {
  const actor = requireActor(context);
  if (!isContractAdminRole(actor.role)) {
    throw new ServiceError(403, "contract admin permission required");
  }
  return actor;
}

async function resolveOrganizationId(
  context: ServiceContext,
  requestedOrganizationId?: string
): Promise<string> {
  const actor = requireActor(context);
  const requested = requestedOrganizationId?.trim() ?? "";
  const resolved = requested || actor.organizationId || "";
  if (!resolved) {
    throw new ServiceError(400, "organizationId is required");
  }

  const tenantScope = resolveTenantScope(actor);
  ensureTenantMatch(tenantScope, resolved, "organization not found");

  const organization = await context.dataAccess.organizations.findById(resolved);
  if (!organization) {
    throw new ServiceError(404, "organization not found");
  }
  return organization.id;
}

function resolveOptionalOrganizationFilter(
  actor: Actor,
  requestedOrganizationId?: string
): string | undefined {
  const requested = requestedOrganizationId?.trim();
  if (requested) {
    const tenantScope = resolveTenantScope(actor);
    ensureTenantMatch(tenantScope, requested, "organization not found");
    return requested;
  }

  if (actor.organizationId) {
    return actor.organizationId;
  }

  return undefined;
}

async function appendAudit(
  context: ServiceContext,
  input: {
    action: string;
    entityType: string;
    entityId: string;
    organizationId: string;
    payload: unknown;
  }
) {
  const actor = requireActor(context);
  await context.dataAccess.audit.append({
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    organizationId: input.organizationId,
    actorRole: actor.role,
    actorId: actor.id,
    payload: input.payload
  });
}

function templateFromAudit(entry: AuditLogEntity): ContractTemplateRecord | null {
  if (!isObject(entry.payload)) {
    return null;
  }
  const template = (entry.payload as Record<string, unknown>).template;
  if (!isObject(template)) {
    return null;
  }

  const id = readString(template.id);
  const organizationId = readString(template.organizationId);
  const name = readString(template.name);
  const category = readString(template.category) as ContractTemplateCategory | null;
  const body = readString(template.body);
  const status = readString(template.status) as ContractTemplateStatus | null;
  const version = readNumber(template.version);
  const createdAt = readString(template.createdAt);
  const updatedAt = readString(template.updatedAt);
  const updatedByActorId = readString(template.updatedByActorId);

  if (
    !id ||
    !organizationId ||
    !name ||
    !category ||
    !body ||
    !status ||
    version === null ||
    !createdAt ||
    !updatedAt
  ) {
    return null;
  }

  return {
    id,
    organizationId,
    name,
    category,
    body,
    status,
    version,
    createdAt,
    updatedAt,
    updatedByActorId
  };
}

function documentFromAudit(entry: AuditLogEntity): ContractDocumentRecord | null {
  if (!isObject(entry.payload)) {
    return null;
  }
  const document = (entry.payload as Record<string, unknown>).document;
  if (!isObject(document)) {
    return null;
  }

  const id = readString(document.id);
  const organizationId = readString(document.organizationId);
  const templateId = readString(document.templateId);
  const templateVersion = readNumber(document.templateVersion);
  const title = readString(document.title);
  const employeeId = readString(document.employeeId);
  const status = readString(document.status) as ContractDocumentStatus | null;
  const approvalStatus = readString(document.approvalStatus) as ContractApprovalStatus | null;
  const approvalExecutionId = readString(document.approvalExecutionId);
  const approvalCycleRaw = readNumber(document.approvalCycle);
  const requiresApproval = readBoolean(document.requiresApproval);
  const documentHash = readString(document.documentHash);
  const sentAt = readString(document.sentAt);
  const sentByActorId = readString(document.sentByActorId);
  const respondedAt = readString(document.respondedAt);
  const respondedByActorId = readString(document.respondedByActorId);
  const employeeDecision = readString(document.employeeDecision) as "SIGNED" | "REJECTED" | null;
  const signatureHash = readString(document.signatureHash);
  const signatureEvidenceHash = readString(document.signatureEvidenceHash);
  const responseComment = readString(document.responseComment);
  const expiresAt = readString(document.expiresAt);
  const expiredAt = readString(document.expiredAt);
  const renewalOfDocumentId = readString(document.renewalOfDocumentId);
  const createdAt = readString(document.createdAt);
  const updatedAt = readString(document.updatedAt);
  const updatedByActorId = readString(document.updatedByActorId);

  if (
    !id ||
    !organizationId ||
    !templateId ||
    templateVersion === null ||
    !title ||
    !employeeId ||
    !status ||
    !approvalStatus ||
    requiresApproval === null ||
    !documentHash ||
    !createdAt ||
    !updatedAt
  ) {
    return null;
  }

  return {
    id,
    organizationId,
    templateId,
    templateVersion,
    title,
    employeeId,
    status,
    approvalStatus,
    approvalExecutionId,
    approvalCycle: approvalCycleRaw === null ? 0 : approvalCycleRaw,
    requiresApproval,
    documentHash,
    sentAt,
    sentByActorId,
    respondedAt,
    respondedByActorId,
    employeeDecision,
    signatureHash,
    signatureEvidenceHash,
    responseComment,
    expiresAt,
    expiredAt,
    renewalOfDocumentId,
    createdAt,
    updatedAt,
    updatedByActorId
  };
}

async function listTemplateSnapshots(dataAccess: DataAccess, organizationId?: string) {
  const logs = await dataAccess.audit.list({
    entityType: CONTRACT_TEMPLATE_ENTITY_TYPE,
    organizationId,
    limit: 5_000
  });

  const map = new Map<string, ContractTemplateRecord>();
  for (const entry of logs) {
    if (!entry.action.startsWith("contract.template.")) {
      continue;
    }
    const template = templateFromAudit(entry);
    if (!template) {
      continue;
    }
    map.set(template.id, template);
  }

  return Array.from(map.values()).sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt)
  );
}

async function listDocumentSnapshots(dataAccess: DataAccess, organizationId?: string) {
  const logs = await dataAccess.audit.list({
    entityType: CONTRACT_DOCUMENT_ENTITY_TYPE,
    organizationId,
    limit: 10_000
  });

  const map = new Map<string, ContractDocumentRecord>();
  for (const entry of logs) {
    if (!entry.action.startsWith("contract.document.")) {
      continue;
    }
    const document = documentFromAudit(entry);
    if (!document) {
      continue;
    }
    map.set(document.id, document);
  }

  return Array.from(map.values()).sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt)
  );
}

function hashContractDocument(input: {
  templateId: string;
  templateVersion: number;
  employeeId: string;
  title: string;
  templateBody: string;
}) {
  return hash(
    [
      input.templateId,
      String(input.templateVersion),
      input.employeeId,
      input.title,
      input.templateBody
    ].join("|")
  );
}

async function findTemplateForActor(
  context: ServiceContext,
  templateId: string,
  requestedOrganizationId?: string
): Promise<ContractTemplateRecord> {
  const actor = requireActor(context);
  const organizationFilter = resolveOptionalOrganizationFilter(actor, requestedOrganizationId);
  const templates = await listTemplateSnapshots(context.dataAccess, organizationFilter);
  const matched = templates.find((template) => template.id === templateId);
  if (!matched) {
    throw new ServiceError(404, "contract template not found");
  }
  return matched;
}

async function findDocumentForActor(
  context: ServiceContext,
  documentId: string,
  requestedOrganizationId?: string
): Promise<ContractDocumentRecord> {
  const actor = requireActor(context);
  const organizationFilter = resolveOptionalOrganizationFilter(actor, requestedOrganizationId);
  const documents = await listDocumentSnapshots(context.dataAccess, organizationFilter);
  const matched = documents.find((document) => document.id === documentId);
  if (!matched) {
    throw new ServiceError(404, "contract document not found");
  }
  return matched;
}

export async function listContractTemplates(
  context: ServiceContext,
  input: ListContractTemplatesInput
): Promise<{ templates: ContractTemplateRecord[] }> {
  const actor = requireActor(context);
  const organizationFilter = resolveOptionalOrganizationFilter(actor, input.organizationId);
  const templates = await listTemplateSnapshots(context.dataAccess, organizationFilter);

  let rows = templates;
  if (actor.role === "employee") {
    rows = rows.filter((template) => template.status === "ACTIVE");
  }

  if (input.category) {
    rows = rows.filter((template) => template.category === input.category);
  }
  if (input.status) {
    rows = rows.filter((template) => template.status === input.status);
  }
  if (input.search) {
    const needle = input.search.trim().toLowerCase();
    rows = rows.filter((template) =>
      `${template.id} ${template.name} ${template.body}`.toLowerCase().includes(needle)
    );
  }

  return { templates: rows };
}

export async function createContractTemplate(
  context: ServiceContext,
  input: CreateContractTemplateInput
): Promise<{ template: ContractTemplateRecord }> {
  const actor = requireContractAdmin(context);
  const organizationId = await resolveOrganizationId(context, input.organizationId);
  const timestamp = nowIso();

  const template: ContractTemplateRecord = {
    id: toId("CT"),
    organizationId,
    name: input.name.trim(),
    category: input.category,
    body: input.body.trim(),
    status: input.status ?? "DRAFT",
    version: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
    updatedByActorId: actor.id
  };

  await appendAudit(context, {
    action: CONTRACT_TEMPLATE_ACTIONS.created,
    entityType: CONTRACT_TEMPLATE_ENTITY_TYPE,
    entityId: template.id,
    organizationId,
    payload: { template }
  });

  return { template };
}

export async function updateContractTemplate(
  context: ServiceContext,
  templateId: string,
  input: UpdateContractTemplateInput
): Promise<{ template: ContractTemplateRecord }> {
  const actor = requireContractAdmin(context);
  const existing = await findTemplateForActor(context, templateId);

  const nextName = input.name?.trim() ?? existing.name;
  const nextCategory = input.category ?? existing.category;
  const nextBody = input.body?.trim() ?? existing.body;
  const nextStatus = input.status ?? existing.status;

  const contentChanged =
    nextName !== existing.name || nextCategory !== existing.category || nextBody !== existing.body;

  const template: ContractTemplateRecord = {
    ...existing,
    name: nextName,
    category: nextCategory,
    body: nextBody,
    status: nextStatus,
    version: contentChanged ? existing.version + 1 : existing.version,
    updatedAt: nowIso(),
    updatedByActorId: actor.id
  };

  await appendAudit(context, {
    action: CONTRACT_TEMPLATE_ACTIONS.updated,
    entityType: CONTRACT_TEMPLATE_ENTITY_TYPE,
    entityId: template.id,
    organizationId: template.organizationId,
    payload: { template }
  });

  return { template };
}

export async function listContractDocuments(
  context: ServiceContext,
  input: ListContractDocumentsInput
): Promise<{ documents: ContractDocumentRecord[] }> {
  const actor = requireActor(context);
  const organizationFilter = resolveOptionalOrganizationFilter(actor, input.organizationId);

  if (actor.role === "employee" && input.employeeId && input.employeeId !== actor.id) {
    throw new ServiceError(403, "employee can only read own contract documents");
  }

  let rows = await listDocumentSnapshots(context.dataAccess, organizationFilter);

  if (actor.role === "employee") {
    rows = rows.filter((document) => document.employeeId === actor.id);
  } else if (input.employeeId) {
    rows = rows.filter((document) => document.employeeId === input.employeeId);
  }

  if (input.templateId) {
    rows = rows.filter((document) => document.templateId === input.templateId);
  }
  if (input.status) {
    rows = rows.filter((document) => document.status === input.status);
  }
  if (input.approvalStatus) {
    rows = rows.filter((document) => document.approvalStatus === input.approvalStatus);
  }
  if (input.expiresWithinDays !== undefined) {
    const now = Date.now();
    const limit = now + input.expiresWithinDays * 24 * 60 * 60 * 1000;
    rows = rows.filter((document) => {
      if (!document.expiresAt) {
        return false;
      }
      const expiresAt = new Date(document.expiresAt).getTime();
      return Number.isFinite(expiresAt) && expiresAt >= now && expiresAt <= limit;
    });
  }

  return { documents: rows };
}

export async function createContractDocument(
  context: ServiceContext,
  input: CreateContractDocumentInput
): Promise<{ document: ContractDocumentRecord }> {
  const actor = requireContractAdmin(context);
  const organizationId = await resolveOrganizationId(context, input.organizationId);
  const template = await findTemplateForActor(context, input.templateId, organizationId);
  if (template.organizationId !== organizationId) {
    throw new ServiceError(404, "contract template not found");
  }

  const employee = await requireEmployeeWithinTenant(context.dataAccess, context.actor, input.employeeId);
  if (employee.organizationId !== organizationId) {
    throw new ServiceError(404, "employee not found");
  }

  const timestamp = nowIso();
  const defaultExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const expiresAt = input.expiresAt ? normalizeIsoString(input.expiresAt) : defaultExpiresAt.toISOString();
  const title = input.title?.trim() || `${template.name} - ${employee.id}`;

  const document: ContractDocumentRecord = {
    id: toId("CD"),
    organizationId,
    templateId: template.id,
    templateVersion: template.version,
    title,
    employeeId: employee.id,
    status: "DRAFT",
    approvalStatus: "NONE",
    approvalExecutionId: null,
    approvalCycle: 0,
    requiresApproval: input.requiresApproval ?? true,
    documentHash: hashContractDocument({
      templateId: template.id,
      templateVersion: template.version,
      employeeId: employee.id,
      title,
      templateBody: template.body
    }),
    sentAt: null,
    sentByActorId: null,
    respondedAt: null,
    respondedByActorId: null,
    employeeDecision: null,
    signatureHash: null,
    signatureEvidenceHash: null,
    responseComment: null,
    expiresAt,
    expiredAt: null,
    renewalOfDocumentId: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    updatedByActorId: actor.id
  };

  await appendAudit(context, {
    action: CONTRACT_DOCUMENT_ACTIONS.created,
    entityType: CONTRACT_DOCUMENT_ENTITY_TYPE,
    entityId: document.id,
    organizationId,
    payload: { document }
  });

  return { document };
}

export async function requestContractDocumentApproval(
  context: ServiceContext,
  documentId: string,
  input: RequestContractDocumentApprovalInput
): Promise<{ document: ContractDocumentRecord }> {
  const actor = requireContractAdmin(context);
  const existing = await findDocumentForActor(context, documentId);
  if (existing.status !== "DRAFT") {
    throw new ServiceError(409, "approval can be requested only from DRAFT state");
  }

  const document: ContractDocumentRecord = {
    ...existing,
    status: "APPROVAL_REQUESTED",
    approvalStatus: existing.requiresApproval ? "PENDING" : "APPROVED",
    approvalExecutionId: null,
    approvalCycle: existing.approvalCycle + 1,
    updatedAt: input.requestedAt ? normalizeIsoString(input.requestedAt) : nowIso(),
    updatedByActorId: actor.id
  };

  await appendAudit(context, {
    action: CONTRACT_DOCUMENT_ACTIONS.approvalRequested,
    entityType: CONTRACT_DOCUMENT_ENTITY_TYPE,
    entityId: document.id,
    organizationId: document.organizationId,
    payload: { document }
  });

  return { document };
}

export async function decideContractDocumentApproval(
  context: ServiceContext,
  documentId: string,
  input: DecideContractDocumentApprovalInput
): Promise<{
  document: ContractDocumentRecord;
  approval: {
    executionId: string;
    state: "PENDING" | "APPROVED" | "REJECTED";
    stageIndex: number;
    totalStages: number;
    finalized: boolean;
  };
}> {
  const actor = requireContractAdmin(context);
  const existing = await findDocumentForActor(context, documentId);
  if (existing.status !== "APPROVAL_REQUESTED") {
    throw new ServiceError(409, "approval action is allowed only for APPROVAL_REQUESTED state");
  }
  if (existing.approvalCycle < 1) {
    throw new ServiceError(409, "approval cycle is not initialized");
  }

  const decidedAt = input.decidedAt ?? new Date();
  const approvalResult = await applyApprovalExecutionAction(
    {
      actor: context.actor,
      dataAccess: context.dataAccess
    },
    {
      domain: CONTRACT_APPROVAL_DOMAIN,
      organizationId: existing.organizationId,
      targetEntityType: CONTRACT_DOCUMENT_ENTITY_TYPE,
      targetEntityId: `${existing.id}:cycle:${existing.approvalCycle}`,
      action: input.action,
      evaluatedAt: decidedAt
    }
  );

  const executionState = approvalResult.execution.state;
  const approvalStatus: ContractApprovalStatus =
    executionState === "APPROVED" ? "APPROVED" : executionState === "REJECTED" ? "REJECTED" : "PENDING";

  const status: ContractDocumentStatus =
    executionState === "REJECTED"
      ? "DRAFT"
      : executionState === "APPROVED"
        ? "DRAFT"
        : "APPROVAL_REQUESTED";

  const document: ContractDocumentRecord = {
    ...existing,
    status,
    approvalStatus,
    approvalExecutionId: approvalResult.execution.id,
    approvalCycle: existing.approvalCycle,
    updatedAt: normalizeIsoString(decidedAt),
    updatedByActorId: actor.id
  };

  await appendAudit(context, {
    action: CONTRACT_DOCUMENT_ACTIONS.approvalDecided,
    entityType: CONTRACT_DOCUMENT_ENTITY_TYPE,
    entityId: document.id,
    organizationId: document.organizationId,
    payload: {
      document,
      approval: {
        executionId: approvalResult.execution.id,
        state: executionState,
        stageIndex: approvalResult.stageIndex,
        totalStages: approvalResult.totalStages,
        finalized: approvalResult.finalized
      }
    }
  });

  return {
    document,
    approval: {
      executionId: approvalResult.execution.id,
      state: executionState,
      stageIndex: approvalResult.stageIndex,
      totalStages: approvalResult.totalStages,
      finalized: approvalResult.finalized
    }
  };
}

export async function sendContractDocument(
  context: ServiceContext,
  documentId: string,
  input: SendContractDocumentInput
): Promise<{ document: ContractDocumentRecord }> {
  const actor = requireContractAdmin(context);
  const existing = await findDocumentForActor(context, documentId);

  if (existing.status !== "DRAFT") {
    throw new ServiceError(409, "document can be sent only from DRAFT state");
  }
  if (existing.requiresApproval && !input.bypassApproval && existing.approvalStatus !== "APPROVED") {
    throw new ServiceError(409, "document approval must be completed before sending");
  }

  const sentAt = input.sentAt ? normalizeIsoString(input.sentAt) : nowIso();
  const document: ContractDocumentRecord = {
    ...existing,
    status: "SENT",
    sentAt,
    sentByActorId: actor.id,
    updatedAt: sentAt,
    updatedByActorId: actor.id
  };

  await appendAudit(context, {
    action: CONTRACT_DOCUMENT_ACTIONS.sent,
    entityType: CONTRACT_DOCUMENT_ENTITY_TYPE,
    entityId: document.id,
    organizationId: document.organizationId,
    payload: { document }
  });

  return { document };
}

export async function respondContractDocument(
  context: ServiceContext,
  documentId: string,
  input: RespondContractDocumentInput
): Promise<{ document: ContractDocumentRecord }> {
  const actor = requireActor(context);
  const existing = await findDocumentForActor(context, documentId);

  const isOwnEmployee = actor.role === "employee" && actor.id === existing.employeeId;
  const isPrivileged = isContractAdminRole(actor.role);
  if (!isOwnEmployee && !isPrivileged) {
    throw new ServiceError(403, "contract response permission denied");
  }

  if (existing.status !== "SENT") {
    throw new ServiceError(409, "employee response is allowed only when status is SENT");
  }

  if (actor.role === "employee" && actor.id !== existing.employeeId) {
    throw new ServiceError(403, "employee can only respond to own document");
  }

  if (input.expectedDocumentHash && input.expectedDocumentHash !== existing.documentHash) {
    throw new ServiceError(409, "expectedDocumentHash mismatch");
  }

  const respondedAt = input.respondedAt ? normalizeIsoString(input.respondedAt) : nowIso();

  if (input.action === "SIGN") {
    if (!input.signatureInput) {
      throw new ServiceError(400, "signatureInput is required for SIGN action");
    }

    const signatureHash = hash(`${existing.documentHash}|${actor.id}|${input.signatureInput.trim()}`);
    const signatureEvidenceHash = hash(input.signatureInput.trim());

    const document: ContractDocumentRecord = {
      ...existing,
      status: "SIGNED",
      respondedAt,
      respondedByActorId: actor.id,
      employeeDecision: "SIGNED",
      signatureHash,
      signatureEvidenceHash,
      responseComment: input.comment?.trim() ?? null,
      updatedAt: respondedAt,
      updatedByActorId: actor.id
    };

    await appendAudit(context, {
      action: CONTRACT_DOCUMENT_ACTIONS.responded,
      entityType: CONTRACT_DOCUMENT_ENTITY_TYPE,
      entityId: document.id,
      organizationId: document.organizationId,
      payload: {
        document,
        responseAction: "SIGN"
      }
    });

    return { document };
  }

  const document: ContractDocumentRecord = {
    ...existing,
    status: "REJECTED",
    respondedAt,
    respondedByActorId: actor.id,
    employeeDecision: "REJECTED",
    responseComment: input.comment?.trim() ?? null,
    updatedAt: respondedAt,
    updatedByActorId: actor.id
  };

  await appendAudit(context, {
    action: CONTRACT_DOCUMENT_ACTIONS.responded,
    entityType: CONTRACT_DOCUMENT_ENTITY_TYPE,
    entityId: document.id,
    organizationId: document.organizationId,
    payload: {
      document,
      responseAction: "REJECT"
    }
  });

  return { document };
}

export async function expireContractDocument(
  context: ServiceContext,
  documentId: string,
  input: ExpireContractDocumentInput
): Promise<{ document: ContractDocumentRecord }> {
  const actor = requireContractAdmin(context);
  const existing = await findDocumentForActor(context, documentId);
  if (existing.status !== "SENT") {
    throw new ServiceError(409, "manual expire is allowed only for SENT document");
  }

  const expiredAt = input.expiredAt ? normalizeIsoString(input.expiredAt) : nowIso();
  const document: ContractDocumentRecord = {
    ...existing,
    status: "EXPIRED",
    expiredAt,
    responseComment: input.reason?.trim() ?? existing.responseComment,
    updatedAt: expiredAt,
    updatedByActorId: actor.id
  };

  await appendAudit(context, {
    action: CONTRACT_DOCUMENT_ACTIONS.expired,
    entityType: CONTRACT_DOCUMENT_ENTITY_TYPE,
    entityId: document.id,
    organizationId: document.organizationId,
    payload: {
      document,
      expireReason: input.reason?.trim() ?? null
    }
  });

  return { document };
}

export async function renewContractDocument(
  context: ServiceContext,
  documentId: string,
  input: RenewContractDocumentInput
): Promise<{ sourceDocument: ContractDocumentRecord; renewedDocument: ContractDocumentRecord }> {
  const actor = requireContractAdmin(context);
  const sourceDocument = await findDocumentForActor(context, documentId);

  if (!["SIGNED", "REJECTED", "EXPIRED"].includes(sourceDocument.status)) {
    throw new ServiceError(409, "renew is allowed only for SIGNED/REJECTED/EXPIRED documents");
  }

  const template = await findTemplateForActor(context, sourceDocument.templateId, sourceDocument.organizationId);
  const now = nowIso();
  const newExpiresAt = input.newExpiresAt
    ? normalizeIsoString(input.newExpiresAt)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const renewedDocument: ContractDocumentRecord = {
    id: toId("CD"),
    organizationId: sourceDocument.organizationId,
    templateId: template.id,
    templateVersion: template.version,
    title: `${sourceDocument.title} (renewal)`,
    employeeId: sourceDocument.employeeId,
    status: "DRAFT",
    approvalStatus: "NONE",
    approvalExecutionId: null,
    approvalCycle: 0,
    requiresApproval: input.copyRequiresApproval ?? sourceDocument.requiresApproval,
    documentHash: hashContractDocument({
      templateId: template.id,
      templateVersion: template.version,
      employeeId: sourceDocument.employeeId,
      title: `${sourceDocument.title} (renewal)`,
      templateBody: template.body
    }),
    sentAt: null,
    sentByActorId: null,
    respondedAt: null,
    respondedByActorId: null,
    employeeDecision: null,
    signatureHash: null,
    signatureEvidenceHash: null,
    responseComment: null,
    expiresAt: newExpiresAt,
    expiredAt: null,
    renewalOfDocumentId: sourceDocument.id,
    createdAt: now,
    updatedAt: now,
    updatedByActorId: actor.id
  };

  const source: ContractDocumentRecord = {
    ...sourceDocument,
    status: "RENEWED",
    updatedAt: now,
    updatedByActorId: actor.id
  };

  await appendAudit(context, {
    action: CONTRACT_DOCUMENT_ACTIONS.renewed,
    entityType: CONTRACT_DOCUMENT_ENTITY_TYPE,
    entityId: source.id,
    organizationId: source.organizationId,
    payload: {
      document: source,
      renewedDocumentId: renewedDocument.id
    }
  });

  await appendAudit(context, {
    action: CONTRACT_DOCUMENT_ACTIONS.created,
    entityType: CONTRACT_DOCUMENT_ENTITY_TYPE,
    entityId: renewedDocument.id,
    organizationId: renewedDocument.organizationId,
    payload: {
      document: renewedDocument,
      renewalOfDocumentId: source.id
    }
  });

  return {
    sourceDocument: source,
    renewedDocument
  };
}
