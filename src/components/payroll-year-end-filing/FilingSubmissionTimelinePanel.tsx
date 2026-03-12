import { formatTimelineEntry } from "@/components/payroll-year-end-filing/value-helpers";
import type { PayrollYearEndFilingCopy } from "@/components/payroll-year-end-filing/copy";
import type { PayrollYearEndFilingTimelineEntry } from "@/components/payroll-year-end-filing/types";

type FilingSubmissionTimelinePanelProps = {
  copy: PayrollYearEndFilingCopy;
  runtimeLocale: string;
  timelineEntries: PayrollYearEndFilingTimelineEntry[];
};

export default function FilingSubmissionTimelinePanel(props: FilingSubmissionTimelinePanelProps) {
  const { copy, runtimeLocale, timelineEntries } = props;

  return (
    <article className="panel workspace-section-card workspace-note-card v2-surface-card">
      <h2>{copy.submissionTimelinePanelTitle}</h2>
      {timelineEntries.length === 0 ? (
        <p className="small">{copy.noTimelineLoaded}</p>
      ) : (
        <ul className="log-list">
          {timelineEntries.map((entry, index) => (
            <li key={`${entry.action}-${entry.occurredAt}-${index}`}>
              <span
                className={
                  entry.action === "acknowledged" && entry.ackStatus === "accepted"
                    ? "ok"
                    : entry.action === "canceled"
                      ? "fail"
                      : "small"
                }
              >
                {copy.timelineActionBadgeLabels[entry.action] ?? entry.action}
              </span>{" "}
              {formatTimelineEntry(entry, copy)}
              <time>{new Date(entry.occurredAt).toLocaleString(runtimeLocale)}</time>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
