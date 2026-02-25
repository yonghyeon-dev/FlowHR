import Link from "next/link";

import { resolveAdminRecruitmentCopy } from "@/components/recruitment/copy";
import type {
  RecruitmentOpeningItem,
  RecruitmentReferralItem,
  RecruitmentReferralStage
} from "@/features/recruitment/types";

type AdminRecruitmentCopy = ReturnType<typeof resolveAdminRecruitmentCopy>;

type AdminRecruitmentWorkspaceViewProps = {
  copy: AdminRecruitmentCopy;
  organizationId: string;
  actorId: string;
  accessToken: string;
  openingTitle: string;
  department: string;
  employmentType: string;
  openings: RecruitmentOpeningItem[];
  referrals: RecruitmentReferralItem[];
  stageSelection: Record<string, RecruitmentReferralStage>;
  pending: boolean;
  statusMessage: string;
  onOrganizationIdChange: (value: string) => void;
  onActorIdChange: (value: string) => void;
  onAccessTokenChange: (value: string) => void;
  onOpeningTitleChange: (value: string) => void;
  onDepartmentChange: (value: string) => void;
  onEmploymentTypeChange: (value: string) => void;
  onLoadWorkspace: () => void;
  onCreateOpening: () => void;
  onStageSelectionChange: (referralId: string, stage: RecruitmentReferralStage) => void;
  onUpdateStage: (referralId: string) => void;
};

export default function AdminRecruitmentWorkspaceView({
  copy,
  organizationId,
  actorId,
  accessToken,
  openingTitle,
  department,
  employmentType,
  openings,
  referrals,
  stageSelection,
  pending,
  statusMessage,
  onOrganizationIdChange,
  onActorIdChange,
  onAccessTokenChange,
  onOpeningTitleChange,
  onDepartmentChange,
  onEmploymentTypeChange,
  onLoadWorkspace,
  onCreateOpening,
  onStageSelectionChange,
  onUpdateStage
}: AdminRecruitmentWorkspaceViewProps) {
  return (
    <main className="saas-content">
      <header className="page-header">
        <div>
          <h1 className="page-title">{copy.pageTitle}</h1>
          <p className="page-subtitle">{copy.pageSubtitle}</p>
        </div>
        <div className="page-actions">
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
          <label>
            {copy.organizationIdLabel}
            <input value={organizationId} onChange={(event) => onOrganizationIdChange(event.target.value)} />
          </label>
          <label>
            {copy.actorIdLabel}
            <input value={actorId} onChange={(event) => onActorIdChange(event.target.value)} />
          </label>
          <label>
            {copy.accessTokenLabel}
            <textarea rows={2} value={accessToken} onChange={(event) => onAccessTokenChange(event.target.value)} />
          </label>
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
                      {opening.department} · {opening.employmentType}
                    </span>
                    <br />
                    <span className="small muted">
                      {copy.statusLabel}: {copy.openingStatus[opening.status]}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="panel">
          <h2>{copy.referralsTitle}</h2>
          {referrals.length === 0 ? (
            <p className="small muted">{copy.emptyReferrals}</p>
          ) : (
            <ul className="simple-list">
              {referrals.map((referral) => (
                <li key={referral.id}>
                  <span>
                    <strong>{referral.candidateName}</strong>
                    <br />
                    <span className="small muted">
                      {referral.candidateEmail} · {referral.referrerEmployeeId}
                    </span>
                    <br />
                    <span className="small muted">
                      {copy.stageLabel}: {copy.referralStage[referral.stage]}
                    </span>
                  </span>
                  <div className="actions" style={{ marginTop: 0 }}>
                    <select
                      value={stageSelection[referral.id] ?? referral.stage}
                      onChange={(event) =>
                        onStageSelectionChange(referral.id, event.target.value as RecruitmentReferralStage)
                      }
                    >
                      {Object.entries(copy.referralStage).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      onClick={() => onUpdateStage(referral.id)}
                      disabled={pending}
                    >
                      {copy.updateStageAction}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </main>
  );
}
