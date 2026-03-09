"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { performEmployeeApiCall } from "@/app/employee/page-api-helpers";
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

type EmployeeNotificationPreferenceDto = NotificationPreferenceSnapshot & {
  defaults: NotificationPreferenceSnapshot;
  hasCustomPreferences: boolean;
  updatedAt: string | null;
};

type EmployeeNotificationSettingsCopy = {
  pageTitle: string;
  pageSubtitle: string;
  reloadLabel: string;
  reloadLoadingLabel: string;
  saveLabel: string;
  saveLoadingLabel: string;
  resetLabel: string;
  resetLoadingLabel: string;
  saveSuccess: string;
  resetSuccess: string;
  loadFailed: string;
  saveFailed: string;
  resetFailed: string;
  noSaveHistory: string;
  enabledTypeLabel: string;
  lastSavedLabel: string;
  defaultSourceLabel: string;
  customSourceLabel: string;
  channelSectionTitle: string;
  channelSectionDescription: string;
  categorySectionTitle: string;
  categorySectionDescription: string;
  adminDefaultTitle: string;
  adminDefaultDescription: string;
  backToHome: string;
  toggleOn: string;
  toggleOff: string;
  countUnit: string;
  fields: {
    email: string;
    inApp: string;
    leave: string;
    attendance: string;
    payroll: string;
  };
};

const DEFAULT_SETTINGS: NotificationPreferenceSnapshot = {
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

function getCopy(locale: string): EmployeeNotificationSettingsCopy {
  if (locale === "ko") {
    return {
      pageTitle: "알림 수신 환경 설정",
      pageSubtitle: "조직 기본값을 바탕으로 내 알림 채널과 유형을 저장합니다.",
      reloadLabel: "새로고침",
      reloadLoadingLabel: "불러오는 중...",
      saveLabel: "내 설정 저장",
      saveLoadingLabel: "저장 중...",
      resetLabel: "기본값으로 복원",
      resetLoadingLabel: "복원 중...",
      saveSuccess: "알림 설정이 저장되었습니다.",
      resetSuccess: "조직 기본값으로 복원되었습니다.",
      loadFailed: "알림 설정을 불러오지 못했습니다.",
      saveFailed: "알림 설정 저장에 실패했습니다.",
      resetFailed: "기본값 복원에 실패했습니다.",
      noSaveHistory: "저장 이력 없음",
      enabledTypeLabel: "활성화된 알림 유형",
      lastSavedLabel: "마지막 저장",
      defaultSourceLabel: "조직 기본값 적용 중",
      customSourceLabel: "개인 설정 적용 중",
      channelSectionTitle: "수신 채널",
      channelSectionDescription: "이메일과 인앱 알림의 수신 여부를 조정합니다.",
      categorySectionTitle: "알림 유형",
      categorySectionDescription: "휴가, 근태, 급여 알림 중 받을 항목을 선택합니다.",
      adminDefaultTitle: "조직 기본값",
      adminDefaultDescription: "관리자가 설정한 기본 채널과 유형입니다.",
      backToHome: "직원 홈으로",
      toggleOn: "켜짐",
      toggleOff: "꺼짐",
      countUnit: "개",
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
    pageTitle: "Notification Preference Settings",
    pageSubtitle: "Save your notification channels and categories on top of the organization defaults.",
    reloadLabel: "Reload",
    reloadLoadingLabel: "Loading...",
    saveLabel: "Save my settings",
    saveLoadingLabel: "Saving...",
    resetLabel: "Restore defaults",
    resetLoadingLabel: "Restoring...",
    saveSuccess: "Notification preferences were saved.",
    resetSuccess: "Notification preferences were restored to the organization defaults.",
    loadFailed: "Failed to load notification preferences.",
    saveFailed: "Failed to save notification preferences.",
    resetFailed: "Failed to restore the organization defaults.",
    noSaveHistory: "No save history",
    enabledTypeLabel: "Enabled notification types",
    lastSavedLabel: "Last saved",
    defaultSourceLabel: "Using organization defaults",
    customSourceLabel: "Using personal preferences",
    channelSectionTitle: "Delivery channels",
    channelSectionDescription: "Adjust whether email and in-app alerts are delivered to you.",
    categorySectionTitle: "Notification categories",
    categorySectionDescription: "Choose which leave, attendance, and payroll alerts you want to receive.",
    adminDefaultTitle: "Organization defaults",
    adminDefaultDescription: "These defaults are managed by your administrator.",
    backToHome: "Back to employee home",
    toggleOn: "On",
    toggleOff: "Off",
    countUnit: "items",
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

export default function EmployeeNotificationSettingsPage() {
  const { locale } = useI18n();
  const runtimeLocale = locale === "ko" ? "ko-KR" : "en-US";
  const copy = useMemo(() => getCopy(locale), [locale]);
  const { loading: sessionLoading, error: sessionError } = useSupabaseSession();

  const [settings, setSettings] = useState<NotificationPreferenceSnapshot>(DEFAULT_SETTINGS);
  const [defaults, setDefaults] = useState<NotificationPreferenceSnapshot>(DEFAULT_SETTINGS);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [hasCustomPreferences, setHasCustomPreferences] = useState(false);
  const [workspaceLoading, setWorkspaceLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const enabledCategoryCount = useMemo(() => {
    return Object.values(settings.categories).filter(Boolean).length;
  }, [settings.categories]);

  const loadWorkspace = useCallback(async () => {
    setWorkspaceLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await performEmployeeApiCall({
        label: "Load notification preferences",
        method: "GET",
        path: "/api/employee/notification-preferences",
        runtimeLocale
      });
      if (!result.response.ok) {
        throw new Error(copy.loadFailed);
      }

      const payload = result.body as EmployeeNotificationPreferenceDto;
      setSettings({
        channels: payload.channels,
        categories: payload.categories
      });
      setDefaults(payload.defaults);
      setLastSavedAt(payload.updatedAt);
      setHasCustomPreferences(payload.hasCustomPreferences);
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
      const result = await performEmployeeApiCall({
        label: "Save notification preferences",
        method: "PUT",
        path: "/api/employee/notification-preferences",
        payload: settings,
        runtimeLocale
      });
      if (!result.response.ok) {
        throw new Error(copy.saveFailed);
      }

      const payload = result.body as EmployeeNotificationPreferenceDto;
      setSettings({
        channels: payload.channels,
        categories: payload.categories
      });
      setDefaults(payload.defaults);
      setLastSavedAt(payload.updatedAt);
      setHasCustomPreferences(payload.hasCustomPreferences);
      setSuccessMessage(copy.saveSuccess);
    } catch (error) {
      const message = error instanceof Error ? error.message : copy.saveFailed;
      setErrorMessage(formatUserFacingErrorMessage(message, runtimeLocale));
    } finally {
      setSaving(false);
    }
  }

  async function handleResetToDefaults() {
    setResetting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await performEmployeeApiCall({
        label: "Reset notification preferences",
        method: "PUT",
        path: "/api/employee/notification-preferences",
        payload: { resetToDefaults: true },
        runtimeLocale
      });
      if (!result.response.ok) {
        throw new Error(copy.resetFailed);
      }

      const payload = result.body as EmployeeNotificationPreferenceDto;
      setSettings({
        channels: payload.channels,
        categories: payload.categories
      });
      setDefaults(payload.defaults);
      setLastSavedAt(payload.updatedAt);
      setHasCustomPreferences(payload.hasCustomPreferences);
      setSuccessMessage(copy.resetSuccess);
    } catch (error) {
      const message = error instanceof Error ? error.message : copy.resetFailed;
      setErrorMessage(formatUserFacingErrorMessage(message, runtimeLocale));
    } finally {
      setResetting(false);
    }
  }

  const toggleLabel = (value: boolean) => (value ? copy.toggleOn : copy.toggleOff);
  const enabledCategoryCountLabel =
    locale === "ko" ? `${enabledCategoryCount}${copy.countUnit}` : `${enabledCategoryCount} ${copy.countUnit}`;

  if (sessionLoading) {
    return null;
  }

  return (
    <main className="saas-content">
      <section className="hero-panel">
        <p className="eyebrow">{copy.pageTitle}</p>
        <h1>{copy.pageTitle}</h1>
        <p className="hero-copy">{copy.pageSubtitle}</p>
        <div className="hero-meta">
          <span>
            {copy.enabledTypeLabel}: {enabledCategoryCountLabel}
          </span>
          <span>
            {copy.lastSavedLabel}: {formatLocalizedDateTime(lastSavedAt, runtimeLocale, copy.noSaveHistory)}
          </span>
          <span>{hasCustomPreferences ? copy.customSourceLabel : copy.defaultSourceLabel}</span>
          <Link href="/employee" className="btn btn-secondary">
            {copy.backToHome}
          </Link>
        </div>
      </section>

      {sessionError ? <p className="small fail">{formatUserFacingErrorMessage(sessionError, runtimeLocale)}</p> : null}
      {errorMessage ? <p className="small fail">{errorMessage}</p> : null}
      {successMessage ? <p className="small ok">{successMessage}</p> : null}

      <section className="panel-grid">
        <article className="panel">
          <h2>{copy.channelSectionTitle}</h2>
          <p className="small">{copy.channelSectionDescription}</p>
          <div className="actions">
            <button
              type="button"
              className={`btn ${settings.channels.email ? "btn-primary" : "btn-secondary"}`}
              onClick={() =>
                setSettings((current) => ({
                  ...current,
                  channels: { ...current.channels, email: !current.channels.email }
                }))
              }
              aria-pressed={settings.channels.email}
            >
              {copy.fields.email}: {toggleLabel(settings.channels.email)}
            </button>
            <button
              type="button"
              className={`btn ${settings.channels.inApp ? "btn-primary" : "btn-secondary"}`}
              onClick={() =>
                setSettings((current) => ({
                  ...current,
                  channels: { ...current.channels, inApp: !current.channels.inApp }
                }))
              }
              aria-pressed={settings.channels.inApp}
            >
              {copy.fields.inApp}: {toggleLabel(settings.channels.inApp)}
            </button>
          </div>
        </article>

        <article className="panel">
          <h2>{copy.categorySectionTitle}</h2>
          <p className="small">{copy.categorySectionDescription}</p>
          <div className="actions">
            <button
              type="button"
              className={`btn ${settings.categories.leave ? "btn-primary" : "btn-secondary"}`}
              onClick={() =>
                setSettings((current) => ({
                  ...current,
                  categories: { ...current.categories, leave: !current.categories.leave }
                }))
              }
              aria-pressed={settings.categories.leave}
            >
              {copy.fields.leave}: {toggleLabel(settings.categories.leave)}
            </button>
            <button
              type="button"
              className={`btn ${settings.categories.attendance ? "btn-primary" : "btn-secondary"}`}
              onClick={() =>
                setSettings((current) => ({
                  ...current,
                  categories: { ...current.categories, attendance: !current.categories.attendance }
                }))
              }
              aria-pressed={settings.categories.attendance}
            >
              {copy.fields.attendance}: {toggleLabel(settings.categories.attendance)}
            </button>
            <button
              type="button"
              className={`btn ${settings.categories.payroll ? "btn-primary" : "btn-secondary"}`}
              onClick={() =>
                setSettings((current) => ({
                  ...current,
                  categories: { ...current.categories, payroll: !current.categories.payroll }
                }))
              }
              aria-pressed={settings.categories.payroll}
            >
              {copy.fields.payroll}: {toggleLabel(settings.categories.payroll)}
            </button>
          </div>
          <div className="panel-actions">
            <button className="btn btn-primary" type="button" onClick={() => void handleSave()} disabled={saving || workspaceLoading}>
              {saving ? copy.saveLoadingLabel : copy.saveLabel}
            </button>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => void handleResetToDefaults()}
              disabled={resetting || workspaceLoading}
            >
              {resetting ? copy.resetLoadingLabel : copy.resetLabel}
            </button>
            <button className="btn btn-secondary" type="button" onClick={() => void loadWorkspace()} disabled={workspaceLoading}>
              {workspaceLoading ? copy.reloadLoadingLabel : copy.reloadLabel}
            </button>
          </div>
        </article>

        <article className="panel">
          <h2>{copy.adminDefaultTitle}</h2>
          <p className="small muted">{copy.adminDefaultDescription}</p>
          <ul className="simple-list">
            <li>
              {copy.fields.email}: {toggleLabel(defaults.channels.email)}
            </li>
            <li>
              {copy.fields.inApp}: {toggleLabel(defaults.channels.inApp)}
            </li>
            <li>
              {copy.fields.leave}: {toggleLabel(defaults.categories.leave)}
            </li>
            <li>
              {copy.fields.attendance}: {toggleLabel(defaults.categories.attendance)}
            </li>
            <li>
              {copy.fields.payroll}: {toggleLabel(defaults.categories.payroll)}
            </li>
          </ul>
        </article>
      </section>
    </main>
  );
}
