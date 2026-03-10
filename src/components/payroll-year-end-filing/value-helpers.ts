import type { PayrollYearEndFilingTimelineEntry } from "@/components/payroll-year-end-filing/types";

type FilingTimelineCopy = {
  timelineActionBadgeLabels: Record<string, string>;
  timelineAttemptLabel: string;
  timelineFromLabel: string;
  timelineReasonLabel: string;
  timelineNoteLabel: string;
  timelineAckPrefix: string;
  timelineReasonCodeLabel: string;
  timelineDetailLabel: string;
  timelineCanceledLabel: string;
  timelineReopenedLabel: string;
  timelineEvidencePrefix: string;
  dashLabel: string;
};

function humanizeCode(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function parseRequiredInt(value: string, fieldName: string, nonNegativeIntegerLabel: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${fieldName} ${nonNegativeIntegerLabel}`);
  }
  return parsed;
}

export function parseRate(value: string, fieldName: string, rateBetweenZeroAndOneLabel: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
    throw new Error(`${fieldName} ${rateBetweenZeroAndOneLabel}`);
  }
  return parsed;
}

export function formatTimelineEntry(entry: PayrollYearEndFilingTimelineEntry, copy: FilingTimelineCopy) {
  if (entry.action === "submitted" || entry.action === "resubmitted") {
    const parts = [
      `${copy.timelineActionBadgeLabels[entry.action]} ${copy.timelineAttemptLabel} ${entry.attempt ?? copy.dashLabel}`,
      entry.resubmissionReason ? `${copy.timelineReasonLabel}: ${entry.resubmissionReason}` : null,
      entry.submissionNote ? `${copy.timelineNoteLabel}: ${entry.submissionNote}` : null
    ].filter(Boolean);
    return parts.join(" / ");
  }
  if (entry.action === "acknowledged") {
    return `${copy.timelineAckPrefix} ${entry.ackStatus ?? copy.dashLabel}${
      entry.rejectionReasonCode ? ` / ${copy.timelineReasonCodeLabel} ${humanizeCode(entry.rejectionReasonCode)}` : ""
    }${
      entry.rejectionReasonDetail ? ` / ${copy.timelineDetailLabel} ${entry.rejectionReasonDetail}` : ""
    }${entry.ackNote ? ` / ${entry.ackNote}` : ""}`;
  }
  if (entry.action === "canceled") {
    return copy.timelineCanceledLabel;
  }
  if (entry.action === "reopened") {
    return copy.timelineReopenedLabel;
  }
  return `${copy.timelineEvidencePrefix}: ${entry.evidenceNote ?? copy.dashLabel}`;
}
