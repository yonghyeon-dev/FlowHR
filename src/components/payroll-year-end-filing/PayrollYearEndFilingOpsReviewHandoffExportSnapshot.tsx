"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import styles from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsReviewHandoffExportSnapshot.module.css";
import type { FilingOpsAlertLevel } from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsDashboard";
import type { AlertMetric } from "@/components/payroll-year-end-filing/filing-alert-execution-checklist";
import {
  normalizeAlertLevel,
  normalizeMetric,
  parseOptionalInt
} from "@/components/payroll-year-end-filing/filing-alert-execution-checklist";
import { buildChecklistReviewRouteHref } from "@/components/payroll-year-end-filing/filing-alert-execution-review-loop";
import { buildChecklistReviewSnapshotRouteHref } from "@/components/payroll-year-end-filing/filing-alert-review-approval-snapshot";
import {
  buildFilingExportSnapshot,
  buildReviewHandoffPacket,
  parseReviewHandoffRole,
  summarizeReviewHandoffExportSnapshot,
  type FilingExportSnapshot,
  type FilingExportSnapshotFormat,
  type FilingExportSnapshotValidationStatus,
  type ReviewHandoffPacket,
  type ReviewHandoffRole
} from "@/components/payroll-year-end-filing/filing-alert-review-handoff-export-snapshot";

type HandoffDraft = {
  fromRole: ReviewHandoffRole;
  fromActorId: string;
  toRole: ReviewHandoffRole;
  toActorId: string;
  note: string;
  escalationPath: string;
  dueAt: string;
};

type ExportDraft = {
  format: FilingExportSnapshotFormat;
  validationStatus: FilingExportSnapshotValidationStatus;
  recordCountInput: string;
  checksum: string;
  artifactId: string;
  exportedAt: string;
};

const ROLE_LABELS: Record<ReviewHandoffRole, string> = {
  payroll_operator: "Payroll Operator",
  manager: "Manager",
  admin: "Admin"
};

function parseCount(input: string) {
  const parsed = parseOptionalInt(input);
  if (parsed === null || parsed < 0) {
    return 0;
  }
  return parsed;
}

function statusBadgeClass(ready: boolean) {
  return `${styles.statusBadge} ${ready ? styles.statusReady : styles.statusHold}`;
}

function buildDefaultHandoffDraft(ownerRoleParam: string | null, ownerActorIdParam: string | null): HandoffDraft {
  return {
    fromRole: parseReviewHandoffRole(ownerRoleParam),
    fromActorId: (ownerActorIdParam ?? "").trim() || "OPS-0205",
    toRole: "manager",
    toActorId: "",
    note: "",
    escalationPath: "ops > payroll-manager > admin",
    dueAt: new Date().toISOString()
  };
}

function buildDefaultExportDraft(metric: AlertMetric): ExportDraft {
  return {
    format: "hometax_csv",
    validationStatus: "pass",
    recordCountInput: "",
    checksum: "",
    artifactId: `filing-${metric}-snapshot`,
    exportedAt: new Date().toISOString()
  };
}

export default function PayrollYearEndFilingOpsReviewHandoffExportSnapshot() {
  const searchParams = useSearchParams();

  const metricParam = searchParams.get("metric");
  const levelParam = searchParams.get("level");
  const ownerRoleParam = searchParams.get("ownerRole");
  const ownerActorIdParam = searchParams.get("ownerActorId");
  const valueParam = searchParams.get("value");
  const approvedCountParam = searchParams.get("approvedCount");
  const pendingCountParam = searchParams.get("pendingCount");
  const reworkCountParam = searchParams.get("reworkCount");
  const totalCountParam = searchParams.get("totalCount");

  const [metric, setMetric] = useState<AlertMetric>(() => normalizeMetric(metricParam));
  const [level, setLevel] = useState<FilingOpsAlertLevel>(() => normalizeAlertLevel(levelParam));
  const [ownerRole, setOwnerRole] = useState(() => (ownerRoleParam ?? "").trim());
  const [ownerActorId, setOwnerActorId] = useState(() => (ownerActorIdParam ?? "").trim());
  const [currentValueInput, setCurrentValueInput] = useState(valueParam ?? "");
  const [approvedCountInput, setApprovedCountInput] = useState(approvedCountParam ?? "0");
  const [pendingCountInput, setPendingCountInput] = useState(pendingCountParam ?? "0");
  const [reworkCountInput, setReworkCountInput] = useState(reworkCountParam ?? "0");
  const [totalCountInput, setTotalCountInput] = useState(totalCountParam ?? "3");
  const [handoffDraft, setHandoffDraft] = useState<HandoffDraft>(() =>
    buildDefaultHandoffDraft(ownerRoleParam, ownerActorIdParam)
  );
  const [exportDraft, setExportDraft] = useState<ExportDraft>(() =>
    buildDefaultExportDraft(normalizeMetric(metricParam))
  );
  const [handoffPacket, setHandoffPacket] = useState<ReviewHandoffPacket | null>(null);
  const [exportSnapshot, setExportSnapshot] = useState<FilingExportSnapshot | null>(null);

  useEffect(() => {
    const normalizedMetric = normalizeMetric(metricParam);
    const normalizedLevel = normalizeAlertLevel(levelParam);
    const normalizedOwnerRole = (ownerRoleParam ?? "").trim();
    const normalizedOwnerActorId = (ownerActorIdParam ?? "").trim();

    setMetric(normalizedMetric);
    setLevel(normalizedLevel);
    setOwnerRole(normalizedOwnerRole);
    setOwnerActorId(normalizedOwnerActorId);
    setCurrentValueInput(valueParam ?? "");
    setApprovedCountInput(approvedCountParam ?? "0");
    setPendingCountInput(pendingCountParam ?? "0");
    setReworkCountInput(reworkCountParam ?? "0");
    setTotalCountInput(totalCountParam ?? "3");
    setHandoffDraft(buildDefaultHandoffDraft(ownerRoleParam, ownerActorIdParam));
    setExportDraft(buildDefaultExportDraft(normalizedMetric));
    setHandoffPacket(null);
    setExportSnapshot(null);
  }, [
    approvedCountParam,
    levelParam,
    metricParam,
    ownerActorIdParam,
    ownerRoleParam,
    pendingCountParam,
    reworkCountParam,
    totalCountParam,
    valueParam
  ]);

  const currentValue = parseOptionalInt(currentValueInput);
  const approvedCount = parseCount(approvedCountInput);
  const pendingCount = parseCount(pendingCountInput);
  const reworkCount = parseCount(reworkCountInput);
  const totalCount = parseCount(totalCountInput);

  const reviewLoopHref = buildChecklistReviewRouteHref({
    metric,
    level,
    value: currentValue,
    ownerRole,
    ownerActorId
  });
  const approvalSnapshotHref = buildChecklistReviewSnapshotRouteHref({
    metric,
    level,
    value: currentValue,
    ownerRole,
    ownerActorId
  });

  const summary = useMemo(
    () =>
      summarizeReviewHandoffExportSnapshot({
        approvedCount,
        pendingCount,
        reworkCount,
        totalCount,
        handoffPacket,
        exportSnapshot
      }),
    [approvedCount, pendingCount, reworkCount, totalCount, handoffPacket, exportSnapshot]
  );

  function updateHandoffDraft(key: keyof HandoffDraft, value: string) {
    setHandoffDraft((prev) => ({ ...prev, [key]: value }));
  }

  function updateExportDraft(key: keyof ExportDraft, value: string) {
    setExportDraft((prev) => ({ ...prev, [key]: value }));
  }

  function createHandoffPacket() {
    setHandoffPacket(
      buildReviewHandoffPacket({
        fromRole: handoffDraft.fromRole,
        fromActorId: handoffDraft.fromActorId,
        toRole: handoffDraft.toRole,
        toActorId: handoffDraft.toActorId,
        note: handoffDraft.note,
        escalationPath: handoffDraft.escalationPath,
        dueAt: handoffDraft.dueAt
      })
    );
  }

  function createExportSnapshot() {
    setExportSnapshot(
      buildFilingExportSnapshot({
        format: exportDraft.format,
        validationStatus: exportDraft.validationStatus,
        recordCount: parseCount(exportDraft.recordCountInput),
        checksum: exportDraft.checksum,
        artifactId: exportDraft.artifactId,
        exportedAt: exportDraft.exportedAt
      })
    );
  }

  return (
    <section className="panel" id="filing-alert-review-handoff-export-snapshot">
      <h2>Payroll Filing Review Handoff and Export Snapshot</h2>
      <p className="small">Capture close-ready handoff notes and filing export proof in one place.</p>
      <div className="panel-actions">
        <Link href="/admin/payroll-year-end-filing/ops" className="btn btn-secondary btn-small">
          Back to Ops Dashboard
        </Link>
        <Link href={reviewLoopHref} className="btn btn-secondary btn-small">
          Back to Review Loop
        </Link>
        <Link href={approvalSnapshotHref} className="btn btn-secondary btn-small">
          Back to Approval Snapshot
        </Link>
      </div>

      <div className={styles.contextGrid}>
        <p className="small">
          metric {metric} / level {level.toUpperCase()} / owner {ownerRole || "-"}:{ownerActorId || "-"} /
          value {currentValue ?? "-"}
        </p>
        <p className="small">
          close-ready status <span className={statusBadgeClass(summary.readyToClose)}>{summary.readyToClose ? "ready" : "hold"}</span>
        </p>
      </div>

      <article className="panel" id="filing-alert-review-handoff-packet">
        <h3>Review Handoff Packet</h3>
        <div className={styles.formGrid}>
          <label>
            From Role
            <select
              value={handoffDraft.fromRole}
              onChange={(event) => updateHandoffDraft("fromRole", event.target.value)}
            >
              <option value="payroll_operator">payroll_operator</option>
              <option value="manager">manager</option>
              <option value="admin">admin</option>
            </select>
          </label>
          <label>
            From Actor ID
            <input
              value={handoffDraft.fromActorId}
              onChange={(event) => updateHandoffDraft("fromActorId", event.target.value)}
            />
          </label>
          <label>
            To Role
            <select value={handoffDraft.toRole} onChange={(event) => updateHandoffDraft("toRole", event.target.value)}>
              <option value="payroll_operator">payroll_operator</option>
              <option value="manager">manager</option>
              <option value="admin">admin</option>
            </select>
          </label>
          <label>
            To Actor ID
            <input
              value={handoffDraft.toActorId}
              onChange={(event) => updateHandoffDraft("toActorId", event.target.value)}
            />
          </label>
          <label>
            Due At (ISO)
            <input value={handoffDraft.dueAt} onChange={(event) => updateHandoffDraft("dueAt", event.target.value)} />
          </label>
          <label>
            Escalation Path
            <input
              value={handoffDraft.escalationPath}
              onChange={(event) => updateHandoffDraft("escalationPath", event.target.value)}
            />
          </label>
        </div>
        <label>
          Handoff Note
          <textarea value={handoffDraft.note} onChange={(event) => updateHandoffDraft("note", event.target.value)} />
        </label>
        <div className={styles.formActions}>
          <button className="btn btn-secondary btn-small" onClick={createHandoffPacket}>
            Build Handoff Packet
          </button>
          <button className="btn btn-secondary btn-small" onClick={() => setHandoffPacket(null)}>
            Clear Handoff Packet
          </button>
        </div>

        {handoffPacket ? (
          <div className={styles.snapshotCard}>
            <p className="small">
              handoffId {handoffPacket.handoffId} / {ROLE_LABELS[handoffPacket.fromRole]}({handoffPacket.fromActorId})
              {" -> "}
              {ROLE_LABELS[handoffPacket.toRole]}({handoffPacket.toActorId || "-"})
            </p>
            <p className="small">due {handoffPacket.dueAt}</p>
            <p className="small">escalation {handoffPacket.escalationPath || "-"}</p>
            <p className="small">{handoffPacket.note || "no handoff note"}</p>
          </div>
        ) : (
          <p className="small">No handoff packet yet.</p>
        )}
      </article>

      <article className="panel" id="filing-alert-export-snapshot">
        <h3>Filing Export Snapshot</h3>
        <div className={styles.formGrid}>
          <label>
            Format
            <select value={exportDraft.format} onChange={(event) => updateExportDraft("format", event.target.value)}>
              <option value="json">json</option>
              <option value="csv">csv</option>
              <option value="jsonl">jsonl</option>
              <option value="hometax_csv">hometax_csv</option>
            </select>
          </label>
          <label>
            Validation
            <select
              value={exportDraft.validationStatus}
              onChange={(event) => updateExportDraft("validationStatus", event.target.value)}
            >
              <option value="pass">pass</option>
              <option value="fail">fail</option>
            </select>
          </label>
          <label>
            Record Count
            <input
              value={exportDraft.recordCountInput}
              onChange={(event) => updateExportDraft("recordCountInput", event.target.value)}
            />
          </label>
          <label>
            Checksum
            <input value={exportDraft.checksum} onChange={(event) => updateExportDraft("checksum", event.target.value)} />
          </label>
          <label>
            Artifact ID
            <input value={exportDraft.artifactId} onChange={(event) => updateExportDraft("artifactId", event.target.value)} />
          </label>
          <label>
            Exported At (ISO)
            <input value={exportDraft.exportedAt} onChange={(event) => updateExportDraft("exportedAt", event.target.value)} />
          </label>
        </div>
        <div className={styles.formActions}>
          <button className="btn btn-secondary btn-small" onClick={createExportSnapshot}>
            Build Export Snapshot
          </button>
          <button className="btn btn-secondary btn-small" onClick={() => setExportSnapshot(null)}>
            Clear Export Snapshot
          </button>
        </div>

        {exportSnapshot ? (
          <div className={styles.snapshotCard}>
            <p className="small">
              artifact {exportSnapshot.artifactId} / {exportSnapshot.format} / validation{" "}
              {exportSnapshot.validationStatus}
            </p>
            <p className="small">
              records {exportSnapshot.recordCount} / checksum {exportSnapshot.checksum || "-"}
            </p>
            <p className="small">exportedAt {exportSnapshot.exportedAt}</p>
          </div>
        ) : (
          <p className="small">No export snapshot yet.</p>
        )}
      </article>

      <article className="panel" id="filing-alert-review-handoff-readiness">
        <h3>Close Readiness Snapshot</h3>
        <div className={styles.formGrid}>
          <label>
            Approved Count
            <input value={approvedCountInput} onChange={(event) => setApprovedCountInput(event.target.value)} />
          </label>
          <label>
            Pending Count
            <input value={pendingCountInput} onChange={(event) => setPendingCountInput(event.target.value)} />
          </label>
          <label>
            Rework Count
            <input value={reworkCountInput} onChange={(event) => setReworkCountInput(event.target.value)} />
          </label>
          <label>
            Total Count
            <input value={totalCountInput} onChange={(event) => setTotalCountInput(event.target.value)} />
          </label>
        </div>

        <p className={`small ${summary.readyToClose ? "ok" : "fail"}`}>
          approvals {approvedCount}/{totalCount}, pending {pendingCount}, rework {reworkCount} / handoff{" "}
          {summary.handoffReady ? "ready" : "hold"} / export {summary.exportReady ? "ready" : "hold"}
        </p>
        {summary.reasons.length === 0 ? (
          <p className="small ok">All handoff and export snapshot gates are satisfied.</p>
        ) : (
          <ul className={styles.readinessList} aria-label="filing review handoff readiness reasons">
            {summary.reasons.map((reason) => (
              <li key={reason} className="small">
                {reason}
              </li>
            ))}
          </ul>
        )}
      </article>
    </section>
  );
}
