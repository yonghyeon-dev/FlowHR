"use client";

import { useEffect, useMemo, useState } from "react";

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
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useStickyStringState } from "@/lib/client/useStickyState";
import { useI18n } from "@/lib/i18n/provider";

const domainOptions: ApprovalDomain[] = ["ATTENDANCE", "LEAVE", "PAYROLL"];

function isTruthyFlag(value: string | undefined) {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export default function AdminApprovalTemplatesPage() {
  const [accessToken, setAccessToken] = useState("");
  const [organizationId, setOrganizationId] = useStickyStringState("flowhr:ctx:organizationId", "");
  const [adminActorId, setAdminActorId] = useStickyStringState("flowhr:ctx:adminId", "ADM-1001");

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
  const { snapshot: supabaseSession, error: supabaseSessionError } = useSupabaseSession();
  const { locale } = useI18n();
  const isKoLocale = locale === "ko";
  const runtimeLocale = isKoLocale ? "ko-KR" : "en-US";
  const copy = useMemo(() => resolveAdminApprovalTemplatesLocaleCopy(isKoLocale), [isKoLocale]);

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
          at: new Date().toLocaleString(runtimeLocale)
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
    const { response, body } = await callApi(copy.apiLabels.fetchTemplates, "GET", `/api/approval/templates?${query}`);
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
    const minRaw = payrollGrossPayMinKrw.trim();
    const maxRaw = payrollGrossPayMaxKrw.trim();
    const min = minRaw.length > 0 ? Number(minRaw) : null;
    const max = maxRaw.length > 0 ? Number(maxRaw) : null;
    if (domain === "PAYROLL") {
      if (
        (minRaw.length > 0 && !Number.isInteger(min)) ||
        (maxRaw.length > 0 && !Number.isInteger(max))
      ) {
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
    if (!organizationId.trim()) {
      return;
    }

    const payrollGrossRaw = previewPayrollGrossPayKrw.trim();
    const payrollGross =
      previewDomain === "PAYROLL" && payrollGrossRaw.length > 0 ? Number(payrollGrossRaw) : null;
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
    await callApi(
      template.active ? copy.apiLabels.deactivateTemplate : copy.apiLabels.activateTemplate,
      "PATCH",
      `/api/approval/templates/${template.id}`,
      { active: !template.active }
    );
    await loadTemplates();
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

      <section className="panel-grid">
        <article className="panel">
          <h2>{copy.context.title}</h2>
          <label>
            {copy.context.organizationId}
            <input value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} />
          </label>
          <label>
            {copy.context.adminActorId}
            <input value={adminActorId} onChange={(event) => setAdminActorId(event.target.value)} />
          </label>
          <label>
            {copy.context.accessTokenOptional}
            <input
              placeholder={copy.context.bearerPlaceholder}
              value={accessToken}
              onChange={(event) => setAccessToken(event.target.value)}
            />
          </label>
          <div className="panel-actions">
            <button className="btn btn-secondary" onClick={() => void loadTemplates()} disabled={!organizationId.trim()}>
              {copy.context.loadTemplates}
            </button>
          </div>
          {supabaseSessionError ? (
            <p className="small fail">
              {copy.context.sessionError}: {supabaseSessionError}
            </p>
          ) : null}
        </article>

        <article className="panel">
          <h2>{copy.create.title}</h2>
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
            <>
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
            </>
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
                  {role}
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
              disabled={!organizationId.trim() || !name.trim() || selectedRoles.length === 0}
            >
              {copy.create.createTemplate}
            </button>
          </div>
        </article>

        <ApprovalTemplatePreviewPanel
          copy={copy}
          runtimeLocale={runtimeLocale}
          organizationId={organizationId}
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

        <ApprovalTemplateLogsPanel copy={copy} stats={stats} pendingLabel={pendingLabel} logs={logs} />
      </section>
    </main>
  );
}
