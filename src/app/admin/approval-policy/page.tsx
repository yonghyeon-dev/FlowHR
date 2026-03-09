"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  formatApprovalPolicyDateTime,
  resolveAdminApprovalPolicyLocaleCopy
} from "@/app/admin/approval-policy/page-locale-helpers";
import {
  type ApiLog,
  type ApprovalDelegationDto,
  type ApprovalDelegationExpireResultDto,
  type ApprovalDomain,
  type ApprovalPolicyDto,
  domainOptions,
  isTruthyFlag,
  toIso,
  toLocalInputValue
} from "@/app/admin/approval-policy/page-types";
import { actorRoles } from "@/lib/actor";
import { apiClientFetch, parseApiResponseBody } from "@/lib/api-client";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { defaultEmployeeIdForApi } from "@/lib/i18n/employee-id-locale";
import { useI18n } from "@/lib/i18n/provider";
import {
  formatActorRoleLabel,
  formatPublicEmployeeNumber,
  formatUserFacingErrorMessage
} from "@/lib/product-language";

export default function AdminApprovalPolicyPage() {
  const [attendanceRole, setAttendanceRole] = useState("manager");
  const [leaveRole, setLeaveRole] = useState("manager");
  const [payrollRole, setPayrollRole] = useState("payroll_operator");
  const [policyConfigured, setPolicyConfigured] = useState(false);

  const [delegationDomain, setDelegationDomain] = useState<ApprovalDomain>("ATTENDANCE");
  const [delegatorRole, setDelegatorRole] = useState("manager");
  const [delegateActorId, setDelegateActorId] = useState(defaultEmployeeIdForApi);
  const [delegationStartsAt, setDelegationStartsAt] = useState(() => {
    const now = new Date();
    return toLocalInputValue(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0));
  });
  const [delegationEndsAt, setDelegationEndsAt] = useState(() => {
    const now = new Date();
    return toLocalInputValue(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 18, 0, 0));
  });
  const [delegationReason, setDelegationReason] = useState("");
  const [delegations, setDelegations] = useState<ApprovalDelegationDto[]>([]);
  const [delegationExpireDryRun, setDelegationExpireDryRun] = useState(false);
  const [lastExpireResult, setLastExpireResult] = useState<ApprovalDelegationExpireResultDto | null>(null);

  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
  const copy = useMemo(() => resolveAdminApprovalPolicyLocaleCopy(isKoLocale), [isKoLocale]);
  const organizationId = (supabaseSession?.organizationId ?? "").trim();
  const adminActorId = (supabaseSession?.actorId ?? "").trim();

  const bearerToken = isProductionRuntime ? (supabaseSession?.accessToken ?? "") : "";
  const usesBearerToken = bearerToken.trim().length > 0;
  const requiresLoginSession =
    !supabaseSessionLoading && isProductionRuntime && !usesBearerToken && !showDevTools;

  const stats = useMemo(() => {
    const total = logs.length;
    const success = logs.filter((log) => log.ok).length;
    return {
      total,
      success,
      fail: total - success
    };
  }, [logs]);

  async function callApi(
    label: string,
    method: "GET" | "POST" | "PATCH" | "PUT",
    path: string,
    payload?: Record<string, unknown>
  ) {
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
      if (!response.ok) {
        throw new Error(typeof body === "string" ? body : label);
      }
      return { response, body };
    } catch (callError) {
      setError(
        formatUserFacingErrorMessage(
          callError instanceof Error ? callError.message : String(callError),
          runtimeLocale
        )
      );
      return null;
    } finally {
      setPendingLabel(null);
    }
  }

  async function loadPolicy() {
    if (supabaseSessionLoading || requiresLoginSession || !organizationId.trim()) {
      return;
    }
    const query = new URLSearchParams({ organizationId: organizationId.trim() }).toString();
    const result = await callApi(copy.apiLabels.loadPolicy, "GET", `/api/approval/policy?${query}`);
    if (!result || !result.body || typeof result.body !== "object") {
      return;
    }
    const parsed = result.body as { policy?: ApprovalPolicyDto; configured?: boolean };
    const policy = parsed.policy;
    if (!policy) {
      return;
    }
    setAttendanceRole(policy.attendanceApproverRole);
    setLeaveRole(policy.leaveApproverRole);
    setPayrollRole(policy.payrollApproverRole);
    setPolicyConfigured(Boolean(parsed.configured));
  }

  async function savePolicy() {
    if (supabaseSessionLoading || requiresLoginSession || !organizationId.trim()) {
      return;
    }
    await callApi(copy.apiLabels.savePolicy, "PUT", "/api/approval/policy", {
      organizationId: organizationId.trim(),
      attendanceApproverRole: attendanceRole,
      leaveApproverRole: leaveRole,
      payrollApproverRole: payrollRole
    });
    await loadPolicy();
  }

  async function loadDelegations() {
    if (supabaseSessionLoading || requiresLoginSession || !organizationId.trim()) {
      return;
    }
    const query = new URLSearchParams({ organizationId: organizationId.trim() }).toString();
    const result = await callApi(copy.apiLabels.loadDelegations, "GET", `/api/approval/delegations?${query}`);
    if (!result || !result.body || typeof result.body !== "object") {
      return;
    }
    const parsed = result.body as { delegations?: ApprovalDelegationDto[] };
    setDelegations(parsed.delegations ?? []);
  }

  async function createDelegation() {
    if (supabaseSessionLoading || requiresLoginSession || !organizationId.trim()) {
      return;
    }
    await callApi(copy.apiLabels.createDelegation, "POST", "/api/approval/delegations", {
      organizationId: organizationId.trim(),
      domain: delegationDomain,
      delegatorRole,
      delegateActorId: delegateActorId.trim(),
      startsAt: toIso(delegationStartsAt),
      endsAt: toIso(delegationEndsAt),
      reason: delegationReason.trim() || undefined,
      active: true
    });
    await loadDelegations();
  }

  async function deactivateDelegation(id: string) {
    if (supabaseSessionLoading || requiresLoginSession || !organizationId.trim()) {
      return;
    }
    await callApi(copy.apiLabels.deactivateDelegation, "PATCH", `/api/approval/delegations/${id}`, {
      active: false
    });
    await loadDelegations();
  }

  async function expireDelegations() {
    if (supabaseSessionLoading || requiresLoginSession || !organizationId.trim()) {
      return;
    }

    const result = await callApi(copy.apiLabels.expireDelegations, "POST", "/api/approval/delegations/expire", {
      organizationId: organizationId.trim(),
      dryRun: delegationExpireDryRun
    });
    if (!result || !result.body || typeof result.body !== "object") {
      return;
    }

    const parsed = result.body as ApprovalDelegationExpireResultDto;
    setLastExpireResult(parsed);
    if (!parsed.dryRun) {
      await loadDelegations();
    }
  }

  return (
    <main className="saas-content">
      <header className="hero">
        <p className="eyebrow">{copy.hero.eyebrow}</p>
        <h1>{copy.hero.title}</h1>
        <p>
          {copy.hero.description}
          {showDevTools ? ` ${copy.hero.devNotice}` : ""}
        </p>
      </header>

      {requiresLoginSession ? (
        <p className="small fail">
          {isKoLocale ? "운영 환경에서는 로그인 세션이 필요합니다. " : "Login session is required in production. "}
          <Link href="/login">/login</Link>
        </p>
      ) : null}
      {error ? <p className="small fail">{error}</p> : null}

      <section className="panel-grid">
        <article className="panel">
          <h2>{isKoLocale ? "작업 조건" : "Work conditions"}</h2>
          {showDevTools ? (
            <p className="small muted">
              {copy.context.organizationId}: <code>{organizationId || "-"}</code> / {copy.context.adminActorId}:{" "}
              <code>{adminActorId || "-"}</code>
            </p>
          ) : null}
          <div className="panel-actions">
            <button
              className="btn btn-secondary"
              onClick={() => void loadPolicy()}
              disabled={supabaseSessionLoading || requiresLoginSession || !organizationId.trim()}
            >
              {copy.context.loadPolicy}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => void loadDelegations()}
              disabled={supabaseSessionLoading || requiresLoginSession || !organizationId.trim()}
            >
              {copy.context.loadDelegations}
            </button>
          </div>
          {supabaseSessionError ? (
            <p className="small fail">
              {copy.context.sessionError}: {formatUserFacingErrorMessage(supabaseSessionError, runtimeLocale)}
            </p>
          ) : null}
          <p className="small">
            {copy.context.policyState}: {policyConfigured ? copy.context.configured : copy.context.defaultFallback}
          </p>
        </article>

        <article className="panel">
          <h2>{copy.policy.title}</h2>
          <label>
            {copy.policy.attendanceApproverRole}
            <select value={attendanceRole} onChange={(event) => setAttendanceRole(event.target.value)}>
              {actorRoles.map((role) => (
                <option key={role} value={role}>
                  {formatActorRoleLabel(role, runtimeLocale)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {copy.policy.leaveApproverRole}
            <select value={leaveRole} onChange={(event) => setLeaveRole(event.target.value)}>
              {actorRoles.map((role) => (
                <option key={role} value={role}>
                  {formatActorRoleLabel(role, runtimeLocale)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {copy.policy.payrollApproverRole}
            <select value={payrollRole} onChange={(event) => setPayrollRole(event.target.value)}>
              {actorRoles.map((role) => (
                <option key={role} value={role}>
                  {formatActorRoleLabel(role, runtimeLocale)}
                </option>
              ))}
            </select>
          </label>
          <div className="panel-actions">
            <button
              className="btn btn-primary"
              onClick={() => void savePolicy()}
              disabled={supabaseSessionLoading || requiresLoginSession || !organizationId.trim()}
            >
              {copy.policy.savePolicy}
            </button>
          </div>
        </article>

        <article className="panel">
          <h2>{copy.delegationCreate.title}</h2>
          <label>
            {copy.delegationCreate.domain}
            <select value={delegationDomain} onChange={(event) => setDelegationDomain(event.target.value as ApprovalDomain)}>
              {domainOptions.map((domain) => (
                <option key={domain} value={domain}>
                  {copy.domainLabels[domain]}
                </option>
              ))}
            </select>
          </label>
          <label>
            {copy.delegationCreate.delegatorRole}
            <select value={delegatorRole} onChange={(event) => setDelegatorRole(event.target.value)}>
              {actorRoles.map((role) => (
                <option key={role} value={role}>
                  {formatActorRoleLabel(role, runtimeLocale)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {copy.delegationCreate.delegateActorId}
            <input value={delegateActorId} onChange={(event) => setDelegateActorId(event.target.value)} />
          </label>
          <label>
            {copy.delegationCreate.startsAt}
            <input
              type="datetime-local"
              value={delegationStartsAt}
              onChange={(event) => setDelegationStartsAt(event.target.value)}
            />
          </label>
          <label>
            {copy.delegationCreate.endsAt}
            <input
              type="datetime-local"
              value={delegationEndsAt}
              onChange={(event) => setDelegationEndsAt(event.target.value)}
            />
          </label>
          <label>
            {copy.delegationCreate.reasonOptional}
            <textarea value={delegationReason} onChange={(event) => setDelegationReason(event.target.value)} />
          </label>
          <div className="panel-actions">
            <button
              className="btn btn-primary"
              onClick={() => void createDelegation()}
              disabled={supabaseSessionLoading || requiresLoginSession || !organizationId.trim()}
            >
              {copy.delegationCreate.createDelegation}
            </button>
          </div>
        </article>

        <article className="panel">
          <h2>
            {copy.delegationList.title} ({delegations.length})
          </h2>
          <div className="panel-actions">
            <button
              className="btn btn-secondary btn-small"
              onClick={() => void expireDelegations()}
              disabled={supabaseSessionLoading || requiresLoginSession || !organizationId.trim()}
            >
              {copy.delegationList.expireDelegations}
            </button>
          </div>
          <details className="details">
            <summary>{isKoLocale ? "고급 조건" : "Advanced options"}</summary>
            <div className="input-grid" style={{ marginTop: 12 }}>
              <label className="small" style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                {copy.delegationList.dryRun}
                <select
                  value={delegationExpireDryRun ? "true" : "false"}
                  onChange={(event) => setDelegationExpireDryRun(event.target.value === "true")}
                >
                  <option value="false">{copy.delegationList.execute}</option>
                  <option value="true">{copy.delegationList.preview}</option>
                </select>
              </label>
            </div>
          </details>
          {lastExpireResult ? (
            <p className="small">
              {copy.delegationList.lastResult}: {copy.delegationList.checked} {lastExpireResult.checkedCount},{" "}
              {copy.delegationList.expired} {lastExpireResult.expiredCount}, {copy.delegationList.dryRunValue}{" "}
              {lastExpireResult.dryRun ? "true" : "false"} (
              {formatApprovalPolicyDateTime(lastExpireResult.effectiveAt, runtimeLocale)})
            </p>
          ) : null}
          {delegations.length === 0 ? (
            <p className="small">{copy.delegationList.noDelegations}</p>
          ) : (
            <ul className="simple-list">
              {delegations.map((delegation) => (
                <li key={delegation.id}>
                  <strong>{copy.domainLabels[delegation.domain]}</strong> /{" "}
                  {formatActorRoleLabel(delegation.delegatorRole, runtimeLocale)} =&gt;{" "}
                  {formatPublicEmployeeNumber(delegation.delegateActorId)} /{" "}
                  {delegation.active ? copy.delegationList.active : copy.delegationList.inactive}
                  <br />
                  <span className="small">
                    {formatApprovalPolicyDateTime(delegation.startsAt, runtimeLocale)} ~{" "}
                    {formatApprovalPolicyDateTime(delegation.endsAt, runtimeLocale)}
                  </span>
                  {delegation.active ? (
                    <div className="panel-actions">
                      <button
                        className="btn btn-danger btn-small"
                        onClick={() => void deactivateDelegation(delegation.id)}
                        disabled={supabaseSessionLoading || requiresLoginSession || !organizationId.trim()}
                      >
                        {copy.delegationList.deactivate}
                      </button>
                    </div>
                  ) : null}
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
              <Link href="/admin" className="btn btn-secondary">
                {copy.logs.toAdmin}
              </Link>
            </div>
          </article>
        ) : (
          <article className="panel">
            <h2>{isKoLocale ? "관련 화면 이동" : "Related workspaces"}</h2>
            <div className="panel-actions">
              <Link href="/admin/approval-executions" className="btn btn-secondary">
                {isKoLocale ? "결재 실행 현황" : "Approval executions"}
              </Link>
              <Link href="/admin/approval-history" className="btn btn-secondary">
                {isKoLocale ? "결재 단계 이력" : "Approval history"}
              </Link>
              <Link href="/admin" className="btn btn-secondary">
                {copy.logs.toAdmin}
              </Link>
            </div>
          </article>
        )}
      </section>
    </main>
  );
}
