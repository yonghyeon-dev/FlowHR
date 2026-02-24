import type { OrganizationSummary } from "@/app/admin/page-types";
import type { SupabaseSessionSnapshot } from "@/lib/client/useSupabaseSession";

type AdminOnboardingAccountPanelsProps = {
  isKoLocale: boolean;
  showDevTools: boolean;
  isProductionRuntime: boolean;
  usesBearerToken: boolean;
  organizationId: string;
  organizationName: string;
  organizations: OrganizationSummary[];
  adminActorId: string;
  accessToken: string;
  supabaseUrl: string;
  supabaseSession: SupabaseSessionSnapshot | null;
  supabaseSessionError: string | null;
  onOrganizationNameChange: (value: string) => void;
  onCreateOrganization: () => void;
  onListOrganizations: () => void;
  onSelectOrganization: (organizationId: string) => void;
  onOrganizationIdChange: (value: string) => void;
  onAdminActorIdChange: (value: string) => void;
  onAccessTokenChange: (value: string) => void;
};

export function AdminOnboardingAccountPanels({
  isKoLocale,
  showDevTools,
  isProductionRuntime,
  usesBearerToken,
  organizationId,
  organizationName,
  organizations,
  adminActorId,
  accessToken,
  supabaseUrl,
  supabaseSession,
  supabaseSessionError,
  onOrganizationNameChange,
  onCreateOrganization,
  onListOrganizations,
  onSelectOrganization,
  onOrganizationIdChange,
  onAdminActorIdChange,
  onAccessTokenChange
}: AdminOnboardingAccountPanelsProps) {
  return (
    <>
      <article className="panel" id="onboarding">
        <h2>조직 온보딩</h2>
        <p className="small">
          {isKoLocale
            ? "조직(테넌트)을 먼저 만들고 선택해야 직원/근태/휴가/급여 흐름을 정상 검증할 수 있습니다. 이 패널의 조직 생성/목록 조회 호출은 tenantScope 제한을 피하기 위해 Dev Header 모드에서 "
            : "You need to create and select an organization (tenant) first to validate employee/attendance/leave/payroll flows. Organization create/list requests in this panel omit "}
          <code>x-actor-organization-id</code>
          {isKoLocale ? " 헤더를 생략합니다." : " header in Dev Header mode to bypass tenantScope restriction."}
        </p>
        <p className="small">
          {isKoLocale ? "현재 선택된 조직 ID" : "Current organization ID"}: <code>{organizationId.trim() || "-"}</code>
        </p>

        <div className="input-grid">
          <label className="full">
            새 조직 이름
            <input value={organizationName} onChange={(event) => onOrganizationNameChange(event.target.value)} />
          </label>
        </div>
        <div className="actions">
          <button className="btn btn-primary" onClick={onCreateOrganization} disabled={!organizationName.trim()}>
            조직 생성
          </button>
          <button className="btn btn-secondary" onClick={onListOrganizations}>
            조직 목록 조회
          </button>
        </div>

        {organizations.length === 0 ? (
          <p className="small muted">조직 목록을 아직 불러오지 않았습니다.</p>
        ) : (
          <ul className="simple-list" aria-label="조직 목록">
            {organizations.map((org) => (
              <li key={org.id}>
                <span>
                  <strong>{org.id}</strong>{" "}
                  <span className="muted">
                    {org.name}
                    {organizationId.trim() === org.id ? " (선택됨)" : ""}
                  </span>
                </span>
                <button type="button" className="btn btn-secondary btn-small" onClick={() => onSelectOrganization(org.id)}>
                  이 조직 사용
                </button>
              </li>
            ))}
          </ul>
        )}
      </article>

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
                {isKoLocale ? "조직 ID" : "Organization ID"}
                <input
                  value={organizationId}
                  placeholder="예: ORG-00001"
                  onChange={(event) => onOrganizationIdChange(event.target.value)}
                />
              </label>
              <label>
                {isKoLocale ? "관리자 액터 ID" : "Admin actor ID"}
                <input value={adminActorId} onChange={(event) => onAdminActorIdChange(event.target.value)} />
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
            </div>
            {showDevTools ? (
              <p className="small muted" style={{ marginTop: 10 }}>
                {isKoLocale ? "(dev) 런타임 Supabase URL" : "(dev) runtime Supabase URL"}: <code>{supabaseUrl}</code>
              </p>
            ) : null}
          </details>
        ) : null}
      </article>
    </>
  );
}
