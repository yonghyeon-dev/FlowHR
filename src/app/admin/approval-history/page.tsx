"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  formatApprovalHistoryDateTime,
  resolveAdminApprovalHistoryLocaleCopy
} from "@/app/admin/approval-history/page-locale-helpers";
import { apiClientFetch, parseApiResponseBody } from "@/lib/api-client";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useI18n } from "@/lib/i18n/provider";
import {
  formatAdminSessionConnectionState,
  formatActorRoleLabel,
  formatApprovalDomainLabel,
  formatApprovalEntityTypeLabel,
  formatApprovalStageResolutionLabel,
  formatWorkspaceConnectionState,
  formatUserFacingErrorMessage
} from "@/lib/product-language";

type ApprovalDomain = "ATTENDANCE" | "LEAVE" | "PAYROLL";
type ApprovalStageResolution =
  | "EXPECTED_ROLE"
  | "ACTIVE_DELEGATION"
  | "PRIVILEGED_BYPASS"
  | "DENIED";

type ApprovalStageHistoryDto = {
  id: string;
  organizationId: string;
  domain: ApprovalDomain;
  targetEntityType: string;
  targetEntityId: string;
  stageIndex: number;
  stageLabel: string;
  requiredRoles: string[];
  fallbackRole: string;
  matchedTemplateIds: string[];
  activeDelegationIds: string[];
  actorRole: string;
  actorId: string | null;
  allowed: boolean;
  resolution: ApprovalStageResolution;
  payrollGrossPayKrw: number | null;
  evaluatedAt: string;
};

type ApiLog = {
  id: number;
  label: string;
  ok: boolean;
  status: number;
  at: string;
};

const domainOptions: Array<ApprovalDomain | ""> = ["", "ATTENDANCE", "LEAVE", "PAYROLL"];
const resolutionOptions: Array<ApprovalStageResolution | ""> = [
  "",
  "EXPECTED_ROLE",
  "ACTIVE_DELEGATION",
  "PRIVILEGED_BYPASS",
  "DENIED"
];

function isTruthyFlag(value: string | undefined) {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export default function AdminApprovalHistoryPage() {
  const [domain, setDomain] = useState<ApprovalDomain | "">("");
  const [targetEntityType, setTargetEntityType] = useState("");
  const [targetEntityId, setTargetEntityId] = useState("");
  const [allowed, setAllowed] = useState<"" | "true" | "false">("");
  const [resolution, setResolution] = useState<ApprovalStageResolution | "">("");
  const [limit, setLimit] = useState("100");
  const [error, setError] = useState<string | null>(null);

  const [history, setHistory] = useState<ApprovalStageHistoryDto[]>([]);
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
  const copy = useMemo(() => resolveAdminApprovalHistoryLocaleCopy(isKoLocale), [isKoLocale]);
  const organizationId = (supabaseSession?.organizationId ?? "").trim();
  const adminActorId = (supabaseSession?.actorId ?? "").trim();

  const bearerToken = isProductionRuntime ? (supabaseSession?.accessToken ?? "") : "";
  const usesBearerToken = bearerToken.trim().length > 0;
  const requiresLoginSession =
    !supabaseSessionLoading && isProductionRuntime && !usesBearerToken && !showDevTools;

  const stats = useMemo(() => {
    const total = logs.length;
    const success = logs.filter((log) => log.ok).length;
    return { total, success, fail: total - success };
  }, [logs]);

  const filterSummary = useMemo(() => {
    return [
      domain ? formatApprovalDomainLabel(domain, runtimeLocale) : copy.filters.all,
      allowed ? (allowed === "true" ? (isKoLocale ? "허용만" : "Allowed only") : (isKoLocale ? "차단만" : "Blocked only")) : copy.filters.all,
      resolution ? formatApprovalStageResolutionLabel(resolution, runtimeLocale) : copy.filters.all
    ].join(" / ");
  }, [allowed, copy.filters.all, domain, isKoLocale, resolution, runtimeLocale]);

  async function callApi(label: string, path: string) {
    setPendingLabel(label);
    setError(null);
    try {
      if (requiresLoginSession) {
        throw new Error(
          isKoLocale
            ? "운영 환경에서는 로그인 세션이 필요합니다. /login에서 로그인해 주세요."
            : "Login session is required in production. Please sign in at /login."
        );
      }

      const response = await apiClientFetch({
        method: "GET",
        path
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
      if (!response.ok) {
        throw new Error(typeof body === "string" ? body : "Failed to load approval stage history.");
      }
      return { response, body };
    } catch (err) {
      setError(formatUserFacingErrorMessage(err instanceof Error ? err.message : String(err), runtimeLocale));
      return null;
    } finally {
      setPendingLabel(null);
    }
  }

  async function loadHistory() {
    if (supabaseSessionLoading || requiresLoginSession || !organizationId.trim()) {
      return;
    }
    const query = new URLSearchParams({
      organizationId: organizationId.trim()
    });
    if (domain) {
      query.set("domain", domain);
    }
    if (targetEntityType.trim()) {
      query.set("targetEntityType", targetEntityType.trim());
    }
    if (targetEntityId.trim()) {
      query.set("targetEntityId", targetEntityId.trim());
    }
    if (allowed) {
      query.set("allowed", allowed);
    }
    if (resolution) {
      query.set("resolution", resolution);
    }
    if (limit.trim()) {
      query.set("limit", limit.trim());
    }

    const result = await callApi(copy.logs.fetchHistory, `/api/approval/stage-history?${query.toString()}`);
    if (!result || !result.body || typeof result.body !== "object") {
      return;
    }
    const parsed = result.body as { history?: ApprovalStageHistoryDto[] };
    setHistory(parsed.history ?? []);
  }

  return (
    <main className="saas-content workspace-shell admin-workspace-shell">
      <header className="page-header workspace-page-header">
        <div>
          <p className="eyebrow">{copy.hero.eyebrow}</p>
          <h1 className="page-title">{copy.hero.title}</h1>
          <p className="page-subtitle">
            {copy.hero.description}
            {showDevTools ? ` ${copy.hero.devActorNotice}` : ""}
          </p>
          <p className="small muted workspace-source-banner">
            {isKoLocale
              ? "결재 단계 이력은 승인 정책, 템플릿, 실행 현황과 함께 검토하는 운영 인사이트 흐름입니다."
              : "Approval stage history sits alongside policy, templates, and execution review in the admin insight lane."}
          </p>
        </div>
        <div className="page-actions">
          <Link href="/admin" className="btn btn-secondary">
            {isKoLocale ? "관리자 허브" : "Admin hub"}
          </Link>
        </div>
      </header>

      <section className="kpi-strip workspace-summary-strip" aria-label={copy.hero.title}>
        <article className="kpi-card workspace-summary-card">
          <p>{copy.results.title}</p>
          <strong>{history.length}</strong>
        </article>
        <article className="kpi-card workspace-summary-card">
          <p>{copy.logs.title}</p>
          <strong>{stats.total}</strong>
        </article>
        <article className="kpi-card workspace-summary-card">
          <p>{isKoLocale ? "현재 필터" : "Current filters"}</p>
          <strong>{filterSummary}</strong>
        </article>
      </section>

      {requiresLoginSession ? (
        <p className="small fail workspace-inline-status">
          {isKoLocale ? "운영 환경에서는 로그인 세션이 필요합니다. " : "Login session is required in production. "}
          <Link href="/login">/login</Link>
        </p>
      ) : null}
      {error ? <p className="small fail workspace-inline-status">{error}</p> : null}

      <section className="panel-grid workspace-panel-grid">
        <article className="panel workspace-section-card workspace-toolbar-card">
          <div className="section-heading">
            <div>
              <h2>{copy.filters.title}</h2>
              <p className="small muted">
                {isKoLocale
                  ? "도메인, 요청 분류, 허용 여부 기준으로 단계 이력을 좁혀 검토합니다."
                  : "Filter the stage history by domain, request subtype, and approval outcome."}
              </p>
            </div>
          </div>
          {showDevTools ? (
            <p className="small muted">
              {copy.filters.organizationId}:{" "}
              <strong>{formatWorkspaceConnectionState(Boolean(organizationId.trim()), runtimeLocale)}</strong> /{" "}
              {copy.filters.adminActorId}:{" "}
              <strong>{formatAdminSessionConnectionState(Boolean(adminActorId.trim()), runtimeLocale)}</strong>
            </p>
          ) : null}
          <label>
            {copy.filters.domain}
            <select value={domain} onChange={(event) => setDomain(event.target.value as ApprovalDomain | "")}>
              <option value="">{copy.filters.all}</option>
              {domainOptions.filter(Boolean).map((option) => (
                <option key={option} value={option}>
                  {formatApprovalDomainLabel(option, runtimeLocale)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {copy.filters.allowed}
            <select value={allowed} onChange={(event) => setAllowed(event.target.value as "" | "true" | "false")}>
              <option value="">{copy.filters.all}</option>
              <option value="true">{isKoLocale ? "허용" : "Allowed"}</option>
              <option value="false">{isKoLocale ? "차단" : "Blocked"}</option>
            </select>
          </label>
          <details className="details">
            <summary>{isKoLocale ? "고급 조건" : "Advanced options"}</summary>
            <div className="input-grid" style={{ marginTop: 12 }}>
              <label>
                {copy.filters.targetEntityType}
                <input
                  value={targetEntityType}
                  onChange={(event) => setTargetEntityType(event.target.value)}
                  placeholder={copy.filters.targetEntityTypePlaceholder}
                />
              </label>
              <label>
                {copy.filters.targetEntityId}
                <input
                  value={targetEntityId}
                  onChange={(event) => setTargetEntityId(event.target.value)}
                  placeholder={isKoLocale ? "특정 요청만 확인할 때 입력" : "Optional request reference"}
                />
              </label>
              <label>
                {copy.filters.resolution}
                <select
                  value={resolution}
                  onChange={(event) => setResolution(event.target.value as ApprovalStageResolution | "")}
                >
                  <option value="">{copy.filters.all}</option>
                  {resolutionOptions.filter(Boolean).map((option) => (
                    <option key={option} value={option}>
                      {formatApprovalStageResolutionLabel(option, runtimeLocale)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {copy.filters.limit}
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={limit}
                  onChange={(event) => setLimit(event.target.value)}
                />
              </label>
            </div>
          </details>
          <div className="panel-actions">
            <button
              className="btn btn-primary"
              onClick={() => void loadHistory()}
              disabled={supabaseSessionLoading || requiresLoginSession || !organizationId.trim()}
            >
              {copy.filters.loadHistory}
            </button>
          </div>
          {supabaseSessionError ? (
            <p className="small fail">{formatUserFacingErrorMessage(supabaseSessionError, runtimeLocale)}</p>
          ) : null}
        </article>

        <article className="panel workspace-section-card workspace-note-card">
          <div className="section-heading">
            <div>
              <h2>{isKoLocale ? "요약" : "Summary"}</h2>
              <p className="small muted">
                {isKoLocale
                  ? "현재 조회 범위와 반환 결과를 빠르게 확인합니다."
                  : "Review the current query scope and returned result size at a glance."}
              </p>
            </div>
          </div>
          <dl className="definition-grid">
            <div>
              <dt>{copy.results.title}</dt>
              <dd>{history.length}</dd>
            </div>
            <div>
              <dt>{copy.logs.title}</dt>
              <dd>{stats.total}</dd>
            </div>
            <div>
              <dt>{isKoLocale ? "현재 필터" : "Current filters"}</dt>
              <dd>{filterSummary}</dd>
            </div>
          </dl>
        </article>

        <article className="panel workspace-section-card">
          <div className="section-heading">
            <div>
              <h2>
                {copy.results.title} ({history.length})
              </h2>
              <p className="small muted">
                {isKoLocale
                  ? "각 단계에서 어떤 역할, 위임, 기본 정책이 적용됐는지 확인합니다."
                  : "Inspect which roles, delegations, and fallback policy were applied at each stage."}
              </p>
            </div>
          </div>
          {history.length === 0 ? (
            <p className="small">{copy.results.empty}</p>
          ) : (
            <ul className="simple-list">
              {history.map((entry) => (
                <li key={entry.id}>
                  <strong>{formatApprovalDomainLabel(entry.domain, runtimeLocale)}</strong> /{" "}
                  {formatApprovalEntityTypeLabel(entry.targetEntityType, runtimeLocale)}
                  <br />
                  <span className={entry.allowed ? "ok" : "fail"}>
                    {entry.allowed ? copy.results.allowed : copy.results.blocked} (
                    {formatApprovalStageResolutionLabel(entry.resolution, runtimeLocale)})
                  </span>
                  {" / "}
                  {copy.results.required} [{entry.requiredRoles.map((role) => formatActorRoleLabel(role, runtimeLocale)).join(", ")}]
                  {" / "}
                  {copy.results.fallback} {formatActorRoleLabel(entry.fallbackRole, runtimeLocale)}
                  <br />
                  {copy.results.actor} {formatActorRoleLabel(entry.actorRole, runtimeLocale)} / {copy.results.stage}{" "}
                  {entry.stageIndex}({entry.stageLabel})
                  {entry.payrollGrossPayKrw !== null
                    ? ` / ${copy.results.gross} ${entry.payrollGrossPayKrw.toLocaleString(runtimeLocale)} KRW`
                    : ""}
                  <br />
                  {copy.results.matchedTemplates}: {entry.matchedTemplateIds.length}
                  {isKoLocale ? "건" : ""} / {copy.results.delegations}: {entry.activeDelegationIds.length}
                  {isKoLocale ? "건" : ""}
                  <br />
                  <span className="small">
                    {copy.results.evaluated} {formatApprovalHistoryDateTime(entry.evaluatedAt, runtimeLocale)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>

        {showDevTools ? (
          <article className="panel workspace-section-card">
            <div className="section-heading">
              <div>
                <h2>{copy.logs.title}</h2>
                <p className="small muted">
                  {isKoLocale
                    ? "개발 모드에서만 이력 조회 요청과 응답 상태를 확인합니다."
                    : "Inspect stage-history request and response outcomes in dev mode only."}
                </p>
              </div>
            </div>
            <p className="small">
              {copy.logs.total} {stats.total} / {copy.logs.success} {stats.success} / {copy.logs.fail} {stats.fail}
              {pendingLabel ? ` / ${copy.logs.inProgress} ${pendingLabel}` : ""}
            </p>
            {logs.length === 0 ? (
              <p className="small">{copy.logs.empty}</p>
            ) : (
              <ul className="log-list">
                {logs.map((log) => (
                  <li key={log.id}>
                    <span className={log.ok ? "ok" : "fail"}>{log.ok ? copy.logs.okBadge : copy.logs.failBadge}</span>{" "}
                    {log.label} / {log.status} / {log.at}
                  </li>
                ))}
              </ul>
            )}
            <div className="panel-actions">
              <Link href="/admin/approval-executions" className="btn btn-secondary">
                {copy.logs.goToExecutions}
              </Link>
              <Link href="/admin/approval-templates" className="btn btn-secondary">
                {copy.logs.goToTemplates}
              </Link>
              <Link href="/admin" className="btn btn-secondary">
                {copy.logs.goToAdminHome}
              </Link>
            </div>
          </article>
        ) : (
          <article className="panel workspace-section-card workspace-note-card">
            <div className="section-heading">
              <div>
                <h2>{isKoLocale ? "관련 화면 이동" : "Related workspaces"}</h2>
                <p className="small muted">
                  {isKoLocale
                    ? "정책, 템플릿, 실행 현황으로 이어지는 승인 운영 흐름을 바로 엽니다."
                    : "Open the connected approval policy, templates, and execution workspaces."}
                </p>
              </div>
            </div>
            <div className="panel-actions">
              <Link href="/admin/approval-executions" className="btn btn-secondary">
                {copy.logs.goToExecutions}
              </Link>
              <Link href="/admin/approval-templates" className="btn btn-secondary">
                {copy.logs.goToTemplates}
              </Link>
              <Link href="/admin" className="btn btn-secondary">
                {copy.logs.goToAdminHome}
              </Link>
            </div>
          </article>
        )}
      </section>
    </main>
  );
}
