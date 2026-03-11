import Link from "next/link";

import type { IntegratedSubmitChecklistCard, IntegratedSummaryCard } from "@/app/employee/page-types";
import { buildEmployeeWorkspaceHubs } from "@/components/employee-dashboard/workspace-hubs";
import { EmployeeJourneyShortcutPanel } from "@/components/employee-self-service/EmployeeJourneyShortcutPanel";
import type { SupabaseSessionSnapshot } from "@/lib/client/useSupabaseSession";
import {
  formatSignedInAccountLabel,
  formatEmployeeSessionConnectionState,
  formatWorkspaceConnectionState
} from "@/lib/product-language";

type EmployeeAccountOverviewPanelsProps = {
  isKoLocale: boolean;
  showDevTools: boolean;
  isProductionRuntime: boolean;
  usesBearerToken: boolean;
  requiresLoginSession: boolean;
  supabaseSession: SupabaseSessionSnapshot | null;
  supabaseSessionError: string | null;
  periodStart: string;
  periodEnd: string;
  supabaseUrl: string;
  integratedSummaryCards: IntegratedSummaryCard[];
  integratedSubmitChecklistCards: IntegratedSubmitChecklistCard[];
  onPeriodStartChange: (value: string) => void;
  onPeriodEndChange: (value: string) => void;
  onRefreshEmployeeSnapshot: () => void;
  onJumpToSection: (sectionId: string) => void;
};

type PriorityWorkspaceTarget = {
  href: string;
  label: string;
};

type ChecklistActionTarget =
  | {
      kind: "link";
      href: string;
      label: string;
    }
  | {
      kind: "jump";
      sectionId: string;
      label: string;
    };

type ActionPriorityBadge = {
  key: string;
  label: string;
  remainingCount: number;
  totalCount: number;
  targetSectionId: string;
  severity: "critical" | "watch" | "stable";
};

function resolveActionPrioritySeverity(
  remainingCount: number,
  totalCount: number
): ActionPriorityBadge["severity"] {
  if (remainingCount <= 0) {
    return "stable";
  }
  if (remainingCount >= Math.max(2, Math.ceil(totalCount / 2))) {
    return "critical";
  }
  return "watch";
}

function buildActionPriorityBadges(
  cards: IntegratedSubmitChecklistCard[]
): ActionPriorityBadge[] {
  const severityRank: Record<ActionPriorityBadge["severity"], number> = {
    critical: 3,
    watch: 2,
    stable: 1
  };
  return cards
    .map((card) => {
      const remainingCount = Math.max(card.totalCount - card.passCount, 0);
      return {
        key: card.key,
        label: card.label,
        remainingCount,
        totalCount: card.totalCount,
        targetSectionId: card.targetSectionId,
        severity: resolveActionPrioritySeverity(remainingCount, card.totalCount)
      } satisfies ActionPriorityBadge;
    })
    .sort((left, right) => {
      const bySeverity = severityRank[right.severity] - severityRank[left.severity];
      if (bySeverity !== 0) {
        return bySeverity;
      }
      if (left.remainingCount !== right.remainingCount) {
        return right.remainingCount - left.remainingCount;
      }
      return left.label.localeCompare(right.label);
    });
}

function resolvePriorityWorkspaceTarget(
  sectionId: string,
  isKoLocale: boolean
): PriorityWorkspaceTarget {
  switch (sectionId) {
    case "attendance":
      return {
        href: "/employee/attendance/correction?source=employee-dashboard",
        label: isKoLocale ? "근태 작업 열기" : "Open attendance workspace"
      };
    case "leave":
      return {
        href: "/employee/leave/request?source=employee-dashboard",
        label: isKoLocale ? "휴가 작업 열기" : "Open leave workspace"
      };
    case "request-feedback":
    case "request-search-sort":
    case "request-timeline":
      return {
        href: "/employee/requests/monitoring?source=employee-dashboard",
        label: isKoLocale ? "요청 상태 센터 열기" : "Open request monitoring"
      };
    case "request-resubmit":
      return {
        href: "/employee/requests/resubmit?source=employee-dashboard",
        label: isKoLocale ? "재제출 워크벤치 열기" : "Open resubmit workbench"
      };
    default:
      return {
        href: "/employee/requests?source=employee-dashboard",
        label: isKoLocale ? "요청 센터 열기" : "Open requests hub"
      };
  }
}

function resolveChecklistActionTarget(
  sectionId: string,
  isKoLocale: boolean
): ChecklistActionTarget {
  const workspaceTarget = resolvePriorityWorkspaceTarget(sectionId, isKoLocale);
  if (
    sectionId === "attendance" ||
    sectionId === "leave" ||
    sectionId === "request-feedback" ||
    sectionId === "request-search-sort" ||
    sectionId === "request-timeline" ||
    sectionId === "request-resubmit"
  ) {
    return {
      kind: "link",
      href: workspaceTarget.href,
      label: workspaceTarget.label
    };
  }
  return {
    kind: "jump",
    sectionId,
    label: isKoLocale ? "관련 섹션 이동" : "Go to section"
  };
}

export function EmployeeAccountOverviewPanels({
  isKoLocale,
  showDevTools,
  isProductionRuntime,
  usesBearerToken,
  requiresLoginSession,
  supabaseSession,
  supabaseSessionError,
  periodStart,
  periodEnd,
  supabaseUrl,
  integratedSummaryCards,
  integratedSubmitChecklistCards,
  onPeriodStartChange,
  onPeriodEndChange,
  onRefreshEmployeeSnapshot,
  onJumpToSection
}: EmployeeAccountOverviewPanelsProps) {
  const locale = isKoLocale ? "ko" : "en";
  const hasWorkspaceSession = Boolean((supabaseSession?.organizationId ?? "").trim());
  const hasEmployeeSession = Boolean((supabaseSession?.actorId ?? supabaseSession?.userId ?? "").trim());
  const workspaceHubs = buildEmployeeWorkspaceHubs(isKoLocale);
  const priorityChecklistCard =
    integratedSubmitChecklistCards.find((card) => !card.ready) ??
    integratedSubmitChecklistCards[0] ??
    null;
  const actionPriorityBadges = buildActionPriorityBadges(
    integratedSubmitChecklistCards
  );
  const hasBlockingChecklist = Boolean(
    priorityChecklistCard && !priorityChecklistCard.ready
  );
  const priorityWorkspaceTarget = priorityChecklistCard
    ? resolvePriorityWorkspaceTarget(
        priorityChecklistCard.targetSectionId,
        isKoLocale
      )
    : null;
  const priorityChecklistAction = priorityChecklistCard
    ? resolveChecklistActionTarget(priorityChecklistCard.targetSectionId, isKoLocale)
    : null;

  return (
    <>
      <EmployeeJourneyShortcutPanel onJumpToSection={onJumpToSection} />

      <article className="panel" id="workspace-hub">
        <h2>{isKoLocale ? "핵심 워크스페이스 허브" : "Core workspace hub"}</h2>
        <p className="small">
          {isKoLocale
            ? "요약은 홈 화면에서 확인하고, 상세 작업은 전용 워크스페이스에서 진행하세요."
            : "Use the home dashboard for summary, then continue in dedicated workspaces."}
        </p>
        <div className="panel-grid">
          {workspaceHubs.map((hub) => (
            <article className="panel" key={hub.key}>
              <h3>{hub.title}</h3>
              <p className="small muted">{hub.description}</p>
              <div className="actions">
                {hub.links.map((link, index) => (
                  <Link
                    className={index === 0 ? "btn btn-primary" : "btn btn-secondary"}
                    href={link.href}
                    key={`${hub.key}-${link.href}`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </div>
      </article>

      <article className="panel" id="priority-action">
        <h2>{isKoLocale ? "오늘의 우선 처리" : "Today's priority"}</h2>
        <p className="small">
          {isKoLocale
            ? "제출 체크리스트를 기준으로 지금 바로 처리할 다음 작업을 제안합니다."
            : "Based on checklist readiness, this suggests the next action to process now."}
        </p>
        <div className="actions">
          {actionPriorityBadges.map((badge) => (
            (() => {
              const actionTarget = resolveChecklistActionTarget(
                badge.targetSectionId,
                isKoLocale
              );
              const badgeLabel = `${badge.label} (${badge.remainingCount}/${badge.totalCount}) / ${
                badge.severity === "critical"
                  ? isKoLocale
                    ? "긴급"
                    : "Critical"
                  : badge.severity === "watch"
                    ? isKoLocale
                      ? "주의"
                      : "Watch"
                    : isKoLocale
                      ? "안정"
                      : "Stable"
              }`;
              const className = `btn ${
                badge.severity === "critical" ? "btn-primary" : "btn-secondary"
              } btn-small`;

              return actionTarget.kind === "link" ? (
                <Link key={badge.key} className={className} href={actionTarget.href}>
                  {badgeLabel}
                </Link>
              ) : (
                <button
                  key={badge.key}
                  type="button"
                  className={className}
                  onClick={() => onJumpToSection(actionTarget.sectionId)}
                >
                  {badgeLabel}
                </button>
              );
            })()
          ))}
        </div>
        {priorityChecklistCard ? (
          <>
            <p className="small">
              <strong>{priorityChecklistCard.label}</strong> / {" "}
              {priorityChecklistCard.passCount}/{priorityChecklistCard.totalCount}
            </p>
            <p className="small muted">{priorityChecklistCard.detail}</p>
            <div className="actions">
              {priorityChecklistAction?.kind === "link" ? (
                <Link
                  className={hasBlockingChecklist ? "btn btn-primary" : "btn btn-secondary"}
                  href={priorityChecklistAction.href}
                >
                  {hasBlockingChecklist
                    ? isKoLocale
                      ? "우선 작업 열기"
                      : "Open priority task"
                    : isKoLocale
                      ? "체크리스트 다시 확인"
                      : "Review checklist"}
                </Link>
              ) : (
                <button
                  type="button"
                  className={hasBlockingChecklist ? "btn btn-primary" : "btn btn-secondary"}
                  onClick={() => onJumpToSection(priorityChecklistCard.targetSectionId)}
                >
                  {hasBlockingChecklist
                    ? isKoLocale
                      ? "우선 작업 열기"
                      : "Open priority task"
                    : isKoLocale
                      ? "체크리스트 다시 확인"
                      : "Review checklist"}
                </button>
              )}
              {priorityWorkspaceTarget ? (
                <Link
                  className="btn btn-secondary"
                  href={priorityWorkspaceTarget.href}
                >
                  {priorityWorkspaceTarget.label}
                </Link>
              ) : null}
            </div>
          </>
        ) : (
          <p className="small muted">
            {isKoLocale
              ? "표시할 체크리스트가 없습니다. 데이터를 새로고침해 주세요."
              : "No checklist items to show yet. Refresh data to continue."}
          </p>
        )}
      </article>

      <article className="panel" id="account">
        <h2>{isKoLocale ? "내 계정" : "My Account"}</h2>
        {isProductionRuntime ? (
          <p className="small">
            {supabaseSession
              ? isKoLocale
                ? `로그인 계정: ${formatSignedInAccountLabel(supabaseSession.email, locale)}`
                : `Signed in as ${formatSignedInAccountLabel(supabaseSession.email, locale)}`
              : isKoLocale
                ? "현재 로그인되어 있지 않습니다. "
                : "You are not signed in. "}
            {!supabaseSession ? (
              <Link className="small" href="/login">
                /login
              </Link>
            ) : null}
          </p>
        ) : (
          <p className="small muted">
            {isKoLocale
              ? "로컬 개발: Dev Header(x-actor-*) 모드가 기본입니다."
              : "Local dev: Dev Header (x-actor-*) mode is default."}
          </p>
        )}
        {supabaseSessionError ? (
          <p className="small" style={{ marginTop: 10, color: "var(--danger)" }}>
            {isKoLocale ? "세션 오류" : "Session error"}: {supabaseSessionError}
          </p>
        ) : null}

        {showDevTools ? (
          <details className="details" style={{ marginTop: 12 }}>
            <summary>
              {isKoLocale ? "세션/조회 설정" : "Session & Query Settings"}
            </summary>
            <div className="input-grid" style={{ marginTop: 12 }}>
              <p className="small full">
                <strong>{formatWorkspaceConnectionState(hasWorkspaceSession, locale)}</strong> /{" "}
                <strong>{formatEmployeeSessionConnectionState(hasEmployeeSession, locale)}</strong>
              </p>
              <label>
                {isKoLocale ? "조회 기간 시작" : "Period Start"}
                <input type="datetime-local" value={periodStart} onChange={(event) => onPeriodStartChange(event.target.value)} />
              </label>
              <label>
                {isKoLocale ? "조회 기간 종료" : "Period End"}
                <input type="datetime-local" value={periodEnd} onChange={(event) => onPeriodEndChange(event.target.value)} />
              </label>
            </div>
            <p className="small muted" style={{ marginTop: 10 }}>
              {isKoLocale ? "(개발) 런타임 Supabase URL" : "(dev) Runtime Supabase URL"}: <code>{supabaseUrl}</code> /{" "}
              {isKoLocale ? "인증 모드" : "Auth mode"}{" "}
              {usesBearerToken ? (isKoLocale ? "세션 Bearer" : "Session Bearer") : isKoLocale ? "개발 헤더" : "Dev Header"}
            </p>
          </details>
        ) : null}
        <div className="actions">
          <button
            className="btn btn-primary"
            onClick={onRefreshEmployeeSnapshot}
            disabled={requiresLoginSession}
          >
            {isKoLocale ? "내 데이터 새로고침" : "Refresh My Data"}
          </button>
        </div>
      </article>

      <article className="panel panel-self-service-overview" id="self-service-overview">
        <h2>{isKoLocale ? "근태/휴가 통합 요약 카드" : "Attendance/Leave Summary Cards"}</h2>
        <p className="small">
          {isKoLocale
            ? "현재 조회 구간의 요청 상태를 한 번에 보고, 재제출 필요 건과 API 실패 신호를 함께 확인합니다."
            : "Review request states, resubmit-needed items, and API failures together for the selected period."}
        </p>
        <div className="integrated-summary-grid" aria-label={isKoLocale ? "요청 통합 요약 카드" : "employee integrated summary cards"}>
          {integratedSummaryCards.map((card) => (
            <article key={card.key} className={`integrated-summary-card tone-${card.tone}`}>
              <p>{card.label}</p>
              <strong>{card.value}</strong>
              <span>{card.detail}</span>
            </article>
          ))}
        </div>
      </article>

      <article className="panel panel-submit-checklist" id="submit-checklist">
        <h2>{isKoLocale ? "정정/휴가 제출 체크리스트 통합" : "Correction/Leave Submit Checklist"}</h2>
        <p className="small">
          {isKoLocale
            ? "출퇴근 정정, 휴가 요청, 재제출 흐름의 제출 가능 상태를 한 화면에서 확인합니다."
            : "Check submit readiness for attendance correction, leave requests, and resubmission in one view."}
        </p>
        <div className="submit-checklist-grid" aria-label={isKoLocale ? "통합 제출 체크리스트" : "Integrated submit checklist"}>
          {integratedSubmitChecklistCards.map((card) => {
              const actionTarget = resolveChecklistActionTarget(
                card.targetSectionId,
                isKoLocale
              );
              return (
                <article
                  key={card.key}
                  className={`submit-checklist-card ${card.ready ? "is-ready" : "is-blocked"}`}
                >
                  <p>{card.label}</p>
                  <strong>
                    {card.passCount}/{card.totalCount}
                  </strong>
                  <span>{card.detail}</span>
                  {actionTarget.kind === "link" ? (
                    <Link className="btn btn-secondary btn-small" href={actionTarget.href}>
                      {actionTarget.label}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      onClick={() => onJumpToSection(actionTarget.sectionId)}
                    >
                      {actionTarget.label}
                    </button>
                  )}
                </article>
              );
            })}
        </div>
      </article>
    </>
  );
}
