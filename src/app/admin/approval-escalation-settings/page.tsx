"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { performAdminApiCall } from "@/app/admin/page-api-helpers";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useI18n } from "@/lib/i18n/provider";
import { formatNotificationChannelLabel, formatUserFacingErrorMessage } from "@/lib/product-language";

type ApprovalEscalationSettingsSnapshot = {
  policy: {
    stalledHoursMin: number;
    limit: number;
    notificationChannel: string;
  };
};

type ApprovalEscalationSettingsDto = ApprovalEscalationSettingsSnapshot & {
  organizationId: string;
  updatedAt: string;
};

type ApprovalEscalationSettingsCopy = {
  pageTitle: string;
  pageSubtitle: string;
  reloadLabel: string;
  reloadLoadingLabel: string;
  saveLabel: string;
  saveLoadingLabel: string;
  loadFailed: string;
  saveFailed: string;
  saveSuccess: string;
  policyTitle: string;
  policyDescription: string;
  statusTitle: string;
  statusDescription: string;
  stalledLabel: string;
  limitLabel: string;
  channelLabel: string;
  channelHint: string;
  lastSavedLabel: string;
  noSaveHistory: string;
  sourceHint: string;
  backToHubLabel: string;
  settingsLabel: string;
};

const DEFAULT_FORM: ApprovalEscalationSettingsSnapshot = {
  policy: {
    stalledHoursMin: 24,
    limit: 50,
    notificationChannel: "approval-stalled-queue"
  }
};

function getCopy(locale: string): ApprovalEscalationSettingsCopy {
  if (locale === "ko") {
    return {
      pageTitle: "결재 에스컬레이션 설정",
      pageSubtitle: "정체 결재 에스컬레이션의 기본 시간, 최대 건수, 알림 채널을 조직 단위로 관리합니다.",
      reloadLabel: "새로고침",
      reloadLoadingLabel: "불러오는 중...",
      saveLabel: "설정 저장",
      saveLoadingLabel: "저장 중...",
      loadFailed: "결재 에스컬레이션 설정을 불러오지 못했습니다.",
      saveFailed: "결재 에스컬레이션 설정을 저장하지 못했습니다.",
      saveSuccess: "결재 에스컬레이션 설정을 저장했습니다.",
      policyTitle: "기본 정책",
      policyDescription: "이 값은 결재 실행 현황과 정체 에스컬레이션 API의 조직 기본값으로 사용됩니다.",
      statusTitle: "현재 상태",
      statusDescription: "현재 조직에 저장된 기본 에스컬레이션 정책을 확인합니다.",
      stalledLabel: "정체 기준(시간)",
      limitLabel: "최대 처리 건수",
      channelLabel: "알림 채널",
      channelHint: "알림 채널은 운영 메시지와 감사 기록에 함께 남습니다.",
      lastSavedLabel: "마지막 저장",
      noSaveHistory: "저장 이력 없음",
      sourceHint: "에스컬레이션 정책은 결재 실행 큐와 운영 알림 흐름의 기본 동작을 즉시 바꿉니다.",
      backToHubLabel: "관리자 허브",
      settingsLabel: "조직 설정"
    };
  }

  return {
    pageTitle: "Approval Escalation Settings",
    pageSubtitle: "Manage the organization defaults used for stalled approval execution escalation.",
    reloadLabel: "Reload",
    reloadLoadingLabel: "Loading...",
    saveLabel: "Save settings",
    saveLoadingLabel: "Saving...",
    loadFailed: "Failed to load approval escalation settings.",
    saveFailed: "Failed to save approval escalation settings.",
    saveSuccess: "Approval escalation settings were saved.",
    policyTitle: "Default policy",
    policyDescription: "These values are used as the default stalled escalation policy in the approval execution queue and API.",
    statusTitle: "Current status",
    statusDescription: "Review the stored default escalation policy for this organization.",
    stalledLabel: "Stalled threshold (hours)",
    limitLabel: "Execution batch limit",
    channelLabel: "Notification channel",
    channelHint: "The notification channel is included in operator messages and audit payloads.",
    lastSavedLabel: "Last saved",
    noSaveHistory: "No save history",
    sourceHint: "Escalation policy directly affects approval queue automation and operator alerting.",
    backToHubLabel: "Admin hub",
    settingsLabel: "Organization settings"
  };
}

function formatLocalizedDateTime(value: string | null, runtimeLocale: string, emptyLabel: string) {
  if (!value) {
    return emptyLabel;
  }
  return new Intl.DateTimeFormat(runtimeLocale, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default function AdminApprovalEscalationSettingsPage() {
  const { locale } = useI18n();
  const runtimeLocale = locale === "ko" ? "ko-KR" : "en-US";
  const copy = useMemo(() => getCopy(locale), [locale]);
  const { loading: sessionLoading, error: sessionError } = useSupabaseSession();

  const [form, setForm] = useState<ApprovalEscalationSettingsSnapshot>(DEFAULT_FORM);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadWorkspace = useCallback(async () => {
    setWorkspaceLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await performAdminApiCall({
        label: "Load approval escalation settings",
        method: "GET",
        path: "/api/admin/approval-escalation-settings",
        runtimeLocale
      });
      if (!result.response.ok) {
        throw new Error(copy.loadFailed);
      }

      const payload = result.body as ApprovalEscalationSettingsDto;
      setForm({ policy: payload.policy });
      setLastSavedAt(payload.updatedAt);
    } catch (error) {
      const message = error instanceof Error ? error.message : copy.loadFailed;
      setErrorMessage(formatUserFacingErrorMessage(message, runtimeLocale));
    } finally {
      setWorkspaceLoading(false);
    }
  }, [copy.loadFailed, runtimeLocale]);

  useEffect(() => {
    if (sessionLoading) {
      return;
    }
    void loadWorkspace();
  }, [loadWorkspace, sessionLoading]);

  async function handleSave() {
    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await performAdminApiCall({
        label: "Save approval escalation settings",
        method: "PUT",
        path: "/api/admin/approval-escalation-settings",
        payload: form,
        runtimeLocale
      });
      if (!result.response.ok) {
        throw new Error(copy.saveFailed);
      }

      const payload = result.body as ApprovalEscalationSettingsDto;
      setForm({ policy: payload.policy });
      setLastSavedAt(payload.updatedAt);
      setSuccessMessage(copy.saveSuccess);
    } catch (error) {
      const message = error instanceof Error ? error.message : copy.saveFailed;
      setErrorMessage(formatUserFacingErrorMessage(message, runtimeLocale));
    } finally {
      setSaving(false);
    }
  }

  if (sessionLoading) {
    return null;
  }

  return (
    <main className="saas-content workspace-shell admin-workspace-shell">
      <header className="page-header workspace-page-header">
        <div>
          <h1 className="page-title">{copy.pageTitle}</h1>
          <p className="page-subtitle">{copy.pageSubtitle}</p>
          <p className="small muted workspace-source-banner">{copy.sourceHint}</p>
        </div>
        <div className="page-actions">
          <Link className="btn btn-secondary" href="/admin">
            {copy.backToHubLabel}
          </Link>
          <Link className="btn btn-secondary" href="/admin/settings">
            {copy.settingsLabel}
          </Link>
          <button className="btn btn-secondary" type="button" onClick={() => void loadWorkspace()} disabled={workspaceLoading || saving}>
            {workspaceLoading ? copy.reloadLoadingLabel : copy.reloadLabel}
          </button>
        </div>
      </header>

      <section className="kpi-strip workspace-summary-strip" aria-label={copy.pageTitle}>
        <article className="kpi-card workspace-summary-card">
          <p>{copy.stalledLabel}</p>
          <strong>{form.policy.stalledHoursMin}h</strong>
        </article>
        <article className="kpi-card workspace-summary-card">
          <p>{copy.limitLabel}</p>
          <strong>{form.policy.limit}</strong>
        </article>
        <article className="kpi-card workspace-summary-card">
          <p>{copy.lastSavedLabel}</p>
          <strong>{formatLocalizedDateTime(lastSavedAt, runtimeLocale, copy.noSaveHistory)}</strong>
        </article>
      </section>

      {sessionError ? (
        <p className="small fail workspace-inline-status">{formatUserFacingErrorMessage(sessionError, runtimeLocale)}</p>
      ) : null}
      {errorMessage ? <p className="small fail workspace-inline-status">{errorMessage}</p> : null}
      {successMessage ? <p className="small ok workspace-inline-status">{successMessage}</p> : null}

      <section className="panel-grid workspace-panel-grid">
        <article className="panel workspace-section-card workspace-toolbar-card">
          <div className="section-heading">
            <div>
              <h2>{copy.policyTitle}</h2>
              <p className="small muted">{copy.policyDescription}</p>
            </div>
          </div>

          <div className="form-grid">
            <label className="stack gap-8">
              <span>{copy.stalledLabel}</span>
              <input
                type="number"
                min={1}
                max={24 * 365}
                value={form.policy.stalledHoursMin}
                onChange={(event) =>
                  setForm((current) => ({
                    policy: {
                      ...current.policy,
                      stalledHoursMin: Number(event.target.value || "0")
                    }
                  }))
                }
              />
            </label>
            <label className="stack gap-8">
              <span>{copy.limitLabel}</span>
              <input
                type="number"
                min={1}
                max={500}
                value={form.policy.limit}
                onChange={(event) =>
                  setForm((current) => ({
                    policy: {
                      ...current.policy,
                      limit: Number(event.target.value || "0")
                    }
                  }))
                }
              />
            </label>
            <label className="stack gap-8">
              <span>{copy.channelLabel}</span>
              <input
                value={form.policy.notificationChannel}
                onChange={(event) =>
                  setForm((current) => ({
                    policy: {
                      ...current.policy,
                      notificationChannel: event.target.value
                    }
                  }))
                }
                placeholder={formatNotificationChannelLabel("approval-stalled-queue", runtimeLocale)}
              />
            </label>
          </div>

          <p className="small muted">{copy.channelHint}</p>

          <div className="panel-actions">
            <button className="btn btn-primary" type="button" onClick={() => void handleSave()} disabled={saving}>
              {saving ? copy.saveLoadingLabel : copy.saveLabel}
            </button>
          </div>
        </article>

        <article className="panel workspace-section-card workspace-note-card">
          <div className="section-heading">
            <div>
              <h2>{copy.statusTitle}</h2>
              <p className="small muted">{copy.statusDescription}</p>
            </div>
          </div>

          <dl className="definition-grid">
            <div>
              <dt>{copy.stalledLabel}</dt>
              <dd>{form.policy.stalledHoursMin}h</dd>
            </div>
            <div>
              <dt>{copy.limitLabel}</dt>
              <dd>{form.policy.limit}</dd>
            </div>
            <div>
              <dt>{copy.channelLabel}</dt>
              <dd>{formatNotificationChannelLabel(form.policy.notificationChannel, runtimeLocale)}</dd>
            </div>
            <div>
              <dt>{copy.lastSavedLabel}</dt>
              <dd>{formatLocalizedDateTime(lastSavedAt, runtimeLocale, copy.noSaveHistory)}</dd>
            </div>
          </dl>
        </article>
      </section>
    </main>
  );
}
