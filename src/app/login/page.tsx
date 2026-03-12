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
  const { locale } = useI18n();
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
    <main className="login-page">
      <div className="login-shell">
        <section className="login-brand-panel">
          <div className="login-brand-logo">FlowHR</div>
          <h1>{isKoLocale ? "하나의 계정으로 모든 HR 업무를 연결합니다." : "One account for every HR workflow."}</h1>
          <p>
            {isKoLocale
              ? "관리자는 운영 스테이션에서 처리하고, 직원은 오늘 해야 할 일과 문서를 빠르게 끝낼 수 있도록 역할별로 밀도를 나눕니다."
              : "Admins work from an operating station while employees finish today's tasks and documents on a lighter surface."}
          </p>
          <div className="login-brand-points">
            <div className="login-brand-point">
              {isKoLocale
                ? "근태, 휴가, 결재, 계약, 급여, 공지를 하나의 제품 언어로 연결"
                : "Unify attendance, leave, approvals, contracts, payroll, and notices under one product language"}
            </div>
            <div className="login-brand-point">
              {isKoLocale
                ? "고객사 관리자와 직원은 같은 제품을 역할별 뷰로 사용"
                : "Customer admins and employees share one product with role-based views"}
            </div>
            <div className="login-brand-point">
              {isKoLocale
                ? "운영 표면과 내부 ops 표면은 명확히 분리"
                : "Operational surfaces remain separate from internal ops tools"}
            </div>
          </div>
        </section>

        <section className="login-form-panel">
          <h1>{isKoLocale ? "로그인" : "Sign in"}</h1>
          <p className="login-desc">
            {isKoLocale ? "계정에 로그인해 역할에 맞는 워크스페이스로 이동하세요." : "Sign in and continue to the workspace for your role."}
          </p>

          {errorMessage ? <div className="login-inline-status error">{errorMessage}</div> : null}
          {snapshot ? (
            <div className="login-inline-status">
              <strong>{isKoLocale ? "현재 세션" : "Current session"}</strong>
              <div>{formatSignedInAccountLabel(snapshot.email, locale)}</div>
              <div>
                {roleLabel} · {formatWorkspaceConnectionState(hasWorkspaceConnection, locale)} · {sessionStatusLabel}
              </div>
            </div>
          ) : null}

          <form className="login-form-stack" onSubmit={handleSignInSubmit}>
            <label className="form-group">
              <span className="form-label">{isKoLocale ? "이메일" : "Email"}</span>
              <input
                autoComplete="email"
                className="form-input"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@company.com"
                type="email"
                value={email}
              />
            </label>
            <label className="form-group">
              <span className="form-label">{isKoLocale ? "비밀번호" : "Password"}</span>
              <input
                autoComplete="current-password"
                className="form-input"
                onChange={(event) => setPassword(event.target.value)}
                placeholder={isKoLocale ? "비밀번호를 입력하세요" : "Enter your password"}
                type="password"
                value={password}
              />
            </label>

            <div className="login-actions">
              <button className="btn btn-primary" disabled={pending || !email.trim() || !password} type="submit">
                {pending ? (isKoLocale ? "로그인 중..." : "Signing in...") : isKoLocale ? "로그인" : "Sign in"}
              </button>
              <Link className="btn btn-secondary" href="/">
                {isKoLocale ? "홈으로" : "Home"}
              </Link>
              <button className="btn btn-secondary" disabled={pending || !snapshot} onClick={() => void signOut()} type="button">
                {isKoLocale ? "로그아웃" : "Sign out"}
              </button>
            </div>
          </form>

          <div className="demo-access">
            <div className="demo-access-title">{isKoLocale ? "빠른 이동" : "Quick access"}</div>
            <div className="demo-links">
              <Link className="demo-link" href="/">
                <span className="demo-icon home">HM</span>
                <span>{isKoLocale ? "소개 화면" : "Landing"}</span>
              </Link>
              <Link className="demo-link" href="/admin">
                <span className="demo-icon admin">AD</span>
                <span>{isKoLocale ? "관리자 워크스페이스" : "Admin workspace"}</span>
              </Link>
              <Link className="demo-link" href="/employee">
                <span className="demo-icon employee">EM</span>
                <span>{isKoLocale ? "직원 홈" : "Employee home"}</span>
              </Link>
            </div>
          </div>

          <div className="login-footer-links">
            <span>
              {redirectTarget
                ? `${isKoLocale ? "로그인 후 이동" : "After sign-in"}: ${redirectTarget}`
                : isKoLocale
                  ? "세션이 없으면 로그인 후 홈으로 이동합니다."
                  : "Without a session, sign-in returns you to the default home."}
            </span>
            <Link href={loginSuccessTarget}>
              {workspaceTarget === "/admin"
                ? isKoLocale
                  ? "관리자 바로가기"
                  : "Go to admin"
                : isKoLocale
                  ? "직원 홈 바로가기"
                  : "Go to employee"}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
