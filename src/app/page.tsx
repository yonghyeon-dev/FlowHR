import { env } from "@/lib/env";

const modules = [
  ["근무일정", "근로 및 휴게시간 계획을 기준으로 근무 형태를 관리합니다."],
  ["출퇴근기록", "위치, Wi-Fi, PC 인증 방식으로 출퇴근 시간을 기록합니다."],
  ["휴가관리", "연차, 병가 등 다양한 휴가의 발생과 사용을 추적합니다."],
  ["전자결재", "근무·휴가 요청과 승인 흐름을 정책에 맞게 처리합니다."],
  ["급여정산", "근태 데이터를 기반으로 세전 급여 계산 결과를 제공합니다."],
  ["ERP/API 연동", "외부 시스템과 인사 데이터를 연동하여 운영을 통합합니다."]
] as const;

export default function HomePage() {
  return (
    <main className="page">
      <section className="hero">
        <h1>FlowHR Runtime Foundation</h1>
        <p>
          Next.js + Supabase + Prisma 조합으로 HRM MVP 기반을 구성했습니다.
          현재 WI-0001(출퇴근 기록 → 근태 집계 → 급여 반영)과 WI-0002(휴가 요청/승인)
          수직 슬라이스가 구현되어 있습니다.
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