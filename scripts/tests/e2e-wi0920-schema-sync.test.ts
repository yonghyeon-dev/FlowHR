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

function extractSchemaModels(schema: string): Set<string> {
  const models = new Set<string>();
  const modelPattern = /^model\s+([A-Za-z0-9_]+)\s+\{/gm;
  let modelMatch = modelPattern.exec(schema);
  while (modelMatch) {
    models.add(modelMatch[1]);
    modelMatch = modelPattern.exec(schema);
  }
  return models;
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
    onboardingTaskTemplates: ["OnboardingTaskTemplate"],
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
}

run()
  .then(() => {
    console.log("e2e-wi0920-schema-sync.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
