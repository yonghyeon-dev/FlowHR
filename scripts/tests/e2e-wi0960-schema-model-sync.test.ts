import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function extractDataAccessKeys(source: string): string[] {
  const match = source.match(/export type DataAccess = \{([\s\S]*?)\n\};/);
  assert.ok(match, "DataAccess type definition should exist");

  const keys = new Set<string>();
  const keyPattern = /^\s*([A-Za-z0-9_]+):\s*[A-Za-z0-9_<>]+;/gm;
  let keyMatch = keyPattern.exec(match[1]);
  while (keyMatch) {
    keys.add(keyMatch[1]);
    keyMatch = keyPattern.exec(match[1]);
  }

  return Array.from(keys).sort((a, b) => a.localeCompare(b));
}

function extractSchemaModels(schema: string) {
  const modelPattern = /^model\s+([A-Za-z0-9_]+)\s+\{([\s\S]*?)^}/gm;
  const models = new Map<string, string>();
  let modelMatch = modelPattern.exec(schema);
  while (modelMatch) {
    models.set(modelMatch[1], modelMatch[2]);
    modelMatch = modelPattern.exec(schema);
  }
  return models;
}

function extractSchemaScalarFields(schema: string): Map<string, string[]> {
  const models = extractSchemaModels(schema);
  const modelNames = new Set(models.keys());
  const result = new Map<string, string[]>();

  for (const [modelName, body] of models.entries()) {
    const fields: string[] = [];
    for (const line of body.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("@@")) {
        continue;
      }

      const fieldMatch = trimmed.match(/^([A-Za-z0-9_]+)\s+([A-Za-z0-9_\[\]?]+)/);
      if (!fieldMatch) {
        continue;
      }

      const fieldName = fieldMatch[1];
      const fieldType = fieldMatch[2];
      const fieldTypeBase = fieldType.replace(/[\[\]?]/g, "");

      if (modelNames.has(fieldTypeBase)) {
        continue;
      }

      fields.push(fieldName);
    }

    result.set(modelName, fields.sort((a, b) => a.localeCompare(b)));
  }

  return result;
}

function extractEntityFields(source: string): Map<string, string[]> {
  const entityPattern = /export type ([A-Za-z0-9_]+Entity) = \{([\s\S]*?)\n\};/gm;
  const entities = new Map<string, string[]>();

  let entityMatch = entityPattern.exec(source);
  while (entityMatch) {
    const entityName = entityMatch[1];
    const body = entityMatch[2];
    const fields: string[] = [];

    for (const line of body.split(/\r?\n/)) {
      const trimmed = line.trim();
      const fieldMatch = trimmed.match(/^([A-Za-z0-9_]+)\??:\s*[^;]+;/);
      if (!fieldMatch) {
        continue;
      }
      fields.push(fieldMatch[1]);
    }

    entities.set(entityName, fields.sort((a, b) => a.localeCompare(b)));
    entityMatch = entityPattern.exec(source);
  }

  return entities;
}

async function run() {
  const dataAccessSource = readUtf8("src", "features", "shared", "data-access.ts");
  const schemaSource = readUtf8("prisma", "schema.prisma");

  const storeToModels: Record<string, string[]> = {
    organizations: ["Organization"],
    employees: ["Employee"],
    departments: ["Department"],
    positions: ["Position"],
    approvals: [
      "ApprovalPolicy",
      "ApprovalDelegation",
      "ApprovalLineTemplate",
      "ApprovalStageHistory",
      "ApprovalExecution",
      "ApprovalExecutionActionLog"
    ],
    rbac: ["Role", "RolePermission"],
    attendance: ["AttendanceRecord"],
    scheduling: ["WorkSchedule", "WorkScheduleTemplate", "ScheduleAnomalyIncident"],
    leave: ["LeaveRequest", "LeaveApproval"],
    leavePolicy: ["LeavePolicy"],
    leaveBalance: ["LeaveBalanceProjection"],
    leavePromotionDeliveries: ["LeavePromotionDelivery", "LeavePromotionDeliveryRecipient"],
    benefits: ["BenefitCatalogItem", "BenefitRequest"],
    onboardingTasks: ["OnboardingTask"],
    insuranceEnrollments: ["InsuranceEnrollment"],
    recruitment: ["RecruitmentOpening", "RecruitmentReferral"],
    inAppNotifications: ["InAppNotification"],
    notices: ["Notice"],
    noticeReadReceipts: ["NoticeReadReceipt"],
    noticeNotifications: ["NoticeNotificationQueue"],
    payroll: ["PayrollRun"],
    deductionProfiles: ["DeductionProfile"],
    audit: ["AuditLog"],
    contractTemplateVersions: []
  };

  const dataAccessKeys = extractDataAccessKeys(dataAccessSource);
  const mappedKeys = Object.keys(storeToModels).sort((a, b) => a.localeCompare(b));
  assert.deepEqual(
    dataAccessKeys,
    mappedKeys,
    `DataAccess keys and schema mapping keys mismatch: dataAccess=${dataAccessKeys.join(",")}; mapped=${mappedKeys.join(",")}`
  );

  const schemaModels = extractSchemaModels(schemaSource);
  for (const key of mappedKeys) {
    const expectedModels = storeToModels[key] ?? [];
    for (const modelName of expectedModels) {
      assert.equal(
        schemaModels.has(modelName),
        true,
        `schema.prisma missing model '${modelName}' required by DataAccess key '${key}'`
      );
    }
  }

  const modelToEntity: Record<string, string> = {
    Organization: "OrganizationEntity",
    Employee: "EmployeeEntity",
    OnboardingTask: "OnboardingTaskEntity",
    InsuranceEnrollment: "InsuranceEnrollmentEntity",
    Department: "DepartmentEntity",
    Position: "PositionEntity",
    ApprovalPolicy: "ApprovalPolicyEntity",
    ApprovalDelegation: "ApprovalDelegationEntity",
    ApprovalLineTemplate: "ApprovalLineTemplateEntity",
    ApprovalStageHistory: "ApprovalStageHistoryEntity",
    ApprovalExecution: "ApprovalExecutionEntity",
    ApprovalExecutionActionLog: "ApprovalExecutionActionEntity",
    Role: "RoleEntity",
    AttendanceRecord: "AttendanceRecordEntity",
    WorkSchedule: "WorkScheduleEntity",
    WorkScheduleTemplate: "WorkScheduleTemplateEntity",
    ScheduleAnomalyIncident: "ScheduleAnomalyIncidentEntity",
    LeaveRequest: "LeaveRequestEntity",
    LeaveBalanceProjection: "LeaveBalanceEntity",
    LeavePolicy: "LeavePolicyEntity",
    LeavePromotionDelivery: "LeavePromotionDeliveryEntity",
    LeavePromotionDeliveryRecipient: "LeavePromotionDeliveryRecipientEntity",
    Notice: "NoticeEntity",
    NoticeReadReceipt: "NoticeReadReceiptEntity",
    NoticeNotificationQueue: "NoticeNotificationEntity",
    InAppNotification: "InAppNotificationEntity",
    RecruitmentOpening: "RecruitmentOpeningEntity",
    RecruitmentReferral: "RecruitmentReferralEntity",
    BenefitCatalogItem: "BenefitCatalogItemEntity",
    BenefitRequest: "BenefitRequestEntity",
    PayrollRun: "PayrollRunEntity",
    DeductionProfile: "DeductionProfileEntity",
    AuditLog: "AuditLogEntity"
  };

  const expectedFieldDrift: Record<string, { missing: string[]; extra: string[] }> = {
    Employee: { missing: [], extra: ["active"] },
    ApprovalLineTemplate: { missing: ["approvalStagesJson"], extra: ["approvalStages"] },
    NoticeNotificationQueue: { missing: [], extra: ["employeeId"] },
    AuditLog: { missing: ["id"], extra: [] }
  };

  const entityFields = extractEntityFields(dataAccessSource);
  const schemaScalarFields = extractSchemaScalarFields(schemaSource);
  const actualFieldDrift: Record<string, { missing: string[]; extra: string[] }> = {};

  for (const [modelName, entityName] of Object.entries(modelToEntity)) {
    const schemaFields = schemaScalarFields.get(modelName);
    assert.ok(schemaFields, `schema scalar fields not found for model '${modelName}'`);
    const entityModelFields = entityFields.get(entityName);
    assert.ok(entityModelFields, `entity fields not found for '${entityName}'`);

    const missing = schemaFields.filter((field) => !entityModelFields.includes(field));
    const extra = entityModelFields.filter((field) => !schemaFields.includes(field));

    if (missing.length > 0 || extra.length > 0) {
      actualFieldDrift[modelName] = {
        missing: missing.sort((a, b) => a.localeCompare(b)),
        extra: extra.sort((a, b) => a.localeCompare(b))
      };
    }
  }

  assert.deepEqual(
    actualFieldDrift,
    expectedFieldDrift,
    `Unexpected schema/entity field drift detected: ${JSON.stringify(actualFieldDrift)}`
  );

  const { memoryDataAccess, resetMemoryDataAccess } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );

  resetMemoryDataAccess();
  const organization = await memoryDataAccess.organizations.create({ name: "WI-0960 Org" });
  const notice = await memoryDataAccess.notices.create({
    organizationId: organization.id,
    title: "schema sync notice",
    body: "notice queue schema sync",
    audience: "employees",
    createdByActorId: "ADM-WI0960-1001"
  });

  await memoryDataAccess.noticeNotifications.create({
    organizationId: organization.id,
    noticeId: notice.id,
    employeeId: "EMP-WI0960-1001",
    audience: "employees",
    channel: "in_app",
    enqueuedAt: new Date("2026-03-05T00:00:00.000Z")
  });
  await memoryDataAccess.noticeNotifications.create({
    organizationId: organization.id,
    noticeId: notice.id,
    employeeId: "EMP-WI0960-1002",
    audience: "employees",
    channel: "in_app",
    enqueuedAt: new Date("2026-03-05T00:01:00.000Z")
  });

  const listed = await memoryDataAccess.noticeNotifications.list({
    organizationId: organization.id,
    noticeId: notice.id
  });
  assert.equal(listed.length, 2, "notice queue entries should be listed");
  assert.ok(
    listed.every((row) => row.employeeId === null),
    "memory notice queue should stay schema-aligned and not persist employeeId"
  );

  const listedByEmployeeFilter = await memoryDataAccess.noticeNotifications.list({
    organizationId: organization.id,
    employeeId: "EMP-WI0960-1001"
  });
  assert.equal(
    listedByEmployeeFilter.length,
    2,
    "memory notice queue should ignore employeeId filter to match Prisma-backed behavior"
  );
}

run()
  .then(() => {
    console.log("e2e-wi0960-schema-model-sync.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
