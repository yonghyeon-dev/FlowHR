import styles from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsReviewCompletionReceiptArchiveDigest.module.css";
import type {
  ClosurePacketReleaseDigestAckLedgerExceptionClosureChannel,
  ClosurePacketReleaseDigestAckLedgerExceptionClosureChannelEntry,
  ClosurePacketReleaseDigestAckLedgerExceptionClosureChannelStatus
} from "@/components/payroll-year-end-filing/filing-alert-review-close-report-distribution-signoff-closure-packet-release-digest-ack-ledger-exception-log-closure-receipt";
import {
  CLOSURE_PACKET_RELEASE_DIGEST_ACK_LEDGER_EXCEPTION_CLOSURE_CHANNEL_LABELS,
  type ClosurePacketReleaseDigestAckLedgerExceptionClosureChannelDraft
} from "@/components/payroll-year-end-filing/filing-alert-review-close-report-distribution-signoff-closure-packet-release-digest-ack-ledger-exception-log-closure-receipt-ui";

type ClosurePacketReleaseDigestAckLedgerExceptionLogClosureReceiptChannelPanelProps = {
  closureChannelEntries: readonly ClosurePacketReleaseDigestAckLedgerExceptionClosureChannelEntry[];
  closureChannelDrafts: Record<
    ClosurePacketReleaseDigestAckLedgerExceptionClosureChannel,
    ClosurePacketReleaseDigestAckLedgerExceptionClosureChannelDraft
  >;
  onClosureChannelDraftChange: (
    channel: ClosurePacketReleaseDigestAckLedgerExceptionClosureChannel,
    next: ClosurePacketReleaseDigestAckLedgerExceptionClosureChannelDraft
  ) => void;
  onApplyClosureChannel: (channel: ClosurePacketReleaseDigestAckLedgerExceptionClosureChannel) => void;
};

function closureChannelStatusClass(status: ClosurePacketReleaseDigestAckLedgerExceptionClosureChannelStatus) {
  if (status === "acknowledged") {
    return `${styles.stateBadge} ${styles.stateVerified}`;
  }
  if (status === "sent") {
    return `${styles.stateBadge} ${styles.stateIssued}`;
  }
  return `${styles.stateBadge} ${styles.statePending}`;
}

export default function PayrollYearEndFilingOpsClosurePacketReleaseDigestAckLedgerExceptionLogClosureReceiptChannelPanel(
  props: ClosurePacketReleaseDigestAckLedgerExceptionLogClosureReceiptChannelPanelProps
) {
  const { closureChannelEntries, closureChannelDrafts, onClosureChannelDraftChange, onApplyClosureChannel } =
    props;

  return (
    <article
      className="panel"
      id="filing-alert-close-report-closure-packet-release-digest-ack-ledger-exception-log-closure-receipt-channels"
    >
      <h3>Exception Closure Channels</h3>
      <div
        className={styles.digestGrid}
        aria-label="filing closure packet release digest acknowledgment exception closure channels"
      >
        {closureChannelEntries.map((entry) => {
          const draft = closureChannelDrafts[entry.channel];
          return (
            <div key={entry.channel} className={styles.digestRow}>
              <p className="small">
                <strong>
                  {
                    CLOSURE_PACKET_RELEASE_DIGEST_ACK_LEDGER_EXCEPTION_CLOSURE_CHANNEL_LABELS[
                      entry.channel
                    ]
                  }
                </strong>
                <span className={closureChannelStatusClass(entry.status)}>{entry.status}</span>
              </p>
              <p className="small">
                reference {entry.referenceId || "-"} / ticket {entry.ticketId || "-"} / sentAt{" "}
                {entry.sentAt ? new Date(entry.sentAt).toLocaleString("ko-KR") : "-"} / acknowledgedAt{" "}
                {entry.acknowledgedAt
                  ? new Date(entry.acknowledgedAt).toLocaleString("ko-KR")
                  : "-"}
              </p>
              <p className="small">{entry.note || "no exception closure channel note"}</p>

              <div className={styles.controlGrid}>
                <label>
                  Status
                  <select
                    value={draft.status}
                    onChange={(event) =>
                      onClosureChannelDraftChange(entry.channel, {
                        ...draft,
                        status:
                          event.target
                            .value as ClosurePacketReleaseDigestAckLedgerExceptionClosureChannelStatus
                      })
                    }
                  >
                    <option value="pending">pending</option>
                    <option value="sent">sent</option>
                    <option value="acknowledged">acknowledged</option>
                  </select>
                </label>
                <label>
                  Reference ID
                  <input
                    value={draft.referenceId}
                    onChange={(event) =>
                      onClosureChannelDraftChange(entry.channel, {
                        ...draft,
                        referenceId: event.target.value
                      })
                    }
                  />
                </label>
                <label>
                  Ticket ID
                  <input
                    value={draft.ticketId}
                    onChange={(event) =>
                      onClosureChannelDraftChange(entry.channel, {
                        ...draft,
                        ticketId: event.target.value
                      })
                    }
                  />
                </label>
                <label>
                  Note
                  <textarea
                    value={draft.note}
                    onChange={(event) =>
                      onClosureChannelDraftChange(entry.channel, {
                        ...draft,
                        note: event.target.value
                      })
                    }
                  />
                </label>
              </div>

              <button className="btn btn-secondary btn-small" onClick={() => onApplyClosureChannel(entry.channel)}>
                Apply Closure Channel
              </button>
            </div>
          );
        })}
      </div>
    </article>
  );
}
