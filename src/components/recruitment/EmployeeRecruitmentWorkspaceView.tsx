"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import {
  isReferralStalledForRiskFilter,
  resolveReferralStalledDays,
  type EmployeeReferralRiskFilter,
  type EmployeeReferralSummary
} from "@/components/recruitment/employee-recruitment-helpers";
import { resolveEmployeeRecruitmentSourceEntry } from "@/components/recruitment/employee-source-context";
import { resolveEmployeeRecruitmentCopy } from "@/components/recruitment/copy";
import type {
  RecruitmentOpeningItem,
  RecruitmentReferralItem,
  RecruitmentReferralStage
} from "@/features/recruitment/types";

type EmployeeRecruitmentCopy = ReturnType<typeof resolveEmployeeRecruitmentCopy>;

type EmployeeRecruitmentWorkspaceViewProps = {
  copy: EmployeeRecruitmentCopy;
  isKoLocale: boolean;
  showDevTools: boolean;
  requiresLoginSession: boolean;
  productionSessionRequiredNotice: string;
  sessionOrganizationId: string;
  sessionEmployeeId: string;
  openings: RecruitmentOpeningItem[];
  referrals: RecruitmentReferralItem[];
  filteredReferrals: RecruitmentReferralItem[];
  referralSummary: EmployeeReferralSummary;
  selectedOpeningId: string;
  candidateName: string;
  candidateEmail: string;
  note: string;
  stageFilter: RecruitmentReferralStage | "all";
  riskFilter: EmployeeReferralRiskFilter;
  openingFilter: string;
  referralSearchQuery: string;
  stalledReferralCount: number;
  stalledCriticalReferralCount: number;
  openingFilteredReferralCount: number;
  pending: boolean;
  statusMessage: string;
  onStageFilterChange: (value: RecruitmentReferralStage | "all") => void;
  onRiskFilterChange: (value: EmployeeReferralRiskFilter) => void;
  onOpeningFilterChange: (value: string) => void;
  onReferralSearchQueryChange: (value: string) => void;
  onClearReferralSearch: () => void;
  onLoadWorkspace: () => void;
  onSelectedOpeningChange: (value: string) => void;
  onCandidateNameChange: (value: string) => void;
  onCandidateEmailChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onSubmitReferral: () => void;
  onWithdrawReferral: (referralId: string) => void;
  resolveOpeningTitle: (openingId: string) => string;
};

export default function EmployeeRecruitmentWorkspaceView({
  copy,
  isKoLocale,
  showDevTools,
  requiresLoginSession,
  productionSessionRequiredNotice,
  sessionOrganizationId,
  sessionEmployeeId,
  openings,
  referrals,
  filteredReferrals,
  referralSummary,
  selectedOpeningId,
  candidateName,
  candidateEmail,
  note,
  stageFilter,
  riskFilter,
  openingFilter,
  referralSearchQuery,
  stalledReferralCount,
  stalledCriticalReferralCount,
  openingFilteredReferralCount,
  pending,
  statusMessage,
  onStageFilterChange,
  onRiskFilterChange,
  onOpeningFilterChange,
  onReferralSearchQueryChange,
  onClearReferralSearch,
  onLoadWorkspace,
  onSelectedOpeningChange,
  onCandidateNameChange,
  onCandidateEmailChange,
  onNoteChange,
  onSubmitReferral,
  onWithdrawReferral,
  resolveOpeningTitle
}: EmployeeRecruitmentWorkspaceViewProps) {
  const searchParams = useSearchParams();
  const sourceEntry = resolveEmployeeRecruitmentSourceEntry(searchParams.get("source"), isKoLocale);
  return (
    <main className="saas-content">
      <header className="page-header">
        <div>
          <h1 className="page-title">{copy.pageTitle}</h1>
          <p className="page-subtitle">{copy.pageSubtitle}</p>
          {sourceEntry ? <p className="small muted">{sourceEntry.hint}</p> : null}
        </div>
        <div className="page-actions">
          <Link className="btn btn-secondary" href="/employee">
            {sourceEntry ? sourceEntry.returnLabel : "/employee"}
          </Link>
          {showDevTools ? (
            <Link className="btn btn-secondary" href="/admin/recruitment">
              /admin/recruitment
            </Link>
          ) : null}
        </div>
      </header>
      {requiresLoginSession ? (
        <p className="small" style={{ margin: "0 0 14px", color: "var(--danger)" }}>
          {productionSessionRequiredNotice} <Link href="/login">/login</Link>
        </p>
      ) : null}

      <section className="panel-grid">
        <article className="panel">
          <h2>{copy.sessionTitle}</h2>
          {showDevTools ? (
            <p className="small muted">
              {copy.organizationIdLabel}: <code>{sessionOrganizationId || "-"}</code> / {copy.employeeIdLabel}:{" "}
              <code>{sessionEmployeeId || "-"}</code>
            </p>
          ) : null}
          <label>
            {copy.stageFilterLabel}
            <select
              value={stageFilter}
              onChange={(event) => onStageFilterChange(event.target.value as RecruitmentReferralStage | "all")}
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
              value={riskFilter}
              onChange={(event) => onRiskFilterChange(event.target.value as EmployeeReferralRiskFilter)}
            >
              <option value="all">{copy.referralRiskFilter.all}</option>
              <option value="stalled_7d">{copy.referralRiskFilter.stalled7d}</option>
              <option value="stalled_14d">{copy.referralRiskFilter.stalled14d}</option>
            </select>
          </label>
          <label>
            {copy.openingFilterLabel}
            <select value={openingFilter} onChange={(event) => onOpeningFilterChange(event.target.value)}>
              <option value="all">{copy.openingFilterAllOption}</option>
              {openings.map((opening) => (
                <option key={opening.id} value={opening.id}>
                  {opening.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            {copy.referralSearchLabel}
            <input
              value={referralSearchQuery}
              placeholder={copy.referralSearchPlaceholder}
              onChange={(event) => onReferralSearchQueryChange(event.target.value)}
            />
          </label>
          <div className="actions">
            <button
              className="btn btn-primary"
              type="button"
              onClick={onLoadWorkspace}
              disabled={pending || requiresLoginSession}
            >
              {copy.refreshAction}
            </button>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={onClearReferralSearch}
              disabled={pending || requiresLoginSession}
            >
              {copy.clearSearchAction}
            </button>
          </div>
          <p className="small muted">
            {copy.referralSummaryLabel}: {referralSummary.total} (S {referralSummary.submitted} / SC {referralSummary.screening} / I {referralSummary.interview} / O {referralSummary.offer} / H {referralSummary.hired} / R {referralSummary.rejected} / W {referralSummary.withdrawn})
            {" / "}
            {copy.filteredReferralSummaryLabel}: {filteredReferrals.length}
            {" / "}
            {copy.referralRiskSummaryLabel}: {stalledReferralCount}
            {" / "}
            {copy.criticalReferralRiskSummaryLabel}: {stalledCriticalReferralCount}
            {" / "}
            {copy.openingFilteredReferralSummaryLabel}: {openingFilteredReferralCount}
          </p>
          {statusMessage ? <p className="small">{statusMessage}</p> : null}
        </article>

        <article className="panel">
          <h2>{copy.submitTitle}</h2>
          <label>
            {copy.openingLabel}
            <select value={selectedOpeningId} onChange={(event) => onSelectedOpeningChange(event.target.value)}>
              <option value="">-</option>
              {openings.map((opening) => (
                <option key={opening.id} value={opening.id}>
                  {opening.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            {copy.candidateNameLabel}
            <input value={candidateName} onChange={(event) => onCandidateNameChange(event.target.value)} maxLength={120} />
          </label>
          <label>
            {copy.candidateEmailLabel}
            <input
              value={candidateEmail}
              onChange={(event) => onCandidateEmailChange(event.target.value)}
              type="email"
              maxLength={120}
            />
          </label>
          <label>
            {copy.noteLabel}
            <textarea rows={4} value={note} onChange={(event) => onNoteChange(event.target.value)} maxLength={1000} />
          </label>
          <div className="actions">
            <button
              className="btn btn-primary"
              type="button"
              onClick={onSubmitReferral}
              disabled={pending || requiresLoginSession}
            >
              {copy.submitAction}
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
          ) : filteredReferrals.length === 0 ? (
            <p className="small muted">{copy.filteredEmptyReferrals}</p>
          ) : (
            <ul className="simple-list">
              {filteredReferrals.map((referral) => {
                const openingTitle = resolveOpeningTitle(referral.openingId);
                const stalledDays = resolveReferralStalledDays(referral);
                const isStalled7d = isReferralStalledForRiskFilter(referral, "stalled_7d");
                const isStalled14d = isReferralStalledForRiskFilter(referral, "stalled_14d");
                return (
                  <li key={referral.id}>
                    <span>
                      <strong>{referral.candidateName}</strong>
                      <br />
                      <span className="small muted">{referral.candidateEmail}</span>
                      <br />
                      <span className="small muted">
                        {copy.openingTitleLabel}: {openingTitle}
                      </span>
                      <br />
                      <span className="small muted">
                        {copy.stageLabel}: {copy.referralStage[referral.stage]}
                      </span>
                      {typeof stalledDays === "number" ? (
                        <>
                          <br />
                          <span className="small muted">
                            {copy.stalledDaysLabel}: D+{stalledDays}
                          </span>
                        </>
                      ) : null}
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
                      <br />
                      <span className="small muted">{referral.note}</span>
                      {referral.stage === "SUBMITTED" || referral.stage === "SCREENING" ? (
                        <>
                          <br />
                          <button
                            className="btn btn-secondary btn-small"
                            type="button"
                            disabled={pending || requiresLoginSession}
                            onClick={() => onWithdrawReferral(referral.id)}
                          >
                            {copy.withdrawAction}
                          </button>
                        </>
                      ) : null}
                    </span>
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

