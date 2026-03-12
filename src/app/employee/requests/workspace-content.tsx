import Link from "next/link";

import { EmployeeWorkspaceHero } from "@/components/employee-dashboard/EmployeeWorkspaceHero";
import { resolveEmployeeWorkspaceSourceEntry } from "@/components/scheduling/employee-source-context";

import EmployeeRequestsPageClient, { type EmployeeRequestsSectionMode } from "./page-client";

type RequestActionCard = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  primaryAction: {
    href: string;
    label: string;
  };
  secondaryActions: {
    href: string;
    label: string;
  }[];
};

type EmployeeRequestsWorkspaceContentProps = {
  locale: "ko" | "en";
  source: string | null;
  sectionMode: EmployeeRequestsSectionMode;
};

function buildRequestActionCards(
  locale: "ko" | "en",
  sectionMode: EmployeeRequestsSectionMode
): RequestActionCard[] {
  const isKoLocale = locale === "ko";
  const requestMonitoringHref = "/employee/requests/monitoring?source=employee-requests";
  const resubmitWorkbenchHref = "/employee/requests/resubmit?source=employee-requests";

  const allCards: RequestActionCard[] = isKoLocale
    ? [
        {
          id: "leave-actions",
          eyebrow: "휴가",
          title: "휴가 요청 시작",
          description: "연차, 반차, 병가 요청을 전용 작성 경로에서 시작하고 후속 상태는 여기서 추적합니다.",
          primaryAction: {
            href: "/employee/leave/request?source=employee-requests",
            label: "휴가 요청 열기"
          },
          secondaryActions: [
            {
              href: "/employee/leave/calendar?source=employee-requests",
              label: "휴가 캘린더 보기"
            }
          ]
        },
        {
          id: "attendance-actions",
          eyebrow: "근태",
          title: "출퇴근 정정 요청",
          description: "출근, 퇴근, 근무기록 정정은 근태 워크스페이스에서 작성하고 승인 상태는 요청 허브에서 이어집니다.",
          primaryAction: {
            href: "/employee/attendance/correction?source=employee-requests",
            label: "근태 정정 열기"
          },
          secondaryActions: [
            {
              href: "/employee/schedule?source=employee-requests",
              label: "내 일정 보기"
            }
          ]
        },
        {
          id: "request-monitoring",
          eyebrow: "모니터링",
          title: "요청 상태 추적",
          description: "피드백, 검색, 타임라인을 한 화면에서 확인하며 대기 중인 요청을 빠르게 찾아 대응합니다.",
          primaryAction: {
            href: requestMonitoringHref,
            label: "요청 모니터링 열기"
          },
          secondaryActions: [
            {
              href: resubmitWorkbenchHref,
              label: "재제출 작업대 열기"
            }
          ]
        },
        {
          id: "resubmit-workbench",
          eyebrow: "재제출",
          title: "재제출 작업대",
          description: "반려되거나 취소된 요청을 다시 검토하고, 올바른 작성 경로로 바로 이어집니다.",
          primaryAction: {
            href: resubmitWorkbenchHref,
            label: "재제출 작업대 열기"
          },
          secondaryActions: [
            {
              href: requestMonitoringHref,
              label: "요청 모니터링 보기"
            }
          ]
        }
      ]
    : [
        {
          id: "leave-actions",
          eyebrow: "Leave",
          title: "Start leave requests",
          description: "Begin annual leave, half-day, or sick leave drafts in a dedicated route and follow up from this hub.",
          primaryAction: {
            href: "/employee/leave/request?source=employee-requests",
            label: "Open leave request"
          },
          secondaryActions: [
            {
              href: "/employee/leave/calendar?source=employee-requests",
              label: "Open leave calendar"
            }
          ]
        },
        {
          id: "attendance-actions",
          eyebrow: "Attendance",
          title: "Open correction requests",
          description: "Use the attendance workspace for clock-in and clock-out corrections, then continue follow-up here.",
          primaryAction: {
            href: "/employee/attendance/correction?source=employee-requests",
            label: "Open attendance correction"
          },
          secondaryActions: [
            {
              href: "/employee/schedule?source=employee-requests",
              label: "View my schedule"
            }
          ]
        },
        {
          id: "request-monitoring",
          eyebrow: "Monitoring",
          title: "Track request status",
          description: "Review feedback, search results, and request timeline from a stable route-first monitoring surface.",
          primaryAction: {
            href: requestMonitoringHref,
            label: "Open request monitoring"
          },
          secondaryActions: [
            {
              href: resubmitWorkbenchHref,
              label: "Open resubmit workbench"
            }
          ]
        },
        {
          id: "resubmit-workbench",
          eyebrow: "Resubmit",
          title: "Continue rejected requests",
          description: "Review rejected or canceled requests, then jump straight into the correct draft route.",
          primaryAction: {
            href: resubmitWorkbenchHref,
            label: "Open resubmit workbench"
          },
          secondaryActions: [
            {
              href: requestMonitoringHref,
              label: "Go to request monitoring"
            }
          ]
        }
      ];

  if (sectionMode === "monitoring") {
    return allCards.filter((card) => card.id === "request-monitoring");
  }
  if (sectionMode === "resubmit") {
    return allCards.filter((card) => card.id === "resubmit-workbench");
  }
  return allCards;
}

function resolveWorkspaceHeroCopy(locale: "ko" | "en", sectionMode: EmployeeRequestsSectionMode) {
  const isKoLocale = locale === "ko";

  if (sectionMode === "monitoring") {
    return {
      eyebrow: isKoLocale ? "requests" : "requests",
      title: isKoLocale ? "요청 모니터링" : "Request monitoring",
      description: isKoLocale
        ? "피드백, 검색, 타임라인을 전용 경로에서 확인하며 대기 중인 요청을 빠르게 처리하세요."
        : "Review feedback, search, and request timeline from a dedicated monitoring route.",
      metaLabel: isKoLocale ? "상태 확인과 후속 조치 전용" : "Dedicated to status follow-up"
    };
  }

  if (sectionMode === "resubmit") {
    return {
      eyebrow: isKoLocale ? "requests" : "requests",
      title: isKoLocale ? "재제출 작업대" : "Resubmit workbench",
      description: isKoLocale
        ? "반려되거나 취소된 요청을 검토하고, 올바른 작성 경로로 다시 이어가세요."
        : "Review rejected or canceled requests, then continue in the correct draft route.",
      metaLabel: isKoLocale ? "반려 요청 후속 처리 전용" : "Dedicated to rejected request follow-up"
    };
  }

  return {
    eyebrow: isKoLocale ? "requests" : "requests",
    title: isKoLocale ? "요청 허브" : "Requests hub",
    description: isKoLocale
      ? "휴가, 근태 정정, 요청 추적을 한 곳에서 시작하고 세부 작업은 전용 경로에서 이어가세요."
      : "Start leave, attendance corrections, and request follow-up from one hub, then continue in dedicated routes.",
    metaLabel: isKoLocale ? "신청과 추적을 위한 전용 작업면" : "Dedicated to request creation and follow-up"
  };
}

function buildRequestTabs(locale: "ko" | "en", sectionMode: EmployeeRequestsSectionMode) {
  const isKoLocale = locale === "ko";
  return [
    {
      href: "/employee",
      label: isKoLocale ? "오늘 홈" : "Today",
      active: false
    },
    {
      href: "/employee/guide?source=employee-requests",
      label: isKoLocale ? "가이드" : "Guide",
      active: false
    },
    {
      href: "/employee/requests",
      label: isKoLocale ? "요청 허브" : "Requests hub",
      active: sectionMode === "all"
    },
    {
      href: "/employee/requests/monitoring?source=employee-requests",
      label: isKoLocale ? "요청 모니터링" : "Monitoring",
      active: sectionMode === "monitoring"
    },
    {
      href: "/employee/requests/resubmit?source=employee-requests",
      label: isKoLocale ? "재제출 작업대" : "Resubmit",
      active: sectionMode === "resubmit"
    }
  ];
}

export function EmployeeRequestsWorkspaceContent({
  locale,
  source,
  sectionMode
}: EmployeeRequestsWorkspaceContentProps) {
  const isKoLocale = locale === "ko";
  const workspaceSourceEntry = resolveEmployeeWorkspaceSourceEntry(source, isKoLocale);
  const heroCopy = resolveWorkspaceHeroCopy(locale, sectionMode);
  const requestCards = buildRequestActionCards(locale, sectionMode);
  const requestTabs = buildRequestTabs(locale, sectionMode);

  return (
    <main className="saas-content workspace-shell employee-workspace-shell v2-route-shell v2-requests-shell">
      <header className="page-header workspace-page-header employee-workspace-status-header v2-page-header">
        <div className="v2-page-copy">
          <p className="eyebrow">{heroCopy.eyebrow}</p>
          <div className="v2-breadcrumb">
            <span>{isKoLocale ? "오늘 홈" : "Today"}</span>
            <span>{heroCopy.title}</span>
          </div>
          <h1 className="page-title">{heroCopy.title}</h1>
          <p className="page-subtitle">{heroCopy.description}</p>
          {workspaceSourceEntry?.hint ? (
            <p className="small muted workspace-source-banner">{workspaceSourceEntry.hint}</p>
          ) : null}
        </div>
        <div className="page-actions">
          <Link className="btn btn-secondary" href={workspaceSourceEntry?.returnHref ?? "/employee"}>
            {workspaceSourceEntry?.returnLabel ?? (isKoLocale ? "직원 홈으로" : "Back to employee home")}
          </Link>
          <Link className="btn btn-primary" href="/employee/guide?source=employee-requests">
            {isKoLocale ? "가이드 보기" : "Open guide"}
          </Link>
        </div>
      </header>

      <nav className="v2-tab-row" aria-label={heroCopy.title}>
        {requestTabs.map((tab) => (
          <Link key={tab.href} className={tab.active ? "v2-tab-link active" : "v2-tab-link"} href={tab.href}>
            {tab.label}
          </Link>
        ))}
      </nav>

      <EmployeeWorkspaceHero
        eyebrow={heroCopy.eyebrow}
        title={heroCopy.title}
        description={heroCopy.description}
        sourceHint={workspaceSourceEntry?.hint ?? null}
        returnHref={workspaceSourceEntry?.returnHref ?? "/employee/requests"}
        returnLabel={
          workspaceSourceEntry?.returnLabel ?? (isKoLocale ? "요청 허브로 이동" : "Go to requests hub")
        }
        metaLabel={heroCopy.metaLabel}
        actions={[
          {
            href: "/employee/requests/monitoring?source=employee-requests",
            label: isKoLocale ? "요청 모니터링" : "Open monitoring",
            tone: "secondary"
          },
          {
            href: "/employee/requests/resubmit?source=employee-requests",
            label: isKoLocale ? "재제출 작업대" : "Open resubmit",
            tone: "secondary"
          }
        ]}
      />

      <section className="panel-grid workspace-panel-grid employee-requests-hub-grid v2-request-type-grid">
        {requestCards.map((card) => (
          <article
            key={card.id}
            className="panel workspace-section-card workspace-action-card employee-requests-hub-card v2-request-type-card"
            id={card.id}
          >
            <div className="employee-requests-hub-copy v2-request-type-meta">
              <span className="workspace-hero-chip employee-requests-hub-chip">{card.eyebrow}</span>
              <h2>{card.title}</h2>
              <p className="small">{card.description}</p>
            </div>
            <div className="employee-requests-hub-primary">
              <Link className="btn btn-primary" href={card.primaryAction.href}>
                {card.primaryAction.label}
              </Link>
            </div>
            <div className="employee-requests-hub-secondary">
              {card.secondaryActions.map((action) => (
                <Link key={`${card.id}-${action.href}`} className="btn btn-secondary" href={action.href}>
                  {action.label}
                </Link>
              ))}
            </div>
          </article>
        ))}
      </section>

      <EmployeeRequestsPageClient locale={locale} sectionMode={sectionMode} />

      <section className="panel workspace-section-card workspace-note-card employee-requests-route-note v2-route-note">
        <h2>{isKoLocale ? "왜 요청을 전용 경로로 나누었나요?" : "Why split requests into dedicated routes?"}</h2>
        <p className="small">
          {isKoLocale
            ? "대시보드와 모바일 진입점에서 해시 위치에 의존하지 않도록, 요청 모니터링과 재제출 후속 처리를 독립 경로로 분리했습니다."
            : "Request monitoring and resubmit follow-up now live on dedicated routes so dashboard and mobile entry points no longer depend on fragile hash positions."}
        </p>
        <div className="actions">
          <Link className="btn btn-secondary" href="/employee/requests">
            {isKoLocale ? "요청 허브" : "Requests hub"}
          </Link>
          <Link className="btn btn-secondary" href="/employee/requests/monitoring?source=employee-requests">
            {isKoLocale ? "요청 모니터링" : "Request monitoring"}
          </Link>
          <Link className="btn btn-secondary" href="/employee/requests/resubmit?source=employee-requests">
            {isKoLocale ? "재제출 작업대" : "Resubmit workbench"}
          </Link>
        </div>
      </section>
    </main>
  );
}
