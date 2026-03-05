import Link from "next/link";

type OnboardingGuideCard = {
  title: string;
  summary: string;
  href: string;
  ctaLabel: string;
  steps: string[];
  checkBefore: string[];
};

const onboardingGuideCards: OnboardingGuideCard[] = [
  {
    title: "출퇴근 기록하기",
    summary: "근무 시작/종료 시간을 기록하고, 누락 시 정정 요청을 올립니다.",
    href: "/employee?focus=attendance",
    ctaLabel: "출퇴근으로 이동",
    steps: [
      "직원 홈에서 출퇴근 섹션으로 이동합니다.",
      "출근/퇴근 버튼으로 오늘 기록을 남깁니다.",
      "기록이 누락되었으면 사유와 함께 정정 요청을 제출합니다."
    ],
    checkBefore: ["근무지 또는 근무 일정이 배정되어 있는지 확인", "모바일 접근 시 위치 권한 허용 상태 확인"]
  },
  {
    title: "휴가 신청하기",
    summary: "연차/반차/시간 단위 휴가를 신청하고 승인 상태를 확인합니다.",
    href: "/employee?focus=leave",
    ctaLabel: "휴가로 이동",
    steps: [
      "휴가 유형(연차, 반차, 시간)을 선택합니다.",
      "시작일/종료일 또는 시간을 입력하고 사유를 작성합니다.",
      "제출 후 요청 이력에서 승인 상태와 반려 사유를 확인합니다."
    ],
    checkBefore: ["남은 휴가 잔여를 먼저 확인", "팀 일정과 겹치는 날짜인지 확인"]
  },
  {
    title: "급여명세서 확인하기",
    summary: "확정된 급여 내역과 공제 항목을 확인하고 필요한 경우 비교합니다.",
    href: "/employee/payslips",
    ctaLabel: "급여명세서로 이동",
    steps: [
      "최신 월의 확정 상태 급여명세서를 엽니다.",
      "지급액, 공제액, 실수령액 항목을 확인합니다.",
      "이전 월과 비교가 필요하면 비교 뷰를 활용합니다."
    ],
    checkBefore: ["조회 월이 정확한지 확인", "확정 전 데이터는 변동될 수 있음"]
  },
  {
    title: "계약서 확인하기",
    summary: "내 계약서 상태를 확인하고 열람 또는 서명 요청에 대응합니다.",
    href: "/employee/contracts",
    ctaLabel: "계약서로 이동",
    steps: [
      "계약서 목록에서 최신 문서를 선택합니다.",
      "상태(검토 필요/서명 대기/완료)를 확인합니다.",
      "요청된 계약서가 있으면 기한 내 검토 및 서명을 완료합니다."
    ],
    checkBefore: ["문서 버전과 적용일 확인", "문의가 필요한 조항은 인사팀에 확인"]
  }
];

const firstWeekChecklist = [
  "첫 출근일 출퇴근 기록 1회 완료",
  "휴가 신청 테스트 또는 정책 확인 완료",
  "최근 급여명세서 1건 확인",
  "계약서 상태 확인 및 필요한 액션 처리",
  "문의 채널과 공지 확인 경로 저장"
];

export default function EmployeeGuidePage() {
  return (
    <main className="saas-content">
      <header className="hero-panel">
        <p className="eyebrow">FlowHR Employee</p>
        <h1>신규 직원 셀프서비스 온보딩 가이드</h1>
        <p className="hero-copy">
          입사 첫 주에 가장 자주 사용하는 업무를 빠르게 익힐 수 있도록 출퇴근, 휴가, 급여명세서, 계약서 확인
          절차를 한 번에 안내합니다.
        </p>
        <div className="hero-meta">
          <span>권장 소요 시간: 약 15분</span>
          <span>진행 순서: 출퇴근 → 휴가 → 급여명세서 → 계약서</span>
          <Link href="/employee">직원 홈 바로가기</Link>
        </div>
      </header>

      <section className="panel-grid" aria-label="온보딩 업무 가이드">
        {onboardingGuideCards.map((card) => (
          <article key={card.title} className="panel">
            <h2>{card.title}</h2>
            <p className="small">{card.summary}</p>

            <p className="small" style={{ marginBottom: 8 }}>
              진행 방법
            </p>
            <ol className="simple-list">
              {card.steps.map((step) => (
                <li key={step}>
                  <span>{step}</span>
                </li>
              ))}
            </ol>

            <p className="small" style={{ marginTop: 12, marginBottom: 8 }}>
              시작 전 확인
            </p>
            <ul className="simple-list">
              {card.checkBefore.map((item) => (
                <li key={item}>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="panel-actions">
              <Link href={card.href} className="btn btn-primary">
                {card.ctaLabel}
              </Link>
            </div>
          </article>
        ))}
      </section>

      <section className="panel-grid" aria-label="첫 주 체크리스트와 문의 안내">
        <article className="panel">
          <h2>첫 주 체크리스트</h2>
          <p className="small">아래 항목을 완료하면 기본 셀프서비스 흐름을 스스로 처리할 수 있습니다.</p>
          <ul className="simple-list">
            {firstWeekChecklist.map((item) => (
              <li key={item}>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="panel">
          <h2>문의 및 공지 확인</h2>
          <p className="small">이슈가 있으면 아래 경로로 문의하고, 주요 공지는 수시로 확인해 주세요.</p>
          <ul className="simple-list">
            <li>
              <span>인사/근태 문의: 소속 조직 HR 담당자 또는 운영 채널로 전달</span>
            </li>
            <li>
              <span>급여/명세서 문의: 급여 담당자에게 지급 월과 항목을 함께 전달</span>
            </li>
            <li>
              <span>
                공지 확인: <Link href="/employee/notices">직원 공지 게시판</Link>
              </span>
            </li>
            <li>
              <span>
                요청 이력 확인: <Link href="/employee?focus=request-timeline">요청 타임라인</Link>
              </span>
            </li>
          </ul>
        </article>
      </section>
    </main>
  );
}
