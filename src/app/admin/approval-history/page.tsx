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

  const [history, setHistory] = useState<ApprovalStageHistoryDto[]>([]);
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);

  const showDevTools = isTruthyFlag(process.env.NEXT_PUBLIC_FLOWHR_DEV_TOOLS);
  const isProductionRuntime = process.env.NODE_ENV === "production";
  const { snapshot: supabaseSession, error: supabaseSessionError } = useSupabaseSession();
  const { locale } = useI18n();
  const isKoLocale = locale === "ko";
  const runtimeLocale = isKoLocale ? "ko-KR" : "en-US";
  const copy = useMemo(() => resolveAdminApprovalHistoryLocaleCopy(isKoLocale), [isKoLocale]);
  const organizationId = (supabaseSession?.organizationId ?? "").trim();
  const adminActorId = (supabaseSession?.actorId ?? "").trim();

  const bearerToken = isProductionRuntime ? (supabaseSession?.accessToken ?? "") : "";
  const usesBearerToken = bearerToken.trim().length > 0;
  const requiresLoginSession = isProductionRuntime && !usesBearerToken && !showDevTools;

  const stats = useMemo(() => {
    const total = logs.length;
    const success = logs.filter((log) => log.ok).length;
    return { total, success, fail: total - success };
  }, [logs]);

  async function callApi(label: string, path: string) {
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
      return { response, body };
    } finally {
      setPendingLabel(null);
    }
  }

  async function loadHistory() {
    if (requiresLoginSession || !organizationId.trim()) {
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

    const { response, body } = await callApi(copy.logs.fetchHistory, `/api/approval/stage-history?${query.toString()}`);
    if (!response.ok || !body || typeof body !== "object") {
      return;
    }
    const parsed = body as { history?: ApprovalStageHistoryDto[] };
    setHistory(parsed.history ?? []);
  }

  return (
    <main className="saas-content">
      <header className="hero">
        <p className="eyebrow">{copy.hero.eyebrow}</p>
        <h1>{copy.hero.title}</h1>
        <p>
          {copy.hero.description}
          {showDevTools ? ` ${copy.hero.devActorNotice}` : ""}
        </p>
      </header>

      {requiresLoginSession ? (
        <p className="small fail">
          {isKoLocale ? "운영 환경에서는 로그인 세션이 필요합니다. " : "Login session is required in production. "}
          <Link href="/login">/login</Link>
        </p>
      ) : null}

      <section className="panel-grid">
        <article className="panel">
          <h2>{isKoLocale ? "작업 조건" : "Work conditions"}</h2>
          {showDevTools ? (
            <p className="small muted">
              {copy.filters.organizationId}: <code>{organizationId || "-"}</code> / {copy.filters.adminActorId}:{" "}
              <code>{adminActorId || "-"}</code>
            </p>
          ) : null}
          <label>
            {copy.filters.domain}
            <select value={domain} onChange={(event) => setDomain(event.target.value as ApprovalDomain | "")}>
              {domainOptions.map((option) => (
                <option key={option || "all"} value={option}>
                  {option || copy.filters.all}
                </option>
              ))}
            </select>
          </label>
          <label>
            {copy.filters.allowed}
            <select value={allowed} onChange={(event) => setAllowed(event.target.value as "" | "true" | "false")}>
              <option value="">{copy.filters.all}</option>
              <option value="true">true</option>
              <option value="false">false</option>
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
                <input value={targetEntityId} onChange={(event) => setTargetEntityId(event.target.value)} />
              </label>
              <label>
                {copy.filters.resolution}
                <select
                  value={resolution}
                  onChange={(event) => setResolution(event.target.value as ApprovalStageResolution | "")}
                >
                  {resolutionOptions.map((option) => (
                    <option key={option || "all"} value={option}>
                      {option || copy.filters.all}
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
              className="btn btn-secondary"
              onClick={() => void loadHistory()}
              disabled={requiresLoginSession || !organizationId.trim()}
            >
              {copy.filters.loadHistory}
            </button>
          </div>
          {supabaseSessionError ? (
            <p className="small fail">
              {copy.filters.sessionError}: {supabaseSessionError}
            </p>
          ) : null}
        </article>

        <article className="panel">
          <h2>
            {copy.results.title} ({history.length})
          </h2>
          {history.length === 0 ? (
            <p className="small">{copy.results.empty}</p>
          ) : (
            <ul className="simple-list">
              {history.map((entry) => (
                <li key={entry.id}>
                  <strong>{entry.domain}</strong> / {entry.targetEntityType}:{entry.targetEntityId}
                  <br />
                  <span className={entry.allowed ? "ok" : "fail"}>
                    {entry.allowed ? copy.results.allowed : copy.results.blocked} ({entry.resolution})
                  </span>
                  {" / "}
                  {copy.results.required} [{entry.requiredRoles.join(", ")}] / {copy.results.fallback} {entry.fallbackRole}
                  <br />
                  {copy.results.actor} {entry.actorRole}
                  {entry.actorId ? ` (${entry.actorId})` : ""} / {copy.results.stage} {entry.stageIndex}({entry.stageLabel})
                  {entry.payrollGrossPayKrw !== null
                    ? ` / ${copy.results.gross} ${entry.payrollGrossPayKrw.toLocaleString(runtimeLocale)} KRW`
                    : ""}
                  <br />
                  {entry.matchedTemplateIds.length > 0
                    ? `${copy.results.matchedTemplates}: ${entry.matchedTemplateIds.join(", ")}`
                    : `${copy.results.matchedTemplates}: -`}
                  {" / "}
                  {entry.activeDelegationIds.length > 0
                    ? `${copy.results.delegations}: ${entry.activeDelegationIds.join(", ")}`
                    : `${copy.results.delegations}: -`}
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
          <article className="panel">
            <h2>{copy.logs.title}</h2>
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
          <article className="panel">
            <h2>{isKoLocale ? "관련 화면 이동" : "Related workspaces"}</h2>
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
