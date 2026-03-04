"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { getSupabaseClient } from "@/lib/supabase/client";

function toResetPasswordErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  if (normalized.includes("auth session missing")) {
    return "재설정 링크가 만료되었거나 유효하지 않습니다. 비밀번호 찾기를 다시 진행해 주세요.";
  }
  if (normalized.includes("password should be at least")) {
    return "비밀번호는 최소 6자 이상이어야 합니다.";
  }
  if (normalized.includes("same password")) {
    return "이전 비밀번호와 다른 비밀번호를 입력해 주세요.";
  }

  return "비밀번호 재설정에 실패했습니다. 잠시 후 다시 시도해 주세요.";
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function resetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!password) {
      setErrorMessage("새 비밀번호를 입력해 주세요.");
      setSuccessMessage(null);
      return;
    }
    if (password !== passwordConfirm) {
      setErrorMessage("비밀번호와 비밀번호 확인이 일치하지 않습니다.");
      setSuccessMessage(null);
      return;
    }

    setPending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const supabase = getSupabaseClient();
      const sessionResult = await supabase.auth.getSession();
      if (sessionResult.error) {
        throw sessionResult.error;
      }
      if (!sessionResult.data.session) {
        throw new Error("Auth session missing");
      }

      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        throw error;
      }

      setSuccessMessage("비밀번호가 변경되었습니다. 로그인 페이지로 이동합니다.");
      window.setTimeout(() => {
        router.replace("/login");
      }, 900);
    } catch (error) {
      setErrorMessage(toResetPasswordErrorMessage(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="landing-page">
      <section className="hero-panel">
        <p className="eyebrow">FlowHR</p>
        <h1>비밀번호 재설정</h1>
        <p className="hero-copy">새 비밀번호를 입력하고 변경을 완료해 주세요.</p>
        <div className="hero-meta">
          <Link className="btn btn-secondary" href="/forgot-password">
            비밀번호 찾기로 이동
          </Link>
          <Link className="btn btn-secondary" href="/login">
            로그인
          </Link>
        </div>
      </section>

      <section className="panel-grid">
        <article className="panel">
          <h2>새 비밀번호 설정</h2>
          <p className="small">재설정 링크에서 이 페이지로 진입한 뒤 비밀번호를 변경해 주세요.</p>

          <form onSubmit={(event) => void resetPassword(event)}>
            <div className="input-grid">
              <label>
                새 비밀번호
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="********"
                  autoComplete="new-password"
                />
              </label>
              <label>
                비밀번호 확인
                <input
                  type="password"
                  value={passwordConfirm}
                  onChange={(event) => setPasswordConfirm(event.target.value)}
                  placeholder="********"
                  autoComplete="new-password"
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
              <button
                type="submit"
                className="btn btn-primary"
                disabled={pending || !password || !passwordConfirm}
              >
                비밀번호 변경
              </button>
            </div>
          </form>
        </article>

        <article className="panel">
          <h2>문제가 있나요?</h2>
          <p className="small">링크가 만료되었거나 오류가 발생하면 비밀번호 찾기를 다시 진행해 주세요.</p>
          <div className="actions">
            <Link className="btn btn-secondary" href="/forgot-password">
              비밀번호 찾기 다시하기
            </Link>
          </div>
        </article>
      </section>
    </main>
  );
}

