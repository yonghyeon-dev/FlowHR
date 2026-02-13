import { env } from "@/lib/env";

const modules = [
  ["근무일정", "근로/휴게 시간과 다양한 근무형태를 관리합니다."],
  ["출퇴근기록", "위치/Wi-Fi/PC 기반 출퇴근 기록을 처리합니다."],
  ["휴가관리", "연차/경조사 등 휴가 발생과 사용을 집계합니다."],
  ["전자결재", "근태·휴가·비용 요청 승인흐름을 통합합니다."],
  ["급여정산", "근태 기반 총지급(세전) 산정 결과를 제공합니다."],
  ["ERP/API 연동", "외부 시스템과 인력 데이터를 동기화합니다."]
] as const;

export default function HomePage() {
  return (
    <main className="page">
      <section className="hero">
        <h1>FlowHR Runtime Foundation</h1>
        <p>
          Next.js + Supabase + Prisma 조합으로 초기 런타임을 구성했습니다.
          WI-0001(출퇴근→집계→급여)의 구현 베이스입니다.
        </p>
        <div className="grid">
          {modules.map(([title, desc]) => (
            <article className="card" key={title}>
              <h2>{title}</h2>
              <p>{desc}</p>
            </article>
          ))}
        </div>
        <div className="meta">
          Supabase URL: <code>{env.NEXT_PUBLIC_SUPABASE_URL}</code>
        </div>
      </section>
    </main>
  );
}
