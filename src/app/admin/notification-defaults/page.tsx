"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { performAdminApiCall } from "@/app/admin/page-api-helpers";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useI18n } from "@/lib/i18n/provider";
import { formatUserFacingErrorMessage } from "@/lib/product-language";

type NotificationPreferenceSnapshot = {
  channels: {
    email: boolean;
    inApp: boolean;
  };
  categories: {
    leave: boolean;
    attendance: boolean;
    payroll: boolean;
  };
};

type AdminNotificationDefaultsDto = NotificationPreferenceSnapshot & {
  organizationId: string;
  updatedAt: string;
};

type AdminNotificationDefaultsCopy = {
  pageTitle: string;
  pageSubtitle: string;
  reloadLabel: string;
  reloadLoadingLabel: string;
  saveLabel: string;
  saveLoadingLabel: string;
  loadFailed: string;
  saveFailed: string;
  saveSuccess: string;
  defaultsTitle: string;
  defaultsDescription: string;
  statusTitle: string;
  statusDescription: string;
  enabledCountLabel: string;
  lastSavedLabel: string;
  noSaveHistory: string;
  enabledLabel: string;
  disabledLabel: string;
  channelTitle: string;
  categoryTitle: string;
  fields: {
    email: string;
    inApp: string;
    leave: string;
    attendance: string;
    payroll: string;
  };
};

const DEFAULT_FORM: NotificationPreferenceSnapshot = {
  channels: {
    email: true,
    inApp: true
  },
  categories: {
    leave: true,
    attendance: true,
    payroll: true
  }
};

function getCopy(locale: string): AdminNotificationDefaultsCopy {
  if (locale === "ko") {
    return {
      pageTitle: "알림 기본값",
      pageSubtitle: "조직 전체에 적용할 기본 알림 수신 정책을 관리합니다.",
      reloadLabel: "새로고침",
      reloadLoadingLabel: "불러오는 중...",
      saveLabel: "기본값 저장",
      saveLoadingLabel: "저장 중...",
      loadFailed: "알림 기본값을 불러오지 못했습니다.",
      saveFailed: "알림 기본값 저장에 실패했습니다.",
      saveSuccess: "알림 기본값이 저장되었습니다.",
      defaultsTitle: "조직 기본값",
      defaultsDescription: "직원이 별도 설정을 하지 않았을 때 사용할 기본 채널과 유형입니다.",
      statusTitle: "적용 현황",
      statusDescription: "현재 조직에 기본으로 열려 있는 알림 항목 수를 확인합니다.",
      enabledCountLabel: "기본 활성 항목",
      lastSavedLabel: "마지막 저장",
      noSaveHistory: "저장 이력 없음",
      enabledLabel: "켜짐",
      disabledLabel: "꺼짐",
      channelTitle: "수신 채널 기본값",
      categoryTitle: "알림 유형 기본값",
      fields: {
        email: "이메일 알림",
        inApp: "인앱 알림",
        leave: "휴가 알림",
        attendance: "근태 알림",
        payroll: "급여 알림"
      }
    };
  }

  return {
    pageTitle: "Notification Defaults",
    pageSubtitle: "Manage the default notification policy applied across the organization.",
    reloadLabel: "Reload",
    reloadLoadingLabel: "Loading...",
    saveLabel: "Save defaults",
    saveLoadingLabel: "Saving...",
    loadFailed: "Failed to load notification defaults.",
    saveFailed: "Failed to save notification defaults.",
    saveSuccess: "Notification defaults were saved.",
    defaultsTitle: "Organization defaults",
    defaultsDescription: "These defaults apply when an employee has not customized notification preferences.",
    statusTitle: "Current status",
    statusDescription: "Review how many notification entries are enabled by default for the current organization.",
    enabledCountLabel: "Enabled by default",
    lastSavedLabel: "Last saved",
    noSaveHistory: "No save history",
    enabledLabel: "On",
    disabledLabel: "Off",
    channelTitle: "Delivery channel defaults",
    categoryTitle: "Notification category defaults",
    fields: {
      email: "Email notifications",
      inApp: "In-app notifications",
      leave: "Leave notifications",
      attendance: "Attendance notifications",
      payroll: "Payroll notifications"
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

export default function AdminNotificationDefaultsPage() {
  const { locale } = useI18n();
  const runtimeLocale = locale === "ko" ? "ko-KR" : "en-US";
  const copy = useMemo(() => getCopy(locale), [locale]);
  const { loading: sessionLoading, error: sessionError } = useSupabaseSession();

  const [form, setForm] = useState<NotificationPreferenceSnapshot>(DEFAULT_FORM);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const enabledCount = useMemo(() => {
    return [
      form.channels.email,
      form.channels.inApp,
      form.categories.leave,
      form.categories.attendance,
      form.categories.payroll
    ].filter(Boolean).length;
  }, [form]);

  const loadWorkspace = useCallback(async () => {
    setWorkspaceLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await performAdminApiCall({
        label: "Load notification defaults",
        method: "GET",
        path: "/api/admin/notification-defaults",
        runtimeLocale
      });
      if (!result.response.ok) {
        throw new Error(copy.loadFailed);
      }

      const payload = result.body as AdminNotificationDefaultsDto;
      setForm({
        channels: payload.channels,
        categories: payload.categories
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
      const result = await performAdminApiCall({
        label: "Save notification defaults",
        method: "PUT",
        path: "/api/admin/notification-defaults",
        payload: form,
        runtimeLocale
      });
      if (!result.response.ok) {
        throw new Error(copy.saveFailed);
      }

      const payload = result.body as AdminNotificationDefaultsDto;
      setForm({
        channels: payload.channels,
        categories: payload.categories
      });
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
          <h2>{copy.defaultsTitle}</h2>
          <p className="small muted">{copy.defaultsDescription}</p>

          <div className="input-grid">
            <label>
              <span>{copy.channelTitle}</span>
              <button
                type="button"
                className={`btn ${form.channels.email ? "btn-primary" : "btn-secondary"}`}
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    channels: { ...current.channels, email: !current.channels.email }
                  }))
                }
                aria-pressed={form.channels.email}
              >
                {copy.fields.email}: {form.channels.email ? copy.enabledLabel : copy.disabledLabel}
              </button>
            </label>
            <label>
              <span>&nbsp;</span>
              <button
                type="button"
                className={`btn ${form.channels.inApp ? "btn-primary" : "btn-secondary"}`}
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    channels: { ...current.channels, inApp: !current.channels.inApp }
                  }))
                }
                aria-pressed={form.channels.inApp}
              >
                {copy.fields.inApp}: {form.channels.inApp ? copy.enabledLabel : copy.disabledLabel}
              </button>
            </label>
            <label>
              <span>{copy.categoryTitle}</span>
              <button
                type="button"
                className={`btn ${form.categories.leave ? "btn-primary" : "btn-secondary"}`}
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    categories: { ...current.categories, leave: !current.categories.leave }
                  }))
                }
                aria-pressed={form.categories.leave}
              >
                {copy.fields.leave}: {form.categories.leave ? copy.enabledLabel : copy.disabledLabel}
              </button>
            </label>
            <label>
              <span>&nbsp;</span>
              <button
                type="button"
                className={`btn ${form.categories.attendance ? "btn-primary" : "btn-secondary"}`}
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    categories: { ...current.categories, attendance: !current.categories.attendance }
                  }))
                }
                aria-pressed={form.categories.attendance}
              >
                {copy.fields.attendance}: {form.categories.attendance ? copy.enabledLabel : copy.disabledLabel}
              </button>
            </label>
            <label>
              <span>&nbsp;</span>
              <button
                type="button"
                className={`btn ${form.categories.payroll ? "btn-primary" : "btn-secondary"}`}
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    categories: { ...current.categories, payroll: !current.categories.payroll }
                  }))
                }
                aria-pressed={form.categories.payroll}
              >
                {copy.fields.payroll}: {form.categories.payroll ? copy.enabledLabel : copy.disabledLabel}
              </button>
            </label>
          </div>

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
              {copy.enabledCountLabel}: {enabledCount}
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
