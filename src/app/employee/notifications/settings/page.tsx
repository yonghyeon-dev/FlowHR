"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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

function formatKoreanDateTime(value: string | null) {
  if (!value) {
    return "저장 이력 없음";
  }
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default function EmployeeNotificationSettingsPage() {
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
      setSaveError("브라우저 저장소에 설정을 저장하지 못했습니다.");
    }
  }, [isHydrated, settings]);

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

  const emailLabel = settings.channels.email ? "켜짐" : "꺼짐";
  const inAppLabel = settings.channels.inApp ? "켜짐" : "꺼짐";

  return (
    <main className="saas-content">
      <section className="hero-panel">
        <p className="eyebrow">알림 설정</p>
        <h1>알림 수신 환경 설정</h1>
        <p className="hero-copy">
          이메일/인앱 채널과 알림 유형별 수신 여부를 설정합니다. 현재 MVP 단계에서는 브라우저 로컬스토리지에 저장됩니다.
        </p>
        <div className="hero-meta">
          <span>활성화된 알림 유형: {enabledCategoryCount}개</span>
          <span>마지막 저장: {formatKoreanDateTime(lastSavedAt)}</span>
          <Link href="/employee" className="btn btn-secondary">
            직원 홈으로
          </Link>
        </div>
      </section>

      <section className="panel-grid">
        <article className="panel">
          <h2>수신 채널</h2>
          <p className="small">채널 단위로 알림 수신을 켜거나 끌 수 있습니다.</p>
          <div className="actions">
            <button
              type="button"
              className={`btn ${settings.channels.email ? "btn-primary" : "btn-secondary"}`}
              onClick={() => toggleChannel("email")}
              aria-pressed={settings.channels.email}
            >
              이메일 알림: {emailLabel}
            </button>
            <button
              type="button"
              className={`btn ${settings.channels.inApp ? "btn-primary" : "btn-secondary"}`}
              onClick={() => toggleChannel("inApp")}
              aria-pressed={settings.channels.inApp}
            >
              인앱 알림: {inAppLabel}
            </button>
          </div>
        </article>

        <article className="panel">
          <h2>알림 유형</h2>
          <p className="small">업무 주제별로 수신 여부를 조정합니다.</p>
          <div className="actions">
            <button
              type="button"
              className={`btn ${settings.categories.leave ? "btn-primary" : "btn-secondary"}`}
              onClick={() => toggleCategory("leave")}
              aria-pressed={settings.categories.leave}
            >
              휴가 알림: {settings.categories.leave ? "켜짐" : "꺼짐"}
            </button>
            <button
              type="button"
              className={`btn ${settings.categories.attendance ? "btn-primary" : "btn-secondary"}`}
              onClick={() => toggleCategory("attendance")}
              aria-pressed={settings.categories.attendance}
            >
              근태 알림: {settings.categories.attendance ? "켜짐" : "꺼짐"}
            </button>
            <button
              type="button"
              className={`btn ${settings.categories.payroll ? "btn-primary" : "btn-secondary"}`}
              onClick={() => toggleCategory("payroll")}
              aria-pressed={settings.categories.payroll}
            >
              급여 알림: {settings.categories.payroll ? "켜짐" : "꺼짐"}
            </button>
          </div>
          <div className="actions">
            <button type="button" className="btn btn-secondary" onClick={resetDefaults}>
              기본값으로 복원
            </button>
          </div>
          {saveError ? (
            <p className="small" style={{ color: "var(--danger)", marginTop: 10 }}>
              {saveError}
            </p>
          ) : (
            <p className="small" style={{ marginTop: 10 }}>
              설정 변경 시 자동 저장됩니다.
            </p>
          )}
        </article>
      </section>
    </main>
  );
}
