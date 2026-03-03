import Link from "next/link";
import { type KpiCopy } from "@/components/admin-kpi/copy";
import { formatDelta, formatPercent } from "@/components/admin-kpi/helpers";
import { type AdminKpiSummary } from "@/features/admin-kpi/summary";

export type ApiLog = {
  id: number;
  label: string;
  ok: boolean;
  status: number;
  at: string;
  durationMs: number;
};

export type RangeKpi = {
  summary: AdminKpiSummary;
  detail: {
    attendanceTotal: number;
    attendanceApproved: number;
    leaveApprovedRequestCount: number;
    payrollTotal: number;
    payrollConfirmed: number;
    contractPendingResponseCount: number;
    contractRenewalCandidateCount: number;
  };
};

export type TrendRow = {
  key: string;
  label: string;
  current: number;
  previous: number;
  percent: boolean;
  delta: number;
};

export type AdminKpiFocusMetric =
  | "all"
  | "pendingApprovals"
  | "stalledApprovals"
  | "attendanceApprovalRate"
  | "leaveApprovedDays"
  | "payrollConfirmedRate"
  | "contractDecisionQueueCount"
  | "contractSlaOverdueCount";
export type AdminKpiDrilldownMetric = Exclude<AdminKpiFocusMetric, "all">;

export type AdminKpiCardQuickLink = {
  href: string;
  workspaceLabel: string;
};

export type AdminKpiCardQuickLinkMap = Partial<
  Record<AdminKpiDrilldownMetric, AdminKpiCardQuickLink>
>;

type ContextPanelProps = {
  copy: KpiCopy;
  showDevTools: boolean;
  sessionOrganizationId: string;
  sessionActorId: string;
  periodStart: string;
  periodEnd: string;
  pendingLabel: string | null;
  refreshDisabled: boolean;
  onSetPeriodStart: (value: string) => void;
  onSetPeriodEnd: (value: string) => void;
  onSetThisMonth: () => void;
  onSetLast30Days: () => void;
  onRefresh: () => void;
};

type AnalyticsControlsProps = {
  copy: KpiCopy;
  focusMetric: AdminKpiFocusMetric;
  exportButtonLabel: string;
  exportDisabled: boolean;
  onFocusMetricChange: (value: AdminKpiFocusMetric) => void;
  onExportCsv: () => void;
};

const analyticsDrilldownMetrics: AdminKpiDrilldownMetric[] = ["pendingApprovals", "stalledApprovals", "attendanceApprovalRate", "leaveApprovedDays", "payrollConfirmedRate", "contractDecisionQueueCount", "contractSlaOverdueCount"];

export function AdminKpiAnalyticsControls({
  copy,
  focusMetric,
  exportButtonLabel,
  exportDisabled,
  onFocusMetricChange,
  onExportCsv
}: AnalyticsControlsProps) {
  return (
    <section className="panel">
      <div className="input-grid">
        <label>
          {copy.focusMetricLabel}
          <select
            value={focusMetric}
            onChange={(event) => onFocusMetricChange(event.target.value as AdminKpiFocusMetric)}
          >
            <option value="all">{copy.focusMetricAllOption}</option>
            <option value="pendingApprovals">{copy.metrics.pendingApprovals}</option>
            <option value="stalledApprovals">{copy.metrics.stalledApprovals}</option>
            <option value="attendanceApprovalRate">{copy.metrics.attendanceApprovalRate}</option>
            <option value="leaveApprovedDays">{copy.metrics.leaveApprovedDays}</option>
            <option value="payrollConfirmedRate">{copy.metrics.payrollConfirmedRate}</option>
            <option value="contractDecisionQueueCount">{copy.metrics.contractDecisionQueueCount}</option>
            <option value="contractSlaOverdueCount">{copy.metrics.contractSlaOverdueCount}</option>
          </select>
        </label>
      </div>
      <div className="actions" style={{ marginTop: 8 }}>
        <span className="small muted">{copy.quickDrilldownLabel}</span>
        <button type="button" className="btn btn-secondary btn-small" onClick={() => onFocusMetricChange("all")} disabled={focusMetric === "all"}>{copy.quickDrilldownAllAction}</button>
        {analyticsDrilldownMetrics.map((metric) => (
          <button key={metric} type="button" className="btn btn-secondary btn-small" onClick={() => onFocusMetricChange(metric)} disabled={focusMetric === metric}>
            {copy.metrics[metric]}
          </button>
        ))}
      </div>
      <div className="actions" style={{ marginTop: 8 }}>
        <button className="btn btn-secondary" onClick={onExportCsv} disabled={exportDisabled}>
          {exportButtonLabel}
        </button>
      </div>
    </section>
  );
}

export function AdminKpiContextPanel(props: ContextPanelProps) {
  const {
    copy,
    showDevTools,
    sessionOrganizationId,
    sessionActorId,
    periodStart,
    periodEnd,
    pendingLabel,
    refreshDisabled,
    onSetPeriodStart,
    onSetPeriodEnd,
    onSetThisMonth,
    onSetLast30Days,
    onRefresh
  } = props;

  return (
    <section className="panel-grid">
      <article className="panel">
        <h2>{copy.contextTitle}</h2>
        {showDevTools ? (
          <p className="small muted">
            {copy.organizationIdLabel}: <code>{sessionOrganizationId || "-"}</code> / {copy.adminActorIdLabel}:{" "}
            <code>{sessionActorId || "-"}</code>
          </p>
        ) : null}
        <div className="input-grid">
          <label>
            {copy.periodStartLabel}
            <input type="datetime-local" value={periodStart} onChange={(event) => onSetPeriodStart(event.target.value)} />
          </label>
          <label>
            {copy.periodEndLabel}
            <input type="datetime-local" value={periodEnd} onChange={(event) => onSetPeriodEnd(event.target.value)} />
          </label>
        </div>
        <div className="actions">
          <button className="btn btn-secondary" onClick={onSetThisMonth}>
            {copy.thisMonthButton}
          </button>
          <button className="btn btn-secondary" onClick={onSetLast30Days}>
            {copy.recent30DaysButton}
          </button>
          <button className="btn btn-primary" onClick={onRefresh} disabled={refreshDisabled}>
            {copy.refreshButton}
          </button>
        </div>
        {pendingLabel ? <p className="small muted">{pendingLabel}</p> : null}
      </article>
    </section>
  );
}

type CardsProps = {
  copy: KpiCopy;
  kpi: RangeKpi;
  quickLinks?: AdminKpiCardQuickLinkMap;
};

function KpiCardQuickJump({
  copy,
  quickLink
}: {
  copy: KpiCopy;
  quickLink?: AdminKpiCardQuickLink;
}) {
  if (!quickLink) {
    return null;
  }
  return (
    <div className="actions" style={{ marginTop: 8 }}>
      <Link href={quickLink.href} className="btn btn-secondary btn-small">
        {copy.focusWorkspaceOpenAction}: {quickLink.workspaceLabel}
      </Link>
    </div>
  );
}

export function AdminKpiCards({ copy, kpi, quickLinks }: CardsProps) {
  return (
    <section className="kpi-strip">
      <article className="kpi-card">
        <p>{copy.cards.pendingApprovals}</p>
        <strong>{kpi.summary.approvalPendingCount}</strong>
        <KpiCardQuickJump copy={copy} quickLink={quickLinks?.pendingApprovals} />
      </article>
      <article className="kpi-card">
        <p>{copy.cards.stalledApprovals}</p>
        <strong>{kpi.summary.approvalStalledCount}</strong>
        <small>{copy.details.stalledThreshold}</small>
        <KpiCardQuickJump copy={copy} quickLink={quickLinks?.stalledApprovals} />
      </article>
      <article className="kpi-card">
        <p>{copy.cards.attendanceApprovalRate}</p>
        <strong>{formatPercent(kpi.summary.attendanceApprovalRate)}</strong>
        <small>
          {kpi.detail.attendanceApproved} / {kpi.detail.attendanceTotal} {copy.details.attendanceTotal}
        </small>
        <KpiCardQuickJump copy={copy} quickLink={quickLinks?.attendanceApprovalRate} />
      </article>
      <article className="kpi-card">
        <p>{copy.cards.leaveApprovedDays}</p>
        <strong>{kpi.summary.leaveApprovedDays.toFixed(1)}</strong>
        <small>
          {kpi.detail.leaveApprovedRequestCount} {copy.details.leaveApprovedRequests}
        </small>
        <KpiCardQuickJump copy={copy} quickLink={quickLinks?.leaveApprovedDays} />
      </article>
      <article className="kpi-card">
        <p>{copy.cards.payrollConfirmedRate}</p>
        <strong>{formatPercent(kpi.summary.payrollConfirmedRate)}</strong>
        <small>
          {kpi.detail.payrollConfirmed} / {kpi.detail.payrollTotal} {copy.details.payrollConfirmedRuns}
        </small>
        <KpiCardQuickJump copy={copy} quickLink={quickLinks?.payrollConfirmedRate} />
      </article>
      <article className="kpi-card">
        <p>{copy.cards.contractDecisionQueueCount}</p>
        <strong>{kpi.summary.contractDecisionQueueCount}</strong>
        <KpiCardQuickJump copy={copy} quickLink={quickLinks?.contractDecisionQueueCount} />
      </article>
      <article className="kpi-card">
        <p>{copy.cards.contractSlaOverdueCount}</p>
        <strong>{kpi.summary.contractSlaOverdueCount}</strong>
        <KpiCardQuickJump copy={copy} quickLink={quickLinks?.contractSlaOverdueCount} />
      </article>
    </section>
  );
}

type TrendPanelProps = {
  copy: KpiCopy;
  rows: TrendRow[];
};

export function AdminKpiTrendPanel({ copy, rows }: TrendPanelProps) {
  return (
    <article className="panel">
      <h2>{copy.trendTitle}</h2>
      {rows.length === 0 ? (
        <p className="small muted">{copy.noData}</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>{copy.metricLabel}</th>
                <th>{copy.trendCurrent}</th>
                <th>{copy.trendPrevious}</th>
                <th>{copy.trendDelta}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key}>
                  <td>{row.label}</td>
                  <td>{row.percent ? formatPercent(row.current) : row.current.toFixed(1)}</td>
                  <td>{row.percent ? formatPercent(row.previous) : row.previous.toFixed(1)}</td>
                  <td className={row.delta > 0 ? "ok" : row.delta < 0 ? "fail" : ""}>
                    {formatDelta(row.delta, row.percent)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}

type LogsPanelProps = {
  copy: KpiCopy;
  logs: ApiLog[];
};

export function AdminKpiLogsPanel({ copy, logs }: LogsPanelProps) {
  return (
    <article className="panel">
      <h2>{copy.logsTitle}</h2>
      {logs.length === 0 ? (
        <p className="small muted">{copy.noLogs}</p>
      ) : (
        <ul className="log-list">
          {logs.map((log) => (
            <li key={log.id}>
              <span className={log.ok ? "ok" : "fail"}>{log.ok ? copy.logSuccessLabel : copy.logFailLabel}</span> {log.label} / {log.status} / {log.durationMs}ms / {log.at}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
