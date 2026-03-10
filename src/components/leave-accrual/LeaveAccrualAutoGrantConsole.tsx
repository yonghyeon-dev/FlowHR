"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { ApiLog, AutoGrantResponse, AutoGrantResultItem } from "@/components/leave-accrual/types";
import { formatDays, isTruthyFlag } from "@/components/leave-accrual/types";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useI18n } from "@/lib/i18n/provider";
import {
  formatAdminSessionConnectionState,
  formatEmployeeDisplayName,
  formatPublicEmployeeNumber,
  formatUserFacingErrorMessage,
  formatWorkspaceConnectionState
} from "@/lib/product-language";

type LeaveAccrualCopy = {
  heroEyebrow: string;
  title: string;
  description: string;
  conditionsTitle: string;
  yearLabel: string;
  includeAlreadySettledLabel: string;
  includeAlreadySettledYes: string;
  includeAlreadySettledNo: string;
  dryRunAction: string;
  runAction: string;
  sessionErrorPrefix: string;
  summaryTitle: string;
  noResultYet: string;
  resultWorkspaceLabel: string;
  resultWorkspaceValue: string;
  resultYearModeLabel: string;
  resultPolicyLabel: string;
  resultEligibleAppliedFailedLabel: string;
  detailsTitle: string;
  noRowsYet: string;
  detailsStatusLabel: string;
  detailsEmployeeNumberLabel: string;
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
  statusMissingWorkspace: string;
  statusInvalidYear: string;
  statusRequestFailed: string;
  statusDryRunDone: string;
  statusRunDone: string;
  dryRunModeLabel: string;
  applyModeLabel: string;
  policyConfiguredLabel: string;
  policyDefaultLabel: string;
  eligibleLabel: string;
  appliedLabel: string;
  failedLabel: string;
  alreadySettledLabel: string;
  noReasonFallback: string;
  detailStatusEligible: string;
  detailStatusAlreadySettled: string;
  detailStatusNotEligible: string;
  detailStatusApplied: string;
  detailStatusFailed: string;
};

const leaveAccrualCopyByLocale: Record<"ko" | "en", LeaveAccrualCopy> = {
  ko: {
    heroEyebrow: "FlowHR 관리자",
    title: "연차 자동 부여 엔진",
    description: "연차 정책을 기준으로 대상 연도의 자동 부여 결과를 미리 확인하거나 바로 실행합니다.",
    conditionsTitle: "실행 조건",
    yearLabel: "정산 연도",
    includeAlreadySettledLabel: "이미 정산된 직원 포함",
    includeAlreadySettledYes: "예",
    includeAlreadySettledNo: "아니오",
    dryRunAction: "미리보기",
    runAction: "자동 부여 실행",
    sessionErrorPrefix: "세션 오류",
    summaryTitle: "정책 / 요약",
    noResultYet: "아직 실행 결과가 없습니다.",
    resultWorkspaceLabel: "적용 작업 공간",
    resultWorkspaceValue: "현재 작업 공간",
    resultYearModeLabel: "연도 / 실행 방식",
    resultPolicyLabel: "적용 정책",
    resultEligibleAppliedFailedLabel: "대상 / 반영 / 실패",
    detailsTitle: "대상 상세",
    noRowsYet: "표시할 대상 결과가 없습니다.",
    detailsStatusLabel: "상태",
    detailsEmployeeNumberLabel: "직원 번호",
    detailsJoinedLabel: "입사일",
    detailsProjectedLabel: "예상 부여",
    workspaceShortcutsTitle: "작업 공간 이동",
    backToAdminAction: "관리자 홈으로",
    leavePromotionDevAction: "(dev) 연차 촉진",
    logsTitle: "요청 로그",
    logsTotalLabel: "총",
    logsSuccessLabel: "성공",
    logsFailLabel: "실패",
    logsRunningLabel: "진행 중",
    noLogsYet: "아직 API 호출 이력이 없습니다.",
    pendingDryRun: "연차 자동 부여 미리보기",
    pendingRun: "연차 자동 부여 실행",
    statusMissingWorkspace: "작업 공간 연결 상태를 확인한 뒤 다시 시도해 주세요.",
    statusInvalidYear: "정산 연도는 2000~9999 사이의 정수여야 합니다.",
    statusRequestFailed: "요청을 완료하지 못했습니다. 현재 상태를 확인한 뒤 다시 시도해 주세요.",
    statusDryRunDone: "미리보기를 불러왔습니다",
    statusRunDone: "자동 부여 실행을 완료했습니다",
    dryRunModeLabel: "미리보기",
    applyModeLabel: "실행",
    policyConfiguredLabel: "설정된 정책",
    policyDefaultLabel: "기본 정책",
    eligibleLabel: "대상",
    appliedLabel: "반영",
    failedLabel: "실패",
    alreadySettledLabel: "기정산",
    noReasonFallback: "추가 안내 없음",
    detailStatusEligible: "대상",
    detailStatusAlreadySettled: "기정산",
    detailStatusNotEligible: "비대상",
    detailStatusApplied: "반영 완료",
    detailStatusFailed: "반영 실패"
  },
  en: {
    heroEyebrow: "FlowHR Admin",
    title: "Leave Auto Grant Engine",
    description: "Review or run automatic annual leave grants for the selected year using the active policy.",
    conditionsTitle: "Run Conditions",
    yearLabel: "Settlement year",
    includeAlreadySettledLabel: "Include already settled employees",
    includeAlreadySettledYes: "yes",
    includeAlreadySettledNo: "no",
    dryRunAction: "Preview",
    runAction: "Run Auto Grant",
    sessionErrorPrefix: "Session error",
    summaryTitle: "Policy / Summary",
    noResultYet: "No execution result yet.",
    resultWorkspaceLabel: "Applied workspace",
    resultWorkspaceValue: "Current workspace",
    resultYearModeLabel: "Year / Mode",
    resultPolicyLabel: "Applied policy",
    resultEligibleAppliedFailedLabel: "Eligible / Applied / Failed",
    detailsTitle: "Target Details",
    noRowsYet: "No target rows to display.",
    detailsStatusLabel: "Status",
    detailsEmployeeNumberLabel: "Employee number",
    detailsJoinedLabel: "Joined",
    detailsProjectedLabel: "Projected grant",
    workspaceShortcutsTitle: "Workspace shortcuts",
    backToAdminAction: "Back to Admin",
    leavePromotionDevAction: "(dev) Leave Promotion",
    logsTitle: "Request Logs",
    logsTotalLabel: "total",
    logsSuccessLabel: "success",
    logsFailLabel: "fail",
    logsRunningLabel: "running",
    noLogsYet: "No API calls yet.",
    pendingDryRun: "leave auto grant preview",
    pendingRun: "leave auto grant run",
    statusMissingWorkspace: "Check the workspace connection and try again.",
    statusInvalidYear: "Settlement year must be an integer between 2000 and 9999.",
    statusRequestFailed: "We couldn't complete the request. Review the current state and try again.",
    statusDryRunDone: "Preview loaded",
    statusRunDone: "Auto grant completed",
    dryRunModeLabel: "Preview",
    applyModeLabel: "Run",
    policyConfiguredLabel: "Configured policy",
    policyDefaultLabel: "Default policy",
    eligibleLabel: "Eligible",
    appliedLabel: "Applied",
    failedLabel: "Failed",
    alreadySettledLabel: "Already settled",
    noReasonFallback: "No additional guidance",
    detailStatusEligible: "Eligible",
    detailStatusAlreadySettled: "Already settled",
    detailStatusNotEligible: "Not eligible",
    detailStatusApplied: "Applied",
    detailStatusFailed: "Failed"
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

function formatAutoGrantPolicyLabel(
  copy: LeaveAccrualCopy,
  policy: AutoGrantResponse["policy"],
  locale: "ko" | "en"
) {
  const sourceLabel =
    policy.source === "configured" ? copy.policyConfiguredLabel : copy.policyDefaultLabel;
  if (locale === "ko") {
    return `${sourceLabel} · 연차 ${formatDays(policy.annualGrantDays)} / 이월 한도 ${formatDays(policy.carryOverCapDays)}`;
  }
  return `${sourceLabel} · annual ${formatDays(policy.annualGrantDays)} / carry cap ${formatDays(policy.carryOverCapDays)}`;
}

function formatAutoGrantStatusLabel(copy: LeaveAccrualCopy, status: AutoGrantResultItem["status"]) {
  switch (status) {
    case "ELIGIBLE":
      return copy.detailStatusEligible;
    case "ALREADY_SETTLED":
      return copy.detailStatusAlreadySettled;
    case "NOT_ELIGIBLE":
      return copy.detailStatusNotEligible;
    case "APPLIED":
      return copy.detailStatusApplied;
    case "FAILED":
      return copy.detailStatusFailed;
    default:
      return status;
  }
}

function formatAutoGrantPrimaryPersonLabel(row: AutoGrantResultItem, locale: "ko" | "en") {
  return formatEmployeeDisplayName(row.name ?? row.email, locale);
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
  const hasWorkspaceSession = organizationId.length > 0;
  const hasAdminSession = (supabaseSession?.actorId ?? supabaseSession?.userId ?? "").trim().length > 0;
  const workspaceStatusLabel = locale === "ko" ? "작업 공간 상태" : "Workspace status";
  const adminSessionStatusLabel = locale === "ko" ? "관리자 세션 상태" : "Admin session status";
  const bearerToken = isProductionRuntime ? (supabaseSession?.accessToken ?? "") : "";
  const usesBearerToken = bearerToken.trim().length > 0;

  const normalizedSupabaseSessionError = useMemo(() => {
    if (!supabaseSessionError) {
      return null;
    }
    return formatUserFacingErrorMessage(supabaseSessionError, locale);
  }, [locale, supabaseSessionError]);

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
      setStatusMessage(copy.statusMissingWorkspace);
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
        `${copy.statusDryRunDone}: ${copy.eligibleLabel} ${parsed.summary.eligibleCount}, ${copy.alreadySettledLabel} ${parsed.summary.alreadySettledCount}`
      );
    } else {
      setStatusMessage(
        `${copy.statusRunDone}: ${copy.appliedLabel} ${parsed.summary.appliedCount}, ${copy.failedLabel} ${parsed.summary.failedCount}`
      );
    }
    setTimeout(() => setStatusMessage(""), 3000);
  }

  return (
    <main className="saas-content">
      <header className="hero">
        <p className="eyebrow">{copy.heroEyebrow}</p>
        <h1>{copy.title}</h1>
        <p>{copy.description}</p>
      </header>

      <section className="panel-grid">
        <article className="panel">
          <h2>{copy.conditionsTitle}</h2>
          {showDevTools ? (
            <p className="small">
              {workspaceStatusLabel}:{" "}
              <strong>{formatWorkspaceConnectionState(hasWorkspaceSession, runtimeLocale)}</strong> /{" "}
              {adminSessionStatusLabel}:{" "}
              <strong>{formatAdminSessionConnectionState(hasAdminSession, runtimeLocale)}</strong>
            </p>
          ) : null}
          <div className="input-grid">
            <label>
              {copy.yearLabel}
              <input
                type="number"
                min={2000}
                max={9999}
                value={year}
                onChange={(event) => setYear(event.target.value)}
              />
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
            <button
              className="btn btn-secondary"
              onClick={() => void runAutoGrant(true)}
              disabled={!organizationId.trim() || pendingLabel !== null}
            >
              {copy.dryRunAction}
            </button>
            <button
              className="btn btn-primary"
              onClick={() => void runAutoGrant(false)}
              disabled={!organizationId.trim() || pendingLabel !== null}
            >
              {copy.runAction}
            </button>
          </div>
          {statusMessage ? <p className="small">{statusMessage}</p> : null}
          {normalizedSupabaseSessionError ? (
            <p className="small fail">
              {copy.sessionErrorPrefix}: {normalizedSupabaseSessionError}
            </p>
          ) : null}
        </article>

        <article className="panel">
          <h2>{copy.summaryTitle}</h2>
          {!result ? (
            <p className="small">{copy.noResultYet}</p>
          ) : (
            <ul className="simple-list">
              <li>
                <span>{copy.resultWorkspaceLabel}</span>
                <strong>{copy.resultWorkspaceValue}</strong>
              </li>
              <li>
                <span>{copy.resultYearModeLabel}</span>
                <strong>
                  {result.year} / {result.dryRun ? copy.dryRunModeLabel : copy.applyModeLabel}
                </strong>
              </li>
              <li>
                <span>{copy.resultPolicyLabel}</span>
                <strong>{formatAutoGrantPolicyLabel(copy, result.policy, locale)}</strong>
              </li>
              <li>
                <span>{copy.resultEligibleAppliedFailedLabel}</span>
                <strong>
                  {result.summary.eligibleCount} / {result.summary.appliedCount} / {result.summary.failedCount}
                </strong>
              </li>
            </ul>
          )}
        </article>

        <article className="panel">
          <h2>{copy.detailsTitle} {result ? `(${result.results.length})` : ""}</h2>
          {!result || result.results.length === 0 ? (
            <p className="small">{copy.noRowsYet}</p>
          ) : (
            <ul className="simple-list">
              {result.results.map((row) => {
                const employeeNumber = formatPublicEmployeeNumber(row.employeeId);
                const reasonLabel = row.reason
                  ? formatUserFacingErrorMessage(row.reason, locale)
                  : copy.noReasonFallback;
                return (
                  <li key={row.employeeId}>
                    <span>
                      <strong>{formatAutoGrantPrimaryPersonLabel(row, locale)}</strong>
                      <br />
                      <span className="small">
                        {copy.detailsEmployeeNumberLabel} {employeeNumber}
                      </span>
                      <br />
                      <span className="small">
                        {copy.detailsStatusLabel} {formatAutoGrantStatusLabel(copy, row.status)} / {reasonLabel} /{" "}
                        {copy.detailsJoinedLabel} {formatDateTimeByLocale(row.joinedAt, runtimeLocale)}
                      </span>
                      <br />
                      <span className="small">
                        {copy.detailsProjectedLabel} {formatDays(row.suggestedAnnualGrantDays)} + carry{" "}
                        {formatDays(row.carryOverAppliedDays)} = {formatDays(row.projectedGrantedDays)}
                      </span>
                    </span>
                  </li>
                );
              })}
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
              {copy.logsTotalLabel} {stats.total} / {copy.logsSuccessLabel} {stats.success} / {copy.logsFailLabel}{" "}
              {stats.fail}
              {pendingLabel ? ` / ${copy.logsRunningLabel} ${pendingLabel}` : ""}
            </p>
            {logs.length === 0 ? (
              <p className="small">{copy.noLogsYet}</p>
            ) : (
              <ul className="log-list">
                {logs.map((log) => (
                  <li key={log.id}>
                    <span className={log.ok ? "ok" : "fail"}>{log.ok ? "OK" : "FAIL"}</span> {log.label} /{" "}
                    {log.status}
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
