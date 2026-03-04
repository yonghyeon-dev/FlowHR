"use client";

import Link from "next/link";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <main className="landing-page error-page">
      <section className="hero-panel error-panel">
        <p className="eyebrow">500</p>
        <h1>문제가 발생했습니다</h1>
        <p className="hero-copy">일시적인 오류일 수 있습니다. 잠시 후 다시 시도해 주세요.</p>
        {error.digest ? <p className="error-hint">오류 코드: {error.digest}</p> : null}
        <div className="error-actions">
          <button className="btn btn-primary" type="button" onClick={() => reset()}>
            다시 시도
          </button>
          <Link className="btn btn-secondary" href="/">
            홈으로 돌아가기
          </Link>
        </div>
      </section>
    </main>
  );
}
