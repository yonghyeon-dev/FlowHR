"use client";

import Link from "next/link";

type GlobalErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalErrorPage({ error, reset }: GlobalErrorPageProps) {
  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "24px",
          fontFamily: '"Pretendard", "Noto Sans KR", system-ui, -apple-system, sans-serif',
          background:
            "radial-gradient(1000px 480px at 0% -10%, #cde0ff 0%, transparent 60%), linear-gradient(180deg, #eaf4ff, #f7fbff)",
          color: "#0f2548"
        }}
      >
        <main
          style={{
            width: "min(560px, 100%)",
            border: "1px solid #cdddf5",
            borderRadius: "18px",
            background: "#ffffff",
            padding: "24px",
            boxShadow: "0 18px 36px rgba(28, 74, 142, 0.08)",
            textAlign: "center"
          }}
        >
          <p style={{ margin: "0 0 8px", color: "#1f5fd1", fontWeight: 700, letterSpacing: "0.08em" }}>오류</p>
          <h1 style={{ margin: 0, fontSize: "1.75rem", lineHeight: 1.2 }}>문제가 발생했습니다</h1>
          <p style={{ margin: "10px 0 0", color: "#4a678f", lineHeight: 1.5 }}>
            페이지를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.
          </p>
          {error.digest ? (
            <p style={{ margin: "10px 0 0", color: "#4a678f", fontSize: "0.82rem" }}>오류 코드: {error.digest}</p>
          ) : null}
          <div
            style={{
              marginTop: "16px",
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: "8px"
            }}
          >
            <button
              type="button"
              onClick={() => reset()}
              style={{
                border: "1px solid transparent",
                borderRadius: "10px",
                padding: "9px 12px",
                cursor: "pointer",
                color: "#fff",
                background: "linear-gradient(135deg, #2467dc 0%, #1f58bd 100%)"
              }}
            >
              다시 시도
            </button>
            <Link
              href="/"
              style={{
                border: "1px solid #cdddf5",
                borderRadius: "10px",
                padding: "9px 12px",
                color: "#0f2548",
                background: "#e6efff",
                textDecoration: "none"
              }}
            >
              홈으로 돌아가기
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
