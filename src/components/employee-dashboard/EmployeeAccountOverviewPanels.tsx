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
  accessToken: string;
  periodStart: string;
  periodEnd: string;
  supabaseUrl: string;
  integratedSummaryCards: IntegratedSummaryCard[];
  integratedSubmitChecklistCards: IntegratedSubmitChecklistCard[];
  onOrganizationIdChange: (value: string) => void;
  onEmployeeIdChange: (value: string) => void;
  onAccessTokenChange: (value: string) => void;
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
  accessToken,
  periodStart,
  periodEnd,
  supabaseUrl,
  integratedSummaryCards,
  integratedSubmitChecklistCards,
  onOrganizationIdChange,
  onEmployeeIdChange,
  onAccessTokenChange,
  onPeriodStartChange,
  onPeriodEndChange,
  onRefreshEmployeeSnapshot,
  onJumpToSection
}: EmployeeAccountOverviewPanelsProps) {
  return (
    <>
      <EmployeeJourneyShortcutPanel onJumpToSection={onJumpToSection} />

      <article className="panel" id="account">
        <h2>내 계정</h2>
        {isProductionRuntime ? (
          <p className="small">
            {supabaseSession
              ? `${supabaseSession.email ?? supabaseSession.userId} · role=${supabaseSession.role ?? "-"} · org=${supabaseSession.organizationId ?? "-"}`
              : "현재 로그인되어 있지 않습니다."}{" "}
            <span className="muted">
              (Bearer {isKoLocale ? (usesBearerToken ? "사용" : "미사용") : usesBearerToken ? "ON" : "OFF"})
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
            세션 오류: {supabaseSessionError}
          </p>
        ) : null}

        {showDevTools || !isProductionRuntime ? (
          <details className="details" style={{ marginTop: 12 }}>
            <summary>
              개발/검증 설정 <small>(필요할 때만)</small>
            </summary>
            <div className="input-grid" style={{ marginTop: 12 }}>
              <label>
                {isKoLocale ? "조직 ID (선택)" : "Organization ID (optional)"}
                <input
                  value={organizationId}
                  placeholder="예: ORG-00001"
                  onChange={(event) => onOrganizationIdChange(event.target.value)}
                />
              </label>
              <label>
                내 직원 ID
                <input value={employeeId} onChange={(event) => onEmployeeIdChange(event.target.value)} />
              </label>
              {showDevTools ? (
                <label className="full">
                  {isKoLocale ? "Bearer 액세스 토큰 (재정의)" : "Bearer access token (override)"}
                  <textarea
                    rows={3}
                    placeholder={
                      isKoLocale
                        ? "비어 있으면 Dev Header(로컬) 또는 세션(Bearer)이 사용됩니다."
                        : "If empty, Dev Header (local) or session (Bearer) will be used."
                    }
                    value={accessToken}
                    onChange={(event) => onAccessTokenChange(event.target.value)}
                  />
                </label>
              ) : null}
              <label>
                조회 기간 시작
                <input type="datetime-local" value={periodStart} onChange={(event) => onPeriodStartChange(event.target.value)} />
              </label>
              <label>
                조회 기간 종료
                <input type="datetime-local" value={periodEnd} onChange={(event) => onPeriodEndChange(event.target.value)} />
              </label>
            </div>
            {showDevTools ? (
              <p className="small muted" style={{ marginTop: 10 }}>
                {isKoLocale ? "(dev) 런타임 Supabase URL" : "(dev) runtime Supabase URL"}: <code>{supabaseUrl}</code> /{" "}
                {isKoLocale ? "인증 모드" : "Auth mode"} {usesBearerToken ? (isKoLocale ? "Bearer 토큰" : "Bearer token") : "Dev Header"}
              </p>
            ) : null}
          </details>
        ) : null}
        <div className="actions">
          <button className="btn btn-primary" onClick={onRefreshEmployeeSnapshot}>
            내 데이터 새로고침
          </button>
        </div>
      </article>

      <article className="panel panel-self-service-overview" id="self-service-overview">
        <h2>근태/휴가 통합 요약 카드</h2>
        <p className="small">현재 조회 구간의 요청 상태를 한 번에 보고, 재제출 필요 건과 API 실패 신호를 함께 점검합니다.</p>
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
        <h2>정정/휴가 제출 체크리스트 통합</h2>
        <p className="small">출퇴근 정정, 휴가 신청, 재제출 흐름의 제출 가능 상태를 한 화면에서 점검합니다.</p>
        <div className="submit-checklist-grid" aria-label="integrated submit checklist">
          {integratedSubmitChecklistCards.map((card) => (
            <article key={card.key} className={`submit-checklist-card ${card.ready ? "is-ready" : "is-blocked"}`}>
              <p>{card.label}</p>
              <strong>
                {card.passCount}/{card.totalCount}
              </strong>
              <span>{card.detail}</span>
              <button type="button" className="btn btn-secondary btn-small" onClick={() => onJumpToSection(card.targetSectionId)}>
                관련 섹션 이동
              </button>
            </article>
          ))}
        </div>
      </article>
    </>
  );
}
