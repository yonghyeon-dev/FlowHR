import type { OrganizationSummary } from "@/app/admin/page-types";
import type { SupabaseSessionSnapshot } from "@/lib/client/useSupabaseSession";
import {
  formatActorRoleLabel,
  formatUserFacingErrorMessage
} from "@/lib/product-language";

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
  const runtimeLocale = isKoLocale ? "ko-KR" : "en-US";

  return (
    <>
      <article className="panel" id="onboarding">
        <h2>{isKoLocale ? "조직 온보딩" : "Organization onboarding"}</h2>
        <p className="small">
          {isKoLocale
            ? "조직을 먼저 만들고 선택해야 직원, 근태, 휴가, 급여 흐름을 같은 환경에서 검증할 수 있습니다."
            : "Create and select an organization first so employee, attendance, leave, and payroll flows can run in the same tenant."}
        </p>
        {organizationId.trim() ? (
          <p className="small">
            {isKoLocale ? "현재 선택 조직" : "Current organization"}: <strong>{organizationName.trim() || organizationId.trim()}</strong>
          </p>
        ) : null}

        <div className="input-grid">
          <label className="full">
            {isKoLocale ? "새 조직 이름" : "New organization name"}
            <input value={organizationName} onChange={(event) => onOrganizationNameChange(event.target.value)} />
          </label>
        </div>
        <div className="actions">
          <button className="btn btn-primary" onClick={onCreateOrganization} disabled={!organizationName.trim()}>
            {isKoLocale ? "조직 생성" : "Create organization"}
          </button>
          <button className="btn btn-secondary" onClick={onListOrganizations}>
            {isKoLocale ? "조직 목록 조회" : "List organizations"}
          </button>
        </div>

        {organizations.length === 0 ? (
          <p className="small muted">{isKoLocale ? "조직 목록을 아직 불러오지 않았습니다." : "Organization list has not been loaded yet."}</p>
        ) : (
          <ul className="simple-list" aria-label={isKoLocale ? "조직 목록" : "Organization list"}>
            {organizations.map((org) => (
              <li key={org.id}>
                <span>
                  <strong>{org.name}</strong>
                  <span className="muted">
                    {organizationId.trim() === org.id ? (isKoLocale ? " (선택됨)" : " (selected)") : ""}
                  </span>
                </span>
                <button type="button" className="btn btn-secondary btn-small" onClick={() => onSelectOrganization(org.id)}>
                  {isKoLocale ? "이 조직 사용" : "Use this organization"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </article>

      <article className="panel" id="account">
        <h2>{isKoLocale ? "내 계정" : "My account"}</h2>
        {isProductionRuntime ? (
          <p className="small">
            {supabaseSession
              ? `${supabaseSession.email ?? supabaseSession.userId} · ${formatActorRoleLabel(supabaseSession.role ?? "", runtimeLocale)}`
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
              ? "로컬 개발에서는 Dev Header 모드가 기본입니다."
              : "Dev Header mode is the default in local development."}
          </p>
        )}
        {supabaseSessionError ? (
          <p className="small" style={{ marginTop: 10, color: "var(--danger)" }}>
            {isKoLocale ? "세션 오류" : "Session error"}: {formatUserFacingErrorMessage(supabaseSessionError, runtimeLocale)}
          </p>
        ) : null}

        {showDevTools ? (
          <details className="details" style={{ marginTop: 12 }}>
            <summary>
              {isKoLocale ? "개발 및 검증 설정" : "Dev and verification settings"}{" "}
              <small>{isKoLocale ? "(필요할 때만)" : "(only when needed)"}</small>
            </summary>
            <div className="input-grid" style={{ marginTop: 12 }}>
              <label>
                {isKoLocale ? "작업 조직" : "Working organization"}
                <input
                  value={organizationId}
                  placeholder={isKoLocale ? "예: ORG-00001" : "e.g. ORG-00001"}
                  onChange={(event) => onOrganizationIdChange(event.target.value)}
                />
              </label>
              <label>
                {isKoLocale ? "관리자 계정" : "Admin account"}
                <input value={adminActorId} onChange={(event) => onAdminActorIdChange(event.target.value)} />
              </label>
              <label className="full">
                {isKoLocale ? "Bearer 액세스 토큰(재정의)" : "Bearer access token (override)"}
                <textarea
                  rows={3}
                  placeholder={
                    isKoLocale
                      ? "비워두면 Dev Header(로컬) 또는 세션(Bearer)이 사용됩니다."
                      : "If empty, Dev Header (local) or session (Bearer) will be used."
                  }
                  value={accessToken}
                  onChange={(event) => onAccessTokenChange(event.target.value)}
                />
              </label>
            </div>
            <p className="small muted" style={{ marginTop: 10 }}>
              {isKoLocale ? "런타임 Supabase URL" : "Runtime Supabase URL"}: <code>{supabaseUrl}</code>
            </p>
          </details>
        ) : null}
      </article>
    </>
  );
}
