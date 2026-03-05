"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useI18n } from "@/lib/i18n/provider";

type NotificationSettings = {
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

type StoredNotificationSettings = NotificationSettings & {
  updatedAt?: string | null;
};

const STORAGE_KEY = "flowhr.employee.notification-settings.v1";

const DEFAULT_SETTINGS: NotificationSettings = {
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

function sanitizeSettings(raw: unknown): StoredNotificationSettings {
  const source = raw as Partial<StoredNotificationSettings> | null | undefined;
  const channels = source?.channels;
  const categories = source?.categories;

  return {
    channels: {
      email: typeof channels?.email === "boolean" ? channels.email : DEFAULT_SETTINGS.channels.email,
      inApp: typeof channels?.inApp === "boolean" ? channels.inApp : DEFAULT_SETTINGS.channels.inApp
    },
    categories: {
      leave: typeof categories?.leave === "boolean" ? categories.leave : DEFAULT_SETTINGS.categories.leave,
      attendance:
        typeof categories?.attendance === "boolean"
          ? categories.attendance
          : DEFAULT_SETTINGS.categories.attendance,
      payroll: typeof categories?.payroll === "boolean" ? categories.payroll : DEFAULT_SETTINGS.categories.payroll
    },
    updatedAt: typeof source?.updatedAt === "string" ? source.updatedAt : null
  };
}

function readFromStorage(): StoredNotificationSettings {
  if (typeof window === "undefined") {
    return {
      ...DEFAULT_SETTINGS,
      updatedAt: null
    };
  }

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return {
      ...DEFAULT_SETTINGS,
      updatedAt: null
    };
  }

  try {
    return sanitizeSettings(JSON.parse(saved));
  } catch {
    return {
      ...DEFAULT_SETTINGS,
      updatedAt: null
    };
  }
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
  const { locale, t } = useI18n();
  const runtimeLocale = locale === "ko" ? "ko-KR" : "en-US";
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const stored = readFromStorage();
    setSettings({
      channels: stored.channels,
      categories: stored.categories
    });
    setLastSavedAt(stored.updatedAt ?? null);
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const savedAt = new Date().toISOString();
    const payload: StoredNotificationSettings = {
      ...settings,
      updatedAt: savedAt
    };

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      setLastSavedAt(savedAt);
      setSaveError(null);
    } catch {
      setSaveError(t("employee.notifications.settings.saveError"));
    }
  }, [isHydrated, settings, t]);

  const enabledCategoryCount = useMemo(() => {
    return Object.values(settings.categories).filter(Boolean).length;
  }, [settings.categories]);

  const toggleChannel = (key: keyof NotificationSettings["channels"]) => {
    setSettings((current) => ({
      ...current,
      channels: {
        ...current.channels,
        [key]: !current.channels[key]
      }
    }));
  };

  const toggleCategory = (key: keyof NotificationSettings["categories"]) => {
    setSettings((current) => ({
      ...current,
      categories: {
        ...current.categories,
        [key]: !current.categories[key]
      }
    }));
  };

  const resetDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  const toggleOnLabel = t("employee.notifications.settings.toggle.on");
  const toggleOffLabel = t("employee.notifications.settings.toggle.off");
  const emailLabel = settings.channels.email ? toggleOnLabel : toggleOffLabel;
  const inAppLabel = settings.channels.inApp ? toggleOnLabel : toggleOffLabel;
  const enabledCategoryCountLabel =
    locale === "ko"
      ? `${enabledCategoryCount}${t("employee.notifications.settings.countUnit")}`
      : `${enabledCategoryCount} ${t("employee.notifications.settings.countUnit")}`;
  const lastSavedLabel = formatLocalizedDateTime(
    lastSavedAt,
    runtimeLocale,
    t("employee.notifications.settings.noSaveHistory")
  );

  return (
    <main className="saas-content">
      <section className="hero-panel">
        <p className="eyebrow">{t("employee.notifications.settings.eyebrow")}</p>
        <h1>{t("employee.notifications.settings.title")}</h1>
        <p className="hero-copy">{t("employee.notifications.settings.description")}</p>
        <div className="hero-meta">
          <span>
            {t("employee.notifications.settings.enabledTypeLabel")}: {enabledCategoryCountLabel}
          </span>
          <span>
            {t("employee.notifications.settings.lastSavedLabel")}: {lastSavedLabel}
          </span>
          <Link href="/employee" className="btn btn-secondary">
            {t("employee.notifications.settings.backToHome")}
          </Link>
        </div>
      </section>

      <section className="panel-grid">
        <article className="panel">
          <h2>{t("employee.notifications.settings.channelSectionTitle")}</h2>
          <p className="small">{t("employee.notifications.settings.channelSectionDescription")}</p>
          <div className="actions">
            <button
              type="button"
              className={`btn ${settings.channels.email ? "btn-primary" : "btn-secondary"}`}
              onClick={() => toggleChannel("email")}
              aria-pressed={settings.channels.email}
            >
              {t("employee.notifications.settings.channel.email")}: {emailLabel}
            </button>
            <button
              type="button"
              className={`btn ${settings.channels.inApp ? "btn-primary" : "btn-secondary"}`}
              onClick={() => toggleChannel("inApp")}
              aria-pressed={settings.channels.inApp}
            >
              {t("employee.notifications.settings.channel.inApp")}: {inAppLabel}
            </button>
          </div>
        </article>

        <article className="panel">
          <h2>{t("employee.notifications.settings.categorySectionTitle")}</h2>
          <p className="small">{t("employee.notifications.settings.categorySectionDescription")}</p>
          <div className="actions">
            <button
              type="button"
              className={`btn ${settings.categories.leave ? "btn-primary" : "btn-secondary"}`}
              onClick={() => toggleCategory("leave")}
              aria-pressed={settings.categories.leave}
            >
              {t("employee.notifications.settings.category.leave")}:{" "}
              {settings.categories.leave ? toggleOnLabel : toggleOffLabel}
            </button>
            <button
              type="button"
              className={`btn ${settings.categories.attendance ? "btn-primary" : "btn-secondary"}`}
              onClick={() => toggleCategory("attendance")}
              aria-pressed={settings.categories.attendance}
            >
              {t("employee.notifications.settings.category.attendance")}:{" "}
              {settings.categories.attendance ? toggleOnLabel : toggleOffLabel}
            </button>
            <button
              type="button"
              className={`btn ${settings.categories.payroll ? "btn-primary" : "btn-secondary"}`}
              onClick={() => toggleCategory("payroll")}
              aria-pressed={settings.categories.payroll}
            >
              {t("employee.notifications.settings.category.payroll")}:{" "}
              {settings.categories.payroll ? toggleOnLabel : toggleOffLabel}
            </button>
          </div>
          <div className="actions">
            <button type="button" className="btn btn-secondary" onClick={resetDefaults}>
              {t("employee.notifications.settings.restoreDefaults")}
            </button>
          </div>
          {saveError ? (
            <p className="small" style={{ color: "var(--danger)", marginTop: 10 }}>
              {saveError}
            </p>
          ) : (
            <p className="small" style={{ marginTop: 10 }}>
              {t("employee.notifications.settings.autoSaveHint")}
            </p>
          )}
        </article>
      </section>
    </main>
  );
}
