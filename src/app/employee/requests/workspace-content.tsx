import Link from "next/link";

import { EmployeeWorkspaceHero } from "@/components/employee-dashboard/EmployeeWorkspaceHero";
import { resolveEmployeeWorkspaceSourceEntry } from "@/components/scheduling/employee-source-context";

import EmployeeRequestsPageClient, { type EmployeeRequestsSectionMode } from "./page-client";

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
  const requestMonitoringHref =
    "/employee/requests/monitoring?source=employee-requests";
  const resubmitWorkbenchHref =
    "/employee/requests/resubmit?source=employee-requests";

  const allCards: RequestActionCard[] = isKoLocale
    ? [
        {
          id: "attendance-actions",
          title: "근태 요청 시작",
          description:
            "근태 정정 초안과 확인 작업은 전용 근태 워크스페이스에서 시작하고, 요청 상태 확인은 이 허브에서 이어갑니다.",
          actions: [
            {
              href: "/employee/attendance/correction?source=employee-requests",
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
            "휴가 초안과 일정 조정은 전용 휴가 워크스페이스에서 시작하고, 승인/재제출 후속 조치는 요청 허브에서 이어갑니다.",
          actions: [
            {
              href: "/employee/leave/request?source=employee-requests",
              label: "휴가 작업 열기",
              tone: "primary"
            },
            {
              href: "/employee/leave/calendar?source=employee-requests",
              label: "휴가 캘린더 보기",
              tone: "secondary"
            }
          ]
        },
        {
          id: "request-monitoring",
          title: "요청 상태와 후속 조치",
          description:
            "요청 피드백, 통합 검색, 타임라인을 전용 모니터링 경로에서 이어서 확인합니다.",
          actions: [
            {
              href: requestMonitoringHref,
              label: "요청 모니터링 열기",
              tone: "primary"
            },
            {
              href: resubmitWorkbenchHref,
              label: "재제출 워크벤치 열기",
              tone: "secondary"
            }
          ]
        },
        {
          id: "resubmit-workbench",
          title: "재제출 워크벤치",
          description:
            "반려/취소 요청을 다시 검토하고, 올바른 초안 경로로 이어가는 작업면입니다.",
          actions: [
            {
              href: resubmitWorkbenchHref,
              label: "재제출 워크벤치 열기",
              tone: "primary"
            },
            {
              href: requestMonitoringHref,
              label: "요청 모니터링 보기",
              tone: "secondary"
            }
          ]
        }
      ]
    : [
        {
          id: "attendance-actions",
          title: "Start attendance work",
          description:
            "Use the attendance workspace for drafts and corrections, then continue monitoring here.",
          actions: [
            {
              href: "/employee/attendance/correction?source=employee-requests",
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
            "Use the leave workspace for leave drafts and continue request follow-up from this hub.",
          actions: [
            {
              href: "/employee/leave/request?source=employee-requests",
              label: "Open leave workspace",
              tone: "primary"
            },
            {
              href: "/employee/leave/calendar?source=employee-requests",
              label: "Open leave calendar",
              tone: "secondary"
            }
          ]
        },
        {
          id: "request-monitoring",
          title: "Request monitoring",
          description:
            "Track feedback, search, and request timeline from a dedicated monitoring route.",
          actions: [
            {
              href: requestMonitoringHref,
              label: "Open request monitoring",
              tone: "primary"
            },
            {
              href: resubmitWorkbenchHref,
              label: "Open resubmit workbench",
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
              href: resubmitWorkbenchHref,
              label: "Open resubmit workbench",
              tone: "primary"
            },
            {
              href: requestMonitoringHref,
              label: "Open request monitoring",
              tone: "secondary"
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

function resolveWorkspaceHeroCopy(
  locale: "ko" | "en",
  sectionMode: EmployeeRequestsSectionMode
) {
  const isKoLocale = locale === "ko";
  if (sectionMode === "monitoring") {
    return {
      eyebrow: isKoLocale ? "직원 요청 모니터링" : "Employee request monitoring",
      title: isKoLocale ? "요청 모니터링" : "Request monitoring",
      description: isKoLocale
        ? "요청 피드백, 검색, 타임라인 후속 조치를 해시 대신 전용 경로에서 안정적으로 이어갑니다."
        : "Track request feedback, search, and timeline follow-up from a stable route instead of a hash-only destination.",
      metaLabel: isKoLocale
        ? "요청 상태 확인과 후속 조치 전용"
        : "Dedicated to request status and follow-up"
    };
  }

  if (sectionMode === "resubmit") {
    return {
      eyebrow: isKoLocale ? "직원 재제출 워크벤치" : "Employee resubmit workbench",
      title: isKoLocale ? "재제출 워크벤치" : "Resubmit workbench",
      description: isKoLocale
        ? "반려/취소 요청을 검토하고 올바른 근태 또는 휴가 초안 경로로 이어가는 작업면입니다."
        : "Review rejected or canceled requests, then continue in the correct attendance or leave draft route.",
      metaLabel: isKoLocale
        ? "재제출 후보 검토 전용"
        : "Dedicated to resubmit follow-up"
    };
  }

  return {
    eyebrow: isKoLocale ? "직원 요청 허브" : "Employee requests",
    title: isKoLocale ? "요청 워크스페이스" : "Requests workspace",
    description: isKoLocale
      ? "Today 화면은 요약과 우선순위만 남기고, 요청 상태 확인과 재제출 후속 조치는 전용 경로에서 이어갑니다."
      : "Keep the Today home focused on summary and priorities, then continue request monitoring and resubmit follow-up from dedicated routes.",
    metaLabel: isKoLocale
      ? "요청 상태와 재제출 후속 조치 전용"
      : "Dedicated to request monitoring and resubmit follow-up"
  };
}

export function EmployeeRequestsWorkspaceContent({
  locale,
  source,
  sectionMode
}: EmployeeRequestsWorkspaceContentProps) {
  const workspaceSourceEntry = resolveEmployeeWorkspaceSourceEntry(
    source,
    locale === "ko"
  );
  const heroCopy = resolveWorkspaceHeroCopy(locale, sectionMode);
  const requestCards = buildRequestActionCards(locale, sectionMode);

  return (
    <main className="saas-content workspace-shell employee-workspace-shell">
      <EmployeeWorkspaceHero
        eyebrow={heroCopy.eyebrow}
        title={heroCopy.title}
        description={heroCopy.description}
        sourceHint={workspaceSourceEntry?.hint ?? null}
        returnHref={workspaceSourceEntry?.returnHref ?? "/employee/requests"}
        returnLabel={
          workspaceSourceEntry?.returnLabel ??
          (locale === "ko" ? "요청 허브로 이동" : "Go to requests hub")
        }
        metaLabel={heroCopy.metaLabel}
        actions={[
          {
            href: "/employee/guide?source=employee-requests",
            label: locale === "ko" ? "가이드 보기" : "Open guide",
            tone: "secondary"
          }
        ]}
      />

      <section className="panel-grid workspace-panel-grid">
        {requestCards.map((card) => (
          <article
            key={card.id}
            className="panel workspace-section-card workspace-action-card"
            id={card.id}
          >
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

      <EmployeeRequestsPageClient locale={locale} sectionMode={sectionMode} />

      <section className="panel workspace-section-card workspace-note-card">
        <h2>
          {locale === "ko"
            ? "왜 요청 워크스페이스를 더 세분화하나요?"
            : "Why promote request monitoring into subroutes?"}
        </h2>
        <p className="small">
          {locale === "ko"
            ? "요청 피드백과 재제출 후속 조치를 같은 허브 안에서도 전용 경로로 분리해, 대시보드와 모바일 진입이 해시 위치에 흔들리지 않도록 정리합니다."
            : "The monitoring and resubmit paths are split into dedicated routes so dashboard and mobile entry points no longer depend on fragile hash positions."}
        </p>
        <div className="actions">
          <Link className="btn btn-secondary" href="/employee/requests">
            {locale === "ko" ? "요청 허브" : "Requests hub"}
          </Link>
          <Link
            className="btn btn-secondary"
            href="/employee/requests/monitoring?source=employee-requests"
          >
            {locale === "ko" ? "요청 모니터링" : "Request monitoring"}
          </Link>
          <Link
            className="btn btn-secondary"
            href="/employee/requests/resubmit?source=employee-requests"
          >
            {locale === "ko" ? "재제출 워크벤치" : "Resubmit workbench"}
          </Link>
        </div>
      </section>
    </main>
  );
}
