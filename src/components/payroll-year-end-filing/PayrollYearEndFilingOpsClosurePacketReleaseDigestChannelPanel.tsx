import styles from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsReviewCompletionReceiptArchiveDigest.module.css";
import type {
  ClosurePacketReleaseDigestChannel,
  ClosurePacketReleaseDigestChannelEntry,
  ClosurePacketReleaseDigestChannelStatus
} from "@/components/payroll-year-end-filing/filing-alert-review-close-report-distribution-signoff-closure-packet-release-digest";
import {
  CLOSURE_PACKET_RELEASE_DIGEST_CHANNEL_LABELS,
  type ClosurePacketReleaseDigestChannelDraft
} from "@/components/payroll-year-end-filing/filing-alert-review-close-report-distribution-signoff-closure-packet-release-digest-ui";

type ClosurePacketReleaseDigestChannelPanelProps = {
  releaseDigestChannelEntries: readonly ClosurePacketReleaseDigestChannelEntry[];
  releaseDigestChannelDrafts: Record<
    ClosurePacketReleaseDigestChannel,
    ClosurePacketReleaseDigestChannelDraft
  >;
  onReleaseDigestChannelDraftChange: (
    channel: ClosurePacketReleaseDigestChannel,
    next: ClosurePacketReleaseDigestChannelDraft
  ) => void;
  onApplyReleaseDigestChannel: (channel: ClosurePacketReleaseDigestChannel) => void;
};

function releaseDigestChannelStatusClass(status: ClosurePacketReleaseDigestChannelStatus) {
  if (status === "delivered") {
    return `${styles.stateBadge} ${styles.stateVerified}`;
  }
  if (status === "queued") {
    return `${styles.stateBadge} ${styles.stateIssued}`;
  }
  return `${styles.stateBadge} ${styles.statePending}`;
}

export default function PayrollYearEndFilingOpsClosurePacketReleaseDigestChannelPanel({
  releaseDigestChannelEntries,
  releaseDigestChannelDrafts,
  onReleaseDigestChannelDraftChange,
  onApplyReleaseDigestChannel
}: ClosurePacketReleaseDigestChannelPanelProps) {
  return (
    <article className="panel" id="filing-alert-close-report-closure-packet-release-digest-channels">
      <h3>Release Digest Channels</h3>
      <div className={styles.digestGrid} aria-label="filing closure packet release digest channels">
        {releaseDigestChannelEntries.map((entry) => {
          const draft = releaseDigestChannelDrafts[entry.channel];
          return (
            <div key={entry.channel} className={styles.digestRow}>
              <p className="small">
                <strong>{CLOSURE_PACKET_RELEASE_DIGEST_CHANNEL_LABELS[entry.channel]}</strong>
                <span className={releaseDigestChannelStatusClass(entry.status)}>{entry.status}</span>
              </p>
              <p className="small">
                artifact {entry.artifactId || "-"} / reference {entry.referenceId || "-"} / queuedAt{" "}
                {entry.queuedAt ? new Date(entry.queuedAt).toLocaleString("ko-KR") : "-"} / deliveredAt{" "}
                {entry.deliveredAt ? new Date(entry.deliveredAt).toLocaleString("ko-KR") : "-"}
              </p>
              <p className="small">{entry.note || "no release digest channel note"}</p>

              <div className={styles.controlGrid}>
                <label>
                  Status
                  <select
                    value={draft.status}
                    onChange={(event) =>
                      onReleaseDigestChannelDraftChange(entry.channel, {
                        ...draft,
                        status: event.target.value as ClosurePacketReleaseDigestChannelStatus
                      })
                    }
                  >
                    <option value="pending">pending</option>
                    <option value="queued">queued</option>
                    <option value="delivered">delivered</option>
                  </select>
                </label>
                <label>
                  Artifact ID
                  <input
                    value={draft.artifactId}
                    onChange={(event) =>
                      onReleaseDigestChannelDraftChange(entry.channel, {
                        ...draft,
                        artifactId: event.target.value
                      })
                    }
                  />
                </label>
                <label>
                  Reference ID
                  <input
                    value={draft.referenceId}
                    onChange={(event) =>
                      onReleaseDigestChannelDraftChange(entry.channel, {
                        ...draft,
                        referenceId: event.target.value
                      })
                    }
                  />
                </label>
                <label>
                  Note
                  <textarea
                    value={draft.note}
                    onChange={(event) =>
                      onReleaseDigestChannelDraftChange(entry.channel, { ...draft, note: event.target.value })
                    }
                  />
                </label>
              </div>

              <button className="btn btn-secondary btn-small" onClick={() => onApplyReleaseDigestChannel(entry.channel)}>
                Apply Release Digest Channel
              </button>
            </div>
          );
        })}
      </div>
    </article>
  );
}
