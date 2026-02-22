import styles from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsReviewCompletionReceiptArchiveDigest.module.css";
import type {
  ClosurePacketReleaseDigestRecord,
  ClosurePacketReleaseDigestStatus
} from "@/components/payroll-year-end-filing/filing-alert-review-close-report-distribution-signoff-closure-packet-release-digest";
import type { ClosurePacketReleaseDigestDraft } from "@/components/payroll-year-end-filing/filing-alert-review-close-report-distribution-signoff-closure-packet-release-digest-ui";
import type { ReviewHandoffRole } from "@/components/payroll-year-end-filing/filing-alert-review-handoff-export-snapshot";

type ClosurePacketReleaseDigestPanelProps = {
  releaseDigestRecord: ClosurePacketReleaseDigestRecord;
  releaseDigestDraft: ClosurePacketReleaseDigestDraft;
  onReleaseDigestDraftChange: (next: ClosurePacketReleaseDigestDraft) => void;
  onApplyReleaseDigest: () => void;
};

function releaseDigestStatusClass(status: ClosurePacketReleaseDigestStatus) {
  if (status === "published") {
    return `${styles.stateBadge} ${styles.stateVerified}`;
  }
  if (status === "compiled") {
    return `${styles.stateBadge} ${styles.stateIssued}`;
  }
  return `${styles.stateBadge} ${styles.statePending}`;
}

export default function PayrollYearEndFilingOpsClosurePacketReleaseDigestPanel({
  releaseDigestRecord,
  releaseDigestDraft,
  onReleaseDigestDraftChange,
  onApplyReleaseDigest
}: ClosurePacketReleaseDigestPanelProps) {
  return (
    <article className="panel" id="filing-alert-close-report-closure-packet-release-digest">
      <h3>Closure Packet Release Digest</h3>
      <div className={styles.sectionGrid}>
        <div className={styles.card}>
          <p className="small">
            digest {releaseDigestRecord.digestId}
            <span className={releaseDigestStatusClass(releaseDigestRecord.status)}>
              {releaseDigestRecord.status}
            </span>
          </p>
          <p className="small">
            owner {releaseDigestRecord.ownerRole}:{releaseDigestRecord.ownerActorId || "-"} / compiledAt{" "}
            {releaseDigestRecord.compiledAt
              ? new Date(releaseDigestRecord.compiledAt).toLocaleString("ko-KR")
              : "-"}
          </p>
          <p className="small">
            publishedAt{" "}
            {releaseDigestRecord.publishedAt
              ? new Date(releaseDigestRecord.publishedAt).toLocaleString("ko-KR")
              : "-"}
          </p>
          <p className="small">{releaseDigestRecord.summary || "no release digest summary"}</p>
        </div>

        <div className={styles.controlGrid}>
          <label>
            Digest Status
            <select
              value={releaseDigestDraft.status}
              onChange={(event) =>
                onReleaseDigestDraftChange({
                  ...releaseDigestDraft,
                  status: event.target.value as ClosurePacketReleaseDigestStatus
                })
              }
            >
              <option value="pending">pending</option>
              <option value="compiled">compiled</option>
              <option value="published">published</option>
            </select>
          </label>
          <label>
            Owner Role
            <select
              value={releaseDigestDraft.ownerRole}
              onChange={(event) =>
                onReleaseDigestDraftChange({
                  ...releaseDigestDraft,
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
              value={releaseDigestDraft.ownerActorId}
              onChange={(event) =>
                onReleaseDigestDraftChange({
                  ...releaseDigestDraft,
                  ownerActorId: event.target.value
                })
              }
            />
          </label>
          <label>
            Summary
            <textarea
              value={releaseDigestDraft.summary}
              onChange={(event) =>
                onReleaseDigestDraftChange({
                  ...releaseDigestDraft,
                  summary: event.target.value
                })
              }
            />
          </label>
        </div>

        <button className="btn btn-secondary btn-small" onClick={onApplyReleaseDigest}>
          Apply Release Digest
        </button>
      </div>
    </article>
  );
}
