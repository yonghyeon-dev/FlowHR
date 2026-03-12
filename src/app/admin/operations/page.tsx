"use client";

import Link from "next/link";
import {
  ADMIN_OPERATIONS_SOURCE,
  withAdminSource
} from "@/app/admin/source-context";
import {
  RouteWorkspaceHeader,
  RouteWorkspaceSectionCard,
  RouteWorkspaceShell,
  RouteWorkspaceSplit,
  RouteWorkspaceSummary
} from "@/components/workspace/RouteWorkspacePrimitives";
import { useI18n } from "@/lib/i18n/provider";

type QueueItem = {
  key: string;
  title: string;
  description: string;
  href: string;
  primaryLabel: string;
  secondaryLabel: string;
  secondaryHref: string;
  tone: "critical" | "watch" | "stable";
};

type LaneCard = {
  key: string;
  title: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryLinks: Array<{ href: string; label: string }>;
};

export default function AdminOperationsLanePage() {
  const { locale } = useI18n();
  const isKoLocale = locale === "ko";

  const queueItems: QueueItem[] = [
    {
      key: "attendance-live",
      title: isKoLocale ? "실시간 근태 예외" : "Realtime attendance exceptions",
      description: isKoLocale
        ? "퇴근 누락, 근태 이상, 당일 현황을 먼저 확인합니다."
        : "Start with missing clock-outs, attendance exceptions, and today's live status.",
      href: withAdminSource("/admin/attendance-live", ADMIN_OPERATIONS_SOURCE),
      primaryLabel: isKoLocale ? "근태 라이브 열기" : "Open attendance live",
      secondaryLabel: isKoLocale ? "휴가 캘린더" : "Leave calendar",
      secondaryHref: withAdminSource("/admin/leave-calendar", ADMIN_OPERATIONS_SOURCE),
      tone: "critical"
    },
    {
      key: "notices",
      title: isKoLocale ? "공지 읽음 후속" : "Notice read follow-up",
      description: isKoLocale
        ? "읽지 않은 공지가 남은 조직 공지를 바로 추적합니다."
        : "Follow up on published notices that still have unread risk.",
      href: withAdminSource(
        "/admin/notices?status=PUBLISHED&risk=no-read",
        ADMIN_OPERATIONS_SOURCE
      ),
      primaryLabel: isKoLocale ? "공지 후속 열기" : "Open notice follow-up",
      secondaryLabel: isKoLocale ? "공지 전체 보기" : "View all notices",
      secondaryHref: withAdminSource("/admin/notices", ADMIN_OPERATIONS_SOURCE),
      tone: "watch"
    },
    {
      key: "benefits",
      title: isKoLocale ? "복리후생 대기열" : "Benefits backlog",
      description: isKoLocale
        ? "3일 이상 쌓인 복리후생 요청을 우선 정리합니다."
        : "Clear benefit requests that have been pending for more than three days.",
      href: withAdminSource(
        "/admin/benefits?status=SUBMITTED&risk=pending_3d",
        ADMIN_OPERATIONS_SOURCE
      ),
      primaryLabel: isKoLocale ? "복리후생 후속 열기" : "Open benefits follow-up",
      secondaryLabel: isKoLocale ? "복리후생 전체 보기" : "View all benefits",
      secondaryHref: withAdminSource("/admin/benefits", ADMIN_OPERATIONS_SOURCE),
      tone: "watch"
    },
    {
      key: "recruitment",
      title: isKoLocale ? "채용 지연 건" : "Recruitment stalled",
      description: isKoLocale
        ? "7일 이상 멈춘 채용 건과 추천 파이프라인을 이어서 처리합니다."
        : "Resume stalled openings and referral pipelines that have been idle for seven days.",
      href: withAdminSource("/admin/recruitment?risk=stalled_7d", ADMIN_OPERATIONS_SOURCE),
      primaryLabel: isKoLocale ? "채용 후속 열기" : "Open recruiting follow-up",
      secondaryLabel: isKoLocale ? "채용 전체 보기" : "View all recruiting",
      secondaryHref: withAdminSource("/admin/recruitment", ADMIN_OPERATIONS_SOURCE),
      tone: "watch"
    },
    {
      key: "contracts",
      title: isKoLocale ? "계약 응답 대기" : "Contract pending response",
      description: isKoLocale
        ? "의사결정 대기, SLA 초과, 전송 후 응답 대기를 한 묶음으로 봅니다."
        : "Track decision queue, SLA overdue, and sent-but-waiting contracts in one lane.",
      href: withAdminSource("/admin/contracts?decisionQueueOnly=true", ADMIN_OPERATIONS_SOURCE),
      primaryLabel: isKoLocale ? "계약 대기열 열기" : "Open contract queue",
      secondaryLabel: isKoLocale ? "SLA 초과 보기" : "View SLA overdue",
      secondaryHref: withAdminSource("/admin/contracts?slaRisk=OVERDUE", ADMIN_OPERATIONS_SOURCE),
      tone: "critical"
    }
  ];

  const laneCards: LaneCard[] = [
    {
      key: "attendance",
      title: isKoLocale ? "근태 · 휴가 · 일정" : "Attendance · leave · schedule",
      description: isKoLocale
        ? "실시간 근태, 휴가 캘린더, 자동 부여, 스케줄 조정을 한 레인에서 묶습니다."
        : "Keep realtime attendance, leave, accrual, and schedule adjustments in one lane.",
      primaryHref: withAdminSource("/admin/attendance-live", ADMIN_OPERATIONS_SOURCE),
      primaryLabel: isKoLocale ? "근태 라이브" : "Attendance live",
      secondaryLinks: [
        {
          href: withAdminSource("/admin/leave-calendar", ADMIN_OPERATIONS_SOURCE),
          label: isKoLocale ? "휴가 캘린더" : "Leave calendar"
        },
        {
          href: withAdminSource("/admin/leave-accrual", ADMIN_OPERATIONS_SOURCE),
          label: isKoLocale ? "연차 자동 부여" : "Leave accrual"
        },
        {
          href: withAdminSource("/admin/scheduling", ADMIN_OPERATIONS_SOURCE),
          label: isKoLocale ? "근무 스케줄" : "Scheduling"
        }
      ]
    },
    {
      key: "employee-comms",
      title: isKoLocale ? "직원 대상 운영" : "Employee-facing operations",
      description: isKoLocale
        ? "공지, 복리후생, 채용을 운영 후속 기준으로 묶어 봅니다."
        : "Group notices, benefits, and recruitment around actual follow-up work.",
      primaryHref: withAdminSource("/admin/notices", ADMIN_OPERATIONS_SOURCE),
      primaryLabel: isKoLocale ? "공지 워크스페이스" : "Notice workspace",
      secondaryLinks: [
        {
          href: withAdminSource("/admin/benefits", ADMIN_OPERATIONS_SOURCE),
          label: isKoLocale ? "복리후생" : "Benefits"
        },
        {
          href: withAdminSource("/admin/recruitment", ADMIN_OPERATIONS_SOURCE),
          label: isKoLocale ? "채용" : "Recruitment"
        }
      ]
    },
    {
      key: "contracts-follow-up",
      title: isKoLocale ? "계약 후속 처리" : "Contract follow-up",
      description: isKoLocale
        ? "계약 결정, 응답 대기, SLA 초과 follow-up을 같은 작업 패턴으로 엽니다."
        : "Handle contract decisions, pending responses, and SLA overdue follow-ups in one pattern.",
      primaryHref: withAdminSource("/admin/contracts", ADMIN_OPERATIONS_SOURCE),
      primaryLabel: isKoLocale ? "전자계약 워크스페이스" : "Contracts workspace",
      secondaryLinks: [
        {
          href: withAdminSource("/admin/contracts?decisionQueueOnly=true", ADMIN_OPERATIONS_SOURCE),
          label: isKoLocale ? "의사결정 대기" : "Decision queue"
        },
        {
          href: withAdminSource("/admin/contracts?status=SENT", ADMIN_OPERATIONS_SOURCE),
          label: isKoLocale ? "응답 대기" : "Pending response"
        },
        {
          href: withAdminSource("/admin/contracts?slaRisk=OVERDUE", ADMIN_OPERATIONS_SOURCE),
          label: isKoLocale ? "SLA 초과" : "SLA overdue"
        }
      ]
    }
  ];

  const summaryItems = [
    { label: isKoLocale ? "핵심 레인" : "Primary lanes", value: laneCards.length },
    { label: isKoLocale ? "즉시 후속 큐" : "Immediate follow-up queues", value: queueItems.length },
    { label: isKoLocale ? "대표 워크스페이스" : "Representative workspaces", value: 8 },
    { label: isKoLocale ? "고위험 후속" : "High-risk follow-ups", value: 3 }
  ];

  const laneRules = [
    isKoLocale
      ? "요약 카드보다 실제 후속 큐를 먼저 열어 처리합니다."
      : "Open actual follow-up queues before summary browsing.",
    isKoLocale
      ? "공지, 복리후생, 채용, 계약은 같은 운영 후속 흐름으로 다룹니다."
      : "Treat notices, benefits, recruitment, and contracts as one operational follow-up family.",
    isKoLocale
      ? "근태·휴가·스케줄은 당일 운영 리듬 기준으로 묶습니다."
      : "Keep attendance, leave, and schedule grouped around the same-day operating rhythm."
  ];

  return (
    <RouteWorkspaceShell tone="admin" className="admin-operations-lane-shell">
      <RouteWorkspaceHeader
        eyebrow="operations lane"
        title={isKoLocale ? "운영 레인" : "Operations lane"}
        description={
          isKoLocale
            ? "컨트롤 타워에서 잡은 우선순위를 실제 운영 작업면으로 이어주는 customer-admin 운영 레인입니다."
            : "A customer-admin operating lane that turns control-tower priorities into real working surfaces."
        }
        sourceHint={
          isKoLocale
            ? "근태 · 휴가 · 공지 · 복리후생 · 채용 · 계약 후속"
            : "Attendance · leave · notices · benefits · recruitment · contract follow-up"
        }
        actions={[
          {
            href: "/admin",
            label: isKoLocale ? "관리자 허브" : "Admin hub",
            tone: "secondary"
          },
          {
            href: withAdminSource("/admin/attendance-live", ADMIN_OPERATIONS_SOURCE),
            label: isKoLocale ? "실시간 근태" : "Attendance live",
            tone: "primary"
          }
        ]}
      />

      <RouteWorkspaceSummary
        ariaLabel={isKoLocale ? "운영 레인 요약" : "Operations lane summary"}
        className="admin-operations-lane-summary"
        items={summaryItems}
      />

      <RouteWorkspaceSplit
        className="admin-operations-lane-grid"
        main={
          <>
            <RouteWorkspaceSectionCard
              className="admin-operations-lane-card"
              title={isKoLocale ? "오늘 바로 처리" : "Handle first today"}
              description={
                isKoLocale
                  ? "당장 열어야 하는 후속 큐를 우선순위대로 나열했습니다."
                  : "The first follow-up queues to open are ranked here."
              }
            >
              <div className="queue-list">
                {queueItems.map((item) => (
                  <article className="queue-item admin-operations-queue-item" key={item.key}>
                    <div className={`q-priority ${item.tone === "critical" ? "high" : item.tone === "watch" ? "medium" : "low"}`} />
                    <div className="q-content">
                      <div className="q-title">{item.title}</div>
                      <div className="q-meta">{item.description}</div>
                    </div>
                    <div className="q-action">
                      <div className="actions">
                        <Link className="btn btn-primary" href={item.href}>
                          {item.primaryLabel}
                        </Link>
                        <Link className="btn btn-secondary" href={item.secondaryHref}>
                          {item.secondaryLabel}
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </RouteWorkspaceSectionCard>

            <RouteWorkspaceSectionCard
              className="admin-operations-lane-card"
              title={isKoLocale ? "운영 워크스페이스 레인" : "Operations workspace lanes"}
              description={
                isKoLocale
                  ? "같은 운영 리듬으로 묶이는 작업면만 모아 route-first로 엽니다."
                  : "Open only the workspaces that belong to the same operating rhythm."
              }
            >
              <div className="panel-grid admin-operations-lane-cards">
                {laneCards.map((lane) => (
                  <article className="panel admin-operations-lane-surface" key={lane.key}>
                    <h2>{lane.title}</h2>
                    <p className="small muted">{lane.description}</p>
                    <div className="actions">
                      <Link className="btn btn-primary" href={lane.primaryHref}>
                        {lane.primaryLabel}
                      </Link>
                      {lane.secondaryLinks.map((link) => (
                        <Link className="btn btn-secondary" href={link.href} key={link.href}>
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </RouteWorkspaceSectionCard>
          </>
        }
        side={
          <div className="admin-operations-lane-side">
            <RouteWorkspaceSectionCard
              className="admin-operations-side-card"
              title={isKoLocale ? "레인 운영 원칙" : "Lane operating principles"}
              description={
                isKoLocale
                  ? "관리자 허브에서 넘어온 우선순위를 이 레인에서 실제 후속 작업으로 바꿉니다."
                  : "Turn admin-hub priorities into actual follow-up actions in this lane."
              }
            >
              <ul className="admin-operations-rule-list">
                {laneRules.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            </RouteWorkspaceSectionCard>

            <RouteWorkspaceSectionCard
              className="admin-operations-side-card"
              title={isKoLocale ? "대표 진입점" : "Representative entries"}
              description={
                isKoLocale
                  ? "가장 자주 이어지는 작업면만 다시 묶어 제공합니다."
                  : "Re-list the most common next entries for quick follow-up."
              }
            >
              <div className="v2-stat-list">
                <Link className="v2-stat-row" href={withAdminSource("/admin/attendance-live", ADMIN_OPERATIONS_SOURCE)}>
                  <div className="v2-stat-copy">
                    <strong>{isKoLocale ? "실시간 근태" : "Attendance live"}</strong>
                    <p>{isKoLocale ? "오늘 근태 이상과 체크 누락" : "Today's attendance anomalies and missing records"}</p>
                  </div>
                </Link>
                <Link className="v2-stat-row" href={withAdminSource("/admin/notices", ADMIN_OPERATIONS_SOURCE)}>
                  <div className="v2-stat-copy">
                    <strong>{isKoLocale ? "공지 후속" : "Notice follow-up"}</strong>
                    <p>{isKoLocale ? "읽음 위험 공지와 직원 공지 운영" : "Read-risk notices and employee-facing notice operations"}</p>
                  </div>
                </Link>
                <Link className="v2-stat-row" href={withAdminSource("/admin/contracts", ADMIN_OPERATIONS_SOURCE)}>
                  <div className="v2-stat-copy">
                    <strong>{isKoLocale ? "계약 후속" : "Contract follow-up"}</strong>
                    <p>{isKoLocale ? "의사결정, 응답 대기, SLA 초과 follow-up" : "Decision, pending-response, and SLA-overdue follow-up"}</p>
                  </div>
                </Link>
              </div>
            </RouteWorkspaceSectionCard>
          </div>
        }
      />
    </RouteWorkspaceShell>
  );
}
