import Link from "next/link";

import { EmployeeWorkspaceHero } from "@/components/employee-dashboard/EmployeeWorkspaceHero";
import { resolveEmployeeWorkspaceSourceEntry } from "@/components/scheduling/employee-source-context";
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

type EmployeeRequestsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function buildRequestActionCards(locale: "ko" | "en"): RequestActionCard[] {
  if (locale === "ko") {
    return [
      {
        id: "attendance-actions",
        title: "근태 요청 시작",
        description:
          "근태 정정 초안은 전용 근태 작업면에서 이어가고, 이 화면에서는 요청 상태와 후속 조치를 한 번에 관리합니다.",
        actions: [
          {
            href: "/employee/attendance?source=employee-requests",
            label: "근태 작업 열기",
            tone: "primary"
          },
          {
            href: "/employee/schedule?source=employee-requests",
            label: "내 일정 보기",
            tone: "secondary"
          }
        ]
      },
      {
        id: "leave-actions",
        title: "휴가 요청 시작",
        description:
          "휴가 초안은 전용 휴가 작업면에서 이어가고, 이 화면에서는 승인 상태와 재제출 준비를 모읍니다.",
        actions: [
          {
            href: "/employee/leave?source=employee-requests",
            label: "휴가 작업 열기",
            tone: "primary"
          },
          {
            href: "/employee/leave?source=employee-requests#leave-calendar",
            label: "휴가 캘린더 보기",
            tone: "secondary"
          }
        ]
      },
      {
        id: "request-monitoring",
        title: "요청 상태와 후속 조치",
        description:
          "요청 피드백, 통합 검색, 타임라인을 한 화면에서 확인하며 대기 중인 항목을 추적합니다.",
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
        title: "재제출 작업대",
        description:
          "반려되거나 취소된 요청을 다시 고르고, 올바른 초안 경로로 이어서 작업합니다.",
        actions: [
          {
            href: "/employee/requests#resubmit-workbench",
            label: "재제출 작업대 열기",
            tone: "primary"
          },
          {
            href: "/employee",
            label: "Today로 돌아가기",
            tone: "secondary"
          }
        ]
      }
    ];
  }

  return [
    {
      id: "attendance-actions",
      title: "Start attendance work",
      description:
        "Continue attendance correction from the dedicated attendance route while using this workspace for monitoring and follow-up.",
      actions: [
        {
          href: "/employee/attendance?source=employee-requests",
          label: "Open attendance workspace",
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
        "Continue leave drafts from the dedicated leave route while keeping request state and resubmit follow-up here.",
      actions: [
        {
          href: "/employee/leave?source=employee-requests",
          label: "Open leave workspace",
          tone: "primary"
        },
        {
          href: "/employee/leave?source=employee-requests#leave-calendar",
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
        "Review rejected or canceled requests, then continue in the correct draft route.",
      actions: [
        {
          href: "/employee/requests#resubmit-workbench",
          label: "Open resubmit workbench",
          tone: "primary"
        },
        {
          href: "/employee",
          label: "Return to Today",
          tone: "secondary"
        }
      ]
    }
  ];
}

export default async function EmployeeRequestsPage({
  searchParams
}: EmployeeRequestsPageProps) {
  const locale = await getRequestLocale();
  const t = createTranslator(locale);
  const requestCards = buildRequestActionCards(locale);
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const sourceParam = resolvedSearchParams.source;
  const source =
    typeof sourceParam === "string"
      ? sourceParam
      : Array.isArray(sourceParam)
        ? (sourceParam[0] ?? null)
        : null;
  const workspaceSourceEntry = resolveEmployeeWorkspaceSourceEntry(
    source,
    locale === "ko"
  );

  return (
    <main className="saas-content">
      <EmployeeWorkspaceHero
        eyebrow={locale === "ko" ? "직원 요청 허브" : "Employee requests"}
        title={locale === "ko" ? "요청 워크스페이스" : "Requests workspace"}
        description={
          locale === "ko"
            ? "Today 화면은 요약과 우선순위에 집중하고, 요청 상태 확인과 재제출 후속 조치는 이 전용 경로에서 이어갑니다."
            : "Keep the Today home focused on summary and priorities, then continue request monitoring and resubmit follow-up from this dedicated route."
        }
        sourceHint={workspaceSourceEntry?.hint ?? null}
        returnHref={workspaceSourceEntry?.returnHref ?? "/employee"}
        returnLabel={
          workspaceSourceEntry?.returnLabel ??
          (locale === "ko" ? "Today로 이동" : "Go to Today")
        }
        metaLabel={
          locale === "ko"
            ? "요청 상태와 재제출 후속 조치 전용"
            : "Dedicated for request monitoring and resubmit follow-up"
        }
        actions={[
          {
            href: "/employee/guide?source=employee-requests",
            label: locale === "ko" ? "가이드 보기" : "Open guide",
            tone: "secondary"
          }
        ]}
      />

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
            ? "Today 화면에 숨겨져 있던 요청 피드백, 검색, 타임라인, 재제출 흐름을 별도 route로 분리하는 단계입니다. 다음 단계에서는 모바일과 나머지 entry도 같은 route-first 규칙으로 정렬합니다."
            : "This is the route-first extraction of request feedback, search, timeline, and resubmit follow-up from the hidden Today sections. The next step aligns mobile and remaining entry points to the same route-first model."}
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
