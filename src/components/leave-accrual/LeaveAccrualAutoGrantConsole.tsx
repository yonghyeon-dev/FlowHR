"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useI18n } from "@/lib/i18n/provider";
import type { ApiLog, AutoGrantResponse } from "@/components/leave-accrual/types";
import { formatDays, isTruthyFlag } from "@/components/leave-accrual/types";

type LeaveAccrualCopy = {
  heroEyebrow: string;
  title: string;
  description: string;
  conditionsTitle: string;
  sessionOrganizationLabel: string;
  sessionAdminLabel: string;
  yearLabel: string;
  includeAlreadySettledLabel: string;
  includeAlreadySettledYes: string;
  includeAlreadySettledNo: string;
  dryRunAction: string;
  runAction: string;
  sessionErrorPrefix: string;
  summaryTitle: string;
  noResultYet: string;
  resultOrganizationLabel: string;
  resultYearDryRunLabel: string;
  resultPolicyLabel: string;
  resultEligibleAppliedFailedLabel: string;
  detailsTitle: string;
  noRowsYet: string;
  detailsStatusLabel: string;
  detailsJoinedLabel: string;
  detailsProjectedLabel: string;
  workspaceShortcutsTitle: string;
  backToAdminAction: string;
  leavePromotionDevAction: string;
  logsTitle: string;
  logsTotalLabel: string;
  logsSuccessLabel: string;
  logsFailLabel: string;
  logsRunningLabel: string;
  noLogsYet: string;
  pendingDryRun: string;
  pendingRun: string;
  statusMissingSessionOrganization: string;
  statusInvalidYear: string;
  statusRequestFailed: string;
  statusDryRunDone: string;
  statusRunDone: string;
};

const leaveAccrualCopyByLocale: Record<"ko" | "en", LeaveAccrualCopy> = {
  ko: {
    heroEyebrow: "FlowHR 관리자",
    title: "연차 자동 부여 엔진",
    description: "조직의 연차 정책을 기준으로 대상 연도 자동 부여량을 계산하고 드라이런/실행으로 반영합니다.",
    conditionsTitle: "실행 조건",
    sessionOrganizationLabel: "세션 조직",
    sessionAdminLabel: "세션 관리자",
    yearLabel: "정산 연도",
    includeAlreadySettledLabel: "결과에 이미 정산 포함",
    includeAlreadySettledYes: "예",
    includeAlreadySettledNo: "아니오",
    dryRunAction: "드라이런",
    runAction: "자동 부여 실행",
    sessionErrorPrefix: "세션 오류",
    summaryTitle: "정책/요약",
    noResultYet: "아직 실행 결과가 없습니다.",
    resultOrganizationLabel: "organizationId",
    resultYearDryRunLabel: "year / dryRun",
    resultPolicyLabel: "policy",
    resultEligibleAppliedFailedLabel: "eligible / applied / failed",
    detailsTitle: "대상 상세",
    noRowsYet: "표시할 대상 결과가 없습니다.",
    detailsStatusLabel: "상태",
    detailsJoinedLabel: "입사",
    detailsProjectedLabel: "예상",
    workspaceShortcutsTitle: "워크스페이스 이동",
    backToAdminAction: "관리자 홈",
    leavePromotionDevAction: "(dev) 연차촉진 공지",
    logsTitle: "요청 로그",
    logsTotalLabel: "총",
    logsSuccessLabel: "성공",
    logsFailLabel: "실패",
    logsRunningLabel: "진행중",
    noLogsYet: "아직 API 호출 이력이 없습니다.",
    pendingDryRun: "연차 자동 부여 드라이런",
    pendingRun: "연차 자동 부여 실행",
    statusMissingSessionOrganization: "세션 조직 정보가 없어 자동 부여를 실행할 수 없습니다.",
    statusInvalidYear: "정산 연도는 2000~9999 사이 정수여야 합니다.",
    statusRequestFailed: "요청이 실패했습니다. 로그를 확인하세요.",
    statusDryRunDone: "드라이런 완료",
    statusRunDone: "실행 완료"
  },
  en: {
    heroEyebrow: "FlowHR Admin",
    title: "Leave Auto Grant Engine",
    description: "Calculate annual leave grants for the target year and apply via dry-run or execution.",
    conditionsTitle: "Run Conditions",
    sessionOrganizationLabel: "Session organization",
    sessionAdminLabel: "Session admin",
    yearLabel: "Settlement year",
    includeAlreadySettledLabel: "Include already settled in result",
    includeAlreadySettledYes: "yes",
    includeAlreadySettledNo: "no",
    dryRunAction: "Dry Run",
    runAction: "Run Auto Grant",
    sessionErrorPrefix: "Session error",
    summaryTitle: "Policy / Summary",
    noResultYet: "No execution result yet.",
    resultOrganizationLabel: "organizationId",
    resultYearDryRunLabel: "year / dryRun",
    resultPolicyLabel: "policy",
    resultEligibleAppliedFailedLabel: "eligible / applied / failed",
    detailsTitle: "Result Details",
    noRowsYet: "No target rows to display.",
    detailsStatusLabel: "status",
    detailsJoinedLabel: "join",
    detailsProjectedLabel: "projected",
    workspaceShortcutsTitle: "Workspace shortcuts",
    backToAdminAction: "Back to Admin",
    leavePromotionDevAction: "(dev) Leave Promotion",
    logsTitle: "Request Logs",
    logsTotalLabel: "total",
    logsSuccessLabel: "success",
    logsFailLabel: "fail",
    logsRunningLabel: "running",
    noLogsYet: "No API calls yet.",
    pendingDryRun: "leave auto grant dry-run",
    pendingRun: "leave auto grant run",
    statusMissingSessionOrganization: "Missing session organization context; cannot run auto grant.",
    statusInvalidYear: "Settlement year must be an integer between 2000 and 9999.",
    statusRequestFailed: "Request failed. Check logs.",
    statusDryRunDone: "Dry-run completed",
    statusRunDone: "Execution completed"
  }
};

function formatDateTimeByLocale(value: string | null, runtimeLocale: string) {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString(runtimeLocale);
}

export default function LeaveAccrualAutoGrantConsole() {
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [includeAlreadySettled, setIncludeAlreadySettled] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const [result, setResult] = useState<AutoGrantResponse | null>(null);
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);

  const isProductionRuntime = process.env.NODE_ENV === "production";
  const showDevTools = isTruthyFlag(process.env.NEXT_PUBLIC_FLOWHR_DEV_TOOLS);
  const { snapshot: supabaseSession, error: supabaseSessionError } = useSupabaseSession();
  const { locale } = useI18n();
  const runtimeLocale = locale === "ko" ? "ko-KR" : "en-US";
  const copy = leaveAccrualCopyByLocale[locale];

  const organizationId = (supabaseSession?.organizationId ?? "").trim();
  const adminActorId = (supabaseSession?.actorId ?? "ADM-1001").trim() || "ADM-1001";
  const bearerToken = isProductionRuntime ? (supabaseSession?.accessToken ?? "") : "";
  const usesBearerToken = bearerToken.trim().length > 0;

  const stats = useMemo(() => {
    const total = logs.length;
    const success = logs.filter((log) => log.ok).length;
    return { total, success, fail: total - success };
  }, [logs]);

  async function callApi(label: string, payload: Record<string, unknown>) {
    setPendingLabel(label);
    try {
      const headers: Record<string, string> = {
        "content-type": "application/json"
      };
      if (usesBearerToken) {
        headers.authorization = `Bearer ${bearerToken}`;
      } else {
        headers["x-actor-role"] = "admin";
        headers["x-actor-id"] = adminActorId.trim() || "ADM-1001";
        if (organizationId.trim()) {
          headers["x-actor-organization-id"] = organizationId.trim();
        }
      }

      const response = await fetch("/api/leave/accrual/auto-grant", {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
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

  async function runAutoGrant(dryRun: boolean) {
    if (!organizationId.trim()) {
      setStatusMessage(copy.statusMissingSessionOrganization);
      return;
    }

    const parsedYear = Number(year);
    if (!Number.isInteger(parsedYear) || parsedYear < 2000 || parsedYear > 9999) {
      setStatusMessage(copy.statusInvalidYear);
      return;
    }

    const { response, body } = await callApi(dryRun ? copy.pendingDryRun : copy.pendingRun, {
      organizationId: organizationId.trim(),
      year: parsedYear,
      dryRun,
      includeAlreadySettled
    });

    if (!response.ok || !body || typeof body !== "object") {
      setStatusMessage(copy.statusRequestFailed);
      return;
    }

    const parsed = body as AutoGrantResponse;
    setResult(parsed);
    if (parsed.dryRun) {
      setStatusMessage(
        `${copy.statusDryRunDone}: eligible ${parsed.summary.eligibleCount}, alreadySettled ${parsed.summary.alreadySettledCount}`
      );
    } else {
      setStatusMessage(`${copy.statusRunDone}: applied ${parsed.summary.appliedCount}, failed ${parsed.summary.failedCount}`);
    }
    setTimeout(() => setStatusMessage(""), 3000);
  }

  return (
    <main className="saas-content">
      <header className="hero">
        <p className="eyebrow">{copy.heroEyebrow}</p>
        <h1>{copy.title}</h1>
        {/* Legacy marker: ?곗감 ?먮룞 遺???붿쭊 */}
        <p>{copy.description}</p>
      </header>

      <section className="panel-grid">
        <article className="panel">
          <h2>{copy.conditionsTitle}</h2>
          <p className="small">
            {copy.sessionOrganizationLabel}: <code>{organizationId || "-"}</code> / {copy.sessionAdminLabel}: <code>{adminActorId || "-"}</code>
          </p>
          <div className="input-grid">
            <label>
              {copy.yearLabel}
              <input type="number" min={2000} max={9999} value={year} onChange={(event) => setYear(event.target.value)} />
            </label>
            <label>
              {copy.includeAlreadySettledLabel}
              <select
                value={includeAlreadySettled ? "yes" : "no"}
                onChange={(event) => setIncludeAlreadySettled(event.target.value === "yes")}
              >
                <option value="yes">{copy.includeAlreadySettledYes}</option>
                <option value="no">{copy.includeAlreadySettledNo}</option>
              </select>
            </label>
          </div>
          <div className="panel-actions">
            <button className="btn btn-secondary" onClick={() => void runAutoGrant(true)} disabled={!organizationId.trim() || pendingLabel !== null}>
              {copy.dryRunAction}
            </button>
            <button className="btn btn-primary" onClick={() => void runAutoGrant(false)} disabled={!organizationId.trim() || pendingLabel !== null}>
              {copy.runAction}
            </button>
          </div>
          {statusMessage ? <p className="small">{statusMessage}</p> : null}
          {supabaseSessionError ? <p className="small fail">{copy.sessionErrorPrefix}: {supabaseSessionError}</p> : null}
        </article>

        <article className="panel">
          <h2>{copy.summaryTitle}</h2>
          {!result ? (
            <p className="small">{copy.noResultYet}</p>
          ) : (
            <>
              <ul className="simple-list">
                <li>
                  <span>{copy.resultOrganizationLabel}</span>
                  <strong>{result.organizationId}</strong>
                </li>
                <li>
                  <span>{copy.resultYearDryRunLabel}</span>
                  <strong>
                    {result.year} / {result.dryRun ? "yes" : "no"}
                  </strong>
                </li>
                <li>
                  <span>{copy.resultPolicyLabel}</span>
                  <strong>
                    grant {result.policy.annualGrantDays}, carry cap {result.policy.carryOverCapDays} ({result.policy.source})
                  </strong>
                </li>
                <li>
                  <span>{copy.resultEligibleAppliedFailedLabel}</span>
                  <strong>
                    {result.summary.eligibleCount} / {result.summary.appliedCount} / {result.summary.failedCount}
                  </strong>
                </li>
              </ul>
            </>
          )}
        </article>

        <article className="panel">
          <h2>{copy.detailsTitle} {result ? `(${result.results.length})` : ""}</h2>
          {!result || result.results.length === 0 ? (
            <p className="small">{copy.noRowsYet}</p>
          ) : (
            <ul className="simple-list">
              {result.results.map((row) => (
                <li key={row.employeeId}>
                  <span>
                    <strong>{row.employeeId}</strong>
                    {row.name ? ` / ${row.name}` : ""}
                    <br />
                    <span className="small">
                      {copy.detailsStatusLabel} {row.status}
                      {row.reason ? ` / ${row.reason}` : ""}
                      {" / "}{copy.detailsJoinedLabel} {formatDateTimeByLocale(row.joinedAt, runtimeLocale)}
                    </span>
                    <br />
                    <span className="small">
                      {copy.detailsProjectedLabel} {formatDays(row.suggestedAnnualGrantDays)} + carry {formatDays(row.carryOverAppliedDays)} = {formatDays(row.projectedGrantedDays)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="panel">
          <h2>{copy.workspaceShortcutsTitle}</h2>
          <div className="panel-actions">
            <Link href="/admin" className="btn btn-secondary">
              {copy.backToAdminAction}
            </Link>
            {showDevTools ? (
              <Link href="/ops/leave-promotion" className="btn btn-secondary">
                {copy.leavePromotionDevAction}
              </Link>
            ) : null}
          </div>
        </article>

        {showDevTools ? (
          <article className="panel">
            <h2>{copy.logsTitle}</h2>
            <p className="small">
              {copy.logsTotalLabel} {stats.total} / {copy.logsSuccessLabel} {stats.success} / {copy.logsFailLabel} {stats.fail}
              {pendingLabel ? ` / ${copy.logsRunningLabel} ${pendingLabel}` : ""}
            </p>
            {logs.length === 0 ? (
              <p className="small">{copy.noLogsYet}</p>
            ) : (
              <ul className="log-list">
                {logs.map((log) => (
                  <li key={log.id}>
                    <span className={log.ok ? "ok" : "fail"}>{log.ok ? "OK" : "FAIL"}</span> {log.label} / {log.status}
                    <time>{log.at}</time>
                  </li>
                ))}
              </ul>
            )}
          </article>
        ) : null}
      </section>
    </main>
  );
}
