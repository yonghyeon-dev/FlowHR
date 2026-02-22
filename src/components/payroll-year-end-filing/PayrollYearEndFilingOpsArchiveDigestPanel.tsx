import styles from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsReviewCompletionReceiptArchiveDigest.module.css";
import type {
  ArchiveDigestChannel,
  ArchiveDigestEntry,
  ArchiveDigestStatus
} from "@/components/payroll-year-end-filing/filing-alert-review-completion-receipt-archive-digest";
import {
  DIGEST_LABELS,
  type DigestDraft
} from "@/components/payroll-year-end-filing/filing-alert-review-completion-receipt-archive-digest-ui";

type ArchiveDigestPanelProps = {
  digestEntries: readonly ArchiveDigestEntry[];
  digestDrafts: Record<ArchiveDigestChannel, DigestDraft>;
  onDigestDraftChange: (channel: ArchiveDigestChannel, next: DigestDraft) => void;
  onApplyDigestChannel: (channel: ArchiveDigestChannel) => void;
};

function digestStatusClass(status: ArchiveDigestStatus) {
  if (status === "sealed") {
    return `${styles.stateBadge} ${styles.stateVerified}`;
  }
  if (status === "prepared") {
    return `${styles.stateBadge} ${styles.stateIssued}`;
  }
  return `${styles.stateBadge} ${styles.statePending}`;
}

export default function PayrollYearEndFilingOpsArchiveDigestPanel({
  digestEntries,
  digestDrafts,
  onDigestDraftChange,
  onApplyDigestChannel
}: ArchiveDigestPanelProps) {
  return (
    <article className="panel" id="filing-alert-archive-digest">
      <h3>Archive Digest Channels</h3>
      <div className={styles.digestGrid} aria-label="filing archive digest channels">
        {digestEntries.map((entry) => {
          const draft = digestDrafts[entry.channel];
          return (
            <div key={entry.channel} className={styles.digestRow}>
              <p className="small">
                <strong>{DIGEST_LABELS[entry.channel]}</strong>
                <span className={digestStatusClass(entry.status)}>{entry.status}</span>
              </p>
              <p className="small">
                artifact {entry.artifactId || "-"} / checksum {entry.checksum || "-"} / updatedAt{" "}
                {entry.updatedAt ? new Date(entry.updatedAt).toLocaleString("ko-KR") : "-"}
              </p>
              <p className="small">{entry.note || "no archive digest note"}</p>

              <div className={styles.controlGrid}>
                <label>
                  Status
                  <select
                    value={draft.status}
                    onChange={(event) =>
                      onDigestDraftChange(entry.channel, {
                        ...draft,
                        status: event.target.value as ArchiveDigestStatus
                      })
                    }
                  >
                    <option value="pending">pending</option>
                    <option value="prepared">prepared</option>
                    <option value="sealed">sealed</option>
                  </select>
                </label>
                <label>
                  Artifact ID
                  <input
                    value={draft.artifactId}
                    onChange={(event) =>
                      onDigestDraftChange(entry.channel, { ...draft, artifactId: event.target.value })
                    }
                  />
                </label>
                <label>
                  Checksum
                  <input
                    value={draft.checksum}
                    onChange={(event) =>
                      onDigestDraftChange(entry.channel, { ...draft, checksum: event.target.value })
                    }
                  />
                </label>
                <label>
                  Note
                  <textarea
                    value={draft.note}
                    onChange={(event) =>
                      onDigestDraftChange(entry.channel, { ...draft, note: event.target.value })
                    }
                  />
                </label>
              </div>

              <button className="btn btn-secondary btn-small" onClick={() => onApplyDigestChannel(entry.channel)}>
                Apply Digest Channel
              </button>
            </div>
          );
        })}
      </div>
    </article>
  );
}
