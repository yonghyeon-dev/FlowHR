"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { performAdminApiCall } from "@/app/admin/page-api-helpers";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useI18n } from "@/lib/i18n/provider";
import { formatUserFacingErrorMessage } from "@/lib/product-language";

type WebhookProvider = "discord" | "slack";

type OperatorAlertsSnapshot = {
  fallbackWebhook: {
    url: string | null;
    provider: WebhookProvider | null;
  };
  flows: {
    approvalEscalation: boolean;
    leavePromotion: boolean;
  };
};

type OperatorAlertsDto = OperatorAlertsSnapshot & {
  organizationId: string;
  updatedAt: string;
};

type OperatorAlertsCopy = {
  pageTitle: string;
  pageSubtitle: string;
  reloadLabel: string;
  reloadLoadingLabel: string;
  saveLabel: string;
  saveLoadingLabel: string;
  loadFailed: string;
  saveFailed: string;
  saveSuccess: string;
  configTitle: string;
  configDescription: string;
  statusTitle: string;
  statusDescription: string;
  urlLabel: string;
  urlPlaceholder: string;
  providerLabel: string;
  providerPlaceholder: string;
  approvalLabel: string;
  leavePromotionLabel: string;
  enabledLabel: string;
  disabledLabel: string;
  webhookStatusLabel: string;
  configuredLabel: string;
  unconfiguredLabel: string;
  lastSavedLabel: string;
  noSaveHistory: string;
  activeFlowCountLabel: string;
  fallbackHint: string;
  envFallbackHint: string;
  providerOptions: {
    discord: string;
    slack: string;
  };
};

const DEFAULT_FORM: OperatorAlertsSnapshot = {
  fallbackWebhook: {
    url: null,
    provider: null
  },
  flows: {
    approvalEscalation: true,
    leavePromotion: true
  }
};

function getCopy(locale: string): OperatorAlertsCopy {
  if (locale === "ko") {
    return {
      pageTitle: "운영 알림 연동",
      pageSubtitle: "결재 에스컬레이션과 연차 촉진 알림에 사용할 조직 기본 웹훅을 관리합니다.",
      reloadLabel: "새로고침",
      reloadLoadingLabel: "불러오는 중...",
      saveLabel: "연동 저장",
      saveLoadingLabel: "저장 중...",
      loadFailed: "운영 알림 연동 설정을 불러오지 못했습니다.",
      saveFailed: "운영 알림 연동 설정을 저장하지 못했습니다.",
      saveSuccess: "운영 알림 연동 설정을 저장했습니다.",
      configTitle: "조직 기본 웹훅",
      configDescription: "여기에 입력한 웹훅은 선택한 운영 플로우에서 조직 기본 알림 채널로 사용됩니다.",
      statusTitle: "적용 상태",
      statusDescription: "현재 조직에서 어떤 운영 플로우가 기본 웹훅을 사용하도록 열려 있는지 확인합니다.",
      urlLabel: "웹훅 URL",
      urlPlaceholder: "https://hooks.slack.com/... 또는 https://discord.com/api/webhooks/...",
      providerLabel: "웹훅 채널",
      providerPlaceholder: "채널 선택",
      approvalLabel: "결재 에스컬레이션에 조직 기본 웹훅 사용",
      leavePromotionLabel: "연차 촉진 알림에 조직 기본 웹훅 사용",
      enabledLabel: "사용",
      disabledLabel: "사용 안 함",
      webhookStatusLabel: "기본 웹훅 상태",
      configuredLabel: "구성됨",
      unconfiguredLabel: "미구성",
      lastSavedLabel: "마지막 저장",
      noSaveHistory: "저장 이력 없음",
      activeFlowCountLabel: "기본 웹훅 사용 플로우 수",
      fallbackHint: "웹훅 URL을 비우면 조직 기본 웹훅은 저장되지 않습니다.",
      envFallbackHint: "조직 기본 웹훅이 비어 있으면 현재 서버 환경 설정이 계속 사용됩니다.",
      providerOptions: {
        discord: "디스코드",
        slack: "슬랙"
      }
    };
  }

  return {
    pageTitle: "Operator Alert Integrations",
    pageSubtitle: "Manage the organization-level fallback webhook used by approval escalation and leave promotion alerts.",
    reloadLabel: "Reload",
    reloadLoadingLabel: "Loading...",
    saveLabel: "Save integrations",
    saveLoadingLabel: "Saving...",
    loadFailed: "Failed to load operator alert integrations.",
    saveFailed: "Failed to save operator alert integrations.",
    saveSuccess: "Operator alert integrations were saved.",
    configTitle: "Organization fallback webhook",
    configDescription: "The webhook entered here is used as the organization fallback alert channel for the enabled operator flows.",
    statusTitle: "Current status",
    statusDescription: "Review which flows are currently allowed to use the organization fallback webhook.",
    urlLabel: "Webhook URL",
    urlPlaceholder: "https://hooks.slack.com/... or https://discord.com/api/webhooks/...",
    providerLabel: "Webhook provider",
    providerPlaceholder: "Select provider",
    approvalLabel: "Use organization fallback webhook for approval escalation",
    leavePromotionLabel: "Use organization fallback webhook for leave promotion alerts",
    enabledLabel: "Enabled",
    disabledLabel: "Disabled",
    webhookStatusLabel: "Fallback webhook status",
    configuredLabel: "Configured",
    unconfiguredLabel: "Not configured",
    lastSavedLabel: "Last saved",
    noSaveHistory: "No save history",
    activeFlowCountLabel: "Flows using fallback webhook",
    fallbackHint: "Leaving the webhook URL blank means no organization fallback webhook is stored.",
    envFallbackHint: "If the organization fallback webhook is blank, the existing server environment configuration still applies.",
    providerOptions: {
      discord: "Discord",
      slack: "Slack"
    }
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

export default function AdminOperatorAlertsPage() {
  const { locale } = useI18n();
  const runtimeLocale = locale === "ko" ? "ko-KR" : "en-US";
  const copy = useMemo(() => getCopy(locale), [locale]);
  const { loading: sessionLoading, error: sessionError } = useSupabaseSession();

  const [form, setForm] = useState<OperatorAlertsSnapshot>(DEFAULT_FORM);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const activeFlowCount = useMemo(() => {
    return [form.flows.approvalEscalation, form.flows.leavePromotion].filter(Boolean).length;
  }, [form]);

  const loadWorkspace = useCallback(async () => {
    setWorkspaceLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await performAdminApiCall({
        label: "Load operator alert integrations",
        method: "GET",
        path: "/api/admin/operator-alerts",
        runtimeLocale
      });
      if (!result.response.ok) {
        throw new Error(copy.loadFailed);
      }

      const payload = result.body as OperatorAlertsDto;
      setForm({
        fallbackWebhook: payload.fallbackWebhook,
        flows: payload.flows
      });
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
      const trimmedUrl = form.fallbackWebhook.url?.trim() ?? "";
      const payload: OperatorAlertsSnapshot = {
        fallbackWebhook: {
          url: trimmedUrl.length > 0 ? trimmedUrl : null,
          provider: trimmedUrl.length > 0 ? form.fallbackWebhook.provider : null
        },
        flows: form.flows
      };

      const result = await performAdminApiCall({
        label: "Save operator alert integrations",
        method: "PUT",
        path: "/api/admin/operator-alerts",
        payload,
        runtimeLocale
      });
      if (!result.response.ok) {
        throw new Error(copy.saveFailed);
      }

      const saved = result.body as OperatorAlertsDto;
      setForm({
        fallbackWebhook: saved.fallbackWebhook,
        flows: saved.flows
      });
      setLastSavedAt(saved.updatedAt);
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
    <main className="saas-content">
      <header className="page-header">
        <div>
          <h1 className="page-title">{copy.pageTitle}</h1>
          <p className="page-subtitle">{copy.pageSubtitle}</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" type="button" onClick={() => void loadWorkspace()} disabled={workspaceLoading}>
            {workspaceLoading ? copy.reloadLoadingLabel : copy.reloadLabel}
          </button>
        </div>
      </header>

      {sessionError ? <p className="small fail">{formatUserFacingErrorMessage(sessionError, runtimeLocale)}</p> : null}
      {errorMessage ? <p className="small fail">{errorMessage}</p> : null}
      {successMessage ? <p className="small ok">{successMessage}</p> : null}

      <section className="panel-grid">
        <article className="panel">
          <h2>{copy.configTitle}</h2>
          <p className="small muted">{copy.configDescription}</p>

          <div className="input-grid">
            <label>
              {copy.urlLabel}
              <input
                type="url"
                placeholder={copy.urlPlaceholder}
                value={form.fallbackWebhook.url ?? ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    fallbackWebhook: {
                      ...current.fallbackWebhook,
                      url: event.target.value
                    }
                  }))
                }
              />
            </label>

            <label>
              {copy.providerLabel}
              <select
                value={form.fallbackWebhook.provider ?? ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    fallbackWebhook: {
                      ...current.fallbackWebhook,
                      provider:
                        event.target.value === "discord" || event.target.value === "slack"
                          ? (event.target.value as WebhookProvider)
                          : null
                    }
                  }))
                }
              >
                <option value="">{copy.providerPlaceholder}</option>
                <option value="discord">{copy.providerOptions.discord}</option>
                <option value="slack">{copy.providerOptions.slack}</option>
              </select>
            </label>

            <label>
              <span>{copy.approvalLabel}</span>
              <button
                type="button"
                className={`btn ${form.flows.approvalEscalation ? "btn-primary" : "btn-secondary"}`}
                aria-pressed={form.flows.approvalEscalation}
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    flows: {
                      ...current.flows,
                      approvalEscalation: !current.flows.approvalEscalation
                    }
                  }))
                }
              >
                {form.flows.approvalEscalation ? copy.enabledLabel : copy.disabledLabel}
              </button>
            </label>

            <label>
              <span>{copy.leavePromotionLabel}</span>
              <button
                type="button"
                className={`btn ${form.flows.leavePromotion ? "btn-primary" : "btn-secondary"}`}
                aria-pressed={form.flows.leavePromotion}
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    flows: {
                      ...current.flows,
                      leavePromotion: !current.flows.leavePromotion
                    }
                  }))
                }
              >
                {form.flows.leavePromotion ? copy.enabledLabel : copy.disabledLabel}
              </button>
            </label>
          </div>

          <ul className="simple-list">
            <li>{copy.fallbackHint}</li>
            <li>{copy.envFallbackHint}</li>
          </ul>

          <div className="panel-actions">
            <button className="btn btn-primary" type="button" onClick={() => void handleSave()} disabled={saving}>
              {saving ? copy.saveLoadingLabel : copy.saveLabel}
            </button>
          </div>
        </article>

        <article className="panel">
          <h2>{copy.statusTitle}</h2>
          <p className="small muted">{copy.statusDescription}</p>
          <ul className="simple-list">
            <li>
              {copy.webhookStatusLabel}: {form.fallbackWebhook.url ? copy.configuredLabel : copy.unconfiguredLabel}
            </li>
            <li>
              {copy.activeFlowCountLabel}: {activeFlowCount}
            </li>
            <li>
              {copy.lastSavedLabel}: {formatLocalizedDateTime(lastSavedAt, runtimeLocale, copy.noSaveHistory)}
            </li>
          </ul>
        </article>
      </section>
    </main>
  );
}
