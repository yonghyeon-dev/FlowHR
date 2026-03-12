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
    <article className="panel workspace-section-card workspace-note-card v2-surface-card admin-payroll-timeline-card">
      <p className="eyebrow admin-payroll-timeline-eyebrow">
        {runtimeLocale.startsWith("ko") ? "후속 스트림" : "Follow-up stream"}
      </p>
      <h2>{copy.submissionTimelinePanelTitle}</h2>
      {timelineEntries.length === 0 ? (
        <p className="small">{copy.noTimelineLoaded}</p>
      ) : (
        <div className="admin-payroll-timeline-list" role="list">
          {timelineEntries.map((entry, index) => (
            <article
              key={`${entry.action}-${entry.occurredAt}-${index}`}
              className="admin-payroll-timeline-item"
              role="listitem"
            >
              <div className="admin-payroll-timeline-item-head">
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
                </span>
                <time>{new Date(entry.occurredAt).toLocaleString(runtimeLocale)}</time>
              </div>
              <p className="admin-payroll-timeline-item-copy">{formatTimelineEntry(entry, copy)}</p>
            </article>
          ))}
        </div>
      )}
    </article>
  );
}
