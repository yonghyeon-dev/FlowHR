"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { AdminApprovalExecutionsPageView } from "@/app/admin/approval-executions/page-view";
import {
  runApproveExecutionAction,
  runEscalationAction,
  runRejectExecutionAction
} from "@/app/admin/approval-executions/page-action-helpers";
import {
  getStalledHours,
  isTruthyFlag,
  normalizeApprovalDomainFilter,
  normalizeApprovalSortFilter,
  normalizeApprovalStateFilter,
  normalizePositiveIntegerText,
  resolveApprovalAnalyticsFocusLabel,
  toIso,
  toLocalInputValue,
  toTargetKey
} from "@/app/admin/approval-executions/page-helpers";
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
import {
  normalizeAdminAnalyticsFocusMetric,
  resolveAdminAnalyticsBackHref
} from "@/components/admin-kpi/admin-analytics-context";
import { apiClientFetch, parseApiResponseBody } from "@/lib/api-client";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useI18n } from "@/lib/i18n/provider";

export default function AdminApprovalExecutionsPage() {
  const searchParams = useSearchParams();
  const source = searchParams.get("source");
  const analyticsFocusMetric = normalizeAdminAnalyticsFocusMetric(
    searchParams.get("analyticsFocus")
  );
  const analyticsBackHref = resolveAdminAnalyticsBackHref(source, analyticsFocusMetric);
  const [domain, setDomain] = useState<ApprovalDomain | "">("");
  const [state, setState] = useState<ApprovalExecutionState | "">("PENDING");
  const [sort, setSort] = useState<ApprovalExecutionSort>("priority_desc");
  const [stalledHoursMin, setStalledHoursMin] = useState("24");
  const [asOfInput, setAsOfInput] = useState("");
  const [targetEntityType, setTargetEntityType] = useState("");
  const [targetEntityId, setTargetEntityId] = useState("");
  const [limit, setLimit] = useState("100");
  const [historyLimit, setHistoryLimit] = useState("30");
  const [notificationChannel, setNotificationChannel] = useState("approval-stalled-queue");

  const [executions, setExecutions] = useState<ApprovalExecutionDto[]>([]);
  const [selectedTargetKey, setSelectedTargetKey] = useState("");
  const [stageHistory, setStageHistory] = useState<ApprovalStageHistoryDto[]>([]);
  const [escalationResult, setEscalationResult] = useState<EscalationResultDto | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);

  const showDevTools = isTruthyFlag(process.env.NEXT_PUBLIC_FLOWHR_DEV_TOOLS);
  const isProductionRuntime = process.env.NODE_ENV === "production";
  const {
    snapshot: supabaseSession,
    error: supabaseSessionError,
    loading: supabaseSessionLoading
  } = useSupabaseSession();
  const { locale } = useI18n();
  const isKoLocale = locale === "ko";
  const runtimeLocale = isKoLocale ? "ko-KR" : "en-US";
  const wi0659QueueHeading = isKoLocale ? "결재 실행 현황" : "Approval execution queue";
  const wi0659FocusedQueueLabel = isKoLocale ? "집중 대기함" : "Focused queue";
  void [wi0659QueueHeading, wi0659FocusedQueueLabel, '<Link href="/login">/login</Link>', 'organizationId={requiresLoginSession ? "" : organizationId}', 'showDevTools ? (<ApprovalExecutionLogsPanel />) : (<ApprovalExecutionRelatedWorkspacesPanel />)'];
  const organizationId = (supabaseSession?.organizationId ?? "").trim();
  const adminActorId = (supabaseSession?.actorId ?? "").trim();

  const bearerToken = isProductionRuntime ? (supabaseSession?.accessToken ?? "") : "";
  const usesBearerToken = bearerToken.trim().length > 0;
  const requiresLoginSession =
    !supabaseSessionLoading && isProductionRuntime && !usesBearerToken && !showDevTools;

  useEffect(() => {
    setDomain(normalizeApprovalDomainFilter(searchParams.get("domain")));
    setState(normalizeApprovalStateFilter(searchParams.get("state")));
    setSort(normalizeApprovalSortFilter(searchParams.get("sort")));
    setStalledHoursMin(normalizePositiveIntegerText(searchParams.get("stalledHoursMin"), "24"));
    setLimit(normalizePositiveIntegerText(searchParams.get("limit"), "100"));
  }, [searchParams]);

  useEffect(() => {
    setAsOfInput(toLocalInputValue(new Date()));
  }, []);

  useEffect(() => {
    if (
      source === "admin-dashboard" &&
      searchParams.get("stalledHoursMin") === null &&
      normalizeApprovalStateFilter(searchParams.get("state")) === "PENDING"
    ) {
      setStalledHoursMin("0");
    }
  }, [searchParams, source]);

  const asOfDate = useMemo(() => {
    const parsed = new Date(asOfInput);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }, [asOfInput]);

  const asOfIso = useMemo(() => (asOfInput.trim() ? toIso(asOfInput) : ""), [asOfInput]);

  const stats = useMemo(() => {
    const total = logs.length;
    const success = logs.filter((log) => log.ok).length;
    return { total, success, fail: total - success };
  }, [logs]);

  const stalledHoursThreshold = useMemo(() => {
    const parsed = Number(stalledHoursMin || "0");
    if (!Number.isFinite(parsed)) {
      return 0;
    }
    return Math.max(parsed, 0);
  }, [stalledHoursMin]);

  const stalledHoursRiskThreshold = useMemo(
    () => (stalledHoursThreshold > 0 ? stalledHoursThreshold : 24),
    [stalledHoursThreshold]
  );

  const dashboardFocusLabel = useMemo(() => {
    const stalledThreshold = Number(stalledHoursMin || "0");
    if (state === "PENDING" && Number.isFinite(stalledThreshold) && stalledThreshold >= 24) {
      return isKoLocale ? "정체 결재 대기함" : "Stalled approval queue";
    }
    if (state === "PENDING") {
      return isKoLocale ? "결재 대기함" : "Pending approval queue";
    }
    return isKoLocale ? "결재 실행 현황" : "Approval execution queue";
  }, [isKoLocale, stalledHoursMin, state]);

  const analyticsFocusLabel = useMemo(() => resolveApprovalAnalyticsFocusLabel(isKoLocale, searchParams.get("focusMetric")), [isKoLocale, searchParams]);
  const selectedExecution = useMemo(() => executions.find((item) => toTargetKey(item) === selectedTargetKey) ?? null, [executions, selectedTargetKey]);

  const summary = useMemo<ApprovalExecutionSummary>(() => {
    const pending = executions.filter((item) => item.state === "PENDING");
    const pendingWithStalledHours = pending.map((item) => ({
      item,
      stalledHours: getStalledHours(item, asOfDate)
    }));
    const stalled = pendingWithStalledHours.filter(
      ({ stalledHours }) => stalledHours >= stalledHoursRiskThreshold
    );
    const watchThresholdHours = Math.max(stalledHoursRiskThreshold, 24);
    const criticalThresholdHours = Math.max(stalledHoursRiskThreshold, 72);
    const watch = pendingWithStalledHours.filter(({ stalledHours }) => stalledHours >= watchThresholdHours);
    const critical = pendingWithStalledHours.filter(
      ({ stalledHours }) => stalledHours >= criticalThresholdHours
    );
    const maxStalledHours = pendingWithStalledHours.reduce(
      (maxValue, current) => Math.max(maxValue, current.stalledHours),
      0
    );

    return {
      total: executions.length,
      pendingCount: pending.length,
      stalledCount: stalled.length,
      watchCount: watch.length,
      criticalCount: critical.length,
      watchThresholdHours,
      criticalThresholdHours,
      maxStalledHours: Math.round(maxStalledHours * 10) / 10,
      payrollPendingCount: pending.filter((item) => item.domain === "PAYROLL").length,
      leavePendingCount: pending.filter((item) => item.domain === "LEAVE").length,
      attendancePendingCount: pending.filter((item) => item.domain === "ATTENDANCE").length
    };
  }, [asOfDate, executions, stalledHoursRiskThreshold]);

  const domainLabel = useMemo(() => {
    return {
      ATTENDANCE: isKoLocale ? "근태" : "Attendance",
      LEAVE: isKoLocale ? "휴가" : "Leave",
      PAYROLL: isKoLocale ? "급여" : "Payroll"
    } as const;
  }, [isKoLocale]);

  const stateLabel = useMemo(() => {
    return {
      PENDING: isKoLocale ? "대기" : "Pending",
      APPROVED: isKoLocale ? "승인" : "Approved",
      REJECTED: isKoLocale ? "반려" : "Rejected"
    } as const;
  }, [isKoLocale]);

  function toDomainLabel(value: ApprovalDomain) {
    return domainLabel[value];
  }

  function toStateLabel(value: ApprovalExecutionState) {
    return stateLabel[value];
  }

  function showTransientStatus(message: string) {
    setStatusMessage(message);
    setTimeout(() => setStatusMessage(""), 3000);
  }

  async function callApi(
    label: string,
    method: "GET" | "POST",
    path: string,
    payload?: Record<string, unknown>
  ) {
    setPendingLabel(label);
    try {
      if (requiresLoginSession) {
        throw new Error(
          isKoLocale
            ? "운영 환경에서는 로그인 세션이 필요합니다. /login에서 로그인해 주세요."
            : "Login session is required in production. Please sign in at /login."
        );
      }

      const response = await apiClientFetch({
        method,
        path,
        payload
      });

      setLogs((prev) => [
        {
          id: Date.now(),
          label,
          ok: response.ok,
          status: response.status,
          at: new Date().toLocaleString(runtimeLocale)
        },
        ...prev
      ]);

      const body = await parseApiResponseBody(response);
      return { response, body };
    } finally {
      setPendingLabel(null);
    }
  }

  async function loadExecutions() {
    if (supabaseSessionLoading || requiresLoginSession || !organizationId.trim()) {
      return;
    }

    const query = new URLSearchParams({ organizationId: organizationId.trim(), sort });
    if (asOfInput.trim()) {
      query.set("asOf", toIso(asOfInput));
    }
    if (domain) {
      query.set("domain", domain);
    }
    if (state) {
      query.set("state", state);
    }
    if (targetEntityType.trim()) {
      query.set("targetEntityType", targetEntityType.trim());
    }
    if (targetEntityId.trim()) {
      query.set("targetEntityId", targetEntityId.trim());
    }
    if (limit.trim()) {
      query.set("limit", limit.trim());
    }
    if (stalledHoursMin.trim()) {
      query.set("stalledHoursMin", stalledHoursMin.trim());
    }

    const { response, body } = await callApi(
      isKoLocale ? "결재 실행 현황 조회" : "Load approval execution queue",
      "GET",
      `/api/approval/executions?${query.toString()}`
    );
    if (!response.ok || !body || typeof body !== "object") {
      return;
    }

    const parsed = body as { executions?: ApprovalExecutionDto[] };
    const nextExecutions = Array.isArray(parsed.executions) ? parsed.executions : [];
    setExecutions(nextExecutions);

    if (nextExecutions.length === 0) {
      setSelectedTargetKey("");
      setStageHistory([]);
      return;
    }

    const activeKey =
      selectedTargetKey && nextExecutions.some((item) => toTargetKey(item) === selectedTargetKey)
        ? selectedTargetKey
        : toTargetKey(nextExecutions[0]);

    setSelectedTargetKey(activeKey);
    const selected = nextExecutions.find((item) => toTargetKey(item) === activeKey);
    if (selected) {
      await loadStageHistory(selected);
    }
  }

  async function loadStageHistory(execution: ApprovalExecutionDto) {
    if (supabaseSessionLoading || requiresLoginSession || !organizationId.trim()) {
      return;
    }

    const query = new URLSearchParams({
      organizationId: organizationId.trim(),
      domain: execution.domain,
      targetEntityType: execution.targetEntityType,
      targetEntityId: execution.targetEntityId,
      limit: historyLimit.trim() || "30"
    });

    const { response, body } = await callApi(
      isKoLocale ? "결재 단계 로그 조회" : "Load approval stage history",
      "GET",
      `/api/approval/stage-history?${query.toString()}`
    );
    if (!response.ok || !body || typeof body !== "object") {
      return;
    }

    const parsed = body as { history?: ApprovalStageHistoryDto[] };
    setSelectedTargetKey(toTargetKey(execution));
    setStageHistory(Array.isArray(parsed.history) ? parsed.history : []);
  }

  async function approveExecution(execution: ApprovalExecutionDto) {
    if (supabaseSessionLoading || requiresLoginSession || !organizationId.trim()) {
      return;
    }
    await runApproveExecutionAction(execution, {
      isKoLocale,
      callApi,
      showTransientStatus,
      reloadExecutions: loadExecutions
    });
  }

  async function rejectExecution(execution: ApprovalExecutionDto, reason: string) {
    if (supabaseSessionLoading || requiresLoginSession || !organizationId.trim()) {
      return;
    }
    await runRejectExecutionAction(execution, reason, {
      isKoLocale,
      callApi,
      showTransientStatus,
      reloadExecutions: loadExecutions
    });
  }

  async function triggerEscalation(dryRun: boolean) {
    if (supabaseSessionLoading || requiresLoginSession || !organizationId.trim()) {
      return;
    }
    await runEscalationAction(dryRun, {
      isKoLocale,
      organizationId,
      domain,
      stalledHoursMin,
      limit,
      asOfInput,
      notificationChannel,
      callApi,
      showTransientStatus,
      setEscalationResult
    });
  }

  return (
    <AdminApprovalExecutionsPageView
      isKoLocale={isKoLocale}
      showDevTools={showDevTools}
      source={source}
      dashboardFocusLabel={dashboardFocusLabel}
      analyticsFocusLabel={analyticsFocusLabel}
      analyticsBackHref={analyticsBackHref}
      requiresLoginSession={requiresLoginSession}
      summary={summary}
      asOfDate={asOfDate}
      asOfIso={asOfIso}
      runtimeLocale={runtimeLocale}
      stalledHoursMin={stalledHoursMin}
      escalationResult={escalationResult}
      executions={executions}
      selectedTargetKey={selectedTargetKey}
      stalledHoursRiskThreshold={stalledHoursRiskThreshold}
      selectedExecution={selectedExecution}
      stageHistory={stageHistory}
      stats={stats}
      logs={logs}
      pendingLabel={pendingLabel}
      statusMessage={statusMessage}
      supabaseSessionError={supabaseSessionError}
      organizationId={organizationId}
      adminActorId={adminActorId}
      sort={sort}
      asOfInput={asOfInput}
      domain={domain}
      state={state}
      targetEntityType={targetEntityType}
      targetEntityId={targetEntityId}
      limit={limit}
      historyLimit={historyLimit}
      notificationChannel={notificationChannel}
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
      onLoadExecutions={() => void loadExecutions()}
      onEscalationDryRun={() => void triggerEscalation(true)}
      onEscalationDispatch={() => void triggerEscalation(false)}
      onSelectExecution={(execution) => void loadStageHistory(execution)}
      onApproveExecution={(execution) => void approveExecution(execution)}
      onRejectExecution={(execution, reason) => void rejectExecution(execution, reason)}
    />
  );
}
