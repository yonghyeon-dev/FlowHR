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

type ContextPanelProps = {
  copy: KpiCopy;
  organizationId: string;
  adminActorId: string;
  accessToken: string;
  periodStart: string;
  periodEnd: string;
  pendingLabel: string | null;
  refreshDisabled: boolean;
  onSetOrganizationId: (value: string) => void;
  onSetAdminActorId: (value: string) => void;
  onSetAccessToken: (value: string) => void;
  onSetPeriodStart: (value: string) => void;
  onSetPeriodEnd: (value: string) => void;
  onSetThisMonth: () => void;
  onSetLast30Days: () => void;
  onRefresh: () => void;
};

export function AdminKpiContextPanel(props: ContextPanelProps) {
  const {
    copy,
    organizationId,
    adminActorId,
    accessToken,
    periodStart,
    periodEnd,
    pendingLabel,
    refreshDisabled,
    onSetOrganizationId,
    onSetAdminActorId,
    onSetAccessToken,
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
        <div className="input-grid">
          <label>
            {copy.organizationIdLabel}
            <input value={organizationId} onChange={(event) => onSetOrganizationId(event.target.value)} />
          </label>
          <label>
            {copy.adminActorIdLabel}
            <input value={adminActorId} onChange={(event) => onSetAdminActorId(event.target.value)} />
          </label>
          <label>
            {copy.accessTokenLabel}
            <input value={accessToken} onChange={(event) => onSetAccessToken(event.target.value)} />
          </label>
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
};

export function AdminKpiCards({ copy, kpi }: CardsProps) {
  return (
    <section className="kpi-strip">
      <article className="kpi-card">
        <p>{copy.cards.pendingApprovals}</p>
        <strong>{kpi.summary.approvalPendingCount}</strong>
      </article>
      <article className="kpi-card">
        <p>{copy.cards.stalledApprovals}</p>
        <strong>{kpi.summary.approvalStalledCount}</strong>
        <small>{copy.details.stalledThreshold}</small>
      </article>
      <article className="kpi-card">
        <p>{copy.cards.attendanceApprovalRate}</p>
        <strong>{formatPercent(kpi.summary.attendanceApprovalRate)}</strong>
        <small>
          {kpi.detail.attendanceApproved} / {kpi.detail.attendanceTotal} {copy.details.attendanceTotal}
        </small>
      </article>
      <article className="kpi-card">
        <p>{copy.cards.leaveApprovedDays}</p>
        <strong>{kpi.summary.leaveApprovedDays.toFixed(1)}</strong>
        <small>
          {kpi.detail.leaveApprovedRequestCount} {copy.details.leaveApprovedRequests}
        </small>
      </article>
      <article className="kpi-card">
        <p>{copy.cards.payrollConfirmedRate}</p>
        <strong>{formatPercent(kpi.summary.payrollConfirmedRate)}</strong>
        <small>
          {kpi.detail.payrollConfirmed} / {kpi.detail.payrollTotal} {copy.details.payrollConfirmedRuns}
        </small>
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
