"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { performAdminApiCall } from "@/app/admin/page-api-helpers";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useI18n } from "@/lib/i18n/provider";
import { formatUserFacingErrorMessage } from "@/lib/product-language";

type LeavePromotionEmailSnapshot = {
  emailTemplate: {
    url: string | null;
    from: string | null;
    defaultTemplateId: string | null;
    tokenConfigured: boolean;
  };
};

type LeavePromotionEmailUpdatePayload = {
  emailTemplate: {
    url: string | null;
    from: string | null;
    defaultTemplateId: string | null;
    token: string | null;
    clearToken: boolean;
  };
};

type LeavePromotionEmailDto = LeavePromotionEmailSnapshot & {
  organizationId: string;
  updatedAt: string;
};

type LeavePromotionEmailCopy = {
  pageTitle: string;
  pageSubtitle: string;
  reloadLabel: string;
  reloadLoadingLabel: string;
  saveLabel: string;
  saveLoadingLabel: string;
  loadFailed: string;
  saveFailed: string;
  saveSuccess: string;
  settingsTitle: string;
  settingsDescription: string;
  statusTitle: string;
  statusDescription: string;
  urlLabel: string;
  urlPlaceholder: string;
  fromLabel: string;
  fromPlaceholder: string;
  templateIdLabel: string;
  templateIdPlaceholder: string;
  tokenLabel: string;
  tokenPlaceholder: string;
  clearTokenLabel: string;
  clearTokenHint: string;
  tokenConfiguredLabel: string;
  configuredLabel: string;
  unconfiguredLabel: string;
  endpointConfiguredLabel: string;
  templateConfiguredLabel: string;
  lastSavedLabel: string;
  noSaveHistory: string;
  envFallbackHint: string;
  secretHint: string;
};

const DEFAULT_FORM: LeavePromotionEmailUpdatePayload = {
  emailTemplate: {
    url: null,
    from: null,
    defaultTemplateId: null,
    token: null,
    clearToken: false
  }
};

function getCopy(locale: string): LeavePromotionEmailCopy {
  if (locale === "ko") {
    return {
      pageTitle: "연차 촉진 이메일 설정",
      pageSubtitle:
        "연차 촉진 공지의 이메일 템플릿 채널 설정을 조직 단위로 관리합니다.",
      reloadLabel: "새로고침",
      reloadLoadingLabel: "불러오는 중...",
      saveLabel: "설정 저장",
      saveLoadingLabel: "저장 중...",
      loadFailed: "연차 촉진 이메일 설정을 불러오지 못했습니다.",
      saveFailed: "연차 촉진 이메일 설정을 저장하지 못했습니다.",
      saveSuccess: "연차 촉진 이메일 설정을 저장했습니다.",
      settingsTitle: "이메일 템플릿 설정",
      settingsDescription:
        "여기서 저장한 URL, 발신 주소, 기본 템플릿 ID는 연차 촉진 발송과 재시도에 기본값으로 사용됩니다.",
      statusTitle: "현재 상태",
      statusDescription:
        "조직에 저장된 연차 촉진 이메일 채널 구성을 확인합니다.",
      urlLabel: "템플릿 호출 URL",
      urlPlaceholder: "https://example.com/email-template",
      fromLabel: "발신 주소",
      fromPlaceholder: "hr@example.com",
      templateIdLabel: "기본 템플릿 ID",
      templateIdPlaceholder: "leave-promotion-default",
      tokenLabel: "템플릿 인증 토큰",
      tokenPlaceholder: "변경할 때만 새 토큰 입력",
      clearTokenLabel: "저장된 토큰 삭제",
      clearTokenHint: "토큰 입력 없이 저장하면 기존 토큰을 유지합니다.",
      tokenConfiguredLabel: "토큰 저장 상태",
      configuredLabel: "설정됨",
      unconfiguredLabel: "미설정",
      endpointConfiguredLabel: "발송 엔드포인트",
      templateConfiguredLabel: "기본 템플릿 ID",
      lastSavedLabel: "마지막 저장",
      noSaveHistory: "저장 이력 없음",
      envFallbackHint:
        "조직 설정이 비어 있으면 기존 서버 환경변수 fallback이 계속 사용됩니다.",
      secretHint:
        "보안상 저장된 토큰 값은 다시 표시되지 않습니다. 새 값을 입력하면 교체됩니다."
    };
  }

  return {
    pageTitle: "Leave Promotion Email Settings",
    pageSubtitle:
      "Manage the organization-level email template configuration used by leave promotion notice delivery.",
    reloadLabel: "Reload",
    reloadLoadingLabel: "Loading...",
    saveLabel: "Save settings",
    saveLoadingLabel: "Saving...",
    loadFailed: "Failed to load leave promotion email settings.",
    saveFailed: "Failed to save leave promotion email settings.",
    saveSuccess: "Leave promotion email settings were saved.",
    settingsTitle: "Email template configuration",
    settingsDescription:
      "The URL, sender, and default template ID saved here are used as organization defaults for leave promotion dispatch and retry.",
    statusTitle: "Current status",
    statusDescription:
      "Review the saved organization configuration for the leave promotion email channel.",
    urlLabel: "Template endpoint URL",
    urlPlaceholder: "https://example.com/email-template",
    fromLabel: "From address",
    fromPlaceholder: "hr@example.com",
    templateIdLabel: "Default template ID",
    templateIdPlaceholder: "leave-promotion-default",
    tokenLabel: "Template auth token",
    tokenPlaceholder: "Enter a new token only when rotating it",
    clearTokenLabel: "Clear saved token",
    clearTokenHint: "Saving without a new token keeps the current saved token.",
    tokenConfiguredLabel: "Saved token status",
    configuredLabel: "Configured",
    unconfiguredLabel: "Not configured",
    endpointConfiguredLabel: "Delivery endpoint",
    templateConfiguredLabel: "Default template ID",
    lastSavedLabel: "Last saved",
    noSaveHistory: "No save history",
    envFallbackHint:
      "If the organization settings are left blank, the existing server environment fallback still applies.",
    secretHint:
      "For security, the stored token value is never shown again. Entering a new token replaces it."
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

export default function AdminLeavePromotionEmailPage() {
  const { locale } = useI18n();
  const runtimeLocale = locale === "ko" ? "ko-KR" : "en-US";
  const copy = useMemo(() => getCopy(locale), [locale]);
  const { loading: sessionLoading, error: sessionError } = useSupabaseSession();

  const [form, setForm] = useState<LeavePromotionEmailUpdatePayload>(DEFAULT_FORM);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [tokenConfigured, setTokenConfigured] = useState(false);
  const [workspaceLoading, setWorkspaceLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const endpointConfigured = useMemo(() => {
    const url = form.emailTemplate.url?.trim() ?? "";
    const from = form.emailTemplate.from?.trim() ?? "";
    return url.length > 0 && from.length > 0;
  }, [form]);

  const templateConfigured = useMemo(() => {
    return (form.emailTemplate.defaultTemplateId?.trim() ?? "").length > 0;
  }, [form]);

  const loadWorkspace = useCallback(async () => {
    setWorkspaceLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await performAdminApiCall({
        label: "Load leave promotion email settings",
        method: "GET",
        path: "/api/admin/leave-promotion-email-settings",
        runtimeLocale
      });
      if (!result.response.ok) {
        throw new Error(copy.loadFailed);
      }

      const payload = result.body as LeavePromotionEmailDto;
      setForm({
        emailTemplate: {
          url: payload.emailTemplate.url,
          from: payload.emailTemplate.from,
          defaultTemplateId: payload.emailTemplate.defaultTemplateId,
          token: null,
          clearToken: false
        }
      });
      setTokenConfigured(payload.emailTemplate.tokenConfigured);
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
      const payload: LeavePromotionEmailUpdatePayload = {
        emailTemplate: {
          url: form.emailTemplate.url?.trim() || null,
          from: form.emailTemplate.from?.trim() || null,
          defaultTemplateId: form.emailTemplate.defaultTemplateId?.trim() || null,
          token: form.emailTemplate.token?.trim() || null,
          clearToken: form.emailTemplate.clearToken
        }
      };

      const result = await performAdminApiCall({
        label: "Save leave promotion email settings",
        method: "PUT",
        path: "/api/admin/leave-promotion-email-settings",
        payload,
        runtimeLocale
      });
      if (!result.response.ok) {
        throw new Error(copy.saveFailed);
      }

      const saved = result.body as LeavePromotionEmailDto;
      setForm({
        emailTemplate: {
          url: saved.emailTemplate.url,
          from: saved.emailTemplate.from,
          defaultTemplateId: saved.emailTemplate.defaultTemplateId,
          token: null,
          clearToken: false
        }
      });
      setTokenConfigured(saved.emailTemplate.tokenConfigured);
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
          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => void loadWorkspace()}
            disabled={workspaceLoading}
          >
            {workspaceLoading ? copy.reloadLoadingLabel : copy.reloadLabel}
          </button>
        </div>
      </header>

      {sessionError ? <p className="small fail">{formatUserFacingErrorMessage(sessionError, runtimeLocale)}</p> : null}
      {errorMessage ? <p className="small fail">{errorMessage}</p> : null}
      {successMessage ? <p className="small ok">{successMessage}</p> : null}

      <section className="panel-grid">
        <article className="panel">
          <h2>{copy.settingsTitle}</h2>
          <p className="small muted">{copy.settingsDescription}</p>

          <div className="input-grid">
            <label>
              {copy.urlLabel}
              <input
                type="url"
                placeholder={copy.urlPlaceholder}
                value={form.emailTemplate.url ?? ""}
                onChange={(event) =>
                  setForm((current) => ({
                    emailTemplate: {
                      ...current.emailTemplate,
                      url: event.target.value
                    }
                  }))
                }
              />
            </label>

            <label>
              {copy.fromLabel}
              <input
                type="email"
                placeholder={copy.fromPlaceholder}
                value={form.emailTemplate.from ?? ""}
                onChange={(event) =>
                  setForm((current) => ({
                    emailTemplate: {
                      ...current.emailTemplate,
                      from: event.target.value
                    }
                  }))
                }
              />
            </label>

            <label>
              {copy.templateIdLabel}
              <input
                type="text"
                placeholder={copy.templateIdPlaceholder}
                value={form.emailTemplate.defaultTemplateId ?? ""}
                onChange={(event) =>
                  setForm((current) => ({
                    emailTemplate: {
                      ...current.emailTemplate,
                      defaultTemplateId: event.target.value
                    }
                  }))
                }
              />
            </label>

            <label>
              {copy.tokenLabel}
              <input
                type="password"
                placeholder={copy.tokenPlaceholder}
                value={form.emailTemplate.token ?? ""}
                onChange={(event) =>
                  setForm((current) => ({
                    emailTemplate: {
                      ...current.emailTemplate,
                      token: event.target.value,
                      clearToken: false
                    }
                  }))
                }
              />
            </label>
          </div>

          <label className="small">
            <input
              type="checkbox"
              checked={form.emailTemplate.clearToken}
              onChange={(event) =>
                setForm((current) => ({
                  emailTemplate: {
                    ...current.emailTemplate,
                    clearToken: event.target.checked,
                    token: event.target.checked ? null : current.emailTemplate.token
                  }
                }))
              }
            />
            {" "}
            {copy.clearTokenLabel}
          </label>

          <p className="small muted">{copy.clearTokenHint}</p>
          <p className="small muted">{copy.secretHint}</p>
          <p className="small muted">{copy.envFallbackHint}</p>

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
              <span>{copy.endpointConfiguredLabel}</span>
              <strong>{endpointConfigured ? copy.configuredLabel : copy.unconfiguredLabel}</strong>
            </li>
            <li>
              <span>{copy.templateConfiguredLabel}</span>
              <strong>{templateConfigured ? copy.configuredLabel : copy.unconfiguredLabel}</strong>
            </li>
            <li>
              <span>{copy.tokenConfiguredLabel}</span>
              <strong>{tokenConfigured ? copy.configuredLabel : copy.unconfiguredLabel}</strong>
            </li>
            <li>
              <span>{copy.lastSavedLabel}</span>
              <strong>{formatLocalizedDateTime(lastSavedAt, runtimeLocale, copy.noSaveHistory)}</strong>
            </li>
          </ul>
        </article>
      </section>
    </main>
  );
}
