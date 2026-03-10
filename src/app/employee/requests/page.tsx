import Link from "next/link";

import { createTranslator } from "@/lib/i18n/messages";
import { getRequestLocale } from "@/lib/i18n/server";

import EmployeeRequestsPageClient from "./page-client";

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
        title: "출퇴근 요청 시작",
        description:
          "출퇴근 정정 초안은 홈의 근태 작업면에서 이어지고, 이곳에서는 요청 상태와 후속 조치를 관리합니다.",
        actions: [
          {
            href: "/employee?focus=attendance",
            label: "출퇴근 정정 열기",
            tone: "primary"
          },
          {
            href: "/employee/schedule?source=employee-requests",
            label: "내 근무 일정 보기",
            tone: "secondary"
          }
        ]
      },
      {
        id: "leave-actions",
        title: "휴가 요청 시작",
        description:
          "휴가 신청 초안은 홈의 휴가 작업면에서 이어지고, 이곳에서는 요청 상태와 재제출 준비를 모읍니다.",
        actions: [
          {
            href: "/employee?focus=leave",
            label: "휴가 신청 열기",
            tone: "primary"
          },
          {
            href: "/employee?focus=leave-calendar",
            label: "휴가 캘린더 보기",
            tone: "secondary"
          }
        ]
      },
      {
        id: "request-monitoring",
        title: "요청 상태와 후속 조치",
        description:
          "요청 피드백, 통합 검색, 타임라인을 한곳에서 보며 대기 건과 실패 원인을 추적합니다.",
        actions: [
          {
            href: "/employee/requests#request-feedback",
            label: "요청 피드백 보기",
            tone: "primary"
          },
          {
            href: "/employee/requests#request-search-sort",
            label: "요청 검색 열기",
            tone: "secondary"
          },
          {
            href: "/employee/requests#request-timeline",
            label: "요청 타임라인 보기",
            tone: "secondary"
          }
        ]
      },
      {
        id: "resubmit-workbench",
        title: "재제출 워크벤치",
        description:
          "반려되거나 취소된 요청을 다시 선택하고, 적절한 초안으로 이어서 작업합니다.",
        actions: [
          {
            href: "/employee/requests#resubmit-workbench",
            label: "재제출 워크벤치 열기",
            tone: "primary"
          },
          { href: "/employee", label: "Today로 돌아가기", tone: "secondary" }
        ]
      }
    ];
  }

  return [
    {
      id: "attendance-actions",
      title: "Start attendance work",
      description:
        "Attendance correction drafts stay on the Today work surface, while this route handles request status and follow-up.",
      actions: [
        {
          href: "/employee?focus=attendance",
          label: "Open attendance correction",
          tone: "primary"
        },
        {
          href: "/employee/schedule?source=employee-requests",
          label: "View my schedule",
          tone: "secondary"
        }
      ]
    },
    {
      id: "leave-actions",
      title: "Start leave work",
      description:
        "Leave drafts continue on the Today work surface, while this route gathers request state and resubmit follow-up.",
      actions: [
        {
          href: "/employee?focus=leave",
          label: "Open leave request",
          tone: "primary"
        },
        {
          href: "/employee?focus=leave-calendar",
          label: "Open leave calendar",
          tone: "secondary"
        }
      ]
    },
    {
      id: "request-monitoring",
      title: "Request status and follow-up",
      description:
        "Track request feedback, unified search, and timeline views from one dedicated workspace.",
      actions: [
        {
          href: "/employee/requests#request-feedback",
          label: "Open request feedback",
          tone: "primary"
        },
        {
          href: "/employee/requests#request-search-sort",
          label: "Open request search",
          tone: "secondary"
        },
        {
          href: "/employee/requests#request-timeline",
          label: "Open request timeline",
          tone: "secondary"
        }
      ]
    },
    {
      id: "resubmit-workbench",
      title: "Resubmit workbench",
      description:
        "Review rejected or canceled requests, then continue in the right draft flow from one stable route.",
      actions: [
        {
          href: "/employee/requests#resubmit-workbench",
          label: "Open resubmit workbench",
          tone: "primary"
        },
        { href: "/employee", label: "Return to Today", tone: "secondary" }
      ]
    }
  ];
}

export default async function EmployeeRequestsPage() {
  const locale = await getRequestLocale();
  const t = createTranslator(locale);
  const requestCards = buildRequestActionCards(locale);

  return (
    <main className="saas-content">
      <section className="hero-panel">
        <p className="eyebrow">
          {locale === "ko" ? "직원 요청 허브" : "Employee requests"}
        </p>
        <h1>{locale === "ko" ? "요청 워크스페이스" : "Requests workspace"}</h1>
        <p className="hero-copy">
          {locale === "ko"
            ? "Today 홈은 요약과 우선순위에 집중하고, 요청 상태 확인과 재제출 후속 조치는 이 전용 경로에서 이어갑니다."
            : "Keep the Today home focused on summary and priorities, then continue request monitoring and resubmit follow-up from this dedicated route."}
        </p>
        <div className="hero-meta">
          <span>
            {locale === "ko"
              ? "요청 상태와 재제출 후속 조치 전용"
              : "Dedicated for request monitoring and resubmit follow-up"}
          </span>
          <Link className="btn btn-primary" href="/employee">
            {locale === "ko" ? "Today로 이동" : "Go to Today"}
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
                  className={
                    action.tone === "primary"
                      ? "btn btn-primary"
                      : "btn btn-secondary"
                  }
                  href={action.href}
                >
                  {action.label}
                </Link>
              ))}
            </div>
          </article>
        ))}
      </section>

      <EmployeeRequestsPageClient locale={locale} />

      <section className="panel">
        <h2>
          {locale === "ko"
            ? "왜 요청 워크스페이스를 분리했나?"
            : "Why split out a requests workspace?"}
        </h2>
        <p className="small">
          {locale === "ko"
            ? "Today 홈에 숨겨진 섹션으로 섞여 있던 요청 피드백·검색·재제출 흐름을 별도 route로 승격한 첫 구현입니다. 다음 단계에서는 홈은 요약과 우선 처리만 남기고, 요청 관련 작업면을 더 명확히 분리합니다."
            : "This is the first route-first extraction of request feedback, search, timeline, and resubmit follow-up from the hidden Today sections. The next step keeps Today focused on summary and priority while request-heavy work moves fully into dedicated workspaces."}
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
