"use client";

import Link from "next/link";
import { type FormEvent, useCallback, useEffect, useState } from "react";

import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { getSupabaseClient } from "@/lib/supabase/client";

type LocaleOption = "ko" | "en";

const LOCALE_STORAGE_KEY = "flowhr-locale";

function getStoredLocale(): LocaleOption {
  if (typeof window === "undefined") {
    return "ko";
  }

  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  return stored === "en" ? "en" : "ko";
}

function getLabel(isKoLocale: boolean, ko: string, en: string) {
  return isKoLocale ? ko : en;
}

function toPasswordChangeErrorMessage(error: unknown, isKoLocale: boolean) {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  if (normalized.includes("password should be at least")) {
    return getLabel(isKoLocale, "비밀번호는 최소 6자 이상이어야 합니다.", "Password must be at least 6 characters.");
  }
  if (normalized.includes("same password")) {
    return getLabel(
      isKoLocale,
      "이전 비밀번호와 다른 비밀번호를 입력해 주세요.",
      "Please enter a password different from your previous one."
    );
  }
  if (normalized.includes("auth session missing")) {
    return getLabel(
      isKoLocale,
      "로그인 세션을 확인할 수 없습니다. 다시 로그인해 주세요.",
      "The login session is missing. Please sign in again."
    );
  }

  return getLabel(
    isKoLocale,
    "비밀번호 변경에 실패했습니다. 잠시 후 다시 시도해 주세요.",
    "Failed to change the password. Please try again shortly."
  );
}

export default function EmployeeSettingsPage() {
  const { loading: sessionLoading } = useSupabaseSession();
  const [locale, setLocale] = useState<LocaleOption>("ko");
  const [saved, setSaved] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordNotice, setPasswordNotice] = useState<string | null>(null);
  const [passwordPending, setPasswordPending] = useState(false);

  useEffect(() => {
    setLocale(getStoredLocale());
  }, []);

  const isKoLocale = locale === "ko";
  const l = useCallback((ko: string, en: string) => getLabel(isKoLocale, ko, en), [isKoLocale]);

  const handleLocaleChange = useCallback((newLocale: LocaleOption) => {
    setLocale(newLocale);
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, []);

  const handleChangePassword = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (newPassword.trim().length < 6) {
        setPasswordError(l("비밀번호는 최소 6자 이상이어야 합니다.", "Password must be at least 6 characters."));
        setPasswordNotice(null);
        return;
      }

      if (newPassword !== confirmPassword) {
        setPasswordError(
          l("새 비밀번호와 확인 비밀번호가 일치하지 않습니다.", "New password and confirmation do not match.")
        );
        setPasswordNotice(null);
        return;
      }

      setPasswordPending(true);
      setPasswordError(null);
      setPasswordNotice(null);

      try {
        const supabase = getSupabaseClient();
        const sessionResult = await supabase.auth.getSession();
        if (sessionResult.error) {
          throw sessionResult.error;
        }
        if (!sessionResult.data.session) {
          throw new Error("Auth session missing");
        }

        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
          throw error;
        }

        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPasswordNotice(l("비밀번호가 변경되었습니다.", "Your password has been changed."));
      } catch (error) {
        setPasswordError(toPasswordChangeErrorMessage(error, isKoLocale));
      } finally {
        setPasswordPending(false);
      }
    },
    [confirmPassword, isKoLocale, l, newPassword]
  );

  if (sessionLoading) {
    return null;
  }

  return (
    <main className="saas-content">
      <header className="page-header">
        <div>
          <h1 className="page-title">{l("개인 설정", "Personal Settings")}</h1>
          <p className="page-subtitle">{l("언어 및 알림 환경을 설정합니다.", "Configure language and notification preferences.")}</p>
        </div>
      </header>

      {saved ? <p className="small ok">{l("저장되었습니다.", "Saved.")}</p> : null}
      {passwordError ? <p className="small fail">{passwordError}</p> : null}
      {passwordNotice ? <p className="small ok">{passwordNotice}</p> : null}

      <section className="panel-grid">
        <article className="panel">
          <h2>{l("언어 설정", "Language Settings")}</h2>
          <p className="small muted">{l("화면 표시 언어를 선택합니다.", "Choose your display language.")}</p>
          <div className="input-grid">
            <label>
              {l("언어", "Language")}
              <select value={locale} onChange={(event) => handleLocaleChange(event.target.value as LocaleOption)}>
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

        <article className="panel">
          <h2>{l("비밀번호 변경", "Change Password")}</h2>
          <p className="small muted">
            {l(
              "로그인 상태에서 새 비밀번호로 변경합니다. 현재 비밀번호 입력은 확인용이며 필수는 아닙니다.",
              "Change to a new password while signed in. The current password field is optional and only for your reference."
            )}
          </p>

          <form onSubmit={(event) => void handleChangePassword(event)}>
            <div className="input-grid">
              <label>
                {l("현재 비밀번호", "Current Password")}
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  autoComplete="current-password"
                  placeholder="********"
                />
              </label>

              <label>
                {l("새 비밀번호", "New Password")}
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  autoComplete="new-password"
                  placeholder="********"
                  minLength={6}
                />
              </label>

              <label>
                {l("새 비밀번호 확인", "Confirm New Password")}
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  placeholder="********"
                  minLength={6}
                />
              </label>
            </div>

            <div className="panel-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={passwordPending || newPassword.length === 0 || confirmPassword.length === 0}
              >
                {passwordPending ? l("변경 중...", "Changing...") : l("변경", "Change")}
              </button>
            </div>
          </form>
        </article>
      </section>
    </main>
  );
}
