"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";

import { getSupabaseClient } from "@/lib/supabase/client";

function toForgotPasswordErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  if (normalized.includes("unable to validate email address")) {
    return "이메일 형식을 확인해 주세요.";
  }
  if (normalized.includes("too many requests")) {
    return "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.";
  }

  return "비밀번호 재설정 요청에 실패했습니다. 잠시 후 다시 시도해 주세요.";
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function requestResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage("이메일을 입력해 주세요.");
      setSuccessMessage(null);
      return;
    }

    setPending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const supabase = getSupabaseClient();
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, { redirectTo });

      if (error) {
        throw error;
      }

      setSuccessMessage(
        "입력한 이메일로 비밀번호 재설정 안내를 보냈습니다. 계정이 없어도 동일한 메시지가 표시됩니다."
      );
    } catch (error) {
      setErrorMessage(toForgotPasswordErrorMessage(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="landing-page">
      <section className="hero-panel">
        <p className="eyebrow">FlowHR</p>
        <h1>비밀번호 찾기</h1>
        <p className="hero-copy">가입한 이메일로 비밀번호 재설정 링크를 발송합니다.</p>
        <div className="hero-meta">
          <Link className="btn btn-secondary" href="/">
            홈으로
          </Link>
          <Link className="btn btn-secondary" href="/login">
            로그인
          </Link>
        </div>
      </section>

      <section className="panel-grid">
        <article className="panel">
          <h2>재설정 메일 받기</h2>
          <p className="small">이메일 주소를 입력하면 재설정 링크를 전송합니다.</p>

          <form onSubmit={(event) => void requestResetPassword(event)}>
            <div className="input-grid">
              <label className="full">
                이메일
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                />
              </label>
            </div>

            {errorMessage ? (
              <p className="small" style={{ color: "var(--danger)" }}>
                {errorMessage}
              </p>
            ) : null}
            {successMessage ? (
              <p className="small" style={{ color: "var(--ok)" }}>
                {successMessage}
              </p>
            ) : null}

            <div className="actions">
              <button type="submit" className="btn btn-primary" disabled={pending || !email.trim()}>
                재설정 메일 보내기
              </button>
            </div>
          </form>
        </article>

        <article className="panel">
          <h2>로그인으로 돌아가기</h2>
          <p className="small">비밀번호를 기억했다면 로그인 페이지로 이동해 주세요.</p>
          <div className="actions">
            <Link className="btn btn-secondary" href="/login">
              로그인으로 이동
            </Link>
          </div>
        </article>
      </section>
    </main>
  );
}

