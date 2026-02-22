import styles from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsReviewCompletionReceiptArchiveDigest.module.css";
import type {
  ClosurePacketDispatchChannel,
  ClosurePacketDispatchEntry,
  ClosurePacketDispatchStatus
} from "@/components/payroll-year-end-filing/filing-alert-review-close-report-distribution-signoff-closure-packet";
import {
  CLOSURE_PACKET_DISPATCH_LABELS,
  type ClosurePacketDispatchDraft
} from "@/components/payroll-year-end-filing/filing-alert-review-close-report-distribution-signoff-closure-packet-ui";

type ClosurePacketDispatchPanelProps = {
  dispatchEntries: readonly ClosurePacketDispatchEntry[];
  dispatchDrafts: Record<ClosurePacketDispatchChannel, ClosurePacketDispatchDraft>;
  onDispatchDraftChange: (
    channel: ClosurePacketDispatchChannel,
    next: ClosurePacketDispatchDraft
  ) => void;
  onApplyDispatchChannel: (channel: ClosurePacketDispatchChannel) => void;
};

function dispatchStatusClass(status: ClosurePacketDispatchStatus) {
  if (status === "released") {
    return `${styles.stateBadge} ${styles.stateVerified}`;
  }
  if (status === "prepared") {
    return `${styles.stateBadge} ${styles.stateIssued}`;
  }
  return `${styles.stateBadge} ${styles.statePending}`;
}

export default function PayrollYearEndFilingOpsClosurePacketDispatchPanel({
  dispatchEntries,
  dispatchDrafts,
  onDispatchDraftChange,
  onApplyDispatchChannel
}: ClosurePacketDispatchPanelProps) {
  return (
    <article className="panel" id="filing-alert-close-report-closure-packet-dispatch">
      <h3>Closure Packet Dispatch Channels</h3>
      <div className={styles.digestGrid} aria-label="filing close report closure packet dispatch channels">
        {dispatchEntries.map((entry) => {
          const draft = dispatchDrafts[entry.channel];
          return (
            <div key={entry.channel} className={styles.digestRow}>
              <p className="small">
                <strong>{CLOSURE_PACKET_DISPATCH_LABELS[entry.channel]}</strong>
                <span className={dispatchStatusClass(entry.status)}>{entry.status}</span>
              </p>
              <p className="small">
                artifact {entry.artifactId || "-"} / checksum {entry.checksum || "-"} / preparedAt{" "}
                {entry.preparedAt ? new Date(entry.preparedAt).toLocaleString("ko-KR") : "-"} / releasedAt{" "}
                {entry.releasedAt ? new Date(entry.releasedAt).toLocaleString("ko-KR") : "-"}
              </p>
              <p className="small">{entry.note || "no closure packet dispatch note"}</p>

              <div className={styles.controlGrid}>
                <label>
                  Status
                  <select
                    value={draft.status}
                    onChange={(event) =>
                      onDispatchDraftChange(entry.channel, {
                        ...draft,
                        status: event.target.value as ClosurePacketDispatchStatus
                      })
                    }
                  >
                    <option value="pending">pending</option>
                    <option value="prepared">prepared</option>
                    <option value="released">released</option>
                  </select>
                </label>
                <label>
                  Artifact ID
                  <input
                    value={draft.artifactId}
                    onChange={(event) =>
                      onDispatchDraftChange(entry.channel, {
                        ...draft,
                        artifactId: event.target.value
                      })
                    }
                  />
                </label>
                <label>
                  Checksum
                  <input
                    value={draft.checksum}
                    onChange={(event) =>
                      onDispatchDraftChange(entry.channel, {
                        ...draft,
                        checksum: event.target.value
                      })
                    }
                  />
                </label>
                <label>
                  Note
                  <textarea
                    value={draft.note}
                    onChange={(event) =>
                      onDispatchDraftChange(entry.channel, {
                        ...draft,
                        note: event.target.value
                      })
                    }
                  />
                </label>
              </div>

              <button className="btn btn-secondary btn-small" onClick={() => onApplyDispatchChannel(entry.channel)}>
                Apply Closure Packet Dispatch
              </button>
            </div>
          );
        })}
      </div>
    </article>
  );
}
