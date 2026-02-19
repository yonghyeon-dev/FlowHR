"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { actorRoles } from "@/lib/actor";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useStickyStringState } from "@/lib/client/useStickyState";

type ApprovalDomain = "ATTENDANCE" | "LEAVE" | "PAYROLL";

type ApprovalPolicyDto = {
  id: string;
  organizationId: string;
  attendanceApproverRole: string;
  leaveApproverRole: string;
  payrollApproverRole: string;
  createdAt: string;
  updatedAt: string;
};

type ApprovalDelegationDto = {
  id: string;
  organizationId: string;
  domain: ApprovalDomain;
  delegatorRole: string;
  delegateActorId: string;
  reason: string | null;
  startsAt: string;
  endsAt: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

type ApprovalDelegationExpireResultDto = {
  organizationId: string;
  checkedCount: number;
  expiredCount: number;
  delegationIds: string[];
  effectiveAt: string;
  dryRun: boolean;
};

type ApiLog = {
  id: number;
  label: string;
  ok: boolean;
  status: number;
  at: string;
};

const domainOptions: ApprovalDomain[] = ["ATTENDANCE", "LEAVE", "PAYROLL"];

function isTruthyFlag(value: string | undefined) {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

function toLocalInputValue(value: Date) {
  const adjusted = new Date(value.getTime() - value.getTimezoneOffset() * 60_000);
  return adjusted.toISOString().slice(0, 16);
}

function toIso(value: string) {
  return new Date(value).toISOString();
}

function formatDateTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString("ko-KR");
}

export default function AdminApprovalPolicyPage() {
  const [accessToken, setAccessToken] = useState("");
  const [organizationId, setOrganizationId] = useStickyStringState("flowhr:ctx:organizationId", "");
  const [adminActorId, setAdminActorId] = useStickyStringState("flowhr:ctx:adminId", "ADM-1001");

  const [attendanceRole, setAttendanceRole] = useState("manager");
  const [leaveRole, setLeaveRole] = useState("manager");
  const [payrollRole, setPayrollRole] = useState("payroll_operator");
  const [policyConfigured, setPolicyConfigured] = useState(false);

  const [delegationDomain, setDelegationDomain] = useState<ApprovalDomain>("ATTENDANCE");
  const [delegatorRole, setDelegatorRole] = useState("manager");
  const [delegateActorId, setDelegateActorId] = useState("EMP-1001");
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
  const [lastExpireResult, setLastExpireResult] = useState<ApprovalDelegationExpireResultDto | null>(
    null
  );

  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);

  const showDevTools = isTruthyFlag(process.env.NEXT_PUBLIC_FLOWHR_DEV_TOOLS);
  const isProductionRuntime = process.env.NODE_ENV === "production";
  const { snapshot: supabaseSession, error: supabaseSessionError } = useSupabaseSession();

  const bearerToken =
    accessToken.trim().length > 0
      ? accessToken.trim()
      : isProductionRuntime
        ? (supabaseSession?.accessToken ?? "")
        : "";
  const usesBearerToken = bearerToken.trim().length > 0;

  const stats = useMemo(() => {
    const total = logs.length;
    const success = logs.filter((log) => log.ok).length;
    return {
      total,
      success,
      fail: total - success
    };
  }, [logs]);

  useEffect(() => {
    if (!isProductionRuntime) {
      return;
    }
    const orgId = supabaseSession?.organizationId ?? "";
    if (orgId.trim().length > 0 && !organizationId.trim()) {
      setOrganizationId(orgId.trim());
    }
  }, [isProductionRuntime, organizationId, setOrganizationId, supabaseSession?.organizationId]);

  async function callApi(
    label: string,
    method: "GET" | "POST" | "PATCH" | "PUT",
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
        if (organizationId.trim().length > 0) {
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
          at: new Date().toLocaleString("ko-KR")
        },
        ...prev
      ]);

      const text = await response.text();
      let body: unknown = null;
      if (text.trim().length > 0) {
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

  async function loadPolicy() {
    if (!organizationId.trim()) {
      return;
    }
    const query = new URLSearchParams({ organizationId: organizationId.trim() }).toString();
    const { response, body } = await callApi("결재선 정책 조회", "GET", `/api/approval/policy?${query}`);
    if (!response.ok || !body || typeof body !== "object") {
      return;
    }
    const parsed = body as { policy?: ApprovalPolicyDto; configured?: boolean };
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
    if (!organizationId.trim()) {
      return;
    }
    await callApi("결재선 정책 저장", "PUT", "/api/approval/policy", {
      organizationId: organizationId.trim(),
      attendanceApproverRole: attendanceRole,
      leaveApproverRole: leaveRole,
      payrollApproverRole: payrollRole
    });
    await loadPolicy();
  }

  async function loadDelegations() {
    if (!organizationId.trim()) {
      return;
    }
    const query = new URLSearchParams({ organizationId: organizationId.trim() }).toString();
    const { response, body } = await callApi("위임 정책 조회", "GET", `/api/approval/delegations?${query}`);
    if (!response.ok || !body || typeof body !== "object") {
      return;
    }
    const parsed = body as { delegations?: ApprovalDelegationDto[] };
    setDelegations(parsed.delegations ?? []);
  }

  async function createDelegation() {
    if (!organizationId.trim()) {
      return;
    }
    await callApi("위임 정책 생성", "POST", "/api/approval/delegations", {
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
    await callApi("위임 정책 비활성화", "PATCH", `/api/approval/delegations/${id}`, {
      active: false
    });
    await loadDelegations();
  }

  async function expireDelegations() {
    if (!organizationId.trim()) {
      return;
    }

    const { response, body } = await callApi("만료 위임 정리", "POST", "/api/approval/delegations/expire", {
      organizationId: organizationId.trim(),
      dryRun: delegationExpireDryRun
    });
    if (!response.ok || !body || typeof body !== "object") {
      return;
    }

    const parsed = body as ApprovalDelegationExpireResultDto;
    setLastExpireResult(parsed);
    if (!parsed.dryRun) {
      await loadDelegations();
    }
  }

  return (
    <main className="saas-content">
      <header className="hero">
        <p className="eyebrow">FlowHR Admin</p>
        <h1>결재선/위임 정책</h1>
        <p>
          도메인별 기본 결재 권한(근태/휴가/급여)과 임시 위임을 설정합니다.
          {showDevTools ? " dev tools 모드에서는 헤더 기반 Actor 컨텍스트를 사용합니다." : ""}
        </p>
      </header>

      <section className="panel-grid">
        <article className="panel">
          <h2>컨텍스트</h2>
          <label>
            Organization ID
            <input value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} />
          </label>
          <label>
            Admin Actor ID (Dev fallback)
            <input value={adminActorId} onChange={(event) => setAdminActorId(event.target.value)} />
          </label>
          <label>
            Access Token (optional)
            <input
              placeholder="Bearer token"
              value={accessToken}
              onChange={(event) => setAccessToken(event.target.value)}
            />
          </label>
          <div className="panel-actions">
            <button className="btn btn-secondary" onClick={() => void loadPolicy()} disabled={!organizationId.trim()}>
              정책 조회
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => void loadDelegations()}
              disabled={!organizationId.trim()}
            >
              위임 조회
            </button>
          </div>
          {supabaseSessionError ? <p className="small fail">Session 오류: {supabaseSessionError}</p> : null}
          <p className="small">현재 정책 상태: {policyConfigured ? "Configured" : "Default fallback"}</p>
        </article>

        <article className="panel">
          <h2>도메인별 결재선</h2>
          <label>
            근태 승인 역할
            <select value={attendanceRole} onChange={(event) => setAttendanceRole(event.target.value)}>
              {actorRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>
          <label>
            휴가 승인 역할
            <select value={leaveRole} onChange={(event) => setLeaveRole(event.target.value)}>
              {actorRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>
          <label>
            급여 확정 역할
            <select value={payrollRole} onChange={(event) => setPayrollRole(event.target.value)}>
              {actorRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>
          <div className="panel-actions">
            <button className="btn btn-primary" onClick={() => void savePolicy()} disabled={!organizationId.trim()}>
              정책 저장
            </button>
          </div>
        </article>

        <article className="panel">
          <h2>위임 생성</h2>
          <label>
            도메인
            <select value={delegationDomain} onChange={(event) => setDelegationDomain(event.target.value as ApprovalDomain)}>
              {domainOptions.map((domain) => (
                <option key={domain} value={domain}>
                  {domain}
                </option>
              ))}
            </select>
          </label>
          <label>
            위임자 역할
            <select value={delegatorRole} onChange={(event) => setDelegatorRole(event.target.value)}>
              {actorRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>
          <label>
            수임 Actor ID
            <input value={delegateActorId} onChange={(event) => setDelegateActorId(event.target.value)} />
          </label>
          <label>
            시작 시각
            <input
              type="datetime-local"
              value={delegationStartsAt}
              onChange={(event) => setDelegationStartsAt(event.target.value)}
            />
          </label>
          <label>
            종료 시각
            <input
              type="datetime-local"
              value={delegationEndsAt}
              onChange={(event) => setDelegationEndsAt(event.target.value)}
            />
          </label>
          <label>
            사유 (optional)
            <textarea value={delegationReason} onChange={(event) => setDelegationReason(event.target.value)} />
          </label>
          <div className="panel-actions">
            <button className="btn btn-primary" onClick={() => void createDelegation()} disabled={!organizationId.trim()}>
              위임 생성
            </button>
          </div>
        </article>

        <article className="panel">
          <h2>위임 목록 ({delegations.length})</h2>
          <div className="panel-actions">
            <button
              className="btn btn-secondary btn-small"
              onClick={() => void expireDelegations()}
              disabled={!organizationId.trim()}
            >
              만료 위임 정리
            </button>
            <label className="small" style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
              Dry-run
              <select
                value={delegationExpireDryRun ? "true" : "false"}
                onChange={(event) => setDelegationExpireDryRun(event.target.value === "true")}
              >
                <option value="false">실행</option>
                <option value="true">미리보기</option>
              </select>
            </label>
          </div>
          {lastExpireResult ? (
            <p className="small">
              최근 정리 결과: checked {lastExpireResult.checkedCount}, expired{" "}
              {lastExpireResult.expiredCount}, dryRun {lastExpireResult.dryRun ? "true" : "false"} (
              {formatDateTime(lastExpireResult.effectiveAt)})
            </p>
          ) : null}
          {delegations.length === 0 ? (
            <p className="small">등록된 위임이 없습니다.</p>
          ) : (
            <ul className="simple-list">
              {delegations.map((delegation) => (
                <li key={delegation.id}>
                  <strong>{delegation.domain}</strong> · {delegation.delegatorRole} =&gt;{" "}
                  {delegation.delegateActorId} · {delegation.active ? "ACTIVE" : "INACTIVE"}<br />
                  <span className="small">
                    {formatDateTime(delegation.startsAt)} ~ {formatDateTime(delegation.endsAt)}
                  </span>
                  {delegation.active ? (
                    <div className="panel-actions">
                      <button
                        className="btn btn-danger btn-small"
                        onClick={() => void deactivateDelegation(delegation.id)}
                      >
                        비활성화
                      </button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="panel">
          <h2>요청 로그</h2>
          <p className="small">
            총 {stats.total}건 · 성공 {stats.success}건 · 실패 {stats.fail}건
            {pendingLabel ? ` · 진행중: ${pendingLabel}` : ""}
          </p>
          {logs.length === 0 ? (
            <p className="small">아직 API 호출 이력이 없습니다.</p>
          ) : (
            <ul className="log-list">
              {logs.map((log) => (
                <li key={log.id}>
                  <span className={log.ok ? "ok" : "fail"}>{log.ok ? "OK" : "FAIL"}</span> {log.label} ·{" "}
                  {log.status} · {log.at}
                </li>
              ))}
            </ul>
          )}
          <div className="panel-actions">
            <Link href="/admin" className="btn btn-secondary">
              관리자 홈으로
            </Link>
          </div>
        </article>
      </section>
    </main>
  );
}
