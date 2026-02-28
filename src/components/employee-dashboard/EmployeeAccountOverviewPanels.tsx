import type { IntegratedSubmitChecklistCard, IntegratedSummaryCard } from "@/app/employee/page-types";
import { EmployeeJourneyShortcutPanel } from "@/components/employee-self-service/EmployeeJourneyShortcutPanel";
import type { SupabaseSessionSnapshot } from "@/lib/client/useSupabaseSession";

type EmployeeAccountOverviewPanelsProps = {
  isKoLocale: boolean;
  showDevTools: boolean;
  isProductionRuntime: boolean;
  usesBearerToken: boolean;
  supabaseSession: SupabaseSessionSnapshot | null;
  supabaseSessionError: string | null;
  organizationId: string;
  employeeId: string;
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

export function EmployeeAccountOverviewPanels({
  isKoLocale,
  showDevTools,
  isProductionRuntime,
  usesBearerToken,
  supabaseSession,
  supabaseSessionError,
  organizationId,
  employeeId,
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
  return (
    <>
      <EmployeeJourneyShortcutPanel onJumpToSection={onJumpToSection} />

      <article className="panel" id="account">
        <h2>{isKoLocale ? "내 계정" : "My Account"}</h2>
        {isProductionRuntime ? (
          <p className="small">
            {supabaseSession
              ? `${supabaseSession.email ?? supabaseSession.userId} · role=${supabaseSession.role ?? "-"} · org=${supabaseSession.organizationId ?? "-"}`
              : isKoLocale
                ? "현재 로그인되어 있지 않습니다."
                : "You are not logged in."}{" "}
            <span className="muted">
              (Bearer {isKoLocale ? (usesBearerToken ? "사용" : "미사용") : usesBearerToken ? "enabled" : "disabled"})
            </span>
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

        {showDevTools || !isProductionRuntime ? (
          <details className="details" style={{ marginTop: 12 }}>
            <summary>
              {isKoLocale ? "세션/조회 설정" : "Session & Query Settings"}
            </summary>
            <div className="input-grid" style={{ marginTop: 12 }}>
              <p className="small full">
                {isKoLocale ? "세션 조직" : "Session organization"}: <code>{organizationId || "-"}</code> /{" "}
                {isKoLocale ? "세션 직원" : "Session employee"}: <code>{employeeId || "-"}</code>
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
            {showDevTools ? (
              <p className="small muted" style={{ marginTop: 10 }}>
                {isKoLocale ? "(개발) 런타임 Supabase URL" : "(dev) Runtime Supabase URL"}: <code>{supabaseUrl}</code> /{" "}
                {isKoLocale ? "인증 모드" : "Auth mode"}{" "}
                {usesBearerToken ? (isKoLocale ? "세션 Bearer" : "Session Bearer") : isKoLocale ? "개발 헤더" : "Dev Header"}
              </p>
            ) : null}
          </details>
        ) : null}
        <div className="actions">
          <button className="btn btn-primary" onClick={onRefreshEmployeeSnapshot}>
            {isKoLocale ? "내 데이터 새로고침" : "Refresh My Data"}
          </button>
        </div>
      </article>

      <article className="panel panel-self-service-overview" id="self-service-overview">
        <h2>{isKoLocale ? "근태/휴가 통합 요약 카드" : "Attendance/Leave Summary Cards"}</h2>
        <p className="small">
          {isKoLocale
            ? "현재 조회 구간의 요청 상태를 한 번에 보고, 재제출 필요 건과 API 실패 신호를 함께 점검합니다."
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
            ? "출퇴근 정정, 휴가 신청, 재제출 흐름의 제출 가능 상태를 한 화면에서 점검합니다."
            : "Check submit readiness for attendance correction, leave requests, and resubmission in one view."}
        </p>
        <div className="submit-checklist-grid" aria-label={isKoLocale ? "통합 제출 체크리스트" : "Integrated submit checklist"}>
          {integratedSubmitChecklistCards.map((card) => (
            <article key={card.key} className={`submit-checklist-card ${card.ready ? "is-ready" : "is-blocked"}`}>
              <p>{card.label}</p>
              <strong>
                {card.passCount}/{card.totalCount}
              </strong>
              <span>{card.detail}</span>
              <button type="button" className="btn btn-secondary btn-small" onClick={() => onJumpToSection(card.targetSectionId)}>
                {isKoLocale ? "관련 섹션 이동" : "Go to Section"}
              </button>
            </article>
          ))}
        </div>
      </article>
    </>
  );
}
