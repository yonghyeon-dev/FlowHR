import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="landing-page error-page">
      <section className="hero-panel error-panel">
        <p className="eyebrow">404</p>
        <h1>페이지를 찾을 수 없습니다</h1>
        <p className="hero-copy">요청하신 주소가 변경되었거나 삭제되었습니다.</p>
        <div className="error-actions">
          <Link className="btn btn-primary" href="/">
            홈으로 돌아가기
          </Link>
        </div>
      </section>
    </main>
  );
}
