import { buildFilingFailureMessage } from "@/components/payroll-year-end/request-failure-guidance";
import type { PayrollYearEndFilingCopy } from "@/components/payroll-year-end-filing/copy";
import type { ApiLog } from "@/components/payroll-year-end-filing/types";
import type { FlowLocale } from "@/lib/i18n/locales";

export type PayrollYearEndFilingFailureAction =
  | "preflight_checklist"
  | "finalization_preview"
  | "finalization_apply"
  | "filing_export"
  | "filing_submit"
  | "submissions_refresh"
  | "ack_catalog_load"
  | "submission_ack"
  | "submission_resubmit"
  | "submission_cancel"
  | "submission_reopen"
  | "submission_timeline"
  | "evidence_note_add";

export type PayrollYearEndFilingFailureState = {
  action: PayrollYearEndFilingFailureAction;
  actionLabel: string;
  status: number | null;
  message: string;
  occurredAt: string;
  submissionId: string | null;
};

type ApiErrorLike = {
  error?: unknown;
};

export function appendApiLogEntry(
  previous: ApiLog[],
  input: {
    label: string;
    status: number;
    ok: boolean;
    runtimeLocale: string;
  }
) {
  const { label, status, ok, runtimeLocale } = input;
  return [
    {
      id: Date.now(),
      label,
      status,
      ok,
      at: new Date().toLocaleString(runtimeLocale)
    },
    ...previous
  ];
}

export function extractApiErrorMessage(body: unknown) {
  if (!body || typeof body !== "object") {
    return null;
  }
  const message = (body as ApiErrorLike).error;
  if (typeof message !== "string") {
    return null;
  }
  const normalized = message.trim();
  return normalized.length > 0 ? normalized : null;
}

export function buildRequestFailureStatusMessage(
  copy: PayrollYearEndFilingCopy,
  locale: FlowLocale,
  status: number | null,
  bodyOrMessage: unknown
) {
  const statusSuffix = status === null ? "" : ` (${status})`;
  const detailMessage = buildFilingFailureMessage({
    status,
    body: bodyOrMessage,
    locale,
    fallback: copy.statusRequestFailed
  }).trim();
  if (!detailMessage) {
    return `${copy.statusRequestFailed}${statusSuffix}`;
  }
  if (detailMessage === copy.statusRequestFailed) {
    return `${copy.statusRequestFailed}${statusSuffix}`;
  }
  return `${copy.statusRequestFailed}${statusSuffix}: ${detailMessage}`;
}
