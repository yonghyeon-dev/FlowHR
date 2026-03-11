"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { performAdminApiCall } from "@/app/admin/page-api-helpers";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useI18n } from "@/lib/i18n/provider";

type LeavePolicyStatus = "ACTIVE" | "ARCHIVED";

type LeavePolicyDetailsDto = {
  policy: {
    organizationId: string;
    annualGrantDays: number;
    carryOverCapDays: number;
    allowHalfDay: boolean;
    allowHourly: boolean;
    hourlyIncrementMinutes: number;
    maxHoursPerRequest: number;
    minNoticeDays: number;
    maxConsecutiveDays: number | null;
    annualLeavePromotionEnabled: boolean;
    annualLeavePromotionThresholdDays: number;
    annualLeavePromotionLeadDays: number;
    annualLeavePromotionMessageTemplate: string;
    source: "configured" | "default";
    updatedAt: string | null;
  };
};

type LeavePolicyListDto = {
  organizationId: string;
  policies: Array<{
    id: string;
    name: string;
    isStatutory: boolean;
    status: LeavePolicyStatus;
    usageCount: number;
    updatedAt: string;
  }>;
};

type LeavePolicyFormState = {
  annualGrantDays: string;
  carryOverCapDays: string;
  allowHalfDay: boolean;
  allowHourly: boolean;
  hourlyIncrementMinutes: string;
  maxHoursPerRequest: string;
  minNoticeDays: string;
  maxConsecutiveDays: string;
  annualLeavePromotionEnabled: boolean;
  annualLeavePromotionThresholdDays: string;
  annualLeavePromotionLeadDays: string;
  annualLeavePromotionMessageTemplate: string;
};

type LeavePoliciesCopy = {
  pageTitle: string;
  pageSubtitle: string;
  reloadLabel: string;
  reloadLoadingLabel: string;
  saveLabel: string;
  saveLoadingLabel: string;
  formTitle: string;
  formDescription: string;
  listTitle: string;
  listDescription: string;
  sourceDefault: string;
  sourceConfigured: string;
  currentPolicyLabel: string;
  currentSourceLabel: string;
  currentUpdatedAtLabel: string;
  currentUpdatedFallback: string;
  statusFilterLabel: string;
  activeOption: string;
  archivedOption: string;
  archiveLabel: string;
  archiveConfirm: (name: string) => string;
  archiveBlocked: string;
  noPolicies: string;
  reloadFailed: string;
  saveFailed: string;
  saveSuccess: string;
  archiveFailed: string;
  archiveSuccess: string;
  invalidNumber: (field: string) => string;
  fields: {
    annualGrantDays: string;
    carryOverCapDays: string;
    allowHalfDay: string;
    allowHourly: string;
    hourlyIncrementMinutes: string;
    maxHoursPerRequest: string;
    minNoticeDays: string;
    maxConsecutiveDays: string;
    annualLeavePromotionEnabled: string;
    annualLeavePromotionThresholdDays: string;
    annualLeavePromotionLeadDays: string;
    annualLeavePromotionMessageTemplate: string;
  };
  booleanOptions: {
    enabled: string;
    disabled: string;
  };
  policyMeta: {
    statutory: string;
    custom: string;
    usage: (count: number) => string;
    updatedAt: (value: string) => string;
  };
};

const defaultFormState: LeavePolicyFormState = {
  annualGrantDays: "15",
  carryOverCapDays: "5",
  allowHalfDay: true,
  allowHourly: true,
  hourlyIncrementMinutes: "30",
  maxHoursPerRequest: "8",
  minNoticeDays: "0",
  maxConsecutiveDays: "",
  annualLeavePromotionEnabled: false,
  annualLeavePromotionThresholdDays: "5",
  annualLeavePromotionLeadDays: "30",
  annualLeavePromotionMessageTemplate: ""
};

function getCopy(locale: string): LeavePoliciesCopy {
  if (locale === "ko") {
    return {
      pageTitle: "휴가 정책 관리",
      pageSubtitle: "연차 부여, 이월 상한, 신청 제약, 연차 촉진 기준을 운영 화면에서 관리합니다.",
      reloadLabel: "새로고침",
      reloadLoadingLabel: "불러오는 중...",
      saveLabel: "정책 저장",
      saveLoadingLabel: "저장 중...",
      formTitle: "기본 휴가 정책",
      formDescription: "현재 조직의 기본 휴가 정책을 저장합니다. 값이 없던 조직도 이 화면에서 바로 정책을 만들 수 있습니다.",
      listTitle: "정책 목록",
      listDescription: "사용 중인 정책과 보관된 정책을 확인하고, 미사용 커스텀 정책은 보관 처리할 수 있습니다.",
      sourceDefault: "기본값",
      sourceConfigured: "저장된 정책",
      currentPolicyLabel: "현재 적용 정책",
      currentSourceLabel: "정책 소스",
      currentUpdatedAtLabel: "마지막 저장",
      currentUpdatedFallback: "아직 저장되지 않음",
      statusFilterLabel: "목록 필터",
      activeOption: "사용 중",
      archivedOption: "보관됨",
      archiveLabel: "보관",
      archiveConfirm: (name) => `정책 '${name}' 을(를) 보관할까요?`,
      archiveBlocked: "법정 정책이거나 사용 중인 정책은 보관할 수 없습니다.",
      noPolicies: "표시할 정책이 없습니다.",
      reloadFailed: "휴가 정책을 불러오지 못했습니다.",
      saveFailed: "휴가 정책 저장에 실패했습니다.",
      saveSuccess: "휴가 정책이 저장되었습니다.",
      archiveFailed: "휴가 정책 보관에 실패했습니다.",
      archiveSuccess: "휴가 정책을 보관했습니다.",
      invalidNumber: (field) => `${field} 값을 확인해 주세요.`,
      fields: {
        annualGrantDays: "연차 부여일",
        carryOverCapDays: "이월 상한일",
        allowHalfDay: "반차 허용",
        allowHourly: "시간 단위 허용",
        hourlyIncrementMinutes: "시간 단위(분)",
        maxHoursPerRequest: "1회 최대 시간",
        minNoticeDays: "사전 신청 최소 일수",
        maxConsecutiveDays: "연속 사용 상한(일)",
        annualLeavePromotionEnabled: "연차 촉진 사용",
        annualLeavePromotionThresholdDays: "연차 촉진 기준 잔여일",
        annualLeavePromotionLeadDays: "연차 촉진 리드 일수",
        annualLeavePromotionMessageTemplate: "연차 촉진 안내 문구"
      },
      booleanOptions: {
        enabled: "사용",
        disabled: "사용 안 함"
      },
      policyMeta: {
        statutory: "법정 정책",
        custom: "커스텀 정책",
        usage: (count) => `사용 중 ${count}건`,
        updatedAt: (value) => `수정 ${value}`
      }
    };
  }

  return {
    pageTitle: "Leave Policy Management",
    pageSubtitle: "Manage grant days, carry-over limits, request constraints, and annual leave promotion rules from the admin product surface.",
    reloadLabel: "Reload",
    reloadLoadingLabel: "Loading...",
    saveLabel: "Save policy",
    saveLoadingLabel: "Saving...",
    formTitle: "Default leave policy",
    formDescription: "Save the active organization leave policy. Organizations without a stored policy can create one directly from this page.",
    listTitle: "Policy list",
    listDescription: "Review active and archived policies, and archive unused custom policies from the product UI.",
    sourceDefault: "Default",
    sourceConfigured: "Configured",
    currentPolicyLabel: "Current policy",
    currentSourceLabel: "Source",
    currentUpdatedAtLabel: "Last saved",
    currentUpdatedFallback: "Not saved yet",
    statusFilterLabel: "List filter",
    activeOption: "Active",
    archivedOption: "Archived",
    archiveLabel: "Archive",
    archiveConfirm: (name) => `Archive policy '${name}'?`,
    archiveBlocked: "Statutory or in-use policies cannot be archived.",
    noPolicies: "No policies to show.",
    reloadFailed: "Failed to load leave policies.",
    saveFailed: "Failed to save leave policy.",
    saveSuccess: "Leave policy was saved.",
    archiveFailed: "Failed to archive leave policy.",
    archiveSuccess: "Leave policy was archived.",
    invalidNumber: (field) => `Please check the value for ${field}.`,
    fields: {
      annualGrantDays: "Annual grant days",
      carryOverCapDays: "Carry-over cap days",
      allowHalfDay: "Allow half-day",
      allowHourly: "Allow hourly requests",
      hourlyIncrementMinutes: "Hourly increment (minutes)",
      maxHoursPerRequest: "Max hours per request",
      minNoticeDays: "Minimum notice days",
      maxConsecutiveDays: "Max consecutive days",
      annualLeavePromotionEnabled: "Enable leave promotion",
      annualLeavePromotionThresholdDays: "Promotion threshold days",
      annualLeavePromotionLeadDays: "Promotion lead days",
      annualLeavePromotionMessageTemplate: "Promotion guidance message"
    },
    booleanOptions: {
      enabled: "Enabled",
      disabled: "Disabled"
    },
    policyMeta: {
      statutory: "Statutory",
      custom: "Custom",
      usage: (count) => `${count} active usages`,
      updatedAt: (value) => `Updated ${value}`
    }
  };
}

function toErrorMessage(body: unknown, fallback: string) {
  if (!body || typeof body !== "object") {
    return fallback;
  }

  const candidate = body as { error?: unknown; message?: unknown };
  if (typeof candidate.error === "string" && candidate.error.trim().length > 0) {
    return candidate.error.trim();
  }
  if (typeof candidate.message === "string" && candidate.message.trim().length > 0) {
    return candidate.message.trim();
  }
  return fallback;
}

function mapPolicyToForm(policy: LeavePolicyDetailsDto["policy"]): LeavePolicyFormState {
  return {
    annualGrantDays: String(policy.annualGrantDays),
    carryOverCapDays: String(policy.carryOverCapDays),
    allowHalfDay: policy.allowHalfDay,
    allowHourly: policy.allowHourly,
    hourlyIncrementMinutes: String(policy.hourlyIncrementMinutes),
    maxHoursPerRequest: String(policy.maxHoursPerRequest),
    minNoticeDays: String(policy.minNoticeDays),
    maxConsecutiveDays: policy.maxConsecutiveDays === null ? "" : String(policy.maxConsecutiveDays),
    annualLeavePromotionEnabled: policy.annualLeavePromotionEnabled,
    annualLeavePromotionThresholdDays: String(policy.annualLeavePromotionThresholdDays),
    annualLeavePromotionLeadDays: String(policy.annualLeavePromotionLeadDays),
    annualLeavePromotionMessageTemplate: policy.annualLeavePromotionMessageTemplate
  };
}

function parseNumberField(value: string, fieldLabel: string, copy: LeavePoliciesCopy) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(copy.invalidNumber(fieldLabel));
  }
  return parsed;
}

export default function AdminLeavePoliciesPage() {
  const { locale } = useI18n();
  const { loading: supabaseSessionLoading } = useSupabaseSession();
  const runtimeLocale = locale === "ko" ? "ko-KR" : "en-US";
  const copy = useMemo(() => getCopy(locale), [locale]);
  const [form, setForm] = useState<LeavePolicyFormState>(defaultFormState);
  const [policies, setPolicies] = useState<LeavePolicyListDto["policies"]>([]);
  const [policySource, setPolicySource] = useState<"configured" | "default">("default");
  const [policyUpdatedAt, setPolicyUpdatedAt] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<LeavePolicyStatus>("ACTIVE");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [archiveTargetId, setArchiveTargetId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const sourceHint =
    locale === "ko"
      ? "휴가 정책은 신청 가능 범위와 연차 촉진 자동화 기준을 함께 바꿉니다."
      : "Leave policy changes affect request limits and leave-promotion automation together.";
  const backToHubLabel = locale === "ko" ? "관리자 허브" : "Admin hub";
  const settingsLabel = locale === "ko" ? "조직 설정" : "Organization settings";

  const loadWorkspace = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [policyResult, listResult] = await Promise.all([
        performAdminApiCall({
          label: "Load leave policy",
          method: "GET",
          path: "/api/leave/policy",
          runtimeLocale
        }),
        performAdminApiCall({
          label: "List leave policies",
          method: "GET",
          path: `/api/leave/policies?status=${encodeURIComponent(statusFilter)}`,
          runtimeLocale
        })
      ]);

      if (!policyResult.response.ok) {
        throw new Error(toErrorMessage(policyResult.body, copy.reloadFailed));
      }
      if (!listResult.response.ok) {
        throw new Error(toErrorMessage(listResult.body, copy.reloadFailed));
      }

      const policyBody = policyResult.body as LeavePolicyDetailsDto;
      const listBody = listResult.body as LeavePolicyListDto;
      setForm(mapPolicyToForm(policyBody.policy));
      setPolicySource(policyBody.policy.source);
      setPolicyUpdatedAt(policyBody.policy.updatedAt);
      setPolicies(listBody.policies);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : String(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [copy.reloadFailed, runtimeLocale, statusFilter]);

  useEffect(() => {
    if (supabaseSessionLoading) {
      return;
    }
    void loadWorkspace();
  }, [loadWorkspace, supabaseSessionLoading]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setError(null);
    setNotice(null);

    try {
      const payload = {
        annualGrantDays: parseNumberField(form.annualGrantDays, copy.fields.annualGrantDays, copy),
        carryOverCapDays: parseNumberField(form.carryOverCapDays, copy.fields.carryOverCapDays, copy),
        allowHalfDay: form.allowHalfDay,
        allowHourly: form.allowHourly,
        hourlyIncrementMinutes: parseNumberField(
          form.hourlyIncrementMinutes,
          copy.fields.hourlyIncrementMinutes,
          copy
        ),
        maxHoursPerRequest: parseNumberField(form.maxHoursPerRequest, copy.fields.maxHoursPerRequest, copy),
        minNoticeDays: parseNumberField(form.minNoticeDays, copy.fields.minNoticeDays, copy),
        maxConsecutiveDays:
          form.maxConsecutiveDays.trim().length === 0
            ? null
            : parseNumberField(form.maxConsecutiveDays, copy.fields.maxConsecutiveDays, copy),
        annualLeavePromotionEnabled: form.annualLeavePromotionEnabled,
        annualLeavePromotionThresholdDays: parseNumberField(
          form.annualLeavePromotionThresholdDays,
          copy.fields.annualLeavePromotionThresholdDays,
          copy
        ),
        annualLeavePromotionLeadDays: parseNumberField(
          form.annualLeavePromotionLeadDays,
          copy.fields.annualLeavePromotionLeadDays,
          copy
        ),
        annualLeavePromotionMessageTemplate: form.annualLeavePromotionMessageTemplate.trim() || null
      };

      const result = await performAdminApiCall({
        label: "Save leave policy",
        method: "PUT",
        path: "/api/leave/policy",
        payload,
        runtimeLocale
      });

      if (!result.response.ok) {
        throw new Error(toErrorMessage(result.body, copy.saveFailed));
      }

      setNotice(copy.saveSuccess);
      await loadWorkspace();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : String(saveError));
    } finally {
      setIsSaving(false);
    }
  }, [copy, form, loadWorkspace, runtimeLocale]);

  const handleArchive = useCallback(
    async (policy: LeavePolicyListDto["policies"][number]) => {
      if (policy.isStatutory || policy.usageCount > 0) {
        setError(copy.archiveBlocked);
        setNotice(null);
        return;
      }
      if (!window.confirm(copy.archiveConfirm(policy.name))) {
        return;
      }

      setArchiveTargetId(policy.id);
      setError(null);
      setNotice(null);

      try {
        const result = await performAdminApiCall({
          label: "Archive leave policy",
          method: "DELETE",
          path: `/api/leave/policies/${encodeURIComponent(policy.id)}`,
          runtimeLocale
        });

        if (!result.response.ok) {
          throw new Error(toErrorMessage(result.body, copy.archiveFailed));
        }

        setNotice(copy.archiveSuccess);
        await loadWorkspace();
      } catch (archiveError) {
        setError(archiveError instanceof Error ? archiveError.message : String(archiveError));
      } finally {
        setArchiveTargetId(null);
      }
    },
    [copy, loadWorkspace, runtimeLocale]
  );

  if (supabaseSessionLoading) {
    return null;
  }

  return (
    <main className="saas-content workspace-shell admin-workspace-shell">
      <header className="page-header workspace-page-header">
        <div>
          <h1 className="page-title">{copy.pageTitle}</h1>
          <p className="page-subtitle">{copy.pageSubtitle}</p>
          <p className="small muted workspace-source-banner">{sourceHint}</p>
        </div>
        <div className="page-actions">
          <Link className="btn btn-secondary" href="/admin">
            {backToHubLabel}
          </Link>
          <Link className="btn btn-secondary" href="/admin/settings">
            {settingsLabel}
          </Link>
          <button className="btn btn-secondary" type="button" onClick={() => void loadWorkspace()} disabled={isLoading}>
            {isLoading ? copy.reloadLoadingLabel : copy.reloadLabel}
          </button>
        </div>
      </header>

      <section className="kpi-strip workspace-summary-strip" aria-label={copy.pageTitle}>
        <article className="kpi-card workspace-summary-card">
          <p>{copy.currentPolicyLabel}</p>
          <strong>{policySource === "configured" ? copy.sourceConfigured : copy.sourceDefault}</strong>
        </article>
        <article className="kpi-card workspace-summary-card">
          <p>{copy.activeOption}</p>
          <strong>{policies.filter((policy) => policy.status === "ACTIVE").length}</strong>
        </article>
        <article className="kpi-card workspace-summary-card">
          <p>{copy.archivedOption}</p>
          <strong>{policies.filter((policy) => policy.status === "ARCHIVED").length}</strong>
        </article>
      </section>

      {error ? <p className="small fail workspace-inline-status">{error}</p> : null}
      {notice ? <p className="small ok workspace-inline-status">{notice}</p> : null}

      <section className="panel-grid workspace-panel-grid">
        <article className="panel workspace-section-card workspace-toolbar-card">
          <h2>{copy.formTitle}</h2>
          <p className="small muted">{copy.formDescription}</p>
          <dl className="detail-grid">
            <div>
              <dt>{copy.currentPolicyLabel}</dt>
              <dd>{policySource === "configured" ? copy.sourceConfigured : copy.sourceDefault}</dd>
            </div>
            <div>
              <dt>{copy.currentSourceLabel}</dt>
              <dd>{policySource === "configured" ? copy.sourceConfigured : copy.sourceDefault}</dd>
            </div>
            <div>
              <dt>{copy.currentUpdatedAtLabel}</dt>
              <dd>{policyUpdatedAt ? new Date(policyUpdatedAt).toLocaleString(runtimeLocale) : copy.currentUpdatedFallback}</dd>
            </div>
          </dl>

          <div className="input-grid">
            <label>
              {copy.fields.annualGrantDays}
              <input
                type="number"
                min={1}
                value={form.annualGrantDays}
                onChange={(event) => setForm((prev) => ({ ...prev, annualGrantDays: event.target.value }))}
              />
            </label>

            <label>
              {copy.fields.carryOverCapDays}
              <input
                type="number"
                min={0}
                value={form.carryOverCapDays}
                onChange={(event) => setForm((prev) => ({ ...prev, carryOverCapDays: event.target.value }))}
              />
            </label>

            <label>
              {copy.fields.allowHalfDay}
              <select
                value={form.allowHalfDay ? "true" : "false"}
                onChange={(event) => setForm((prev) => ({ ...prev, allowHalfDay: event.target.value === "true" }))}
              >
                <option value="true">{copy.booleanOptions.enabled}</option>
                <option value="false">{copy.booleanOptions.disabled}</option>
              </select>
            </label>

            <label>
              {copy.fields.allowHourly}
              <select
                value={form.allowHourly ? "true" : "false"}
                onChange={(event) => setForm((prev) => ({ ...prev, allowHourly: event.target.value === "true" }))}
              >
                <option value="true">{copy.booleanOptions.enabled}</option>
                <option value="false">{copy.booleanOptions.disabled}</option>
              </select>
            </label>

            <label>
              {copy.fields.hourlyIncrementMinutes}
              <input
                type="number"
                min={15}
                step={15}
                value={form.hourlyIncrementMinutes}
                onChange={(event) => setForm((prev) => ({ ...prev, hourlyIncrementMinutes: event.target.value }))}
              />
            </label>

            <label>
              {copy.fields.maxHoursPerRequest}
              <input
                type="number"
                min={1}
                max={24}
                step={0.5}
                value={form.maxHoursPerRequest}
                onChange={(event) => setForm((prev) => ({ ...prev, maxHoursPerRequest: event.target.value }))}
              />
            </label>

            <label>
              {copy.fields.minNoticeDays}
              <input
                type="number"
                min={0}
                value={form.minNoticeDays}
                onChange={(event) => setForm((prev) => ({ ...prev, minNoticeDays: event.target.value }))}
              />
            </label>

            <label>
              {copy.fields.maxConsecutiveDays}
              <input
                type="number"
                min={0.5}
                step={0.5}
                value={form.maxConsecutiveDays}
                onChange={(event) => setForm((prev) => ({ ...prev, maxConsecutiveDays: event.target.value }))}
              />
            </label>

            <label>
              {copy.fields.annualLeavePromotionEnabled}
              <select
                value={form.annualLeavePromotionEnabled ? "true" : "false"}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, annualLeavePromotionEnabled: event.target.value === "true" }))
                }
              >
                <option value="true">{copy.booleanOptions.enabled}</option>
                <option value="false">{copy.booleanOptions.disabled}</option>
              </select>
            </label>

            <label>
              {copy.fields.annualLeavePromotionThresholdDays}
              <input
                type="number"
                min={0.5}
                step={0.5}
                value={form.annualLeavePromotionThresholdDays}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, annualLeavePromotionThresholdDays: event.target.value }))
                }
              />
            </label>

            <label>
              {copy.fields.annualLeavePromotionLeadDays}
              <input
                type="number"
                min={0}
                value={form.annualLeavePromotionLeadDays}
                onChange={(event) => setForm((prev) => ({ ...prev, annualLeavePromotionLeadDays: event.target.value }))}
              />
            </label>
          </div>

          <label>
            {copy.fields.annualLeavePromotionMessageTemplate}
            <textarea
              rows={5}
              value={form.annualLeavePromotionMessageTemplate}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, annualLeavePromotionMessageTemplate: event.target.value }))
              }
            />
          </label>

          <div className="panel-actions">
            <button className="btn btn-primary" type="button" onClick={() => void handleSave()} disabled={isSaving}>
              {isSaving ? copy.saveLoadingLabel : copy.saveLabel}
            </button>
          </div>
        </article>

        <article className="panel workspace-section-card workspace-note-card">
          <h2>{copy.listTitle}</h2>
          <p className="small muted">{copy.listDescription}</p>

          <label>
            {copy.statusFilterLabel}
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as LeavePolicyStatus)}>
              <option value="ACTIVE">{copy.activeOption}</option>
              <option value="ARCHIVED">{copy.archivedOption}</option>
            </select>
          </label>

          {policies.length > 0 ? (
            <ul className="simple-list">
              {policies.map((policy) => {
                const archiveDisabled = policy.isStatutory || policy.usageCount > 0 || archiveTargetId === policy.id;
                return (
                  <li key={policy.id}>
                    <div>
                      <strong>{policy.name}</strong>
                      <div className="small muted">
                        {policy.isStatutory ? copy.policyMeta.statutory : copy.policyMeta.custom}
                        {" · "}
                        {copy.policyMeta.usage(policy.usageCount)}
                        {" · "}
                        {copy.policyMeta.updatedAt(new Date(policy.updatedAt).toLocaleString(runtimeLocale))}
                      </div>
                    </div>
                    {statusFilter === "ACTIVE" ? (
                      <button
                        className="btn btn-secondary btn-small"
                        type="button"
                        disabled={archiveDisabled}
                        onClick={() => void handleArchive(policy)}
                      >
                        {copy.archiveLabel}
                      </button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="small muted">{copy.noPolicies}</p>
          )}
        </article>
      </section>
    </main>
  );
}
