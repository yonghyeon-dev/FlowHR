import { ServiceError } from "@/features/shared/service-error";

export type PayrollYearEndFilingAckStatus = "accepted" | "rejected";

type PayrollYearEndFilingAckCodeCatalogItem = {
  code: string;
  label: string;
  description: string;
  defaultNote: string;
};

type PayrollYearEndFilingRejectionReasonCatalogItem = {
  code: string;
  label: string;
  description: string;
};

export type ListPayrollYearEndFilingAckCatalogResult = {
  acceptedCodes: PayrollYearEndFilingAckCodeCatalogItem[];
  rejectedCodes: PayrollYearEndFilingAckCodeCatalogItem[];
  rejectionReasons: PayrollYearEndFilingRejectionReasonCatalogItem[];
};

type ResolvePayrollYearEndFilingAckPayloadInput = {
  ackStatus: PayrollYearEndFilingAckStatus;
  ackCode?: string;
  ackNote?: string;
  rejectionReasonCode?: string;
  rejectionReasonDetail?: string;
};

const payrollYearEndAcceptedAckCodeCatalog: PayrollYearEndFilingAckCodeCatalogItem[] = [
  {
    code: "ACK-OK",
    label: "Accepted",
    description: "Submission accepted without additional correction request.",
    defaultNote: "accepted"
  },
  {
    code: "ACK-2026-OK",
    label: "Accepted (Legacy)",
    description: "Legacy accepted code maintained for backward-compatible replay.",
    defaultNote: "accepted"
  },
  {
    code: "ACK-ACCEPTED-WARNING",
    label: "Accepted With Warning",
    description: "Submission accepted with follow-up recommendation.",
    defaultNote: "accepted with warning"
  }
];

const payrollYearEndRejectedAckCodeCatalog: PayrollYearEndFilingAckCodeCatalogItem[] = [
  {
    code: "ACK-REJECT",
    label: "Rejected",
    description: "Submission rejected and correction is required.",
    defaultNote: "rejected"
  },
  {
    code: "ACK-REJECT-VALIDATION",
    label: "Rejected (Validation)",
    description: "Submission failed validation checks.",
    defaultNote: "rejected due to validation errors"
  },
  {
    code: "ACK-REJECT-FORMAT",
    label: "Rejected (Format)",
    description: "Submission format is invalid for filing channel.",
    defaultNote: "rejected due to format mismatch"
  },
  {
    code: "ACK-REJECT-COVERAGE",
    label: "Rejected (Coverage)",
    description: "Submission coverage or run mapping is incomplete.",
    defaultNote: "rejected due to coverage mismatch"
  }
];

const payrollYearEndRejectionReasonCatalog: PayrollYearEndFilingRejectionReasonCatalogItem[] = [
  {
    code: "VALIDATION_ERROR",
    label: "Validation Error",
    description: "Schema or value validation failed."
  },
  {
    code: "FORMAT_MISMATCH",
    label: "Format Mismatch",
    description: "Submitted artifact format does not match required format."
  },
  {
    code: "EMPLOYEE_IDENTIFIER_MISMATCH",
    label: "Employee Identifier Mismatch",
    description: "Employee identifier values do not match filing expectation."
  },
  {
    code: "AMOUNT_MISMATCH",
    label: "Amount Mismatch",
    description: "Declared totals differ from reconciled payroll totals."
  },
  {
    code: "MISSING_SUPPORTING_EVIDENCE",
    label: "Missing Supporting Evidence",
    description: "Required notes or supporting evidence are missing."
  },
  {
    code: "OTHER",
    label: "Other",
    description: "Other rejection reason requiring manual review."
  }
];

const payrollYearEndDefaultRejectedReasonCode = "OTHER";

export function buildPayrollYearEndFilingAckCatalog(): ListPayrollYearEndFilingAckCatalogResult {
  return {
    acceptedCodes: payrollYearEndAcceptedAckCodeCatalog.map((item) => ({ ...item })),
    rejectedCodes: payrollYearEndRejectedAckCodeCatalog.map((item) => ({ ...item })),
    rejectionReasons: payrollYearEndRejectionReasonCatalog.map((item) => ({ ...item }))
  };
}

export function resolvePayrollYearEndFilingAckPayload(
  input: ResolvePayrollYearEndFilingAckPayloadInput
) {
  const allowedAckCodes =
    input.ackStatus === "accepted"
      ? payrollYearEndAcceptedAckCodeCatalog
      : payrollYearEndRejectedAckCodeCatalog;
  const fallbackAckCode = allowedAckCodes[0]?.code;
  if (!fallbackAckCode) {
    throw new ServiceError(500, "filing ack code catalog is not configured");
  }

  const ackCodeCandidate = input.ackCode?.trim() ? input.ackCode.trim() : fallbackAckCode;
  if (!allowedAckCodes.some((entry) => entry.code === ackCodeCandidate)) {
    throw new ServiceError(409, "ack code is not allowed for selected ack status", {
      ackStatus: input.ackStatus,
      allowedAckCodes: allowedAckCodes.map((entry) => entry.code)
    });
  }

  if (input.ackStatus === "accepted") {
    if (input.rejectionReasonCode?.trim() || input.rejectionReasonDetail?.trim()) {
      throw new ServiceError(409, "rejection reason fields are only allowed when ackStatus is rejected");
    }
    const ackNote = input.ackNote?.trim() ? input.ackNote.trim() : null;
    return {
      ackCode: ackCodeCandidate,
      ackNote,
      rejectionReasonCode: null,
      rejectionReasonDetail: null
    } as const;
  }

  const rejectionReasonCodeCandidate = input.rejectionReasonCode?.trim()
    ? input.rejectionReasonCode.trim()
    : payrollYearEndDefaultRejectedReasonCode;
  if (
    !payrollYearEndRejectionReasonCatalog.some(
      (entry) => entry.code === rejectionReasonCodeCandidate
    )
  ) {
    throw new ServiceError(409, "rejection reason code is not defined in catalog", {
      rejectionReasonCode: rejectionReasonCodeCandidate,
      allowedRejectionReasonCodes: payrollYearEndRejectionReasonCatalog.map((entry) => entry.code)
    });
  }

  return {
    ackCode: ackCodeCandidate,
    ackNote: input.ackNote?.trim() ? input.ackNote.trim() : null,
    rejectionReasonCode: rejectionReasonCodeCandidate,
    rejectionReasonDetail: input.rejectionReasonDetail?.trim()
      ? input.rejectionReasonDetail.trim()
      : null
  } as const;
}
