"use client";

import type { Session } from "@supabase/supabase-js";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import {
  clearAccessTokenCookie,
  readAccessTokenCookie,
  syncAccessTokenCookie
} from "@/lib/auth/session-cookie";
import { useI18n } from "@/lib/i18n/provider";
import {
  formatActorRoleLabel,
  formatAdminSessionConnectionState,
  formatEmployeeSessionConnectionState,
  formatSignedInAccountLabel,
  formatUserFacingErrorMessage,
  formatWorkspaceConnectionState
} from "@/lib/product-language";
import { getSupabaseClient } from "@/lib/supabase/client";

const metadataRoles = ["admin", "manager", "employee", "payroll_operator"] as const;
type MetadataRole = (typeof metadataRoles)[number];

type SessionSnapshot = {
  accessToken: string;
  userId: string;
  email: string | null;
  role: string | null;
  organizationId: string | null;
  actorId: string | null;
};

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

function readAppMetadataString(app: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = app[key];
    if (typeof value !== "string") {
      continue;
    }
    const normalized = value.trim();
    if (normalized.length > 0) {
      return normalized;
    }
  }
  return null;
}

function normalizeMetadataRole(value: unknown): MetadataRole | null {
  if (typeof value !== "string") {
    return null;
  }
  return (metadataRoles as readonly string[]).includes(value) ? (value as MetadataRole) : null;
}

async function ensureSessionMetadata(session: Session | null) {
  if (!session?.access_token || !session.user) {
    return;
  }

  const app = (session.user.app_metadata ?? {}) as Record<string, unknown>;
  const role = normalizeMetadataRole(app.role);
  const organizationId = readAppMetadataString(app, "organization_id", "organizationId");
  if (!role || !organizationId) {
    return;
  }

  try {
    await fetch("/api/auth/setup-metadata", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        role,
        organization_id: organizationId
      })
    });
  } catch {
    // noop
  }
}

function parseSession(session: Session | null): SessionSnapshot | null {
  if (!session?.access_token || !session.user?.id) {
    return null;
  }

  const user = session.user;
  const app = (user.app_metadata ?? {}) as Record<string, unknown>;
  const role = readAppMetadataString(app, "role");
  const organizationId = readAppMetadataString(app, "organization_id", "organizationId");
  const actorId = readAppMetadataString(app, "actor_id", "actorId");

  return {
    accessToken: session.access_token,
    userId: user.id,
    email: typeof user.email === "string" ? user.email : null,
    role,
    organizationId,
    actorId
  };
}

export default function LoginPage() {
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
  const hasWorkspaceConnection = Boolean((snapshot?.organizationId ?? "").trim());
  const hasSignedInSession = Boolean((snapshot?.actorId ?? snapshot?.userId ?? "").trim());
  const roleLabel =
    snapshot?.role?.trim()
      ? formatActorRoleLabel(snapshot.role, locale)
      : isKoLocale
        ? "역할 확인 중"
        : "Role pending";
  const sessionStatusLabel =
    snapshot?.role === "admin" || snapshot?.role === "manager" || snapshot?.role === "payroll_operator"
      ? formatAdminSessionConnectionState(hasSignedInSession, locale)
      : formatEmployeeSessionConnectionState(hasSignedInSession, locale);

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
        void ensureSessionMetadata(data.session);
      } catch (error) {
        if (!active) {
          return;
        }
        setErrorMessage(formatUserFacingErrorMessage(error instanceof Error ? error.message : String(error), locale));
      }
    }

    const supabase = getSupabaseClient();
    const listener = supabase.auth.onAuthStateChange((_event, session) => {
      syncAccessTokenCookie(session);
      setSnapshot(parseSession(session));
      void ensureSessionMetadata(session);
    });

    void load();

    return () => {
      active = false;
      listener.data.subscription.unsubscribe();
    };
  }, [locale]);

  useEffect(() => {
    if (!snapshot) {
      return;
    }

    let frameId = 0;
    let timeoutId = 0;
    let cancelled = false;
    const verifyCookieAndRedirect = () => {
      if (cancelled) {
        return;
      }

      if (readAccessTokenCookie() === snapshot.accessToken) {
        window.location.href = loginSuccessTarget;
        return;
      }

      frameId = window.requestAnimationFrame(verifyCookieAndRedirect);
    };

    timeoutId = window.setTimeout(() => {
      frameId = window.requestAnimationFrame(verifyCookieAndRedirect);
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [loginSuccessTarget, snapshot]);

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
      setErrorMessage(formatUserFacingErrorMessage(error instanceof Error ? error.message : String(error), locale));
    } finally {
      setPending(false);
    }
  }

  function handleSignInSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !email.trim() || !password) {
      return;
    }
    void signIn();
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
      setErrorMessage(formatUserFacingErrorMessage(error instanceof Error ? error.message : String(error), locale));
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
                  <strong>{formatSignedInAccountLabel(snapshot.email, locale)}</strong>
                </li>
                <li>
                  <span className="muted">{t("login.role")}</span>
                  <strong>{roleLabel}</strong>
                </li>
                <li>
                  <span className="muted">{t("login.organization")}</span>
                  <strong>{formatWorkspaceConnectionState(hasWorkspaceConnection, locale)}</strong>
                </li>
                <li>
                  <span className="muted">{t("login.actorIdOptional")}</span>
                  <strong>{sessionStatusLabel}</strong>
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
          <form onSubmit={handleSignInSubmit}>
            <div className="input-grid">
              <label>
                {t("login.email")}
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@company.com"
                />
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
              <button className="btn btn-primary" type="submit" disabled={pending || !email.trim() || !password}>
                {t("login.signIn")}
              </button>
            </div>
          </form>
        </article>
      </section>
    </main>
  );
}
