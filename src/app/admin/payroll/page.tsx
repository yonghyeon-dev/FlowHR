"use client";

import Link from "next/link";
import { ADMIN_PAYROLL_SOURCE, withAdminSource } from "@/app/admin/source-context";
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

export default function AdminPayrollLanePage() {
  const { locale } = useI18n();
  const isKoLocale = locale === "ko";

  const queueItems: QueueItem[] = [
    {
      key: "previewed-payroll",
      title: isKoLocale ? "미확정 급여 프리뷰" : "Previewed payroll runs",
      description: isKoLocale
        ? "마감 전 마지막 확인이 필요한 급여 프리뷰와 정산 예외를 먼저 엽니다."
        : "Open previewed payroll runs and settlement exceptions before final close.",
      href: withAdminSource("/admin/payroll-close/previewed", ADMIN_PAYROLL_SOURCE),
      primaryLabel: isKoLocale ? "프리뷰 확인" : "Review previews",
      secondaryLabel: isKoLocale ? "급여 마감" : "Open payroll close",
      secondaryHref: withAdminSource("/admin/payroll-close", ADMIN_PAYROLL_SOURCE),
      tone: "critical"
    },
    {
      key: "payslip-delivery",
      title: isKoLocale ? "명세서 미배포 후속" : "Undistributed payslips",
      description: isKoLocale
        ? "배포되지 않은 명세서와 전달 상태를 같은 레인에서 추적합니다."
        : "Track undistributed payslips and delivery status in one lane.",
      href: withAdminSource(
        "/admin/payroll-payslip-delivery/undistributed",
        ADMIN_PAYROLL_SOURCE
      ),
      primaryLabel: isKoLocale ? "미배포 확인" : "Review undistributed",
      secondaryLabel: isKoLocale ? "배포 워크스페이스" : "Delivery workspace",
      secondaryHref: withAdminSource("/admin/payroll-payslip-delivery", ADMIN_PAYROLL_SOURCE),
      tone: "watch"
    },
    {
      key: "year-end",
      title: isKoLocale ? "연말정산 정산 후속" : "Year-end settlement follow-up",
      description: isKoLocale
        ? "연말정산 정산과 영수증 발급 전 검토 항목을 한 번에 이어서 처리합니다."
        : "Review year-end settlement and receipt follow-up before distribution.",
      href: withAdminSource("/admin/payroll-year-end", ADMIN_PAYROLL_SOURCE),
      primaryLabel: isKoLocale ? "연말정산 열기" : "Open year-end",
      secondaryLabel: isKoLocale ? "사전 점검" : "Open preflight",
      secondaryHref: withAdminSource("/admin/payroll-year-end/preflight", ADMIN_PAYROLL_SOURCE),
      tone: "watch"
    },
    {
      key: "filing",
      title: isKoLocale ? "신고 운영 후속" : "Filing operations follow-up",
      description: isKoLocale
        ? "신고 마감, ACK, 제출 상태를 운영 레인 기준으로 이어서 관리합니다."
        : "Continue filing close, ACK, and submission status follow-up in one flow.",
      href: withAdminSource("/admin/payroll-year-end-filing", ADMIN_PAYROLL_SOURCE),
      primaryLabel: isKoLocale ? "신고 워크스페이스" : "Open filing workspace",
      secondaryLabel: isKoLocale ? "신고 운영 단계" : "Open filing ops",
      secondaryHref: withAdminSource("/admin/payroll-year-end-filing/ops", ADMIN_PAYROLL_SOURCE),
      tone: "critical"
    }
  ];

  const laneCards: LaneCard[] = [
    {
      key: "payroll-close",
      title: isKoLocale ? "급여 마감과 검증" : "Payroll close and verification",
      description: isKoLocale
        ? "프리뷰, 마감, 검증 단계를 한 작업 묶음으로 이어서 처리합니다."
        : "Keep preview, close, and verification in one working sequence.",
      primaryHref: withAdminSource("/admin/payroll-close", ADMIN_PAYROLL_SOURCE),
      primaryLabel: isKoLocale ? "급여 마감" : "Payroll close",
      secondaryLinks: [
        {
          href: withAdminSource("/admin/payroll-close/previewed", ADMIN_PAYROLL_SOURCE),
          label: isKoLocale ? "프리뷰 검토" : "Preview review"
        },
        {
          href: withAdminSource("/admin/payroll-insurance", ADMIN_PAYROLL_SOURCE),
          label: isKoLocale ? "4대보험 정산" : "Insurance settlement"
        }
      ]
    },
    {
      key: "documents",
      title: isKoLocale ? "명세서와 문서 후속" : "Payslips and document follow-up",
      description: isKoLocale
        ? "명세서 배포, 수신 확인, 계약 문서 후속을 같은 문서 리듬으로 묶습니다."
        : "Group payslip delivery, receipt follow-up, and contract documents into one document rhythm.",
      primaryHref: withAdminSource("/admin/payroll-payslip-delivery", ADMIN_PAYROLL_SOURCE),
      primaryLabel: isKoLocale ? "명세서 배포" : "Payslip delivery",
      secondaryLinks: [
        {
          href: withAdminSource(
            "/admin/payroll-payslip-delivery/undistributed",
            ADMIN_PAYROLL_SOURCE
          ),
          label: isKoLocale ? "미배포 명세서" : "Undistributed payslips"
        },
        {
          href: withAdminSource("/admin/contracts", ADMIN_PAYROLL_SOURCE),
          label: isKoLocale ? "전자계약 문서" : "Contract documents"
        }
      ]
    },
    {
      key: "year-end-filing",
      title: isKoLocale ? "연말정산과 신고" : "Year-end and filing",
      description: isKoLocale
        ? "정산, 영수증, 신고 제출, ACK 후속을 하나의 정산 레인으로 엽니다."
        : "Open settlement, receipts, filing submissions, and ACK follow-up as one lane.",
      primaryHref: withAdminSource("/admin/payroll-year-end", ADMIN_PAYROLL_SOURCE),
      primaryLabel: isKoLocale ? "연말정산" : "Year-end",
      secondaryLinks: [
        {
          href: withAdminSource("/admin/payroll-year-end-filing", ADMIN_PAYROLL_SOURCE),
          label: isKoLocale ? "신고" : "Filing"
        },
        {
          href: withAdminSource("/admin/payroll-year-end-filing/ops", ADMIN_PAYROLL_SOURCE),
          label: isKoLocale ? "신고 운영 단계" : "Filing ops"
        }
      ]
    }
  ];

  const summaryItems = [
    { label: isKoLocale ? "핵심 큐" : "Primary queues", value: queueItems.length },
    { label: isKoLocale ? "대표 레인" : "Representative lanes", value: laneCards.length },
    { label: isKoLocale ? "문서 후속" : "Document follow-up", value: 3 },
    { label: isKoLocale ? "정산·신고 축" : "Settlement & filing", value: 2 }
  ];

  const laneRules = [
    isKoLocale
      ? "급여는 카드 둘러보기보다 프리뷰, 배포, 신고 후속 순으로 처리합니다."
      : "Treat payroll as preview, delivery, and filing follow-up before browsing.",
    isKoLocale
      ? "명세서와 문서 후속은 전달 상태와 응답 상태를 함께 보며 정리합니다."
      : "Review document delivery state together with response state.",
    isKoLocale
      ? "연말정산과 신고는 별도 콘솔이 아니라 같은 정산 리듬으로 연결합니다."
      : "Keep year-end and filing aligned to the same settlement rhythm."
  ];

  return (
    <RouteWorkspaceShell tone="admin" className="admin-payroll-lane-shell">
      <RouteWorkspaceHeader
        eyebrow="payroll lane"
        title={isKoLocale ? "급여 레인" : "Payroll lane"}
        description={
          isKoLocale
            ? "급여 마감, 명세서 배포, 연말정산, 신고 후속을 customer-admin 운영 레인으로 묶은 작업면입니다."
            : "A customer-admin operating lane for payroll close, payslip delivery, year-end, and filing follow-up."
        }
        sourceHint={
          isKoLocale
            ? "급여 마감 · 명세서 배포 · 연말정산 · 신고 · 문서 후속"
            : "Payroll close · payslip delivery · year-end · filing · document follow-up"
        }
        actions={[
          {
            href: "/admin",
            label: isKoLocale ? "관리자 허브" : "Admin hub",
            tone: "secondary"
          },
          {
            href: withAdminSource("/admin/payroll-close", ADMIN_PAYROLL_SOURCE),
            label: isKoLocale ? "급여 마감" : "Payroll close",
            tone: "primary"
          }
        ]}
      />

      <RouteWorkspaceSummary
        ariaLabel={isKoLocale ? "급여 레인 요약" : "Payroll lane summary"}
        className="admin-payroll-lane-summary"
        items={summaryItems}
      />

      <RouteWorkspaceSplit
        className="admin-payroll-lane-grid"
        main={
          <>
            <RouteWorkspaceSectionCard
              className="admin-payroll-lane-card"
              title={isKoLocale ? "지금 먼저 열기" : "Open first now"}
              description={
                isKoLocale
                  ? "확정, 배포, 신고에 직접 영향을 주는 후속 큐를 먼저 정렬합니다."
                  : "Start with the follow-up queues that directly affect confirmation, delivery, and filing."
              }
            >
              <div className="queue-list">
                {queueItems.map((item) => (
                  <article className="queue-item admin-payroll-queue-item" key={item.key}>
                    <div
                      className={`q-priority ${
                        item.tone === "critical" ? "high" : item.tone === "watch" ? "medium" : "low"
                      }`}
                    />
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
              className="admin-payroll-lane-card"
              title={isKoLocale ? "급여 워크스페이스 레인" : "Payroll workspace lanes"}
              description={
                isKoLocale
                  ? "마감, 배포, 정산, 신고를 같은 시각 리듬과 액션 계층으로 다시 묶습니다."
                  : "Re-align close, delivery, settlement, and filing into one visual rhythm."
              }
            >
              <div className="panel-grid admin-payroll-lane-cards">
                {laneCards.map((lane) => (
                  <article className="panel admin-payroll-lane-surface" key={lane.key}>
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
          <div className="admin-payroll-lane-side">
            <RouteWorkspaceSectionCard
              className="admin-payroll-side-card"
              title={isKoLocale ? "레인 운영 원칙" : "Lane operating principles"}
              description={
                isKoLocale
                  ? "관리자 허브의 급여 신호를 실제 정산·신고 작업 흐름으로 바꾸는 기준입니다."
                  : "Turn payroll signals from the admin hub into concrete settlement and filing work."
              }
            >
              <ul className="admin-payroll-rule-list">
                {laneRules.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            </RouteWorkspaceSectionCard>

            <RouteWorkspaceSectionCard
              className="admin-payroll-side-card"
              title={isKoLocale ? "대표 진입점" : "Representative entries"}
              description={
                isKoLocale
                  ? "자주 이어지는 급여 작업면을 다시 묶어 바로 진입할 수 있게 둡니다."
                  : "Keep the most common payroll entries grouped for quick follow-up."
              }
            >
              <div className="v2-stat-list">
                <Link className="v2-stat-row" href={withAdminSource("/admin/payroll-close", ADMIN_PAYROLL_SOURCE)}>
                  <div className="v2-stat-copy">
                    <strong>{isKoLocale ? "급여 마감" : "Payroll close"}</strong>
                    <p>
                      {isKoLocale
                        ? "프리뷰 검토와 최종 확정 전 체크리스트"
                        : "Preview review and confirmation checklist"}
                    </p>
                  </div>
                </Link>
                <Link
                  className="v2-stat-row"
                  href={withAdminSource("/admin/payroll-payslip-delivery", ADMIN_PAYROLL_SOURCE)}
                >
                  <div className="v2-stat-copy">
                    <strong>{isKoLocale ? "명세서 배포" : "Payslip delivery"}</strong>
                    <p>
                      {isKoLocale
                        ? "미배포 명세서와 전달 상태 후속"
                        : "Undistributed payslips and delivery follow-up"}
                    </p>
                  </div>
                </Link>
                <Link
                  className="v2-stat-row"
                  href={withAdminSource("/admin/payroll-year-end-filing", ADMIN_PAYROLL_SOURCE)}
                >
                  <div className="v2-stat-copy">
                    <strong>{isKoLocale ? "연말정산 신고" : "Year-end filing"}</strong>
                    <p>
                      {isKoLocale
                        ? "정산, 제출, ACK 후속을 한 레인에서 연결"
                        : "Settlement, submission, and ACK follow-up in one lane"}
                    </p>
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
