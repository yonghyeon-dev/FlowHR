import styles from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsReviewCompletionReceiptArchiveDigest.module.css";
import type {
  CloseReportDistributionSignoffClosurePacketRecord,
  ClosurePacketStatus
} from "@/components/payroll-year-end-filing/filing-alert-review-close-report-distribution-signoff-closure-packet";
import type { ClosurePacketDraft } from "@/components/payroll-year-end-filing/filing-alert-review-close-report-distribution-signoff-closure-packet-ui";
import type { ReviewHandoffRole } from "@/components/payroll-year-end-filing/filing-alert-review-handoff-export-snapshot";

type ClosurePacketPanelProps = {
  closurePacketRecord: CloseReportDistributionSignoffClosurePacketRecord;
  closurePacketDraft: ClosurePacketDraft;
  onClosurePacketDraftChange: (next: ClosurePacketDraft) => void;
  onApplyClosurePacket: () => void;
};

function closurePacketStatusClass(status: ClosurePacketStatus) {
  if (status === "sealed") {
    return `${styles.stateBadge} ${styles.stateVerified}`;
  }
  if (status === "assembled") {
    return `${styles.stateBadge} ${styles.stateIssued}`;
  }
  return `${styles.stateBadge} ${styles.statePending}`;
}

export default function PayrollYearEndFilingOpsClosurePacketPanel({
  closurePacketRecord,
  closurePacketDraft,
  onClosurePacketDraftChange,
  onApplyClosurePacket
}: ClosurePacketPanelProps) {
  return (
    <article className="panel" id="filing-alert-close-report-closure-packet">
      <h3>Distribution Sign-off Closure Packet</h3>
      <div className={styles.sectionGrid}>
        <div className={styles.card}>
          <p className="small">
            packet {closurePacketRecord.packetId}
            <span className={closurePacketStatusClass(closurePacketRecord.status)}>
              {closurePacketRecord.status}
            </span>
          </p>
          <p className="small">
            owner {closurePacketRecord.ownerRole}:{closurePacketRecord.ownerActorId || "-"} / assembledAt{" "}
            {closurePacketRecord.assembledAt
              ? new Date(closurePacketRecord.assembledAt).toLocaleString("ko-KR")
              : "-"}
          </p>
          <p className="small">
            sealedAt{" "}
            {closurePacketRecord.sealedAt
              ? new Date(closurePacketRecord.sealedAt).toLocaleString("ko-KR")
              : "-"}
          </p>
          <p className="small">{closurePacketRecord.summary || "no closure packet summary"}</p>
        </div>

        <div className={styles.controlGrid}>
          <label>
            Packet Status
            <select
              value={closurePacketDraft.status}
              onChange={(event) =>
                onClosurePacketDraftChange({
                  ...closurePacketDraft,
                  status: event.target.value as ClosurePacketStatus
                })
              }
            >
              <option value="pending">pending</option>
              <option value="assembled">assembled</option>
              <option value="sealed">sealed</option>
            </select>
          </label>
          <label>
            Owner Role
            <select
              value={closurePacketDraft.ownerRole}
              onChange={(event) =>
                onClosurePacketDraftChange({
                  ...closurePacketDraft,
                  ownerRole: event.target.value as ReviewHandoffRole
                })
              }
            >
              <option value="payroll_operator">payroll_operator</option>
              <option value="manager">manager</option>
              <option value="admin">admin</option>
            </select>
          </label>
          <label>
            Owner Actor ID
            <input
              value={closurePacketDraft.ownerActorId}
              onChange={(event) =>
                onClosurePacketDraftChange({
                  ...closurePacketDraft,
                  ownerActorId: event.target.value
                })
              }
            />
          </label>
          <label>
            Summary
            <textarea
              value={closurePacketDraft.summary}
              onChange={(event) =>
                onClosurePacketDraftChange({
                  ...closurePacketDraft,
                  summary: event.target.value
                })
              }
            />
          </label>
        </div>

        <button className="btn btn-secondary btn-small" onClick={onApplyClosurePacket}>
          Apply Closure Packet
        </button>
      </div>
    </article>
  );
}
