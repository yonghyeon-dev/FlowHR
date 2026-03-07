"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { useSupabaseSession } from "@/lib/client/useSupabaseSession";

type LocaleOption = "ko" | "en";

const LOCALE_STORAGE_KEY = "flowhr-locale";

function getStoredLocale(): LocaleOption {
  if (typeof window === "undefined") return "ko";
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  return stored === "en" ? "en" : "ko";
}

function getLabel(ko: string, en: string) {
  return ko;
}

export default function EmployeeSettingsPage() {
  const { loading: sessionLoading } = useSupabaseSession();
  const [locale, setLocale] = useState<LocaleOption>("ko");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLocale(getStoredLocale());
  }, []);

  const handleLocaleChange = useCallback((newLocale: LocaleOption) => {
    setLocale(newLocale);
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, []);

  if (sessionLoading) return null;

  const l = getLabel;

  return (
    <main className="saas-content">
      <header className="page-header">
        <div>
          <h1 className="page-title">{l("개인 설정", "Personal Settings")}</h1>
          <p className="page-subtitle">{l("언어 및 알림 환경을 설정합니다.", "Configure language and notification preferences.")}</p>
        </div>
      </header>

      {saved ? <p className="small ok">{l("저장되었습니다.", "Saved.")}</p> : null}

      <section className="panel-grid">
        <article className="panel">
          <h2>{l("언어 설정", "Language Settings")}</h2>
          <p className="small muted">{l("화면 표시 언어를 선택합니다.", "Choose your display language.")}</p>
          <div className="input-grid">
            <label>
              {l("언어", "Language")}
              <select value={locale} onChange={(e) => handleLocaleChange(e.target.value as LocaleOption)}>
                <option value="ko">한국어</option>
                <option value="en">English</option>
              </select>
            </label>
          </div>
        </article>

        <article className="panel">
          <h2>{l("알림 설정", "Notification Settings")}</h2>
          <p className="small muted">
            {l("이메일/인앱 알림 수신 환경을 설정합니다.", "Configure email and in-app notification preferences.")}
          </p>
          <div className="panel-actions">
            <Link href="/employee/notifications/settings" className="btn btn-secondary">
              {l("알림 설정 바로가기", "Go to Notification Settings")}
            </Link>
          </div>
        </article>
      </section>
    </main>
  );
}
