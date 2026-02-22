"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import styles from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsReviewRoutingSignatureBundle.module.css";
import type { FilingOpsAlertLevel } from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsDashboard";
import type { AlertMetric } from "@/components/payroll-year-end-filing/filing-alert-execution-checklist";
import {
  normalizeAlertLevel,
  normalizeMetric,
  parseOptionalInt
} from "@/components/payroll-year-end-filing/filing-alert-execution-checklist";
import { buildReviewCloseOffRouteHref, parseBooleanQueryParam } from "@/components/payroll-year-end-filing/filing-alert-review-close-off-package";
import {
  applyApprovalRoutingStatus,
  applyDeliverySignature,
  buildDefaultApprovalRoutingEntries,
  buildDefaultDeliverySignatureEntries,
  summarizeRoutingSignatureBundle,
  type ApprovalRoutingEntry,
  type ApprovalRoutingStage,
  type ApprovalRoutingStatus,
  type DeliverySignatureChannel,
  type DeliverySignatureEntry,
  type DeliverySignatureStatus
} from "@/components/payroll-year-end-filing/filing-alert-review-routing-signature-bundle";
import type { ReviewHandoffRole } from "@/components/payroll-year-end-filing/filing-alert-review-handoff-export-snapshot";

type RoutingDraft = {
  status: ApprovalRoutingStatus;
  ownerRole: ReviewHandoffRole;
  ownerActorId: string;
  etaHoursInput: string;
  note: string;
};

type SignatureDraft = {
  status: DeliverySignatureStatus;
  signerRole: ReviewHandoffRole;
  signerActorId: string;
  reference: string;
};

const ROUTING_STAGE_LABELS: Record<ApprovalRoutingStage, string> = {
  prepare: "Prepare",
  manager_review: "Manager Review",
  admin_signoff: "Admin Sign-off",
  delivery_ack: "Delivery ACK"
};

const SIGNATURE_CHANNEL_LABELS: Record<DeliverySignatureChannel, string> = {
  hometax_upload: "HomeTax Upload",
  manual_portal: "Manual Portal",
  internal_archive: "Internal Archive"
};

function parseHours(input: string) {
  const parsed = parseOptionalInt(input);
  if (parsed === null || parsed < 0) {
    return 0;
  }
  return parsed;
}

function statusBadgeClass(ready: boolean) {
  return `${styles.statusBadge} ${ready ? styles.statusReady : styles.statusHold}`;
}

function routingStatusClass(status: ApprovalRoutingStatus) {
  if (status === "done") {
    return `${styles.stateBadge} ${styles.stateDone}`;
  }
  if (status === "blocked") {
    return `${styles.stateBadge} ${styles.stateBlocked}`;
  }
  if (status === "in_progress") {
    return `${styles.stateBadge} ${styles.stateProgress}`;
  }
  return `${styles.stateBadge} ${styles.statePending}`;
}

function signatureStatusClass(status: DeliverySignatureStatus) {
  if (status === "signed") {
    return `${styles.stateBadge} ${styles.stateSigned}`;
  }
  if (status === "failed") {
    return `${styles.stateBadge} ${styles.stateFailed}`;
  }
  return `${styles.stateBadge} ${styles.statePending}`;
}

function copyRoutingEntries(entries: readonly ApprovalRoutingEntry[]) {
  return entries.map((entry) => ({ ...entry }));
}

function copySignatureEntries(entries: readonly DeliverySignatureEntry[]) {
  return entries.map((entry) => ({ ...entry }));
}

function buildRoutingDraftMap(entries: readonly ApprovalRoutingEntry[]) {
  return {
    prepare: {
      status: entries.find((entry) => entry.stage === "prepare")?.status ?? "pending",
      ownerRole: entries.find((entry) => entry.stage === "prepare")?.ownerRole ?? "payroll_operator",
      ownerActorId: entries.find((entry) => entry.stage === "prepare")?.ownerActorId ?? "",
      etaHoursInput: String(entries.find((entry) => entry.stage === "prepare")?.etaHours ?? 0),
      note: entries.find((entry) => entry.stage === "prepare")?.note ?? ""
    },
    manager_review: {
      status: entries.find((entry) => entry.stage === "manager_review")?.status ?? "pending",
      ownerRole: entries.find((entry) => entry.stage === "manager_review")?.ownerRole ?? "manager",
      ownerActorId: entries.find((entry) => entry.stage === "manager_review")?.ownerActorId ?? "",
      etaHoursInput: String(entries.find((entry) => entry.stage === "manager_review")?.etaHours ?? 0),
      note: entries.find((entry) => entry.stage === "manager_review")?.note ?? ""
    },
    admin_signoff: {
      status: entries.find((entry) => entry.stage === "admin_signoff")?.status ?? "pending",
      ownerRole: entries.find((entry) => entry.stage === "admin_signoff")?.ownerRole ?? "admin",
      ownerActorId: entries.find((entry) => entry.stage === "admin_signoff")?.ownerActorId ?? "",
      etaHoursInput: String(entries.find((entry) => entry.stage === "admin_signoff")?.etaHours ?? 0),
      note: entries.find((entry) => entry.stage === "admin_signoff")?.note ?? ""
    },
    delivery_ack: {
      status: entries.find((entry) => entry.stage === "delivery_ack")?.status ?? "pending",
      ownerRole: entries.find((entry) => entry.stage === "delivery_ack")?.ownerRole ?? "manager",
      ownerActorId: entries.find((entry) => entry.stage === "delivery_ack")?.ownerActorId ?? "",
      etaHoursInput: String(entries.find((entry) => entry.stage === "delivery_ack")?.etaHours ?? 0),
      note: entries.find((entry) => entry.stage === "delivery_ack")?.note ?? ""
    }
  } satisfies Record<ApprovalRoutingStage, RoutingDraft>;
}

function buildSignatureDraftMap(entries: readonly DeliverySignatureEntry[]) {
  return {
    hometax_upload: {
      status: entries.find((entry) => entry.channel === "hometax_upload")?.status ?? "pending",
      signerRole: entries.find((entry) => entry.channel === "hometax_upload")?.signerRole ?? "manager",
      signerActorId: entries.find((entry) => entry.channel === "hometax_upload")?.signerActorId ?? "",
      reference: entries.find((entry) => entry.channel === "hometax_upload")?.reference ?? ""
    },
    manual_portal: {
      status: entries.find((entry) => entry.channel === "manual_portal")?.status ?? "pending",
      signerRole: entries.find((entry) => entry.channel === "manual_portal")?.signerRole ?? "payroll_operator",
      signerActorId: entries.find((entry) => entry.channel === "manual_portal")?.signerActorId ?? "",
      reference: entries.find((entry) => entry.channel === "manual_portal")?.reference ?? ""
    },
    internal_archive: {
      status: entries.find((entry) => entry.channel === "internal_archive")?.status ?? "pending",
      signerRole: entries.find((entry) => entry.channel === "internal_archive")?.signerRole ?? "admin",
      signerActorId: entries.find((entry) => entry.channel === "internal_archive")?.signerActorId ?? "",
      reference: entries.find((entry) => entry.channel === "internal_archive")?.reference ?? ""
    }
  } satisfies Record<DeliverySignatureChannel, SignatureDraft>;
}

export default function PayrollYearEndFilingOpsReviewRoutingSignatureBundle() {
  const searchParams = useSearchParams();

  const metricParam = searchParams.get("metric");
  const levelParam = searchParams.get("level");
  const ownerRoleParam = searchParams.get("ownerRole");
  const ownerActorIdParam = searchParams.get("ownerActorId");
  const valueParam = searchParams.get("value");
  const handoffReadyParam = searchParams.get("handoffReady");
  const exportReadyParam = searchParams.get("exportReady");
  const archiveReadyParam = searchParams.get("archiveReady");

  const [metric, setMetric] = useState<AlertMetric>(() => normalizeMetric(metricParam));
  const [level, setLevel] = useState<FilingOpsAlertLevel>(() => normalizeAlertLevel(levelParam));
  const [ownerRole, setOwnerRole] = useState(() => (ownerRoleParam ?? "").trim());
  const [ownerActorId, setOwnerActorId] = useState(() => (ownerActorIdParam ?? "").trim());
  const [currentValueInput, setCurrentValueInput] = useState(valueParam ?? "");
  const [handoffReady, setHandoffReady] = useState(() => parseBooleanQueryParam(handoffReadyParam));
  const [exportReady, setExportReady] = useState(() => parseBooleanQueryParam(exportReadyParam));
  const [archiveReady, setArchiveReady] = useState(() => parseBooleanQueryParam(archiveReadyParam));
  const [routingEntries, setRoutingEntries] = useState<ApprovalRoutingEntry[]>(() =>
    buildDefaultApprovalRoutingEntries(ownerActorIdParam ?? "")
  );
  const [signatureEntries, setSignatureEntries] = useState<DeliverySignatureEntry[]>(() =>
    buildDefaultDeliverySignatureEntries()
  );
  const [routingDrafts, setRoutingDrafts] = useState<Record<ApprovalRoutingStage, RoutingDraft>>(() =>
    buildRoutingDraftMap(buildDefaultApprovalRoutingEntries(ownerActorIdParam ?? ""))
  );
  const [signatureDrafts, setSignatureDrafts] = useState<Record<DeliverySignatureChannel, SignatureDraft>>(() =>
    buildSignatureDraftMap(buildDefaultDeliverySignatureEntries())
  );
  const [bundleLabel, setBundleLabel] = useState(() => `routing-signature-${normalizeMetric(metricParam)}`);

  useEffect(() => {
    const normalizedMetric = normalizeMetric(metricParam);
    const normalizedLevel = normalizeAlertLevel(levelParam);
    const normalizedOwnerRole = (ownerRoleParam ?? "").trim();
    const normalizedOwnerActorId = (ownerActorIdParam ?? "").trim();
    const defaultRouting = buildDefaultApprovalRoutingEntries(normalizedOwnerActorId);
    const defaultSignature = buildDefaultDeliverySignatureEntries();

    setMetric(normalizedMetric);
    setLevel(normalizedLevel);
    setOwnerRole(normalizedOwnerRole);
    setOwnerActorId(normalizedOwnerActorId);
    setCurrentValueInput(valueParam ?? "");
    setHandoffReady(parseBooleanQueryParam(handoffReadyParam));
    setExportReady(parseBooleanQueryParam(exportReadyParam));
    setArchiveReady(parseBooleanQueryParam(archiveReadyParam));
    setRoutingEntries(copyRoutingEntries(defaultRouting));
    setSignatureEntries(copySignatureEntries(defaultSignature));
    setRoutingDrafts(buildRoutingDraftMap(defaultRouting));
    setSignatureDrafts(buildSignatureDraftMap(defaultSignature));
    setBundleLabel(`routing-signature-${normalizedMetric}`);
  }, [
    archiveReadyParam,
    exportReadyParam,
    handoffReadyParam,
    levelParam,
    metricParam,
    ownerActorIdParam,
    ownerRoleParam,
    valueParam
  ]);

  const currentValue = parseOptionalInt(currentValueInput);
  const closeOffHref = buildReviewCloseOffRouteHref({
    metric,
    level,
    value: currentValue,
    ownerRole,
    ownerActorId,
    handoffReady,
    exportReady
  });

  const summary = useMemo(
    () =>
      summarizeRoutingSignatureBundle({
        routingEntries,
        signatureEntries,
        handoffReady,
        exportReady,
        archiveReady
      }),
    [routingEntries, signatureEntries, handoffReady, exportReady, archiveReady]
  );

  function updateRoutingDraft(stage: ApprovalRoutingStage, key: keyof RoutingDraft, value: string) {
    setRoutingDrafts((prev) => ({
      ...prev,
      [stage]: {
        ...prev[stage],
        [key]: value
      }
    }));
  }

  function updateSignatureDraft(channel: DeliverySignatureChannel, key: keyof SignatureDraft, value: string) {
    setSignatureDrafts((prev) => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        [key]: value
      }
    }));
  }

  function applyRoutingStage(stage: ApprovalRoutingStage) {
    const draft = routingDrafts[stage];
    setRoutingEntries((prev) =>
      applyApprovalRoutingStatus({
        entries: prev,
        stage,
        status: draft.status,
        ownerRole: draft.ownerRole,
        ownerActorId: draft.ownerActorId,
        etaHours: parseHours(draft.etaHoursInput),
        note: draft.note
      })
    );
  }

  function applySignatureChannel(channel: DeliverySignatureChannel) {
    const draft = signatureDrafts[channel];
    setSignatureEntries((prev) =>
      applyDeliverySignature({
        entries: prev,
        channel,
        status: draft.status,
        signerRole: draft.signerRole,
        signerActorId: draft.signerActorId,
        reference: draft.reference
      })
    );
  }

  return (
    <section className="panel" id="filing-alert-routing-signature-bundle">
      <h2>Payroll Filing Approval Routing and Delivery Signature Bundle</h2>
      <p className="small">Track close-off routing status and channel signature delivery in one bundle.</p>
      <div className="panel-actions">
        <Link href="/admin/payroll-year-end-filing/ops" className="btn btn-secondary btn-small">
          Back to Ops Dashboard
        </Link>
        <Link href={closeOffHref} className="btn btn-secondary btn-small">
          Back to Close-off Package
        </Link>
      </div>

      <div className={styles.contextGrid}>
        <p className="small">
          metric {metric} / level {level.toUpperCase()} / owner {ownerRole || "-"}:{ownerActorId || "-"} /
          value {currentValue ?? "-"}
        </p>
        <p className="small">
          delivery readiness
          <span className={statusBadgeClass(summary.readyToDeliver)}>
            {summary.readyToDeliver ? "ready" : "hold"}
          </span>
        </p>
      </div>

      <article className="panel" id="filing-alert-approval-routing-grid">
        <h3>Approval Routing Grid</h3>
        <div className={styles.routingGrid} aria-label="filing approval routing grid">
          {routingEntries.map((entry) => {
            const draft = routingDrafts[entry.stage];
            return (
              <div key={entry.stage} className={styles.routingRow}>
                <p className="small">
                  <strong>{ROUTING_STAGE_LABELS[entry.stage]}</strong>
                  <span className={routingStatusClass(entry.status)}>{entry.status}</span>
                </p>
                <p className="small">
                  owner {entry.ownerRole}:{entry.ownerActorId || "-"} / eta {entry.etaHours}h / updated{" "}
                  {entry.updatedAt ? new Date(entry.updatedAt).toLocaleString("ko-KR") : "-"}
                </p>
                <p className="small">{entry.note || "no routing note"}</p>

                <div className={styles.controlGrid}>
                  <label>
                    Status
                    <select
                      value={draft.status}
                      onChange={(event) => updateRoutingDraft(entry.stage, "status", event.target.value)}
                    >
                      <option value="pending">pending</option>
                      <option value="in_progress">in_progress</option>
                      <option value="done">done</option>
                      <option value="blocked">blocked</option>
                    </select>
                  </label>
                  <label>
                    Owner Role
                    <select
                      value={draft.ownerRole}
                      onChange={(event) => updateRoutingDraft(entry.stage, "ownerRole", event.target.value)}
                    >
                      <option value="payroll_operator">payroll_operator</option>
                      <option value="manager">manager</option>
                      <option value="admin">admin</option>
                    </select>
                  </label>
                  <label>
                    Owner Actor ID
                    <input
                      value={draft.ownerActorId}
                      onChange={(event) => updateRoutingDraft(entry.stage, "ownerActorId", event.target.value)}
                    />
                  </label>
                  <label>
                    ETA Hours
                    <input
                      value={draft.etaHoursInput}
                      onChange={(event) => updateRoutingDraft(entry.stage, "etaHoursInput", event.target.value)}
                    />
                  </label>
                  <label>
                    Note
                    <textarea
                      value={draft.note}
                      onChange={(event) => updateRoutingDraft(entry.stage, "note", event.target.value)}
                    />
                  </label>
                </div>
                <button className="btn btn-secondary btn-small" onClick={() => applyRoutingStage(entry.stage)}>
                  Apply Routing Stage
                </button>
              </div>
            );
          })}
        </div>
      </article>

      <article className="panel" id="filing-alert-delivery-signature-grid">
        <h3>Delivery Signature Grid</h3>
        <div className={styles.signatureGrid} aria-label="filing delivery signature grid">
          {signatureEntries.map((entry) => {
            const draft = signatureDrafts[entry.channel];
            return (
              <div key={entry.channel} className={styles.signatureRow}>
                <p className="small">
                  <strong>{SIGNATURE_CHANNEL_LABELS[entry.channel]}</strong>
                  <span className={signatureStatusClass(entry.status)}>{entry.status}</span>
                </p>
                <p className="small">
                  signer {entry.signerRole}:{entry.signerActorId || "-"} / signedAt{" "}
                  {entry.signedAt ? new Date(entry.signedAt).toLocaleString("ko-KR") : "-"}
                </p>
                <p className="small">reference {entry.reference || "-"}</p>

                <div className={styles.controlGrid}>
                  <label>
                    Status
                    <select
                      value={draft.status}
                      onChange={(event) => updateSignatureDraft(entry.channel, "status", event.target.value)}
                    >
                      <option value="pending">pending</option>
                      <option value="signed">signed</option>
                      <option value="failed">failed</option>
                    </select>
                  </label>
                  <label>
                    Signer Role
                    <select
                      value={draft.signerRole}
                      onChange={(event) => updateSignatureDraft(entry.channel, "signerRole", event.target.value)}
                    >
                      <option value="payroll_operator">payroll_operator</option>
                      <option value="manager">manager</option>
                      <option value="admin">admin</option>
                    </select>
                  </label>
                  <label>
                    Signer Actor ID
                    <input
                      value={draft.signerActorId}
                      onChange={(event) => updateSignatureDraft(entry.channel, "signerActorId", event.target.value)}
                    />
                  </label>
                  <label>
                    Reference
                    <input
                      value={draft.reference}
                      onChange={(event) => updateSignatureDraft(entry.channel, "reference", event.target.value)}
                    />
                  </label>
                </div>
                <button className="btn btn-secondary btn-small" onClick={() => applySignatureChannel(entry.channel)}>
                  Apply Signature
                </button>
              </div>
            );
          })}
        </div>
      </article>

      <article className="panel" id="filing-alert-routing-signature-readiness">
        <h3>Routing Signature Bundle Readiness</h3>
        <div className={styles.controlGrid}>
          <label>
            Bundle Label
            <input value={bundleLabel} onChange={(event) => setBundleLabel(event.target.value)} />
          </label>
          <label>
            Handoff Ready
            <select value={handoffReady ? "yes" : "no"} onChange={(event) => setHandoffReady(event.target.value === "yes")}>
              <option value="yes">yes</option>
              <option value="no">no</option>
            </select>
          </label>
          <label>
            Export Ready
            <select value={exportReady ? "yes" : "no"} onChange={(event) => setExportReady(event.target.value === "yes")}>
              <option value="yes">yes</option>
              <option value="no">no</option>
            </select>
          </label>
          <label>
            Archive Ready
            <select value={archiveReady ? "yes" : "no"} onChange={(event) => setArchiveReady(event.target.value === "yes")}>
              <option value="yes">yes</option>
              <option value="no">no</option>
            </select>
          </label>
        </div>

        <div className={styles.bundleCard}>
          <p className="small">bundle {bundleLabel || "-"}</p>
          <p className="small">
            routing done {summary.routingDoneCount}/{summary.routingTotalCount}, blocked {summary.routingBlockedCount}
          </p>
          <p className="small">
            signatures signed {summary.signatureSignedCount}/{summary.signatureTotalCount}, failed{" "}
            {summary.signatureFailedCount}
          </p>
          <p className={`small ${summary.readyToDeliver ? "ok" : "fail"}`}>
            readyToDeliver {summary.readyToDeliver ? "yes" : "no"}
          </p>
        </div>

        {summary.blockers.length === 0 ? (
          <p className="small ok">Routing and delivery signature bundle is fully ready.</p>
        ) : (
          <ul className={styles.blockerList} aria-label="filing routing signature blockers">
            {summary.blockers.map((blocker) => (
              <li key={blocker} className="small">
                {blocker}
              </li>
            ))}
          </ul>
        )}
      </article>
    </section>
  );
}
