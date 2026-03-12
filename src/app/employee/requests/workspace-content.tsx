import Link from "next/link";

import { EmployeeWorkspaceHero } from "@/components/employee-dashboard/EmployeeWorkspaceHero";
import { resolveEmployeeWorkspaceSourceEntry } from "@/components/scheduling/employee-source-context";
import {
  RouteWorkspaceHeader,
  RouteWorkspaceSectionCard,
  RouteWorkspaceShell,
  RouteWorkspaceTabs
} from "@/components/workspace/RouteWorkspacePrimitives";

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
  secondaryActions: Array<{
    href: string;
    label: string;
  }>;
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
  const monitoringHref = "/employee/requests/monitoring?source=employee-requests";
  const resubmitHref = "/employee/requests/resubmit?source=employee-requests";

  const cards: RequestActionCard[] = isKoLocale
    ? [
        {
          id: "leave-actions",
          eyebrow: "휴가",
          title: "휴가 요청 시작",
          description: "연차, 반차, 병가 요청을 전용 경로에서 작성하고 이 허브에서 상태를 이어서 확인합니다.",
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
          description: "출근, 퇴근, 근무기록 정정은 근태 작업면에서 작성하고 이후 상태는 요청 허브에서 추적합니다.",
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
          description: "피드백, 검색, 타임라인을 전용 모니터링 화면에서 확인하고 대기 중인 요청을 빠르게 이어서 처리합니다.",
          primaryAction: {
            href: monitoringHref,
            label: "요청 모니터링 열기"
          },
          secondaryActions: [
            {
              href: resubmitHref,
              label: "재제출 작업대로 이동"
            }
          ]
        },
        {
          id: "resubmit-workbench",
          eyebrow: "재제출",
          title: "반려 요청 다시 이어가기",
          description: "반려되거나 취소된 요청을 검토한 뒤 올바른 작성 경로로 다시 연결합니다.",
          primaryAction: {
            href: resubmitHref,
            label: "재제출 작업대 열기"
          },
          secondaryActions: [
            {
              href: monitoringHref,
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
          description: "Draft annual leave, half-day, and sick leave in a dedicated route, then follow up here.",
          primaryAction: {
            href: "/employee/leave/request?source=employee-requests",
            label: "Open leave request"
          },
          secondaryActions: [
            {
              href: "/employee/leave/calendar?source=employee-requests",
              label: "View leave calendar"
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
          description: "Review feedback, search results, and request timeline from a stable monitoring workspace.",
          primaryAction: {
            href: monitoringHref,
            label: "Open request monitoring"
          },
          secondaryActions: [
            {
              href: resubmitHref,
              label: "Open resubmit workbench"
            }
          ]
        },
        {
          id: "resubmit-workbench",
          eyebrow: "Resubmit",
          title: "Continue rejected requests",
          description: "Review rejected or canceled requests and jump back into the correct draft route.",
          primaryAction: {
            href: resubmitHref,
            label: "Open resubmit workbench"
          },
          secondaryActions: [
            {
              href: monitoringHref,
              label: "Go to request monitoring"
            }
          ]
        }
      ];

  if (sectionMode === "monitoring") {
    return cards.filter((card) => card.id === "request-monitoring");
  }

  if (sectionMode === "resubmit") {
    return cards.filter((card) => card.id === "resubmit-workbench");
  }

  return cards;
}

function resolveWorkspaceHeroCopy(locale: "ko" | "en", sectionMode: EmployeeRequestsSectionMode) {
  const isKoLocale = locale === "ko";

  if (sectionMode === "monitoring") {
    return {
      eyebrow: "requests",
      title: isKoLocale ? "요청 모니터링" : "Request monitoring",
      description: isKoLocale
        ? "피드백, 검색, 타임라인을 한곳에서 확인하고 대기 중인 요청을 빠르게 이어서 처리합니다."
        : "Review feedback, search, and request timeline from one dedicated monitoring route.",
      metaLabel: isKoLocale ? "상태 확인과 후속 조치 전용" : "Dedicated to status follow-up"
    };
  }

  if (sectionMode === "resubmit") {
    return {
      eyebrow: "requests",
      title: isKoLocale ? "재제출 작업대" : "Resubmit workbench",
      description: isKoLocale
        ? "반려되거나 취소된 요청을 검토한 뒤 올바른 작성 경로로 다시 이어갑니다."
        : "Review rejected or canceled requests, then continue in the correct draft route.",
      metaLabel: isKoLocale ? "반려 요청 후속 처리 전용" : "Dedicated to rejected request follow-up"
    };
  }

  return {
    eyebrow: "requests",
    title: isKoLocale ? "요청 허브" : "Requests hub",
    description: isKoLocale
      ? "휴가, 근태 정정, 상태 추적을 한곳에서 시작하고 각 전용 작업면으로 이어갑니다."
      : "Start leave, attendance correction, and follow-up work from one hub, then continue in dedicated routes.",
    metaLabel: isKoLocale ? "요청 생성과 추적 전용 작업면" : "Dedicated to request creation and follow-up"
  };
}

function buildRequestTabs(locale: "ko" | "en", sectionMode: EmployeeRequestsSectionMode) {
  const isKoLocale = locale === "ko";

  return [
    {
      href: "/employee",
      label: isKoLocale ? "오늘" : "Today",
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
    <RouteWorkspaceShell className="v2-requests-shell" tone="employee">
      <RouteWorkspaceHeader
        actions={[
          {
            href: workspaceSourceEntry?.returnHref ?? "/employee",
            label: workspaceSourceEntry?.returnLabel ?? (isKoLocale ? "직원 홈으로" : "Back to employee home"),
            tone: "secondary"
          },
          {
            href: "/employee/guide?source=employee-requests",
            label: isKoLocale ? "가이드 보기" : "Open guide",
            tone: "primary"
          }
        ]}
        breadcrumbs={[isKoLocale ? "오늘" : "Today", heroCopy.title]}
        className="employee-workspace-status-header"
        description={heroCopy.description}
        eyebrow={heroCopy.eyebrow}
        sourceHint={workspaceSourceEntry?.hint ?? null}
        title={heroCopy.title}
      />

      <RouteWorkspaceTabs ariaLabel={heroCopy.title} tabs={requestTabs} />

      <EmployeeWorkspaceHero
        eyebrow={heroCopy.eyebrow}
        title={heroCopy.title}
        description={heroCopy.description}
        sourceHint={workspaceSourceEntry?.hint ?? null}
        returnHref={workspaceSourceEntry?.returnHref ?? "/employee/requests"}
        returnLabel={workspaceSourceEntry?.returnLabel ?? (isKoLocale ? "요청 허브로 이동" : "Go to requests hub")}
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
          <RouteWorkspaceSectionCard
            className="workspace-action-card employee-requests-hub-card v2-request-type-card"
            id={card.id}
            key={card.id}
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
                <Link className="btn btn-secondary" href={action.href} key={`${card.id}-${action.href}`}>
                  {action.label}
                </Link>
              ))}
            </div>
          </RouteWorkspaceSectionCard>
        ))}
      </section>

      <EmployeeRequestsPageClient locale={locale} sectionMode={sectionMode} />

      <RouteWorkspaceSectionCard className="workspace-note-card employee-requests-route-note v2-route-note">
        <h2>{isKoLocale ? "왜 요청을 전용 경로로 나누었나요?" : "Why split requests into dedicated routes?"}</h2>
        <p className="small">
          {isKoLocale
            ? "대시보드와 모바일 진입점에서도 같은 위치 기준으로 열리도록 요청 모니터링과 재제출 후속 처리를 별도 경로로 분리했습니다."
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
      </RouteWorkspaceSectionCard>
    </RouteWorkspaceShell>
  );
}
