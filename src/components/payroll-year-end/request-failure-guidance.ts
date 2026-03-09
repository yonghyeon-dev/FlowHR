import {
  normalizePayrollYearEndRuntimeMessage,
  resolvePayrollYearEndBlockingReasons
} from "@/components/payroll-year-end/runtime-copy-helpers";
import {
  normalizeRuntimeDiagnosticMessage,
  resolveWithholdingBlockingReasons
} from "@/components/withholding-receipt/copy-runtime";
import type { FlowLocale } from "@/lib/i18n/locales";

type ErrorPayload = {
  error?: unknown;
  message?: unknown;
  reason?: unknown;
  detail?: unknown;
  details?: unknown;
};

type FailureMessageInput = {
  status: number | null;
  body: unknown;
  locale: FlowLocale;
  fallback: string;
};

function extractErrorPayload(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { message: typeof body === "string" ? body.trim() : null, details: null };
  }
  const payload = body as ErrorPayload;
  const candidates = [payload.error, payload.message, payload.reason, payload.detail];
  const message =
    candidates.find((value) => typeof value === "string" && value.trim().length > 0) ?? null;
  return {
    message: typeof message === "string" ? message.trim() : null,
    details: payload.details ?? null
  };
}

function extractBlockingReasons(details: unknown) {
  if (!details || typeof details !== "object" || Array.isArray(details)) {
    return [];
  }
  const value = (details as { blockingReasons?: unknown }).blockingReasons;
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function buildReasonSummary(
  reasons: string[],
  locale: FlowLocale,
  mapReason: (reasons: string[], locale: FlowLocale) => string[]
) {
  const resolved = mapReason(reasons, locale).map((reason) => reason.trim()).filter(Boolean);
  if (resolved.length === 0) {
    return null;
  }
  return resolved.slice(0, 2).join(" ");
}

function includesMessage(message: string | null, pattern: RegExp) {
  return typeof message === "string" && pattern.test(message);
}

function normalizeYearEndFallback(message: string | null, locale: FlowLocale, fallback: string) {
  if (!message) {
    return fallback;
  }
  return normalizePayrollYearEndRuntimeMessage(message, locale, fallback);
}

function normalizeWithholdingFallback(message: string | null, locale: FlowLocale, fallback: string) {
  if (!message) {
    return fallback;
  }
  return normalizeRuntimeDiagnosticMessage(message, locale, fallback);
}

export function buildPayrollYearEndFailureMessage(input: FailureMessageInput) {
  const { status, body, locale, fallback } = input;
  const { message, details } = extractErrorPayload(body);
  if (status === 404 && includesMessage(message, /payroll run not found/i)) {
    return locale === "ko"
      ? "선택한 직원과 연도에 해당하는 급여 실행을 찾지 못했습니다. 직원 번호와 연도를 확인한 뒤 다시 시도해 주세요."
      : "No payroll run was found for the selected employee and year. Review the employee number and year, then try again.";
  }
  if (status === 409) {
    const blockingReasons = extractBlockingReasons(details);
    const blockingSummary = buildReasonSummary(
      blockingReasons,
      locale,
      resolvePayrollYearEndBlockingReasons
    );
    if (includesMessage(message, /payroll_year_end_.*feature flag is disabled/i)) {
      return locale === "ko"
        ? "연말정산 기능이 아직 운영에서 열려 있지 않습니다. 설정 또는 배포 상태를 확인해 주세요."
        : "Year-end payroll is not enabled in this environment. Check deployment settings first.";
    }
    if (includesMessage(message, /year-end settlement hash mismatch/i)) {
      return locale === "ko"
        ? "정산 기준이 변경되었습니다. 최신 정산 미리보기나 확정 내역을 다시 불러온 뒤 재시도해 주세요."
        : "The settlement basis changed. Reload the latest preview or finalized settlement and try again.";
    }
    if (includesMessage(message, /year-end settlement already finalized for same hash/i)) {
      return locale === "ko"
        ? "동일한 정산 기준으로 이미 확정이 완료되었습니다. 최신 확정 내역을 확인해 주세요."
        : "This settlement has already been finalized with the same hash. Review the latest finalized record.";
    }
    if (includesMessage(message, /year-end settlement cannot be finalized/i) && blockingSummary) {
      return locale === "ko"
        ? `연말정산을 확정할 수 없습니다. ${blockingSummary}`
        : `Year-end settlement cannot be finalized yet. ${blockingSummary}`;
    }
    if (
      includesMessage(message, /year-end deduction eligibility validation failed/i) &&
      blockingSummary
    ) {
      return locale === "ko"
        ? `공제 적용 조건을 다시 확인해 주세요. ${blockingSummary}`
        : `Review deduction eligibility first. ${blockingSummary}`;
    }
  }
  return normalizeYearEndFallback(message, locale, fallback);
}

export function buildWithholdingFailureMessage(input: FailureMessageInput) {
  const { status, body, locale, fallback } = input;
  const { message, details } = extractErrorPayload(body);
  if (status === 404 && includesMessage(message, /finalized year-end settlement not found/i)) {
    return locale === "ko"
      ? "아직 확정된 연말정산 내역이 없습니다. 먼저 연말정산 확정을 완료해 주세요."
      : "No finalized year-end settlement exists yet. Finalize the year-end settlement first.";
  }
  if (status === 404 && includesMessage(message, /issued withholding receipt not found/i)) {
    return locale === "ko"
      ? "아직 발급된 원천징수영수증이 없습니다. 먼저 미리보기 또는 발급을 진행해 주세요."
      : "No issued withholding receipt exists yet. Run preview or issue first.";
  }
  if (status === 409) {
    const blockingReasons = extractBlockingReasons(details);
    const blockingSummary = buildReasonSummary(
      blockingReasons,
      locale,
      resolveWithholdingBlockingReasons
    );
    if (includesMessage(message, /payroll_year_end_.*feature flag is disabled/i)) {
      return locale === "ko"
        ? "원천징수영수증 기능이 아직 운영에서 열려 있지 않습니다. 설정 또는 배포 상태를 확인해 주세요."
        : "Withholding receipt is not enabled in this environment. Check deployment settings first.";
    }
    if (includesMessage(message, /withholding receipt cannot be issued/i) && blockingSummary) {
      return locale === "ko"
        ? `원천징수영수증을 발급할 수 없습니다. ${blockingSummary}`
        : `Withholding receipt cannot be issued yet. ${blockingSummary}`;
    }
  }
  return normalizeWithholdingFallback(message, locale, fallback);
}

export function buildFilingFailureMessage(input: FailureMessageInput) {
  const { status, body, locale, fallback } = input;
  const { message } = extractErrorPayload(body);
  if (status === 404 && includesMessage(message, /payroll run not found/i)) {
    return locale === "ko"
      ? "선택한 직원과 연도에 해당하는 급여 실행을 찾지 못했습니다. 연말정산 기준 급여 실행이 먼저 준비되어 있는지 확인해 주세요."
      : "No payroll run was found for the selected employee and year. Confirm that the year-end payroll basis exists first.";
  }
  if (status === 409) {
    if (includesMessage(message, /payroll_year_end_filing_submission_v1 feature flag is disabled/i)) {
      return locale === "ko"
        ? "신고 제출 기능이 아직 운영에서 열려 있지 않습니다. 설정 또는 배포 상태를 확인해 주세요."
        : "Filing submissions are not enabled in this environment. Check deployment settings first.";
    }
    if (
      includesMessage(
        message,
        /existing filing submission history found; use resubmit endpoint for rejected submissions/i
      )
    ) {
      return locale === "ko"
        ? "기존 신고 제출 이력이 있습니다. 반려 건은 재제출로 이어가고, 진행 중 건은 먼저 정리해 주세요."
        : "A filing history already exists. Use resubmit for rejected items and clear any in-progress submission first.";
    }
    if (
      includesMessage(
        message,
        /existing filing submission must be acknowledged before submit\/resubmit|another pending filing submission exists; acknowledge or cancel it before reopening/i
      )
    ) {
      return locale === "ko"
        ? "처리 대기 중인 신고 제출 건이 있습니다. ACK 처리 또는 취소 후 다시 시도해 주세요."
        : "A pending filing submission already exists. Acknowledge or cancel it before trying again.";
    }
    if (includesMessage(message, /only rejected acknowledged submissions can be resubmitted/i)) {
      return locale === "ko"
        ? "반려된 제출 건만 재제출할 수 있습니다."
        : "Only rejected acknowledged submissions can be resubmitted.";
    }
    if (includesMessage(message, /selected submission has already been resubmitted/i)) {
      return locale === "ko"
        ? "이미 재제출된 신고 건입니다."
        : "This filing submission has already been resubmitted.";
    }
    if (includesMessage(message, /canceled filing submission cannot be acknowledged/i)) {
      return locale === "ko"
        ? "취소된 신고 건은 ACK 처리할 수 없습니다."
        : "Canceled filing submissions cannot be acknowledged.";
    }
    if (includesMessage(message, /filing submission is already acknowledged/i)) {
      return locale === "ko"
        ? "이미 ACK 처리된 신고 건입니다."
        : "This filing submission is already acknowledged.";
    }
    if (includesMessage(message, /filing submission is already canceled/i)) {
      return locale === "ko"
        ? "이미 취소된 신고 건입니다."
        : "This filing submission is already canceled.";
    }
    if (includesMessage(message, /acknowledged filing submission cannot be canceled/i)) {
      return locale === "ko"
        ? "ACK 완료된 신고 건은 취소할 수 없습니다."
        : "Acknowledged filing submissions cannot be canceled.";
    }
    if (includesMessage(message, /only canceled filing submission can be reopened/i)) {
      return locale === "ko"
        ? "취소된 신고 건만 다시 열 수 있습니다."
        : "Only canceled filing submissions can be reopened.";
    }
    if (includesMessage(message, /filing submission settlement hash mismatch|year-end settlement hash mismatch/i)) {
      return locale === "ko"
        ? "정산 기준이 바뀌었습니다. 최신 정산값과 제출 대상을 다시 불러온 뒤 재시도해 주세요."
        : "The settlement basis changed. Reload the latest settlement and submission target, then try again.";
    }
  }
  if (status === 404 && includesMessage(message, /filing submission not found/i)) {
    return locale === "ko"
      ? "선택한 신고 제출 건을 찾지 못했습니다. 목록을 새로고침한 뒤 다시 선택해 주세요."
      : "The selected filing submission could not be found. Refresh the list and try again.";
  }
  if (!message) {
    return fallback;
  }
  return locale === "ko"
    ? normalizeRuntimeDiagnosticMessage(message, locale, fallback)
    : message;
}
