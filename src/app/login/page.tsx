"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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
        <h1>로그인</h1>
        <p className="hero-copy">
          Supabase Auth 세션으로 API를 호출합니다. 로컬 개발에서는 Dev Header 모드가 계속 지원됩니다.
        </p>
        <div className="hero-meta">
          <Link className="btn btn-secondary" href="/">
            홈
          </Link>
          <Link className="btn btn-secondary" href={target}>
            {target === "/admin" ? "관리자" : "직원"} 화면으로
          </Link>
        </div>
      </section>

      <section className="panel-grid">
        <article className="panel">
          <h2>세션 상태</h2>
          {snapshot ? (
            <ul className="simple-list" aria-label="세션 정보">
              <li>
                <span className="muted">User ID</span>
                <strong>{snapshot.userId}</strong>
              </li>
              <li>
                <span className="muted">Email</span>
                <strong>{snapshot.email ?? "-"}</strong>
              </li>
              <li>
                <span className="muted">Role</span>
                <strong>{snapshot.role ?? "-"}</strong>
              </li>
              <li>
                <span className="muted">Organization</span>
                <strong>{snapshot.organizationId ?? "-"}</strong>
              </li>
              <li>
                <span className="muted">Actor ID(선택)</span>
                <strong>{snapshot.actorId ?? "-"}</strong>
              </li>
            </ul>
          ) : (
            <p className="small muted">현재 로그인되어 있지 않습니다.</p>
          )}

          <div className="actions">
            <button className="btn btn-secondary" onClick={() => void signOut()} disabled={pending || !snapshot}>
              로그아웃
            </button>
          </div>
        </article>

        <article className="panel">
          <h2>로그인</h2>
          <p className="small">
            이메일/비밀번호 로그인을 사용합니다. (Supabase 설정에서 해당 Provider가 활성화되어 있어야 합니다.)
          </p>
          <div className="input-grid">
            <label>
              Email
              <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" />
            </label>
            <label>
              Password
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
              로그인
            </button>
          </div>
        </article>
      </section>
    </main>
  );
}
