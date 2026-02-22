import styles from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsReviewCompletionReceiptArchiveDigest.module.css";
import type {
  ClosurePacketReleaseDigestAckChannel,
  ClosurePacketReleaseDigestAckChannelEntry,
  ClosurePacketReleaseDigestAckChannelStatus
} from "@/components/payroll-year-end-filing/filing-alert-review-close-report-distribution-signoff-closure-packet-release-digest-ack-ledger";
import {
  CLOSURE_PACKET_RELEASE_DIGEST_ACK_CHANNEL_LABELS,
  type ClosurePacketReleaseDigestAckChannelDraft
} from "@/components/payroll-year-end-filing/filing-alert-review-close-report-distribution-signoff-closure-packet-release-digest-ack-ledger-ui";

type ClosurePacketReleaseDigestAckLedgerChannelPanelProps = {
  ackChannelEntries: readonly ClosurePacketReleaseDigestAckChannelEntry[];
  ackChannelDrafts: Record<ClosurePacketReleaseDigestAckChannel, ClosurePacketReleaseDigestAckChannelDraft>;
  onAckChannelDraftChange: (
    channel: ClosurePacketReleaseDigestAckChannel,
    next: ClosurePacketReleaseDigestAckChannelDraft
  ) => void;
  onApplyAckChannel: (channel: ClosurePacketReleaseDigestAckChannel) => void;
};

function ackChannelStatusClass(status: ClosurePacketReleaseDigestAckChannelStatus) {
  if (status === "reconciled") {
    return `${styles.stateBadge} ${styles.stateVerified}`;
  }
  if (status === "acknowledged") {
    return `${styles.stateBadge} ${styles.stateIssued}`;
  }
  return `${styles.stateBadge} ${styles.statePending}`;
}

export default function PayrollYearEndFilingOpsClosurePacketReleaseDigestAckLedgerChannelPanel({
  ackChannelEntries,
  ackChannelDrafts,
  onAckChannelDraftChange,
  onApplyAckChannel
}: ClosurePacketReleaseDigestAckLedgerChannelPanelProps) {
  return (
    <article className="panel" id="filing-alert-close-report-closure-packet-release-digest-ack-ledger-channels">
      <h3>Acknowledgment Channels</h3>
      <div className={styles.digestGrid} aria-label="filing closure packet release digest acknowledgment channels">
        {ackChannelEntries.map((entry) => {
          const draft = ackChannelDrafts[entry.channel];
          return (
            <div key={entry.channel} className={styles.digestRow}>
              <p className="small">
                <strong>{CLOSURE_PACKET_RELEASE_DIGEST_ACK_CHANNEL_LABELS[entry.channel]}</strong>
                <span className={ackChannelStatusClass(entry.status)}>{entry.status}</span>
              </p>
              <p className="small">
                ackCode {entry.ackCode || "-"} / reference {entry.referenceId || "-"} / acknowledgedAt{" "}
                {entry.acknowledgedAt ? new Date(entry.acknowledgedAt).toLocaleString("ko-KR") : "-"} /
                reconciledAt {entry.reconciledAt ? new Date(entry.reconciledAt).toLocaleString("ko-KR") : "-"}
              </p>
              <p className="small">{entry.note || "no acknowledgment channel note"}</p>

              <div className={styles.controlGrid}>
                <label>
                  Status
                  <select
                    value={draft.status}
                    onChange={(event) =>
                      onAckChannelDraftChange(entry.channel, {
                        ...draft,
                        status: event.target.value as ClosurePacketReleaseDigestAckChannelStatus
                      })
                    }
                  >
                    <option value="pending">pending</option>
                    <option value="acknowledged">acknowledged</option>
                    <option value="reconciled">reconciled</option>
                  </select>
                </label>
                <label>
                  ACK Code
                  <input
                    value={draft.ackCode}
                    onChange={(event) =>
                      onAckChannelDraftChange(entry.channel, {
                        ...draft,
                        ackCode: event.target.value
                      })
                    }
                  />
                </label>
                <label>
                  Reference ID
                  <input
                    value={draft.referenceId}
                    onChange={(event) =>
                      onAckChannelDraftChange(entry.channel, {
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
                      onAckChannelDraftChange(entry.channel, { ...draft, note: event.target.value })
                    }
                  />
                </label>
              </div>

              <button className="btn btn-secondary btn-small" onClick={() => onApplyAckChannel(entry.channel)}>
                Apply Ack Channel
              </button>
            </div>
          );
        })}
      </div>
    </article>
  );
}
