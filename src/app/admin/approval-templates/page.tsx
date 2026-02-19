"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { actorRoles } from "@/lib/actor";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useStickyStringState } from "@/lib/client/useStickyState";

type ApprovalDomain = "ATTENDANCE" | "LEAVE" | "PAYROLL";

type ApprovalLineTemplateDto = {
  id: string;
  organizationId: string;
  name: string;
  domain: ApprovalDomain;
  approverRoles: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
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

function formatDateTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString("ko-KR");
}

export default function AdminApprovalTemplatesPage() {
  const [accessToken, setAccessToken] = useState("");
  const [organizationId, setOrganizationId] = useStickyStringState("flowhr:ctx:organizationId", "");
  const [adminActorId, setAdminActorId] = useStickyStringState("flowhr:ctx:adminId", "ADM-1001");

  const [name, setName] = useState("attendance-default-line");
  const [domain, setDomain] = useState<ApprovalDomain>("ATTENDANCE");
  const [selectedRoles, setSelectedRoles] = useState<string[]>(["manager"]);
  const [createAsActive, setCreateAsActive] = useState(true);

  const [templates, setTemplates] = useState<ApprovalLineTemplateDto[]>([]);
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
    return { total, success, fail: total - success };
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

  function toggleRole(role: string, checked: boolean) {
    setSelectedRoles((prev) => {
      if (checked) {
        return prev.includes(role) ? prev : [...prev, role];
      }
      const next = prev.filter((item) => item !== role);
      if (next.length === 0) {
        return prev;
      }
      return next;
    });
  }

  async function callApi(
    label: string,
    method: "GET" | "POST" | "PATCH",
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

  async function loadTemplates() {
    if (!organizationId.trim()) {
      return;
    }
    const query = new URLSearchParams({ organizationId: organizationId.trim() }).toString();
    const { response, body } = await callApi(
      "결재선 템플릿 조회",
      "GET",
      `/api/approval/templates?${query}`
    );
    if (!response.ok || !body || typeof body !== "object") {
      return;
    }
    const parsed = body as { templates?: ApprovalLineTemplateDto[] };
    setTemplates(parsed.templates ?? []);
  }

  async function createTemplate() {
    if (!organizationId.trim()) {
      return;
    }
    if (selectedRoles.length === 0) {
      return;
    }
    await callApi("결재선 템플릿 생성", "POST", "/api/approval/templates", {
      organizationId: organizationId.trim(),
      name: name.trim(),
      domain,
      approverRoles: selectedRoles,
      active: createAsActive
    });
    await loadTemplates();
  }

  async function toggleTemplateActive(template: ApprovalLineTemplateDto) {
    await callApi(
      template.active ? "결재선 템플릿 비활성화" : "결재선 템플릿 활성화",
      "PATCH",
      `/api/approval/templates/${template.id}`,
      { active: !template.active }
    );
    await loadTemplates();
  }

  return (
    <main className="saas-content">
      <header className="hero">
        <p className="eyebrow">FlowHR Admin</p>
        <h1>결재선 템플릿</h1>
        <p>
          도메인별 결재선 역할 집합을 템플릿으로 관리합니다. 활성 템플릿은 승인 게이트에서 정책 단일 role보다
          우선 적용됩니다.
          {showDevTools ? " 개발 모드에서는 헤더 기반 Actor 컨텍스트를 사용합니다." : ""}
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
            <button className="btn btn-secondary" onClick={() => void loadTemplates()} disabled={!organizationId.trim()}>
              템플릿 조회
            </button>
          </div>
          {supabaseSessionError ? <p className="small fail">Session 오류: {supabaseSessionError}</p> : null}
        </article>

        <article className="panel">
          <h2>템플릿 생성</h2>
          <label>
            템플릿 이름
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label>
            도메인
            <select value={domain} onChange={(event) => setDomain(event.target.value as ApprovalDomain)}>
              {domainOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <fieldset>
            <legend className="small">승인 가능 role (1개 이상)</legend>
            <div style={{ display: "grid", gap: 8 }}>
              {actorRoles.map((role) => (
                <label key={role} className="small" style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(role)}
                    onChange={(event) => toggleRole(role, event.target.checked)}
                  />
                  {role}
                </label>
              ))}
            </div>
          </fieldset>
          <label>
            생성 즉시 활성화
            <select value={createAsActive ? "true" : "false"} onChange={(event) => setCreateAsActive(event.target.value === "true")}>
              <option value="true">활성</option>
              <option value="false">비활성</option>
            </select>
          </label>
          <div className="panel-actions">
            <button
              className="btn btn-primary"
              onClick={() => void createTemplate()}
              disabled={!organizationId.trim() || !name.trim() || selectedRoles.length === 0}
            >
              템플릿 생성
            </button>
          </div>
        </article>

        <article className="panel">
          <h2>템플릿 목록 ({templates.length})</h2>
          {templates.length === 0 ? (
            <p className="small">등록된 템플릿이 없습니다.</p>
          ) : (
            <ul className="simple-list">
              {templates.map((template) => (
                <li key={template.id}>
                  <strong>{template.name}</strong>{" "}
                  <span className="muted">
                    [{template.domain}] / roles: {template.approverRoles.join(", ")} /{" "}
                    {template.active ? "ACTIVE" : "INACTIVE"}
                  </span>
                  <br />
                  <span className="small">
                    created {formatDateTime(template.createdAt)} / updated {formatDateTime(template.updatedAt)}
                  </span>
                  <div className="panel-actions">
                    <button className="btn btn-secondary btn-small" onClick={() => void toggleTemplateActive(template)}>
                      {template.active ? "비활성화" : "활성화"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="panel">
          <h2>요청 로그</h2>
          <p className="small">
            총 {stats.total}건 · 성공 {stats.success}건 · 실패 {stats.fail}건
            {pendingLabel ? ` · 진행중 ${pendingLabel}` : ""}
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
            <Link href="/admin/approval-policy" className="btn btn-secondary">
              결재선/위임 정책으로
            </Link>
            <Link href="/admin" className="btn btn-secondary">
              관리자 홈으로
            </Link>
          </div>
        </article>
      </section>
    </main>
  );
}
