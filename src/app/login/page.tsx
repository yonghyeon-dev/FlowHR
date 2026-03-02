"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useI18n } from "@/lib/i18n/provider";
import { getSupabaseClient } from "@/lib/supabase/client";

type SessionSnapshot = {
  userId: string;
  email: string | null;
  role: string | null;
  organizationId: string | null;
  actorId: string | null;
};

function parseSession(session: unknown): SessionSnapshot | null {
  if (!session || typeof session !== "object" || !("user" in session)) {
    return null;
  }
  const user = (session as { user: unknown }).user;
  if (!user || typeof user !== "object" || !("id" in user) || typeof (user as { id: unknown }).id !== "string") {
    return null;
  }

  const typed = user as {
    id: string;
    email?: string | null;
    app_metadata?: Record<string, unknown>;
  };

  const app = typed.app_metadata ?? {};
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
    userId: typed.id,
    email: typeof typed.email === "string" ? typed.email : null,
    role,
    organizationId,
    actorId
  };
}

export default function LoginPage() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const isKoLocale = locale === "ko";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<SessionSnapshot | null>(null);

  const target = useMemo(() => {
    const role = snapshot?.role ?? "";
    if (role === "admin" || role === "payroll_operator" || role === "manager") {
      return "/admin";
    }
    return "/employee";
  }, [snapshot]);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const supabase = getSupabaseClient();
        const { data } = await supabase.auth.getSession();
        if (!active) {
          return;
        }
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
      router.replace(target);
    }, 600);
    return () => {
      window.clearTimeout(timer);
    };
  }, [router, snapshot, target]);

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
          <Link className="btn btn-secondary" href={target}>
            {target === "/admin" ? t("login.goToAdmin") : t("login.goToEmployee")}
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
