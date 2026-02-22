import styles from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsReviewCompletionReceiptArchiveDigest.module.css";
import type {
  ClosurePacketReleaseDigestAckLedgerExceptionClosureReceiptGateState,
  ClosurePacketReleaseDigestAckLedgerExceptionClosureReceiptSummary
} from "@/components/payroll-year-end-filing/filing-alert-review-close-report-distribution-signoff-closure-packet-release-digest-ack-ledger-exception-log-closure-receipt";
import { CLOSURE_PACKET_RELEASE_DIGEST_ACK_LEDGER_EXCEPTION_CLOSURE_GATE_FIELDS } from "@/components/payroll-year-end-filing/filing-alert-review-close-report-distribution-signoff-closure-packet-release-digest-ack-ledger-exception-log-closure-receipt-ui";

type ClosureReceiptReadinessPanelProps = {
  gates: ClosurePacketReleaseDigestAckLedgerExceptionClosureReceiptGateState;
  summary: ClosurePacketReleaseDigestAckLedgerExceptionClosureReceiptSummary;
  onGateChange: (
    key: keyof ClosurePacketReleaseDigestAckLedgerExceptionClosureReceiptGateState,
    value: boolean
  ) => void;
};

export default function PayrollYearEndFilingOpsClosurePacketReleaseDigestAckLedgerExceptionLogClosureReceiptReadinessPanel(
  props: ClosureReceiptReadinessPanelProps
) {
  const { gates, summary, onGateChange } = props;

  return (
    <article
      className="panel"
      id="filing-alert-close-report-closure-packet-release-digest-ack-ledger-exception-log-closure-receipt-readiness"
    >
      <h3>Exception Closure Receipt Readiness</h3>
      <div className={styles.controlGrid}>
        {CLOSURE_PACKET_RELEASE_DIGEST_ACK_LEDGER_EXCEPTION_CLOSURE_GATE_FIELDS.map((field) => (
          <label key={field.key}>
            {field.label}
            <select
              value={gates[field.key] ? "yes" : "no"}
              onChange={(event) => onGateChange(field.key, event.target.value === "yes")}
            >
              <option value="yes">yes</option>
              <option value="no">no</option>
            </select>
          </label>
        ))}
      </div>
      <p className={`small ${summary.readyForExceptionClosureReceipt ? "ok" : "fail"}`}>
        closureReceiptVerified {summary.closureReceiptVerified ? "yes" : "no"}, acknowledged{" "}
        {summary.closureChannelAcknowledgedCount}/{summary.closureChannelTotalCount}, sent{" "}
        {summary.closureChannelSentCount}
      </p>
      {summary.blockers.length === 0 ? (
        <p className="small ok">Exception closure receipt is fully verified.</p>
      ) : (
        <ul
          className={styles.blockerList}
          aria-label="filing close report closure packet release digest ack ledger exception closure receipt blockers"
        >
          {summary.blockers.map((blocker) => (
            <li key={blocker} className="small">
              {blocker}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
