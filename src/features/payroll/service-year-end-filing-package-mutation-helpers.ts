import { Permissions } from "@/lib/rbac";
import { ServiceError } from "@/features/shared/service-error";
import {
  listYearEndFilingSubmissionSummaries,
  normalizeYearEndSettlementHash,
  resolvePayrollYearEndFilingAckPayload
} from "@/features/payroll/service-year-end-adapter-helpers";
import {
  isPayrollYearEndEnabled,
  isPayrollYearEndFilingSubmissionEnabled
} from "@/features/payroll/service-runtime-helpers";
import type {
  AcknowledgePayrollYearEndFilingPackageInput,
  CancelPayrollYearEndFilingPackageInput,
  ReopenPayrollYearEndFilingPackageInput
} from "@/features/payroll/service-input-types";
import type {
  AcknowledgePayrollYearEndFilingPackageResult,
  CancelPayrollYearEndFilingPackageResult,
  ReopenPayrollYearEndFilingPackageResult
} from "@/features/payroll/service-output-types";
import { loadYearEndRunSnapshot } from "@/features/payroll/service-year-end-run-snapshot-helpers";
import {
  type ServiceContext,
  getEventPublisher,
  requirePayrollPermission
} from "@/features/payroll/service-context-helpers";
import { loadPayrollRuntimeFeatureFlags } from "@/features/payroll/service-feature-flags";

type FilingSubmissionTarget = {
  submissions: Awaited<ReturnType<typeof listYearEndFilingSubmissionSummaries>>;
  target: Awaited<ReturnType<typeof listYearEndFilingSubmissionSummaries>>[number];
};

async function loadFilingSubmissionTarget(
  context: ServiceContext,
  input: {
    year: number;
    employeeId: string;
    submissionId: string;
  }
): Promise<FilingSubmissionTarget> {
  await loadYearEndRunSnapshot(context, input.year, input.employeeId);
  const submissions = await listYearEndFilingSubmissionSummaries(context, {
    year: input.year,
    employeeId: input.employeeId
  });
  const target = submissions.find((submission) => submission.submissionId === input.submissionId);
  if (!target) {
    throw new ServiceError(404, "filing submission not found");
  }
  return { submissions, target };
}

export async function acknowledgePayrollYearEndFilingPackageFromHelper(
  context: ServiceContext,
  input: AcknowledgePayrollYearEndFilingPackageInput
): Promise<AcknowledgePayrollYearEndFilingPackageResult> {
  await requirePayrollPermission(context, Permissions.payrollRunConfirm, "confirm");
  const featureFlags = await loadPayrollRuntimeFeatureFlags(context);
  if (!isPayrollYearEndEnabled(featureFlags)) {
    throw new ServiceError(409, "payroll_year_end_v1 feature flag is disabled");
  }
  if (!isPayrollYearEndFilingSubmissionEnabled(featureFlags)) {
    throw new ServiceError(409, "payroll_year_end_filing_submission_v1 feature flag is disabled");
  }

  const { target } = await loadFilingSubmissionTarget(context, input);
  if (target.status === "canceled") {
    throw new ServiceError(409, "canceled filing submission cannot be acknowledged");
  }
  if (target.status === "acknowledged") {
    throw new ServiceError(409, "filing submission is already acknowledged");
  }

  const expectedSettlementHash = normalizeYearEndSettlementHash(input.expectedSettlementHash);
  const submissionSettlementHash = normalizeYearEndSettlementHash(target.settlementHash);
  if (expectedSettlementHash && expectedSettlementHash !== submissionSettlementHash) {
    throw new ServiceError(409, "filing submission settlement hash mismatch", {
      expectedSettlementHash,
      submissionSettlementHash
    });
  }

  const resolvedAck = resolvePayrollYearEndFilingAckPayload({
    ackStatus: input.ackStatus,
    ackCode: input.ackCode,
    ackNote: input.ackNote,
    rejectionReasonCode: input.rejectionReasonCode,
    rejectionReasonDetail: input.rejectionReasonDetail
  });
  const actorRole = context.actor?.role ?? "system";
  const actorId = context.actor?.id ?? null;
  const acknowledgedAt = new Date().toISOString();
  const entityId = `${input.year}_${input.employeeId}`;
  const ackPayload = {
    submissionId: input.submissionId,
    settlementHash: submissionSettlementHash,
    expectedSettlementHash,
    ackStatus: input.ackStatus,
    ackCode: resolvedAck.ackCode,
    ackNote: resolvedAck.ackNote,
    rejectionReasonCode: resolvedAck.rejectionReasonCode,
    rejectionReasonDetail: resolvedAck.rejectionReasonDetail,
    acknowledgedAt,
    acknowledgedByRole: actorRole,
    acknowledgedById: actorId
  };

  await context.dataAccess.audit.append({
    action: "payroll.year_end.filing_package_acknowledged",
    entityType: "PayrollYearEnd",
    entityId,
    actorRole,
    actorId: actorId ?? undefined,
    payload: ackPayload
  });
  await getEventPublisher(context).publish({
    name: "payroll.year_end.filing_package.acknowledged.v1",
    occurredAt: acknowledgedAt,
    entityType: "PayrollYearEnd",
    entityId,
    actorRole,
    actorId: actorId ?? undefined,
    payload: ackPayload as unknown as Record<string, unknown>
  });

  return {
    submission: {
      ...target,
      status: "acknowledged",
      ack: {
        ackStatus: input.ackStatus,
        ackCode: resolvedAck.ackCode,
        ackNote: resolvedAck.ackNote,
        rejectionReasonCode: resolvedAck.rejectionReasonCode,
        rejectionReasonDetail: resolvedAck.rejectionReasonDetail,
        acknowledgedAt,
        acknowledgedByRole: actorRole,
        acknowledgedById: actorId
      }
    }
  };
}

export async function cancelPayrollYearEndFilingPackageFromHelper(
  context: ServiceContext,
  input: CancelPayrollYearEndFilingPackageInput
): Promise<CancelPayrollYearEndFilingPackageResult> {
  await requirePayrollPermission(context, Permissions.payrollRunConfirm, "confirm");
  const featureFlags = await loadPayrollRuntimeFeatureFlags(context);
  if (!isPayrollYearEndEnabled(featureFlags)) {
    throw new ServiceError(409, "payroll_year_end_v1 feature flag is disabled");
  }
  if (!isPayrollYearEndFilingSubmissionEnabled(featureFlags)) {
    throw new ServiceError(409, "payroll_year_end_filing_submission_v1 feature flag is disabled");
  }

  const { target } = await loadFilingSubmissionTarget(context, input);
  if (target.status === "canceled") {
    throw new ServiceError(409, "filing submission is already canceled");
  }
  if (target.status === "acknowledged") {
    throw new ServiceError(409, "acknowledged filing submission cannot be canceled");
  }

  const actorRole = context.actor?.role ?? "system";
  const actorId = context.actor?.id ?? null;
  const canceledAt = new Date().toISOString();
  const entityId = `${input.year}_${input.employeeId}`;
  const payload = {
    submissionId: input.submissionId,
    canceledAt,
    canceledByRole: actorRole,
    canceledById: actorId
  };

  await context.dataAccess.audit.append({
    action: "payroll.year_end.filing_package_canceled",
    entityType: "PayrollYearEnd",
    entityId,
    actorRole,
    actorId: actorId ?? undefined,
    payload
  });
  await getEventPublisher(context).publish({
    name: "payroll.year_end.filing_package.canceled.v1",
    occurredAt: canceledAt,
    entityType: "PayrollYearEnd",
    entityId,
    actorRole,
    actorId: actorId ?? undefined,
    payload: payload as unknown as Record<string, unknown>
  });

  return {
    submission: {
      ...target,
      status: "canceled",
      ack: null
    }
  };
}

export async function reopenPayrollYearEndFilingPackageFromHelper(
  context: ServiceContext,
  input: ReopenPayrollYearEndFilingPackageInput
): Promise<ReopenPayrollYearEndFilingPackageResult> {
  await requirePayrollPermission(context, Permissions.payrollRunConfirm, "confirm");
  const featureFlags = await loadPayrollRuntimeFeatureFlags(context);
  if (!isPayrollYearEndEnabled(featureFlags)) {
    throw new ServiceError(409, "payroll_year_end_v1 feature flag is disabled");
  }
  if (!isPayrollYearEndFilingSubmissionEnabled(featureFlags)) {
    throw new ServiceError(409, "payroll_year_end_filing_submission_v1 feature flag is disabled");
  }

  const { submissions, target } = await loadFilingSubmissionTarget(context, input);
  if (target.status !== "canceled") {
    throw new ServiceError(409, "only canceled filing submission can be reopened");
  }
  if (
    submissions.some(
      (submission) =>
        submission.status === "submitted" && submission.submissionId !== target.submissionId
    )
  ) {
    throw new ServiceError(
      409,
      "another pending filing submission exists; acknowledge or cancel it before reopening"
    );
  }

  const actorRole = context.actor?.role ?? "system";
  const actorId = context.actor?.id ?? null;
  const reopenedAt = new Date().toISOString();
  const entityId = `${input.year}_${input.employeeId}`;
  const payload = {
    submissionId: input.submissionId,
    reopenedAt,
    reopenedByRole: actorRole,
    reopenedById: actorId
  };

  await context.dataAccess.audit.append({
    action: "payroll.year_end.filing_package_reopened",
    entityType: "PayrollYearEnd",
    entityId,
    actorRole,
    actorId: actorId ?? undefined,
    payload
  });
  await getEventPublisher(context).publish({
    name: "payroll.year_end.filing_package.reopened.v1",
    occurredAt: reopenedAt,
    entityType: "PayrollYearEnd",
    entityId,
    actorRole,
    actorId: actorId ?? undefined,
    payload: payload as unknown as Record<string, unknown>
  });

  return {
    submission: {
      ...target,
      status: "submitted",
      ack: null
    }
  };
}
