import Link from "next/link";

import { createTranslator } from "@/lib/i18n/messages";
import { getRequestLocale } from "@/lib/i18n/server";

type RequestActionCard = {
  id: string;
  title: string;
  description: string;
  actions: {
    href: string;
    label: string;
    tone: "primary" | "secondary";
  }[];
};

function buildRequestActionCards(locale: "ko" | "en"): RequestActionCard[] {
  if (locale === "ko") {
    return [
      {
        id: "attendance-actions",
        title: "출퇴근 정정 요청",
        description: "오늘 근태를 확인하고 정정 요청 초안을 바로 여는 흐름입니다.",
        actions: [
          { href: "/employee?focus=attendance", label: "출퇴근 정정 열기", tone: "primary" },
          { href: "/employee/schedule?source=employee-requests", label: "내 근무 일정 보기", tone: "secondary" },
        ],
      },
      {
        id: "leave-actions",
        title: "휴가 요청",
        description: "휴가 신청, 잔여 연차 확인, 팀 캘린더 점검을 요청 중심으로 묶습니다.",
        actions: [
          { href: "/employee?focus=leave", label: "휴가 요청 열기", tone: "primary" },
          { href: "/employee/benefits?source=employee-requests", label: "복리후생 보기", tone: "secondary" },
        ],
      },
      {
        id: "request-monitoring",
        title: "요청 상태와 후속 조치",
        description: "요청 피드백, 검색, 타임라인을 한 곳에서 확인하고 대기 건을 추적합니다.",
        actions: [
          { href: "/employee?focus=request-feedback", label: "요청 피드백 보기", tone: "primary" },
          { href: "/employee?focus=request-search-sort", label: "요청 검색 열기", tone: "secondary" },
          { href: "/employee?focus=request-timeline", label: "요청 타임라인 보기", tone: "secondary" },
        ],
      },
      {
        id: "resubmit-workbench",
        title: "반려 요청 재제출",
        description: "반려 또는 취소된 요청을 다시 불러와 초안으로 수정하고 재제출합니다.",
        actions: [
          { href: "/employee?focus=request-resubmit", label: "재제출 워크벤치 열기", tone: "primary" },
          { href: "/employee", label: "Today 홈으로 돌아가기", tone: "secondary" },
        ],
      },
    ];
  }

  return [
    {
      id: "attendance-actions",
      title: "Attendance correction requests",
      description: "Review today's attendance and open a correction draft from a stable requests route.",
      actions: [
        { href: "/employee?focus=attendance", label: "Open attendance correction", tone: "primary" },
        { href: "/employee/schedule?source=employee-requests", label: "View my schedule", tone: "secondary" },
      ],
    },
    {
      id: "leave-actions",
      title: "Leave requests",
      description: "Keep leave submission, balance review, and team calendar checks under the requests area.",
      actions: [
        { href: "/employee?focus=leave", label: "Open leave request", tone: "primary" },
        { href: "/employee/benefits?source=employee-requests", label: "Open benefits", tone: "secondary" },
      ],
    },
    {
      id: "request-monitoring",
      title: "Request status and follow-up",
      description: "Track feedback, search, and timeline views for attendance and leave requests.",
      actions: [
        { href: "/employee?focus=request-feedback", label: "Open request feedback", tone: "primary" },
        { href: "/employee?focus=request-search-sort", label: "Open request search", tone: "secondary" },
        { href: "/employee?focus=request-timeline", label: "Open request timeline", tone: "secondary" },
      ],
    },
    {
      id: "resubmit-workbench",
      title: "Resubmit rejected requests",
      description: "Bring rejected or canceled requests back into draft state and continue from a stable route.",
      actions: [
        { href: "/employee?focus=request-resubmit", label: "Open resubmit workbench", tone: "primary" },
        { href: "/employee", label: "Return to Today", tone: "secondary" },
      ],
    },
  ];
}

export default async function EmployeeRequestsPage() {
  const locale = await getRequestLocale();
  const t = createTranslator(locale);
  const requestCards = buildRequestActionCards(locale);

  return (
    <main className="saas-content">
      <section className="hero-panel">
        <p className="eyebrow">{locale === "ko" ? "직원 요청 센터" : "Employee Requests"}</p>
        <h1>{locale === "ko" ? "요청 센터" : "Requests Hub"}</h1>
        <p className="hero-copy">
          {locale === "ko"
            ? "Today 홈은 요약과 우선순위 확인에 집중하고, 요청 생성과 상태 추적은 이 전용 경로에서 이어갑니다."
            : "Keep the Today home focused on summary and priorities, then continue request work from this dedicated route."}
        </p>
        <div className="hero-meta">
          <span>{locale === "ko" ? "요청 흐름 전용 진입점" : "Dedicated entry for request flows"}</span>
          <Link className="btn btn-primary" href="/employee">
            {locale === "ko" ? "Today 홈으로 이동" : "Go to Today"}
          </Link>
          <Link className="btn btn-secondary" href="/employee/guide">
            {locale === "ko" ? "가이드 보기" : "Open guide"}
          </Link>
        </div>
      </section>

      <section className="panel-grid">
        {requestCards.map((card) => (
          <article key={card.id} className="panel" id={card.id}>
            <h2>{card.title}</h2>
            <p className="small">{card.description}</p>
            <div className="actions">
              {card.actions.map((action) => (
                <Link
                  key={`${card.id}-${action.href}`}
                  className={action.tone === "primary" ? "btn btn-primary" : "btn btn-secondary"}
                  href={action.href}
                >
                  {action.label}
                </Link>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="panel">
        <h2>{locale === "ko" ? "왜 요청 센터를 분리했나요?" : "Why a dedicated requests hub?"}</h2>
        <p className="small">
          {locale === "ko"
            ? "숨은 섹션과 focus 파라미터에 의존하던 요청 흐름을 안정된 라우트로 승격하는 첫 단계입니다. 다음 단계에서는 실제 요청 워크스페이스를 이 경로 아래로 옮깁니다."
            : "This is the first route-first seam that reduces reliance on hidden sections and focus parameters. The next step is to migrate the actual request workspace under this route."}
        </p>
        <div className="actions">
          <Link className="btn btn-secondary" href="/employee/notices">
            {t("employee.nav.notices")}
          </Link>
          <Link className="btn btn-secondary" href="/employee/payslips">
            {t("employee.nav.payslips")}
          </Link>
          <Link className="btn btn-secondary" href="/employee/contracts">
            {t("employee.nav.contracts")}
          </Link>
        </div>
      </section>
    </main>
  );
}
