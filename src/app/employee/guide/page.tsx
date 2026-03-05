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
    summary: "출근/퇴근 시간을 확인하고 누락이나 오기록이 있으면 정정 요청을 제출하세요.",
    steps: [
      "왼쪽 메뉴에서 출퇴근 메뉴로 이동합니다.",
      "오늘 또는 최근 기록의 출근/퇴근 시간이 정확한지 확인합니다.",
      "오류가 있으면 정정 요청 사유를 입력하고 제출합니다.",
      "요청 상태(대기/승인/반려)를 타임라인에서 확인합니다."
    ],
    caution: "정정 요청은 급여 계산과 연동되므로 사유를 구체적으로 작성하세요.",
    href: "/employee?focus=attendance",
    cta: "출퇴근 바로가기"
  },
  {
    title: "휴가 신청과 잔여일 확인",
    summary: "휴가 유형을 선택하고 기간/사유를 등록한 뒤 승인 상태를 추적하세요.",
    steps: [
      "휴가 메뉴에서 연차/병가/무급 중 유형을 선택합니다.",
      "일자(또는 시간 단위)와 사유를 입력합니다.",
      "신청 전 잔여 휴가와 중복 일정 여부를 확인합니다.",
      "신청 후 승인 상태와 반려 사유를 확인합니다."
    ],
    caution: "반차/시간 단위 휴가는 종료 시간을 함께 확인해 주세요.",
    href: "/employee?focus=leave",
    cta: "휴가 바로가기"
  },
  {
    title: "급여명세서 조회",
    summary: "확정된 급여명세서를 월별로 조회하고 지급 항목/공제 항목을 확인하세요.",
    steps: [
      "급여명세서 메뉴로 이동합니다.",
      "조회 기간과 상태를 선택해 목록을 필터링합니다.",
      "상세 보기에서 지급/공제/실지급액을 확인합니다.",
      "필요 시 영수증 상태와 전달 여부를 함께 확인합니다."
    ],
    caution: "지급 항목이 예상과 다르면 인사/급여 담당자에게 즉시 문의하세요.",
    href: "/employee/payslips",
    cta: "급여명세서 바로가기"
  },
  {
    title: "근로계약서 확인",
    summary: "내 계약 상태를 확인하고 서명 대기 문서를 처리하세요.",
    steps: [
      "계약서 메뉴에서 최신 계약 문서를 엽니다.",
      "계약 유형, 기간, 보상 조건을 확인합니다.",
      "서명 대기 상태인 경우 안내 절차에 따라 서명합니다.",
      "체결 완료 후 상태가 반영되었는지 확인합니다."
    ],
    caution: "계약 내용 변경이 필요한 경우 서명 전에 HR에 먼저 요청하세요.",
    href: "/employee/contracts",
    cta: "계약서 바로가기"
  }
];

export default function EmployeeGuidePage() {
  return (
    <main className="saas-content">
      <section className="hero-panel">
        <p className="eyebrow">신규 직원 온보딩</p>
        <h1>셀프서비스 가이드</h1>
        <p className="hero-copy">
          입사 직후 가장 많이 사용하는 4가지 기능(출퇴근, 휴가, 급여명세서, 계약서)을 순서대로 빠르게 익힐 수
          있도록 구성했습니다.
        </p>
        <div className="hero-meta">
          <span>권장 소요 시간: 10분</span>
          <Link className="btn btn-primary" href="/employee?focus=self-service-overview">
            셀프서비스 홈 열기
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
            <p className="small muted">유의사항: {step.caution}</p>
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
