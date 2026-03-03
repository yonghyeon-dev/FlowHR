import Link from "next/link";

import { resolveAdminRecruitmentCopy } from "@/components/recruitment/copy";
import {
  listRecruitmentReferralNextStages,
  type RecruitmentOpeningItem,
  type RecruitmentOpeningStatus,
  type RecruitmentReferralItem,
  type RecruitmentReferralStage
} from "@/features/recruitment/types";

type AdminRecruitmentCopy = ReturnType<typeof resolveAdminRecruitmentCopy>;

type AdminRecruitmentWorkspaceViewProps = {
  copy: AdminRecruitmentCopy;
  sourceHint: string;
  analyticsBackHref: string;
  analyticsBackLabel: string;
  showDevTools: boolean;
  sessionOrganizationId: string;
  sessionActorId: string;
  openingTitle: string;
  department: string;
  employmentType: string;
  openings: RecruitmentOpeningItem[];
  referrals: RecruitmentReferralItem[];
  filteredReferrals: RecruitmentReferralItem[];
  openingTitleById: Record<string, string>;
  referralFilter: RecruitmentReferralStage | "all";
  referralRiskFilter: "all" | "stalled_7d" | "stalled_14d";
  referralSearchQuery: string;
  stalledReferralCount: number;
  stalledCriticalReferralCount: number;
  stageSelection: Record<string, RecruitmentReferralStage>;
  pending: boolean;
  statusMessage: string;
  onOpeningTitleChange: (value: string) => void;
  onDepartmentChange: (value: string) => void;
  onEmploymentTypeChange: (value: string) => void;
  onReferralFilterChange: (value: RecruitmentReferralStage | "all") => void;
  onReferralRiskFilterChange: (value: "all" | "stalled_7d" | "stalled_14d") => void;
  onReferralSearchQueryChange: (value: string) => void;
  onClearReferralSearch: () => void;
  onLoadWorkspace: () => void;
  onCreateOpening: () => void;
  onUpdateOpeningStatus: (openingId: string, status: RecruitmentOpeningStatus) => void;
  onStageSelectionChange: (referralId: string, stage: RecruitmentReferralStage) => void;
  onUpdateStage: (referralId: string) => void;
};

export default function AdminRecruitmentWorkspaceView({
  copy,
  sourceHint,
  analyticsBackHref,
  analyticsBackLabel,
  showDevTools,
  sessionOrganizationId,
  sessionActorId,
  openingTitle,
  department,
  employmentType,
  openings,
  referrals,
  filteredReferrals,
  openingTitleById,
  referralFilter,
  referralRiskFilter,
  referralSearchQuery,
  stalledReferralCount,
  stalledCriticalReferralCount,
  stageSelection,
  pending,
  statusMessage,
  onOpeningTitleChange,
  onDepartmentChange,
  onEmploymentTypeChange,
  onReferralFilterChange,
  onReferralRiskFilterChange,
  onReferralSearchQueryChange,
  onClearReferralSearch,
  onLoadWorkspace,
  onCreateOpening,
  onUpdateOpeningStatus,
  onStageSelectionChange,
  onUpdateStage
}: AdminRecruitmentWorkspaceViewProps) {
  return (
    <main className="saas-content">
      <header className="page-header">
        <div>
          <h1 className="page-title">{copy.pageTitle}</h1>
          <p className="page-subtitle">{copy.pageSubtitle}</p>
          {sourceHint ? <p className="small muted">{sourceHint}</p> : null}
        </div>
        <div className="page-actions">
          {analyticsBackHref ? (
            <Link className="btn btn-secondary" href={analyticsBackHref}>
              {analyticsBackLabel}
            </Link>
          ) : null}
          <Link className="btn btn-secondary" href="/admin">
            /admin
          </Link>
          <Link className="btn btn-secondary" href="/employee/recruitment">
            /employee/recruitment
          </Link>
        </div>
      </header>

      <section className="panel-grid">
        <article className="panel">
          <h2>{copy.sessionTitle}</h2>
          {showDevTools ? (
            <p className="small muted">
              {copy.organizationIdLabel}: <code>{sessionOrganizationId || "-"}</code> / {copy.actorIdLabel}:{" "}
              <code>{sessionActorId || "-"}</code>
            </p>
          ) : null}
          <div className="actions">
            <button className="btn btn-primary" type="button" onClick={onLoadWorkspace} disabled={pending}>
              {copy.refreshAction}
            </button>
          </div>
          {statusMessage ? <p className="small">{statusMessage}</p> : null}
        </article>

        <article className="panel">
          <h2>{copy.createOpeningTitle}</h2>
          <label>
            {copy.openingTitleLabel}
            <input value={openingTitle} onChange={(event) => onOpeningTitleChange(event.target.value)} maxLength={120} />
          </label>
          <label>
            {copy.departmentLabel}
            <input value={department} onChange={(event) => onDepartmentChange(event.target.value)} maxLength={120} />
          </label>
          <label>
            {copy.employmentTypeLabel}
            <input
              value={employmentType}
              onChange={(event) => onEmploymentTypeChange(event.target.value)}
              maxLength={60}
            />
          </label>
          <div className="actions">
            <button className="btn btn-primary" type="button" onClick={onCreateOpening} disabled={pending}>
              {copy.createOpeningAction}
            </button>
          </div>
        </article>

        <article className="panel">
          <h2>{copy.openingsTitle}</h2>
          {openings.length === 0 ? (
            <p className="small muted">{copy.emptyOpenings}</p>
          ) : (
            <ul className="simple-list">
              {openings.map((opening) => (
                <li key={opening.id}>
                  <span>
                    <strong>{opening.title}</strong>
                    <br />
                    <span className="small muted">
                      {opening.department} / {opening.employmentType}
                    </span>
                    <br />
                    <span className="small muted">
                      {copy.statusLabel}: {copy.openingStatus[opening.status]}
                    </span>
                  </span>
                  <div className="actions" style={{ marginTop: 0 }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      onClick={() =>
                        onUpdateOpeningStatus(opening.id, opening.status === "OPEN" ? "CLOSED" : "OPEN")
                      }
                      disabled={pending}
                    >
                      {opening.status === "OPEN" ? copy.openingStatus.CLOSED : copy.openingStatus.OPEN}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="panel">
          <h2>{copy.referralsTitle}</h2>
          <label>
            {copy.referralFilterLabel}
            <select
              value={referralFilter}
              onChange={(event) => onReferralFilterChange(event.target.value as RecruitmentReferralStage | "all")}
            >
              <option value="all">{copy.referralStageFilter.all}</option>
              <option value="SUBMITTED">{copy.referralStageFilter.SUBMITTED}</option>
              <option value="SCREENING">{copy.referralStageFilter.SCREENING}</option>
              <option value="INTERVIEW">{copy.referralStageFilter.INTERVIEW}</option>
              <option value="OFFER">{copy.referralStageFilter.OFFER}</option>
              <option value="HIRED">{copy.referralStageFilter.HIRED}</option>
              <option value="REJECTED">{copy.referralStageFilter.REJECTED}</option>
              <option value="WITHDRAWN">{copy.referralStageFilter.WITHDRAWN}</option>
            </select>
          </label>
          <label>
            {copy.referralRiskFilterLabel}
            <select
              value={referralRiskFilter}
              onChange={(event) =>
                onReferralRiskFilterChange(event.target.value as "all" | "stalled_7d" | "stalled_14d")
              }
            >
              <option value="all">{copy.referralRiskFilter.all}</option>
              <option value="stalled_7d">{copy.referralRiskFilter.stalled7d}</option>
              <option value="stalled_14d">{copy.referralRiskFilter.stalled14d}</option>
            </select>
          </label>
          <label>
            {copy.referralSearchLabel}
            <input
              value={referralSearchQuery}
              onChange={(event) => onReferralSearchQueryChange(event.target.value)}
              placeholder={copy.referralSearchPlaceholder}
            />
          </label>
          <div className="actions">
            <button className="btn btn-secondary btn-small" type="button" onClick={onClearReferralSearch} disabled={pending}>
              {copy.clearSearchAction}
            </button>
          </div>
          <p className="small muted">
            {copy.filteredReferralSummaryLabel}: {filteredReferrals.length} / {referrals.length} / {copy.referralRiskSummaryLabel}: {stalledReferralCount} / {copy.criticalReferralRiskSummaryLabel}: {stalledCriticalReferralCount}
          </p>
          {referrals.length === 0 ? (
            <p className="small muted">{copy.emptyReferrals}</p>
          ) : filteredReferrals.length === 0 ? (
            <p className="small muted">{copy.filteredEmptyReferrals}</p>
          ) : (
            <ul className="simple-list">
              {filteredReferrals.map((referral) => {
                const isTerminalStage = ["HIRED", "REJECTED", "WITHDRAWN"].includes(referral.stage);
                const updatedAtMs = Date.parse(referral.updatedAt);
                const isStalled7d = !isTerminalStage && Number.isFinite(updatedAtMs) && Date.now() - updatedAtMs >= 7 * 24 * 60 * 60 * 1000;
                const isStalled14d = !isTerminalStage && Number.isFinite(updatedAtMs) && Date.now() - updatedAtMs >= 14 * 24 * 60 * 60 * 1000;
                const selectedStage = stageSelection[referral.id] ?? referral.stage;
                const stageOptions = listRecruitmentReferralNextStages(referral.stage);
                return (
                  <li key={referral.id}>
                    <span>
                      <strong>{referral.candidateName}</strong>
                      <br />
                      <span className="small muted">
                        {referral.candidateEmail} / {referral.referrerEmployeeId}
                      </span>
                      <br />
                      <span className="small muted">
                        {copy.referralOpeningTitleLabel}: {openingTitleById[referral.openingId] ?? copy.unknownOpeningLabel}
                      </span>
                      <br />
                      <span className="small muted">
                        {copy.stageLabel}: {copy.referralStage[referral.stage]}
                      </span>
                      {isStalled14d ? (
                        <>
                          <br />
                          <span className="small" style={{ color: "var(--danger)" }}>
                            {copy.stalledCriticalBadgeLabel}
                          </span>
                        </>
                      ) : isStalled7d ? (
                        <>
                          <br />
                          <span className="small" style={{ color: "var(--danger)" }}>
                            {copy.stalledBadgeLabel}
                          </span>
                        </>
                      ) : null}
                    </span>
                    <div className="actions" style={{ marginTop: 0 }}>
                      <select
                        value={selectedStage}
                        onChange={(event) =>
                          onStageSelectionChange(referral.id, event.target.value as RecruitmentReferralStage)
                        }
                      >
                        {stageOptions.map((stage) => (
                          <option key={stage} value={stage}>
                            {copy.referralStage[stage]}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="btn btn-secondary btn-small"
                        onClick={() => onUpdateStage(referral.id)}
                        disabled={pending || selectedStage === referral.stage}
                      >
                        {copy.updateStageAction}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </article>
      </section>
    </main>
  );
}
