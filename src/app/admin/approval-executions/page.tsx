"use client";

import { useMemo, useState } from "react";

import {
  ApprovalExecutionEscalationResultPanel,
  ApprovalExecutionHistoryPanel,
  ApprovalExecutionListPanel,
  ApprovalExecutionLogsPanel,
  ApprovalExecutionRelatedWorkspacesPanel,
  ApprovalExecutionSummaryPanel,
  ApprovalExecutionWorkConditionsPanel
} from "@/app/admin/approval-executions/page-sections";
import {
  getStalledHours,
  isTruthyFlag,
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
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useI18n } from "@/lib/i18n/provider";

export default function AdminApprovalExecutionsPage() {
  const [domain, setDomain] = useState<ApprovalDomain | "">("");
  const [state, setState] = useState<ApprovalExecutionState | "">("PENDING");
  const [sort, setSort] = useState<ApprovalExecutionSort>("priority_desc");
  const [stalledHoursMin, setStalledHoursMin] = useState("24");
  const [asOfInput, setAsOfInput] = useState(() => toLocalInputValue(new Date()));
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
  const { snapshot: supabaseSession, error: supabaseSessionError } = useSupabaseSession();
  const { locale } = useI18n();
  const isKoLocale = locale === "ko";
  const runtimeLocale = isKoLocale ? "ko-KR" : "en-US";
  const organizationId = (supabaseSession?.organizationId ?? "").trim();
  const adminActorId = (supabaseSession?.actorId ?? "ADM-1001").trim() || "ADM-1001";

  const bearerToken = isProductionRuntime ? (supabaseSession?.accessToken ?? "") : "";
  const usesBearerToken = bearerToken.trim().length > 0;

  const asOfDate = useMemo(() => {
    const parsed = new Date(asOfInput);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }, [asOfInput]);

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

  const selectedExecution = useMemo(() => {
    return executions.find((item) => toTargetKey(item) === selectedTargetKey) ?? null;
  }, [executions, selectedTargetKey]);

  const summary = useMemo<ApprovalExecutionSummary>(() => {
    const pending = executions.filter((item) => item.state === "PENDING");
    const pendingWithStalledHours = pending.map((item) => ({
      item,
      stalledHours: getStalledHours(item, asOfDate)
    }));
    const stalled = pendingWithStalledHours.filter(
      ({ stalledHours }) => stalledHours >= stalledHoursThreshold
    );
    const watchThresholdHours = Math.max(stalledHoursThreshold, 24);
    const criticalThresholdHours = Math.max(stalledHoursThreshold, 72);
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
  }, [asOfDate, executions, stalledHoursThreshold]);

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

  async function callApi(
    label: string,
    method: "GET" | "POST",
    path: string,
    payload?: Record<string, unknown>
  ) {
    setPendingLabel(label);
    try {
      const headers: Record<string, string> = {};
      if (payload) {
        headers["content-type"] = "application/json";
      }
      if (usesBearerToken) {
        headers.authorization = `Bearer ${bearerToken}`;
      } else {
        headers["x-actor-role"] = "admin";
        headers["x-actor-id"] = adminActorId.trim() || "ADM-1001";
        if (organizationId.trim()) {
          headers["x-actor-organization-id"] = organizationId.trim();
        }
      }

      const response = await fetch(path, {
        method,
        headers,
        body: payload ? JSON.stringify(payload) : undefined
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

      const text = await response.text();
      let body: unknown = null;
      if (text.trim()) {
        try {
          body = JSON.parse(text);
        } catch {
          body = text;
        }
      }
      return { response, body };
    } finally {
      setPendingLabel(null);
    }
  }

  async function loadExecutions() {
    if (!organizationId.trim()) {
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
    if (!organizationId.trim()) {
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

  async function triggerEscalation(dryRun: boolean) {
    if (!organizationId.trim()) {
      return;
    }

    const payload = {
      organizationId: organizationId.trim(),
      domain: domain || undefined,
      stalledHoursMin: stalledHoursMin.trim() ? Number(stalledHoursMin.trim()) : undefined,
      limit: limit.trim() ? Number(limit.trim()) : undefined,
      asOf: asOfInput.trim() ? toIso(asOfInput) : undefined,
      dryRun,
      notificationChannel: notificationChannel.trim() || undefined
    };

    const { response, body } = await callApi(
      dryRun
        ? isKoLocale
          ? "정체 에스컬레이션 드라이런"
          : "Escalation dry run"
        : isKoLocale
          ? "정체 에스컬레이션 실행"
          : "Escalation dispatch",
      "POST",
      "/api/approval/executions/escalate",
      payload
    );

    if (!response.ok || !body || typeof body !== "object") {
      return;
    }

    const parsed = body as EscalationResultDto;
    setEscalationResult(parsed);
    if (parsed.dryRun) {
      setStatusMessage(
        isKoLocale
          ? `드라이런 완료: 후보 ${parsed.counts.candidates}건`
          : `Dry run complete: ${parsed.counts.candidates} candidate(s)`
      );
    } else if (parsed.counts.requested > 0) {
      setStatusMessage(
        isKoLocale
          ? `에스컬레이션 전송 완료: ${parsed.counts.requested}건`
          : `Escalation sent: ${parsed.counts.requested} item(s)`
      );
    } else {
      setStatusMessage(
        isKoLocale
          ? "에스컬레이션 후보가 없어 전송을 건너뛰었습니다."
          : "No escalation candidate found, dispatch skipped."
      );
    }
    setTimeout(() => setStatusMessage(""), 3000);
  }

  return (
    <main className="saas-content">
      <header className="hero">
        <p className="eyebrow">{isKoLocale ? "FlowHR 관리자" : "FlowHR Admin"}</p>
        <h1>{isKoLocale ? "결재 실행 현황" : "Approval execution queue"}</h1>
        <p>
          {isKoLocale
            ? "정체된 결재 실행 항목을 우선순위로 확인하고, 임계값을 넘는 항목을 드라이런/실전 에스컬레이션으로 전송합니다."
            : "Review stalled approval executions by priority and send over-threshold items through dry-run/live escalation."}
          {showDevTools
            ? isKoLocale
              ? " 개발 옵션이 활성화되어 고급 로그를 확인할 수 있습니다."
              : " Dev options are enabled so advanced logs are visible."
            : ""}
        </p>
      </header>

      <section className="panel-grid">
        <ApprovalExecutionWorkConditionsPanel
          isKoLocale={isKoLocale}
          showDevTools={showDevTools}
          organizationId={organizationId}
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
          onLoadExecutions={() => void loadExecutions()}
          onEscalationDryRun={() => void triggerEscalation(true)}
          onEscalationDispatch={() => void triggerEscalation(false)}
        />

        <ApprovalExecutionSummaryPanel
          isKoLocale={isKoLocale}
          summary={summary}
          asOfIso={asOfDate.toISOString()}
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
          stalledHoursThreshold={stalledHoursThreshold}
          toDomainLabel={toDomainLabel}
          toStateLabel={toStateLabel}
          onSelectExecution={(execution) => void loadStageHistory(execution)}
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
