"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { resolveAdminApprovalTemplatesLocaleCopy } from "@/app/admin/approval-templates/page-locale-helpers";
import {
  ApprovalTemplateListPanel,
  ApprovalTemplateLogsPanel,
  ApprovalTemplatePreviewPanel
} from "@/app/admin/approval-templates/page-sections";
import type {
  ApiLog,
  ApprovalDomain,
  ApprovalGatePreviewDto,
  ApprovalLineTemplateDto
} from "@/app/admin/approval-templates/page-types";
import { actorRoles } from "@/lib/actor";
import { apiClientFetch, parseApiResponseBody } from "@/lib/api-client";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useI18n } from "@/lib/i18n/provider";
import {
  formatAdminSessionConnectionState,
  formatActorRoleLabel,
  formatWorkspaceConnectionState,
  formatUserFacingErrorMessage
} from "@/lib/product-language";

const domainOptions: ApprovalDomain[] = ["ATTENDANCE", "LEAVE", "PAYROLL"];

function isTruthyFlag(value: string | undefined) {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export default function AdminApprovalTemplatesPage() {
  const [name, setName] = useState("attendance-default-line");
  const [domain, setDomain] = useState<ApprovalDomain>("ATTENDANCE");
  const [selectedRoles, setSelectedRoles] = useState<string[]>(["manager"]);
  const [payrollGrossPayMinKrw, setPayrollGrossPayMinKrw] = useState("");
  const [payrollGrossPayMaxKrw, setPayrollGrossPayMaxKrw] = useState("");
  const [createAsActive, setCreateAsActive] = useState(true);

  const [previewDomain, setPreviewDomain] = useState<ApprovalDomain>("ATTENDANCE");
  const [previewActorRole, setPreviewActorRole] = useState("manager");
  const [previewActorId, setPreviewActorId] = useState("MGR-1001");
  const [previewPayrollGrossPayKrw, setPreviewPayrollGrossPayKrw] = useState("");

  const [templates, setTemplates] = useState<ApprovalLineTemplateDto[]>([]);
  const [gatePreview, setGatePreview] = useState<ApprovalGatePreviewDto | null>(null);
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
  const copy = useMemo(() => resolveAdminApprovalTemplatesLocaleCopy(isKoLocale), [isKoLocale]);
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
    } catch (error) {
      setLogs((prev) => [
        {
          id: Date.now(),
          label,
          ok: false,
          status: 0,
          at: new Date().toLocaleString(runtimeLocale)
        },
        ...prev
      ]);
      return {
        response: { ok: false, status: 0 } as Response,
        body: formatUserFacingErrorMessage(error instanceof Error ? error.message : String(error), runtimeLocale)
      };
    } finally {
      setPendingLabel(null);
    }
  }

  async function loadTemplates() {
    if (supabaseSessionLoading || requiresLoginSession || !organizationId.trim()) {
      return;
    }
    const query = new URLSearchParams({ organizationId: organizationId.trim() }).toString();
    const { response, body } = await callApi(copy.apiLabels.fetchTemplates, "GET", `/api/approval/templates?${query}`);
    if (!response.ok || !body || typeof body !== "object") {
      return;
    }
    const parsed = body as { templates?: ApprovalLineTemplateDto[] };
    setTemplates(parsed.templates ?? []);
  }

  async function createTemplate() {
    if (supabaseSessionLoading || requiresLoginSession || !organizationId.trim()) {
      return;
    }
    if (selectedRoles.length === 0) {
      return;
    }
    const minRaw = payrollGrossPayMinKrw.trim();
    const maxRaw = payrollGrossPayMaxKrw.trim();
    const min = minRaw.length > 0 ? Number(minRaw) : null;
    const max = maxRaw.length > 0 ? Number(maxRaw) : null;
    if (domain === "PAYROLL") {
      if ((minRaw.length > 0 && !Number.isInteger(min)) || (maxRaw.length > 0 && !Number.isInteger(max))) {
        return;
      }
      if (min !== null && max !== null && min > max) {
        return;
      }
    }
    await callApi(copy.apiLabels.createTemplate, "POST", "/api/approval/templates", {
      organizationId: organizationId.trim(),
      name: name.trim(),
      domain,
      approverRoles: selectedRoles,
      ...(domain === "PAYROLL"
        ? {
            payrollGrossPayMinKrw: min,
            payrollGrossPayMaxKrw: max
          }
        : {}),
      active: createAsActive
    });
    await loadTemplates();
  }

  async function runGatePreview() {
    if (supabaseSessionLoading || requiresLoginSession || !organizationId.trim()) {
      return;
    }

    const payrollGrossRaw = previewPayrollGrossPayKrw.trim();
    const payrollGross = previewDomain === "PAYROLL" && payrollGrossRaw.length > 0 ? Number(payrollGrossRaw) : null;
    if (previewDomain === "PAYROLL" && payrollGrossRaw.length > 0 && !Number.isInteger(payrollGross)) {
      return;
    }

    const { response, body } = await callApi(copy.apiLabels.gatePreview, "POST", "/api/approval/policy/gate-preview", {
      organizationId: organizationId.trim(),
      domain: previewDomain,
      actorRole: previewActorRole.trim() || undefined,
      actorId: previewActorId.trim() || undefined,
      ...(previewDomain === "PAYROLL" ? { payrollGrossPayKrw: payrollGross } : {})
    });
    if (!response.ok || !body || typeof body !== "object") {
      return;
    }
    const parsed = body as { preview?: ApprovalGatePreviewDto };
    setGatePreview(parsed.preview ?? null);
  }

  async function toggleTemplateActive(template: ApprovalLineTemplateDto) {
    if (supabaseSessionLoading || requiresLoginSession || !organizationId.trim()) {
      return;
    }
    await callApi(
      template.active ? copy.apiLabels.deactivateTemplate : copy.apiLabels.activateTemplate,
      "PATCH",
      `/api/approval/templates/${template.id}`,
      { active: !template.active }
    );
    await loadTemplates();
  }

  return (
    <main className="saas-content workspace-shell admin-workspace-shell">
      <header className="page-header workspace-page-header">
        <div>
          <p className="eyebrow">{copy.hero.eyebrow}</p>
          <h1 className="page-title">{copy.hero.title}</h1>
          <p className="page-subtitle">
            {copy.hero.description}
            {showDevTools ? ` ${copy.hero.devNotice}` : ""}
          </p>
          <p className="small muted workspace-source-banner">
            {isKoLocale
              ? "결재 라인 템플릿은 승인 운영 인사이트 흐름에서 정책, 단계 이력, 실행 현황과 같은 기준으로 관리합니다."
              : "Approval line templates stay aligned with policy, stage history, and execution review in the admin insight lane."}
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
          <p>{copy.templateList.title}</p>
          <strong>{templates.length}</strong>
        </article>
        <article className="kpi-card workspace-summary-card">
          <p>{copy.preview.title}</p>
          <strong>{gatePreview ? (gatePreview.allowed ? copy.preview.allowed : copy.preview.blocked) : "-"}</strong>
        </article>
        <article className="kpi-card workspace-summary-card">
          <p>{copy.logs.title}</p>
          <strong>{stats.total}</strong>
        </article>
      </section>

      {requiresLoginSession ? (
        <p className="small fail workspace-inline-status">
          {isKoLocale ? "운영 환경에서는 로그인 세션이 필요합니다. " : "Login session is required in production. "}
          <Link href="/login">/login</Link>
        </p>
      ) : null}

      <section className="panel-grid workspace-panel-grid">
        <article className="panel workspace-section-card workspace-toolbar-card">
          <div className="section-heading">
            <div>
              <h2>{copy.context.title}</h2>
              <p className="small muted">
                {isKoLocale
                  ? "템플릿 목록을 새로 불러오고 현재 작업 공간 연결 상태를 확인합니다."
                  : "Refresh templates and confirm the current workspace connection state."}
              </p>
            </div>
          </div>
          {showDevTools ? (
            <p className="small muted">
              {copy.context.organizationId}:{" "}
              <strong>{formatWorkspaceConnectionState(Boolean(organizationId.trim()), runtimeLocale)}</strong> /{" "}
              {copy.context.adminActorId}:{" "}
              <strong>{formatAdminSessionConnectionState(Boolean(adminActorId.trim()), runtimeLocale)}</strong>
            </p>
          ) : null}
          <div className="panel-actions">
            <button
              className="btn btn-secondary"
              onClick={() => void loadTemplates()}
              disabled={supabaseSessionLoading || requiresLoginSession || !organizationId.trim()}
            >
              {copy.context.loadTemplates}
            </button>
          </div>
          {supabaseSessionError ? (
            <p className="small fail">
              {copy.context.sessionError}: {formatUserFacingErrorMessage(supabaseSessionError, runtimeLocale)}
            </p>
          ) : null}
        </article>

        <article className="panel workspace-section-card workspace-note-card">
          <div className="section-heading">
            <div>
              <h2>{isKoLocale ? "요약" : "Summary"}</h2>
              <p className="small muted">
                {isKoLocale
                  ? "현재 템플릿 규모와 최근 프리뷰 결과를 한 번에 확인합니다."
                  : "Review template scale and the latest gate preview result at a glance."}
              </p>
            </div>
          </div>
          <dl className="definition-grid">
            <div>
              <dt>{copy.templateList.title}</dt>
              <dd>{templates.length}</dd>
            </div>
            <div>
              <dt>{copy.preview.title}</dt>
              <dd>{gatePreview ? (gatePreview.allowed ? copy.preview.allowed : copy.preview.blocked) : "-"}</dd>
            </div>
            <div>
              <dt>{copy.logs.title}</dt>
              <dd>{stats.total}</dd>
            </div>
          </dl>
        </article>

        <article className="panel workspace-section-card workspace-toolbar-card">
          <div className="section-heading">
            <div>
              <h2>{copy.create.title}</h2>
              <p className="small muted">
                {isKoLocale
                  ? "도메인별 승인 역할 구성을 새 템플릿으로 등록합니다."
                  : "Register a new domain-based approver-role template."}
              </p>
            </div>
          </div>
          <label>
            {copy.create.templateName}
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label>
            {copy.create.domain}
            <select value={domain} onChange={(event) => setDomain(event.target.value as ApprovalDomain)}>
              {domainOptions.map((option) => (
                <option key={option} value={option}>
                  {copy.domainLabels[option]}
                </option>
              ))}
            </select>
          </label>
          {domain === "PAYROLL" ? (
            <details className="details">
              <summary>{isKoLocale ? "고급 조건" : "Advanced options"}</summary>
              <div className="input-grid" style={{ marginTop: 12 }}>
                <label>
                  {copy.create.payrollGrossMin}
                  <input
                    type="number"
                    min={0}
                    value={payrollGrossPayMinKrw}
                    onChange={(event) => setPayrollGrossPayMinKrw(event.target.value)}
                    placeholder={copy.create.payrollGrossMinPlaceholder}
                  />
                </label>
                <label>
                  {copy.create.payrollGrossMax}
                  <input
                    type="number"
                    min={0}
                    value={payrollGrossPayMaxKrw}
                    onChange={(event) => setPayrollGrossPayMaxKrw(event.target.value)}
                    placeholder={copy.create.payrollGrossMaxPlaceholder}
                  />
                </label>
              </div>
            </details>
          ) : null}
          <fieldset>
            <legend className="small">{copy.create.rolesLegend}</legend>
            <div style={{ display: "grid", gap: 8 }}>
              {actorRoles.map((role) => (
                <label key={role} className="small" style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(role)}
                    onChange={(event) => toggleRole(role, event.target.checked)}
                  />
                  {formatActorRoleLabel(role, runtimeLocale)}
                </label>
              ))}
            </div>
          </fieldset>
          <label>
            {copy.create.activateOnCreate}
            <select value={createAsActive ? "true" : "false"} onChange={(event) => setCreateAsActive(event.target.value === "true")}>
              <option value="true">{copy.create.active}</option>
              <option value="false">{copy.create.inactive}</option>
            </select>
          </label>
          <div className="panel-actions">
            <button
              className="btn btn-primary"
              onClick={() => void createTemplate()}
              disabled={
                supabaseSessionLoading ||
                requiresLoginSession ||
                !organizationId.trim() ||
                !name.trim() ||
                selectedRoles.length === 0
              }
            >
              {copy.create.createTemplate}
            </button>
          </div>
        </article>

        <ApprovalTemplatePreviewPanel
          copy={copy}
          runtimeLocale={runtimeLocale}
          organizationId={supabaseSessionLoading || requiresLoginSession ? "" : organizationId}
          actorRoles={actorRoles}
          domainOptions={domainOptions}
          previewDomain={previewDomain}
          setPreviewDomain={setPreviewDomain}
          previewActorRole={previewActorRole}
          setPreviewActorRole={setPreviewActorRole}
          previewActorId={previewActorId}
          setPreviewActorId={setPreviewActorId}
          previewPayrollGrossPayKrw={previewPayrollGrossPayKrw}
          setPreviewPayrollGrossPayKrw={setPreviewPayrollGrossPayKrw}
          gatePreview={gatePreview}
          runGatePreview={() => void runGatePreview()}
        />

        <ApprovalTemplateListPanel
          copy={copy}
          runtimeLocale={runtimeLocale}
          templates={templates}
          onToggleTemplateActive={(template) => void toggleTemplateActive(template)}
        />

        {showDevTools ? (
          <ApprovalTemplateLogsPanel copy={copy} stats={stats} pendingLabel={pendingLabel} logs={logs} />
        ) : (
          <article className="panel workspace-section-card workspace-note-card">
            <div className="section-heading">
              <div>
                <h2>{isKoLocale ? "관련 화면 이동" : "Related workspaces"}</h2>
                <p className="small muted">
                  {isKoLocale
                    ? "정책과 실행 현황으로 이어지는 승인 운영 흐름을 바로 엽니다."
                    : "Open the connected policy and execution workspaces."}
                </p>
              </div>
            </div>
            <div className="panel-actions">
              <Link className="btn btn-secondary" href="/admin/approval-executions">
                {isKoLocale ? "결재 실행 현황" : "Approval executions"}
              </Link>
              <Link className="btn btn-secondary" href="/admin/approval-policy">
                {isKoLocale ? "결재/위임 정책" : "Approval policy"}
              </Link>
              <Link className="btn btn-secondary" href="/admin">
                {isKoLocale ? "관리자 허브" : "Admin hub"}
              </Link>
            </div>
          </article>
        )}
      </section>
    </main>
  );
}
