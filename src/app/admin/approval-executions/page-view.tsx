import Link from "next/link";

import {
  ApprovalExecutionEscalationResultPanel,
  ApprovalExecutionHistoryPanel,
  ApprovalExecutionListPanel,
  ApprovalExecutionLogsPanel,
  ApprovalExecutionRelatedWorkspacesPanel,
  ApprovalExecutionSummaryPanel,
  ApprovalExecutionWorkConditionsPanel
} from "@/app/admin/approval-executions/page-sections";
import type {
  ApiLog,
  ApprovalDomain,
  ApprovalExecutionDto,
  ApprovalExecutionSort,
  ApprovalExecutionState,
  ApprovalExecutionSummary,
  ApprovalStageHistoryDto,
  EscalationResultDto
} from "@/app/admin/approval-executions/page-types";
import { isAdminHubSource } from "@/app/admin/source-context";

type AdminApprovalExecutionsPageViewProps = {
  isKoLocale: boolean;
  showDevTools: boolean;
  source: string | null;
  dashboardFocusLabel: string;
  analyticsFocusLabel: string;
  analyticsBackHref: string | null;
  requiresLoginSession: boolean;
  summary: ApprovalExecutionSummary;
  asOfDate: Date;
  asOfIso: string;
  runtimeLocale: string;
  stalledHoursMin: string;
  escalationResult: EscalationResultDto | null;
  executions: ApprovalExecutionDto[];
  selectedTargetKey: string;
  stalledHoursRiskThreshold: number;
  selectedExecution: ApprovalExecutionDto | null;
  stageHistory: ApprovalStageHistoryDto[];
  stats: { total: number; success: number; fail: number };
  logs: ApiLog[];
  pendingLabel: string | null;
  statusMessage: string;
  supabaseSessionError: string | null;
  organizationId: string;
  adminActorId: string;
  sort: ApprovalExecutionSort;
  asOfInput: string;
  domain: ApprovalDomain | "";
  state: ApprovalExecutionState | "";
  targetEntityType: string;
  targetEntityId: string;
  limit: string;
  historyLimit: string;
  notificationChannel: string;
  toDomainLabel: (value: ApprovalDomain) => string;
  toStateLabel: (value: ApprovalExecutionState) => string;
  setSort: (value: ApprovalExecutionSort) => void;
  setStalledHoursMin: (value: string) => void;
  setAsOfInput: (value: string) => void;
  setDomain: (value: ApprovalDomain | "") => void;
  setState: (value: ApprovalExecutionState | "") => void;
  setTargetEntityType: (value: string) => void;
  setTargetEntityId: (value: string) => void;
  setLimit: (value: string) => void;
  setHistoryLimit: (value: string) => void;
  setNotificationChannel: (value: string) => void;
  onLoadExecutions: () => void;
  onEscalationDryRun: () => void;
  onEscalationDispatch: () => void;
  onSelectExecution: (execution: ApprovalExecutionDto) => void;
  onApproveExecution: (execution: ApprovalExecutionDto) => void;
  onRejectExecution: (execution: ApprovalExecutionDto, reason: string) => void;
};

export function AdminApprovalExecutionsPageView(props: AdminApprovalExecutionsPageViewProps) {
  const {
    isKoLocale,
    showDevTools,
    source,
    dashboardFocusLabel,
    analyticsFocusLabel,
    analyticsBackHref,
    requiresLoginSession,
    summary,
    asOfDate,
    asOfIso,
    runtimeLocale,
    stalledHoursMin,
    escalationResult,
    executions,
    selectedTargetKey,
    stalledHoursRiskThreshold,
    selectedExecution,
    stageHistory,
    stats,
    logs,
    pendingLabel,
    statusMessage,
    supabaseSessionError,
    organizationId,
    adminActorId,
    sort,
    asOfInput,
    domain,
    state,
    targetEntityType,
    targetEntityId,
    limit,
    historyLimit,
    notificationChannel,
    toDomainLabel,
    toStateLabel,
    setSort,
    setStalledHoursMin,
    setAsOfInput,
    setDomain,
    setState,
    setTargetEntityType,
    setTargetEntityId,
    setLimit,
    setHistoryLimit,
    setNotificationChannel,
    onLoadExecutions,
    onEscalationDryRun,
    onEscalationDispatch,
    onSelectExecution,
    onApproveExecution,
    onRejectExecution
  } = props;

  const sourceHint = isAdminHubSource(source)
    ? `${isKoLocale ? "관리자 허브에서 이동했습니다" : "Opened from admin hub"} · ${isKoLocale ? "집중 대기함" : "Focused queue"}: ${dashboardFocusLabel}`
    : source === "admin-analytics"
      ? `${isKoLocale ? "관리자 분석에서 이동했습니다" : "Opened from admin analytics"} · ${isKoLocale ? "집중 대기함" : "Focused queue"}: ${analyticsFocusLabel}`
      : isKoLocale
        ? "결재 실행 현황은 정책, 템플릿, 단계 이력과 연결된 핵심 승인 운영 워크스페이스입니다."
        : "Approval execution is the core approval operations workspace connected to policy, templates, and stage history.";

  return (
    <main className="saas-content workspace-shell admin-workspace-shell">
      <header className="page-header workspace-page-header">
        <div>
          <p className="eyebrow">{isKoLocale ? "FlowHR 관리자" : "FlowHR Admin"}</p>
          <h1 className="page-title">{isKoLocale ? "결재 실행 현황" : "Approval execution queue"}</h1>
          <p className="page-subtitle">
            {isKoLocale
              ? "정체된 결재 실행 항목을 우선순위로 확인하고, 임계값을 넘는 항목을 드라이런 또는 실제 에스컬레이션으로 전송합니다."
              : "Review stalled approval executions by priority and send over-threshold items through dry-run or live escalation."}
            {showDevTools
              ? isKoLocale
                ? " 개발 옵션이 활성화되어 고급 로그를 함께 확인할 수 있습니다."
                : " Dev options are enabled so advanced logs remain visible."
              : ""}
          </p>
          <p className="small muted workspace-source-banner">{sourceHint}</p>
        </div>
        <div className="page-actions">
          {analyticsBackHref ? (
            <Link href={analyticsBackHref} className="btn btn-secondary">
              {isKoLocale ? "분석으로 돌아가기" : "Back to analytics"}
            </Link>
          ) : null}
          <Link href="/admin" className="btn btn-secondary">
            {isKoLocale ? "관리자 허브" : "Admin hub"}
          </Link>
        </div>
      </header>

      <section
        className="kpi-strip workspace-summary-strip"
        aria-label={isKoLocale ? "결재 실행 요약" : "Approval execution summary"}
      >
        <article className="kpi-card workspace-summary-card">
          <p>{isKoLocale ? "전체 실행" : "Total executions"}</p>
          <strong>{summary.total}</strong>
        </article>
        <article className="kpi-card workspace-summary-card">
          <p>{isKoLocale ? "정체 항목" : "Stalled items"}</p>
          <strong>{summary.stalledCount}</strong>
        </article>
        <article className="kpi-card workspace-summary-card">
          <p>{isKoLocale ? "최대 정체 시간" : "Max stalled hours"}</p>
          <strong>{summary.maxStalledHours.toFixed(1)}h</strong>
        </article>
      </section>

      {requiresLoginSession ? (
        <p className="small fail workspace-inline-status">
          {isKoLocale ? "운영 환경에서는 로그인 세션이 필요합니다. " : "Login session is required in production. "}
          <Link href="/login">/login</Link>
        </p>
      ) : null}

      <section className="panel-grid workspace-panel-grid">
        <ApprovalExecutionWorkConditionsPanel
          isKoLocale={isKoLocale}
          showDevTools={showDevTools}
          organizationId={requiresLoginSession ? "" : organizationId}
          adminActorId={adminActorId}
          sort={sort}
          stalledHoursMin={stalledHoursMin}
          asOfInput={asOfInput}
          domain={domain}
          state={state}
          targetEntityType={targetEntityType}
          targetEntityId={targetEntityId}
          limit={limit}
          historyLimit={historyLimit}
          notificationChannel={notificationChannel}
          pendingLabel={pendingLabel}
          statusMessage={statusMessage}
          supabaseSessionError={supabaseSessionError}
          toDomainLabel={toDomainLabel}
          toStateLabel={toStateLabel}
          setSort={setSort}
          setStalledHoursMin={setStalledHoursMin}
          setAsOfInput={setAsOfInput}
          setDomain={setDomain}
          setState={setState}
          setTargetEntityType={setTargetEntityType}
          setTargetEntityId={setTargetEntityId}
          setLimit={setLimit}
          setHistoryLimit={setHistoryLimit}
          setNotificationChannel={setNotificationChannel}
          onLoadExecutions={onLoadExecutions}
          onEscalationDryRun={onEscalationDryRun}
          onEscalationDispatch={onEscalationDispatch}
        />

        <ApprovalExecutionSummaryPanel
          isKoLocale={isKoLocale}
          summary={summary}
          asOfIso={asOfIso}
          runtimeLocale={runtimeLocale}
          stalledHoursMin={stalledHoursMin}
        />

        <ApprovalExecutionEscalationResultPanel
          isKoLocale={isKoLocale}
          runtimeLocale={runtimeLocale}
          escalationResult={escalationResult}
        />

        <ApprovalExecutionListPanel
          isKoLocale={isKoLocale}
          runtimeLocale={runtimeLocale}
          executions={executions}
          selectedTargetKey={selectedTargetKey}
          asOfDate={asOfDate}
          stalledHoursThreshold={stalledHoursRiskThreshold}
          toDomainLabel={toDomainLabel}
          toStateLabel={toStateLabel}
          pendingLabel={pendingLabel}
          onSelectExecution={onSelectExecution}
          onApproveExecution={onApproveExecution}
          onRejectExecution={onRejectExecution}
        />

        <ApprovalExecutionHistoryPanel
          isKoLocale={isKoLocale}
          runtimeLocale={runtimeLocale}
          selectedExecution={selectedExecution}
          stageHistory={stageHistory}
        />

        {showDevTools ? (
          <ApprovalExecutionLogsPanel
            isKoLocale={isKoLocale}
            stats={stats}
            pendingLabel={pendingLabel}
            logs={logs}
          />
        ) : (
          <ApprovalExecutionRelatedWorkspacesPanel isKoLocale={isKoLocale} />
        )}
      </section>
    </main>
  );
}
