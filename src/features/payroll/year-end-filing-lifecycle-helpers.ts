import type { AuditLogEntity } from "@/features/shared/data-access";
import {
  asYearEndFilingEvidenceNoteAddedAuditPayload,
  asYearEndFilingPackageAcknowledgedAuditPayload,
  asYearEndFilingPackageCanceledAuditPayload,
  asYearEndFilingPackageReopenedAuditPayload,
  asYearEndFilingPackageSubmittedAuditPayload
} from "@/features/payroll/year-end-audit-payload-helpers";

type YearEndFilingSubmissionSummary = {
  submissionId: string;
  year: number;
  employeeId: string;
  attempt: number;
  resubmissionOfSubmissionId: string | null;
  resubmissionReason: string | null;
  finalizationId: string;
  settlementHash: string | null;
  format: string;
  validationMode: string;
  transport: string;
  artifact: {
    fileName: string;
    contentType: string;
    checksumSha256: string;
    byteLength: number;
  };
  validationStatus: "pass" | "fail";
  submittedAt: string;
  submittedByRole: string;
  submittedById: string | null;
  status: "submitted" | "acknowledged" | "canceled";
  ack: {
    ackStatus: string;
    ackCode: string | null;
    ackNote: string | null;
    rejectionReasonCode: string | null;
    rejectionReasonDetail: string | null;
    acknowledgedAt: string;
    acknowledgedByRole: string;
    acknowledgedById: string | null;
  } | null;
  submissionNote: string | null;
};

type YearEndFilingTimelineAction =
  | "submitted"
  | "resubmitted"
  | "canceled"
  | "reopened"
  | "acknowledged"
  | "evidence_note_added";

type YearEndFilingTimelineEntry = {
  action: YearEndFilingTimelineAction;
  submissionId: string;
  occurredAt: string;
  actorRole: string;
  actorId: string | null;
  attempt: number | null;
  submissionNote: string | null;
  resubmissionOfSubmissionId: string | null;
  resubmissionReason: string | null;
  ackStatus: string | null;
  ackCode: string | null;
  ackNote: string | null;
  rejectionReasonCode: string | null;
  rejectionReasonDetail: string | null;
  evidenceNote: string | null;
};

export function buildYearEndFilingSubmissionSummaries(logs: AuditLogEntity[]) {
  const sortedLogs = [...logs].sort(
    (left, right) => left.createdAt.getTime() - right.createdAt.getTime()
  );
  const submissions = new Map<string, YearEndFilingSubmissionSummary>();

  for (const log of sortedLogs) {
    if (
      log.action === "payroll.year_end.filing_package_submitted" ||
      log.action === "payroll.year_end.filing_package_resubmitted"
    ) {
      const payload = asYearEndFilingPackageSubmittedAuditPayload(log.payload);
      if (!payload) {
        continue;
      }
      submissions.set(payload.submissionId, {
        submissionId: payload.submissionId,
        year: payload.year,
        employeeId: payload.employeeId,
        attempt: payload.attempt ?? 1,
        resubmissionOfSubmissionId: payload.resubmissionOfSubmissionId ?? null,
        resubmissionReason: payload.resubmissionReason ?? null,
        finalizationId: payload.finalizationId,
        settlementHash: payload.settlementHash ?? null,
        format: payload.format,
        validationMode: payload.validationMode,
        transport: payload.transport,
        artifact: payload.artifact,
        validationStatus: payload.validationStatus,
        submittedAt: payload.submittedAt,
        submittedByRole: payload.submittedByRole,
        submittedById: payload.submittedById ?? null,
        status: "submitted",
        ack: null,
        submissionNote: payload.submissionNote ?? null
      });
      continue;
    }

    if (log.action === "payroll.year_end.filing_package_acknowledged") {
      const payload = asYearEndFilingPackageAcknowledgedAuditPayload(log.payload);
      if (!payload) {
        continue;
      }
      const existing = submissions.get(payload.submissionId);
      if (!existing) {
        continue;
      }
      existing.status = "acknowledged";
      existing.ack = {
        ackStatus: payload.ackStatus,
        ackCode: payload.ackCode ?? null,
        ackNote: payload.ackNote ?? null,
        rejectionReasonCode: payload.rejectionReasonCode ?? null,
        rejectionReasonDetail: payload.rejectionReasonDetail ?? null,
        acknowledgedAt: payload.acknowledgedAt,
        acknowledgedByRole: payload.acknowledgedByRole,
        acknowledgedById: payload.acknowledgedById ?? null
      };
      continue;
    }

    if (log.action === "payroll.year_end.filing_package_canceled") {
      const payload = asYearEndFilingPackageCanceledAuditPayload(log.payload);
      if (!payload) {
        continue;
      }
      const existing = submissions.get(payload.submissionId);
      if (!existing) {
        continue;
      }
      existing.status = "canceled";
      existing.ack = null;
      continue;
    }

    if (log.action === "payroll.year_end.filing_package_reopened") {
      const payload = asYearEndFilingPackageReopenedAuditPayload(log.payload);
      if (!payload) {
        continue;
      }
      const existing = submissions.get(payload.submissionId);
      if (!existing) {
        continue;
      }
      existing.status = "submitted";
      existing.ack = null;
    }
  }

  return Array.from(submissions.values()).sort(
    (left, right) =>
      right.submittedAt.localeCompare(left.submittedAt) ||
      right.submissionId.localeCompare(left.submissionId)
  );
}

export function buildYearEndFilingSubmissionTimeline(logs: AuditLogEntity[], submissionId: string) {
  const sortedLogs = [...logs].sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());
  const timeline: YearEndFilingTimelineEntry[] = [];

  for (const log of sortedLogs) {
    if (
      log.action === "payroll.year_end.filing_package_submitted" ||
      log.action === "payroll.year_end.filing_package_resubmitted"
    ) {
      const payload = asYearEndFilingPackageSubmittedAuditPayload(log.payload);
      if (!payload || payload.submissionId !== submissionId) {
        continue;
      }
      timeline.push({
        action:
          log.action === "payroll.year_end.filing_package_submitted" ? "submitted" : "resubmitted",
        submissionId: payload.submissionId,
        occurredAt: payload.submittedAt,
        actorRole: payload.submittedByRole,
        actorId: payload.submittedById ?? null,
        attempt: payload.attempt ?? null,
        submissionNote: payload.submissionNote ?? null,
        resubmissionOfSubmissionId: payload.resubmissionOfSubmissionId ?? null,
        resubmissionReason: payload.resubmissionReason ?? null,
        ackStatus: null,
        ackCode: null,
        ackNote: null,
        rejectionReasonCode: null,
        rejectionReasonDetail: null,
        evidenceNote: null
      });
      continue;
    }

    if (log.action === "payroll.year_end.filing_package_acknowledged") {
      const payload = asYearEndFilingPackageAcknowledgedAuditPayload(log.payload);
      if (!payload || payload.submissionId !== submissionId) {
        continue;
      }
      timeline.push({
        action: "acknowledged",
        submissionId: payload.submissionId,
        occurredAt: payload.acknowledgedAt,
        actorRole: payload.acknowledgedByRole,
        actorId: payload.acknowledgedById ?? null,
        attempt: null,
        submissionNote: null,
        resubmissionOfSubmissionId: null,
        resubmissionReason: null,
        ackStatus: payload.ackStatus,
        ackCode: payload.ackCode ?? null,
        ackNote: payload.ackNote ?? null,
        rejectionReasonCode: payload.rejectionReasonCode ?? null,
        rejectionReasonDetail: payload.rejectionReasonDetail ?? null,
        evidenceNote: null
      });
      continue;
    }

    if (log.action === "payroll.year_end.filing_package_canceled") {
      const payload = asYearEndFilingPackageCanceledAuditPayload(log.payload);
      if (!payload || payload.submissionId !== submissionId) {
        continue;
      }
      timeline.push({
        action: "canceled",
        submissionId: payload.submissionId,
        occurredAt: payload.canceledAt,
        actorRole: payload.canceledByRole,
        actorId: payload.canceledById ?? null,
        attempt: null,
        submissionNote: null,
        resubmissionOfSubmissionId: null,
        resubmissionReason: null,
        ackStatus: null,
        ackCode: null,
        ackNote: null,
        rejectionReasonCode: null,
        rejectionReasonDetail: null,
        evidenceNote: null
      });
      continue;
    }

    if (log.action === "payroll.year_end.filing_package_reopened") {
      const payload = asYearEndFilingPackageReopenedAuditPayload(log.payload);
      if (!payload || payload.submissionId !== submissionId) {
        continue;
      }
      timeline.push({
        action: "reopened",
        submissionId: payload.submissionId,
        occurredAt: payload.reopenedAt,
        actorRole: payload.reopenedByRole,
        actorId: payload.reopenedById ?? null,
        attempt: null,
        submissionNote: null,
        resubmissionOfSubmissionId: null,
        resubmissionReason: null,
        ackStatus: null,
        ackCode: null,
        ackNote: null,
        rejectionReasonCode: null,
        rejectionReasonDetail: null,
        evidenceNote: null
      });
      continue;
    }

    if (log.action === "payroll.year_end.filing_evidence_note_added") {
      const payload = asYearEndFilingEvidenceNoteAddedAuditPayload(log.payload);
      if (!payload || payload.submissionId !== submissionId) {
        continue;
      }
      timeline.push({
        action: "evidence_note_added",
        submissionId: payload.submissionId,
        occurredAt: payload.notedAt,
        actorRole: payload.notedByRole,
        actorId: payload.notedById ?? null,
        attempt: null,
        submissionNote: null,
        resubmissionOfSubmissionId: null,
        resubmissionReason: null,
        ackStatus: null,
        ackCode: null,
        ackNote: null,
        rejectionReasonCode: null,
        rejectionReasonDetail: null,
        evidenceNote: payload.note
      });
    }
  }

  const actionOrder: Record<YearEndFilingTimelineAction, number> = {
    submitted: 0,
    resubmitted: 1,
    canceled: 2,
    reopened: 3,
    acknowledged: 4,
    evidence_note_added: 5
  };

  return timeline.sort((left, right) => {
    const timeDelta = Date.parse(left.occurredAt) - Date.parse(right.occurredAt);
    if (timeDelta !== 0) {
      return timeDelta;
    }
    const actionDelta = actionOrder[left.action] - actionOrder[right.action];
    if (actionDelta !== 0) {
      return actionDelta;
    }
    return (left.evidenceNote ?? "").localeCompare(right.evidenceNote ?? "");
  });
}
