import { createHash } from "node:crypto";

type YearEndSettlementHashPayloadShape = {
  year: number;
  employeeId: string;
  runStates: {
    totalRuns: number;
    confirmedRuns: number;
    previewedRuns: number;
    undistributedRuns: number;
    pendingReceiptRuns: number;
    previewedRunIds: string[];
    undistributedRunIds: string[];
    pendingReceiptRunIds: string[];
  };
  annualTotalsKrw: unknown;
  deductionEligibility: unknown;
  deductionItemsKrw: unknown;
  settlementKrw: unknown;
};

type YearEndFinalizationAuditPayloadShape = YearEndSettlementHashPayloadShape & {
  periodStart: string;
  periodEnd: string;
  apply: boolean;
  canFinalize: boolean;
  finalized: boolean;
  finalizationId: string;
  finalizedAt: string | null;
};

type PayrollYearEndWithholdingReceiptSummaryShape = {
  year: number;
  employeeId: string;
  receiptNumber: string;
  issuerName: string;
  issued: boolean;
  issuedAt: string | null;
  runStates: unknown;
  annualTotalsKrw: unknown;
};

type YearEndFilingPackageSubmittedAuditPayloadShape = {
  submissionId: string;
  year: number;
  employeeId: string;
  attempt?: number;
  resubmissionOfSubmissionId?: string | null;
  resubmissionReason?: string | null;
  finalizationId: string;
  settlementHash?: string | null;
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
  submittedById?: string | null;
  submissionNote?: string | null;
};

type YearEndFilingPackageAcknowledgedAuditPayloadShape = {
  submissionId: string;
  settlementHash?: string | null;
  expectedSettlementHash?: string | null;
  ackStatus: string;
  ackCode?: string | null;
  ackNote?: string | null;
  rejectionReasonCode?: string | null;
  rejectionReasonDetail?: string | null;
  acknowledgedAt: string;
  acknowledgedByRole: string;
  acknowledgedById?: string | null;
};

type YearEndFilingPackageCanceledAuditPayloadShape = {
  submissionId: string;
  canceledAt: string;
  canceledByRole: string;
  canceledById?: string | null;
};

type YearEndFilingPackageReopenedAuditPayloadShape = {
  submissionId: string;
  reopenedAt: string;
  reopenedByRole: string;
  reopenedById?: string | null;
};

type YearEndFilingEvidenceNoteAddedAuditPayloadShape = {
  submissionId: string;
  year: number;
  employeeId: string;
  note: string;
  notedAt: string;
  notedByRole: string;
  notedById?: string | null;
};

const yearEndSettlementHashPattern = /^[a-f0-9]{64}$/i;

export function buildYearEndSettlementHash(payload: YearEndSettlementHashPayloadShape) {
  const normalizedPayload = {
    year: payload.year,
    employeeId: payload.employeeId,
    runStates: {
      ...payload.runStates,
      previewedRunIds: [...payload.runStates.previewedRunIds].sort(),
      undistributedRunIds: [...payload.runStates.undistributedRunIds].sort(),
      pendingReceiptRunIds: [...payload.runStates.pendingReceiptRunIds].sort()
    },
    annualTotalsKrw: payload.annualTotalsKrw,
    deductionEligibility: payload.deductionEligibility,
    deductionItemsKrw: payload.deductionItemsKrw,
    settlementKrw: payload.settlementKrw
  };
  return createHash("sha256").update(JSON.stringify(normalizedPayload)).digest("hex");
}

export function normalizeYearEndSettlementHash(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  if (!yearEndSettlementHashPattern.test(normalized)) {
    return null;
  }
  return normalized;
}

export function resolveYearEndSettlementHashFromFinalizationPayload(
  payload: YearEndFinalizationAuditPayloadShape
): string {
  const settlementHash = normalizeYearEndSettlementHash(
    (payload as { settlementHash?: unknown }).settlementHash
  );
  if (settlementHash) {
    return settlementHash;
  }
  return buildYearEndSettlementHash({
    year: payload.year,
    employeeId: payload.employeeId,
    runStates: payload.runStates,
    annualTotalsKrw: payload.annualTotalsKrw,
    deductionEligibility: payload.deductionEligibility,
    deductionItemsKrw: payload.deductionItemsKrw,
    settlementKrw: payload.settlementKrw
  });
}

export function asYearEndFinalizationAuditPayload(
  payload: unknown
): YearEndFinalizationAuditPayloadShape | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const candidate = payload as Partial<YearEndFinalizationAuditPayloadShape>;
  if (
    typeof candidate.year !== "number" ||
    typeof candidate.employeeId !== "string" ||
    typeof candidate.finalizationId !== "string" ||
    typeof candidate.finalizedAt !== "string" ||
    !candidate.runStates ||
    !candidate.annualTotalsKrw ||
    !candidate.deductionItemsKrw ||
    !candidate.settlementKrw
  ) {
    return null;
  }
  return candidate as YearEndFinalizationAuditPayloadShape;
}

export function asYearEndWithholdingReceiptSummaryPayload(
  payload: unknown
): PayrollYearEndWithholdingReceiptSummaryShape | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const candidate = payload as Partial<PayrollYearEndWithholdingReceiptSummaryShape>;
  if (
    typeof candidate.year !== "number" ||
    typeof candidate.employeeId !== "string" ||
    typeof candidate.receiptNumber !== "string" ||
    typeof candidate.issuerName !== "string" ||
    typeof candidate.issued !== "boolean" ||
    typeof candidate.issuedAt !== "string" ||
    !candidate.runStates ||
    !candidate.annualTotalsKrw
  ) {
    return null;
  }
  return candidate as PayrollYearEndWithholdingReceiptSummaryShape;
}

export function asYearEndFilingPackageSubmittedAuditPayload(
  payload: unknown
): YearEndFilingPackageSubmittedAuditPayloadShape | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const candidate = payload as Partial<YearEndFilingPackageSubmittedAuditPayloadShape>;
  if (
    typeof candidate.submissionId !== "string" ||
    typeof candidate.year !== "number" ||
    typeof candidate.employeeId !== "string" ||
    typeof candidate.finalizationId !== "string" ||
    typeof candidate.format !== "string" ||
    typeof candidate.validationMode !== "string" ||
    typeof candidate.transport !== "string" ||
    !candidate.artifact ||
    typeof candidate.submittedAt !== "string" ||
    typeof candidate.submittedByRole !== "string"
  ) {
    return null;
  }
  return {
    ...candidate,
    attempt: typeof candidate.attempt === "number" ? candidate.attempt : 1,
    settlementHash: normalizeYearEndSettlementHash(
      (candidate as { settlementHash?: unknown }).settlementHash
    ),
    resubmissionOfSubmissionId:
      typeof candidate.resubmissionOfSubmissionId === "string"
        ? candidate.resubmissionOfSubmissionId
        : null,
    resubmissionReason:
      typeof candidate.resubmissionReason === "string" ? candidate.resubmissionReason : null
  } as YearEndFilingPackageSubmittedAuditPayloadShape;
}

export function asYearEndFilingPackageAcknowledgedAuditPayload(
  payload: unknown
): YearEndFilingPackageAcknowledgedAuditPayloadShape | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const candidate = payload as Partial<YearEndFilingPackageAcknowledgedAuditPayloadShape>;
  if (
    typeof candidate.submissionId !== "string" ||
    typeof candidate.ackStatus !== "string" ||
    typeof candidate.acknowledgedAt !== "string" ||
    typeof candidate.acknowledgedByRole !== "string"
  ) {
    return null;
  }
  return {
    ...candidate,
    settlementHash: normalizeYearEndSettlementHash(
      (candidate as { settlementHash?: unknown }).settlementHash
    ),
    expectedSettlementHash: normalizeYearEndSettlementHash(
      (candidate as { expectedSettlementHash?: unknown }).expectedSettlementHash
    ),
    ackCode: typeof candidate.ackCode === "string" ? candidate.ackCode : null,
    ackNote: typeof candidate.ackNote === "string" ? candidate.ackNote : null,
    rejectionReasonCode:
      typeof candidate.rejectionReasonCode === "string" ? candidate.rejectionReasonCode : null,
    rejectionReasonDetail:
      typeof candidate.rejectionReasonDetail === "string" ? candidate.rejectionReasonDetail : null,
    acknowledgedById: typeof candidate.acknowledgedById === "string" ? candidate.acknowledgedById : null
  } as YearEndFilingPackageAcknowledgedAuditPayloadShape;
}

export function asYearEndFilingPackageCanceledAuditPayload(
  payload: unknown
): YearEndFilingPackageCanceledAuditPayloadShape | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const candidate = payload as Partial<YearEndFilingPackageCanceledAuditPayloadShape>;
  if (
    typeof candidate.submissionId !== "string" ||
    typeof candidate.canceledAt !== "string" ||
    typeof candidate.canceledByRole !== "string"
  ) {
    return null;
  }
  return {
    ...candidate,
    canceledById: typeof candidate.canceledById === "string" ? candidate.canceledById : null
  } as YearEndFilingPackageCanceledAuditPayloadShape;
}

export function asYearEndFilingPackageReopenedAuditPayload(
  payload: unknown
): YearEndFilingPackageReopenedAuditPayloadShape | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const candidate = payload as Partial<YearEndFilingPackageReopenedAuditPayloadShape>;
  if (
    typeof candidate.submissionId !== "string" ||
    typeof candidate.reopenedAt !== "string" ||
    typeof candidate.reopenedByRole !== "string"
  ) {
    return null;
  }
  return {
    ...candidate,
    reopenedById: typeof candidate.reopenedById === "string" ? candidate.reopenedById : null
  } as YearEndFilingPackageReopenedAuditPayloadShape;
}

export function asYearEndFilingEvidenceNoteAddedAuditPayload(
  payload: unknown
): YearEndFilingEvidenceNoteAddedAuditPayloadShape | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const candidate = payload as Partial<YearEndFilingEvidenceNoteAddedAuditPayloadShape>;
  if (
    typeof candidate.submissionId !== "string" ||
    typeof candidate.year !== "number" ||
    typeof candidate.employeeId !== "string" ||
    typeof candidate.note !== "string" ||
    typeof candidate.notedAt !== "string" ||
    typeof candidate.notedByRole !== "string"
  ) {
    return null;
  }
  return {
    ...candidate,
    notedById: typeof candidate.notedById === "string" ? candidate.notedById : null
  } as YearEndFilingEvidenceNoteAddedAuditPayloadShape;
}
