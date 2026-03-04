"use client";

import type { Session } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { FLOWHR_ACCESS_TOKEN_COOKIE } from "@/lib/auth/session-cookie";
import { useI18n } from "@/lib/i18n/provider";
import { getSupabaseClient } from "@/lib/supabase/client";

type SessionSnapshot = {
  userId: string;
  email: string | null;
  role: string | null;
  organizationId: string | null;
  actorId: string | null;
};

function clearAccessTokenCookie() {
  document.cookie = `${FLOWHR_ACCESS_TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

function syncAccessTokenCookie(session: Session | null) {
  if (!session?.access_token) {
    clearAccessTokenCookie();
    return;
  }

  const nowEpochSeconds = Math.floor(Date.now() / 1000);
  const maxAge =
    typeof session.expires_at === "number" ? Math.max(0, session.expires_at - nowEpochSeconds) : 60 * 60;

  if (maxAge <= 0) {
    clearAccessTokenCookie();
    return;
  }

  const secureFlag = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${FLOWHR_ACCESS_TOKEN_COOKIE}=${encodeURIComponent(session.access_token)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secureFlag}`;
}

function resolveRedirectPath(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return null;
  }

  return trimmed;
}

function parseSession(session: Session | null): SessionSnapshot | null {
  const user = session?.user;
  if (!user?.id) {
    return null;
  }

  const app = (user.app_metadata ?? {}) as Record<string, unknown>;
  const role = typeof app.role === "string" ? app.role : null;
  const organizationId =
    typeof app.organization_id === "string"
      ? app.organization_id
      : typeof app.organizationId === "string"
        ? app.organizationId
        : null;
  const actorId =
    typeof app.actor_id === "string"
      ? app.actor_id
      : typeof app.actorId === "string"
        ? app.actorId
        : null;

  return {
    userId: user.id,
    email: typeof user.email === "string" ? user.email : null,
    role,
    organizationId,
    actorId
  };
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, locale } = useI18n();
  const isKoLocale = locale === "ko";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<SessionSnapshot | null>(null);

  const redirectTarget = useMemo(() => resolveRedirectPath(searchParams.get("redirect")), [searchParams]);

  const workspaceTarget = useMemo(() => {
    const role = snapshot?.role ?? "";
    if (role === "admin" || role === "payroll_operator" || role === "manager") {
      return "/admin";
    }
    return "/employee";
  }, [snapshot]);

  const loginSuccessTarget = redirectTarget ?? workspaceTarget;

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const supabase = getSupabaseClient();
        const { data } = await supabase.auth.getSession();
        if (!active) {
          return;
        }
        syncAccessTokenCookie(data.session);
        setSnapshot(parseSession(data.session));
      } catch (error) {
        if (!active) {
          return;
        }
        setErrorMessage(error instanceof Error ? error.message : String(error));
      }
    }

    const supabase = getSupabaseClient();
    const listener = supabase.auth.onAuthStateChange((_event, session) => {
      syncAccessTokenCookie(session);
      setSnapshot(parseSession(session));
    });

    void load();

    return () => {
      active = false;
      listener.data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!snapshot) {
      return;
    }
    const timer = window.setTimeout(() => {
      router.replace(loginSuccessTarget);
    }, 600);
    return () => {
      window.clearTimeout(timer);
    };
  }, [loginSuccessTarget, router, snapshot]);

  async function signIn() {
    setPending(true);
    setErrorMessage(null);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });
      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setPending(false);
    }
  }

  async function signOut() {
    setPending(true);
    setErrorMessage(null);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw new Error(error.message);
      }
      clearAccessTokenCookie();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="landing-page">
      <section className="hero-panel">
        <p className="eyebrow">FlowHR</p>
        <h1>{t("login.title")}</h1>
        <p className="hero-copy">{t("login.copy")}</p>
        <div className="hero-meta">
          <Link className="btn btn-secondary" href="/">
            {t("login.backHome")}
          </Link>
          <Link className="btn btn-secondary" href={workspaceTarget}>
            {workspaceTarget === "/admin" ? t("login.goToAdmin") : t("login.goToEmployee")}
          </Link>
        </div>
      </section>

      <section className="panel-grid">
        <article className="panel">
          <h2>{t("login.sessionTitle")}</h2>
          {snapshot ? (
            <>
              <p className="small muted">
                {isKoLocale
                  ? "세션이 확인되어 권한에 맞는 워크스페이스로 자동 이동합니다."
                  : "Session detected. Redirecting to your role workspace."}
              </p>
              <ul className="simple-list" aria-label={t("login.sessionAria")}>
                <li>
                  <span className="muted">{t("login.userId")}</span>
                  <strong>{snapshot.userId}</strong>
                </li>
                <li>
                  <span className="muted">{t("login.email")}</span>
                  <strong>{snapshot.email ?? "-"}</strong>
                </li>
                <li>
                  <span className="muted">{t("login.role")}</span>
                  <strong>{snapshot.role ?? "-"}</strong>
                </li>
                <li>
                  <span className="muted">{t("login.organization")}</span>
                  <strong>{snapshot.organizationId ?? "-"}</strong>
                </li>
                <li>
                  <span className="muted">{t("login.actorIdOptional")}</span>
                  <strong>{snapshot.actorId ?? "-"}</strong>
                </li>
              </ul>
            </>
          ) : (
            <p className="small muted">{t("login.notSignedIn")}</p>
          )}

          <div className="actions">
            <button className="btn btn-secondary" onClick={() => void signOut()} disabled={pending || !snapshot}>
              {t("login.signOut")}
            </button>
          </div>
        </article>

        <article className="panel">
          <h2>{t("login.signInTitle")}</h2>
          <p className="small">{t("login.signInCopy")}</p>
          <div className="input-grid">
            <label>
              {t("login.email")}
              <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" />
            </label>
            <label>
              {t("login.password")}
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="********"
              />
            </label>
          </div>
          {errorMessage ? (
            <p className="small" style={{ color: "var(--danger)" }}>
              {errorMessage}
            </p>
          ) : null}
          <p className="small muted">
            {isKoLocale ? "계정이 없나요?" : "Need an account?"}{" "}
            <Link href="/signup">{isKoLocale ? "회원가입" : "Sign up"}</Link>
            {" · "}
            <Link href="/forgot-password">{isKoLocale ? "비밀번호 찾기" : "Forgot password"}</Link>
          </p>
          <div className="actions">
            <button className="btn btn-primary" onClick={() => void signIn()} disabled={pending || !email.trim() || !password}>
              {t("login.signIn")}
            </button>
          </div>
        </article>
      </section>
    </main>
  );
}
