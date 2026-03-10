import Link from "next/link";

type GuideStep = {
  title: string;
  summary: string;
  steps: string[];
  caution: string;
  href: string;
  cta: string;
};

const onboardingSteps: GuideStep[] = [
  {
    title: "출퇴근 기록과 정정 요청",
    summary: "출근/퇴근 시간을 확인하고 누락이나 오류가 있으면 정정 요청을 제출하세요.",
    steps: [
      "왼쪽 메뉴에서 요청 센터로 이동합니다.",
      "출퇴근 정정 요청 카드에서 현재 근태와 정정 흐름을 확인합니다.",
      "오류가 있으면 정정 사유를 작성하고 제출합니다.",
      "요청 피드백과 타임라인에서 처리 상태를 확인합니다.",
    ],
    caution: "정정 요청은 급여 계산과 연결되므로 사유를 구체적으로 작성해야 합니다.",
    href: "/employee/attendance",
    cta: "출퇴근 요청 센터 열기",
  },
  {
    title: "휴가 요청과 잔여 연차 확인",
    summary: "휴가 유형과 기간을 선택하고 요청한 뒤 승인 상태를 추적하세요.",
    steps: [
      "요청 센터에서 휴가 요청 카드로 이동합니다.",
      "휴가 유형, 기간, 사유를 입력합니다.",
      "잔여 휴가와 팀 일정에 충돌이 없는지 확인합니다.",
      "요청 피드백에서 승인/반려 상태를 확인합니다.",
    ],
    caution: "반차나 시간 단위 휴가는 시작/종료 시간을 다시 확인하세요.",
    href: "/employee/leave",
    cta: "휴가 요청 센터 열기",
  },
  {
    title: "급여 명세서 조회",
    summary: "확정된 급여 명세서를 월별로 확인하고 지급 항목과 공제 내역을 검토합니다.",
    steps: [
      "급여 명세서 메뉴로 이동합니다.",
      "조회 기간과 상태를 선택해 목록을 좁힙니다.",
      "상세 보기에서 지급/공제/실지급액을 확인합니다.",
      "필요하면 수신 확인이나 비교 보기를 이어서 사용합니다.",
    ],
    caution: "실지급액이 예상과 다르면 인사/급여 담당자에게 바로 문의하세요.",
    href: "/employee/payslips",
    cta: "급여 명세서 열기",
  },
  {
    title: "근로계약 확인",
    summary: "전자계약 상태를 확인하고 서명 대기 문서를 처리하세요.",
    steps: [
      "계약 메뉴에서 최신 문서를 엽니다.",
      "계약 유형, 기간, 보상 조건을 검토합니다.",
      "서명 대기 상태면 안내에 따라 응답합니다.",
      "체결 완료 후 상태가 반영됐는지 확인합니다.",
    ],
    caution: "계약 내용 수정이 필요하면 서명 전에 HR에 요청해야 합니다.",
    href: "/employee/contracts",
    cta: "계약함 열기",
  },
];

export default function EmployeeGuidePage() {
  return (
    <main className="saas-content">
      <section className="hero-panel">
        <p className="eyebrow">신규 직원 온보딩</p>
        <h1>셀프서비스 가이드</h1>
        <p className="hero-copy">
          입사 직후 가장 많이 쓰는 흐름을 기준으로 요청, 급여, 계약 경로를 빠르게
          익힐 수 있도록 정리했습니다.
        </p>
        <div className="hero-meta">
          <span>권장 소요 시간: 10분</span>
          <Link className="btn btn-primary" href="/employee/requests">
            요청 센터 열기
          </Link>
        </div>
      </section>

      <section className="panel-grid">
        {onboardingSteps.map((step, index) => (
          <article className="panel" key={step.title}>
            <h2>
              {index + 1}. {step.title}
            </h2>
            <p className="small">{step.summary}</p>
            <ol className="simple-list">
              {step.steps.map((item) => (
                <li key={item}>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
            <p className="small muted">주의사항: {step.caution}</p>
            <div className="actions">
              <Link className="btn btn-secondary" href={step.href}>
                {step.cta}
              </Link>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
