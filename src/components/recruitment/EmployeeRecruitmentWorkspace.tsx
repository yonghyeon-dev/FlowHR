"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type {
  RecruitmentOpeningItem,
  RecruitmentReferralItem,
  RecruitmentReferralStage
} from "@/features/recruitment/types";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useStickyStringState } from "@/lib/client/useStickyState";
import { useI18n } from "@/lib/i18n/provider";
import { resolveEmployeeRecruitmentCopy } from "@/components/recruitment/copy";

type ReferralSummary = {
  total: number;
  submitted: number;
  screening: number;
  interview: number;
  offer: number;
  hired: number;
  rejected: number;
  withdrawn: number;
};

const EMPTY_REFERRAL_SUMMARY: ReferralSummary = {
  total: 0,
  submitted: 0,
  screening: 0,
  interview: 0,
  offer: 0,
  hired: 0,
  rejected: 0,
  withdrawn: 0
};

function parseOpenings(payload: unknown) {
  const openings = (payload as { openings?: RecruitmentOpeningItem[] } | null)?.openings;
  return Array.isArray(openings) ? openings : [];
}

function parseReferrals(payload: unknown) {
  const referrals = (payload as { referrals?: RecruitmentReferralItem[] } | null)?.referrals;
  return Array.isArray(referrals) ? referrals : [];
}

function parseSummary(payload: unknown) {
  const summary = (payload as { summary?: Partial<ReferralSummary> } | null)?.summary;
  if (!summary) {
    return EMPTY_REFERRAL_SUMMARY;
  }
  return {
    total: Number(summary.total ?? 0),
    submitted: Number(summary.submitted ?? 0),
    screening: Number(summary.screening ?? 0),
    interview: Number(summary.interview ?? 0),
    offer: Number(summary.offer ?? 0),
    hired: Number(summary.hired ?? 0),
    rejected: Number(summary.rejected ?? 0),
    withdrawn: Number(summary.withdrawn ?? 0)
  };
}

function buildQuery(input: Record<string, string>) {
  const query = new URLSearchParams();
  Object.entries(input).forEach(([key, value]) => {
    if (!value.trim()) {
      return;
    }
    query.set(key, value.trim());
  });
  const text = query.toString();
  return text ? `?${text}` : "";
}

export default function EmployeeRecruitmentWorkspace() {
  const { locale } = useI18n();
  const copy = resolveEmployeeRecruitmentCopy(locale);
  const isProductionRuntime = process.env.NODE_ENV === "production";
  const { snapshot: supabaseSession } = useSupabaseSession();

  const [organizationId, setOrganizationId] = useStickyStringState("flowhr:ctx:organizationId", "");
  const [employeeId, setEmployeeId] = useStickyStringState("flowhr:ctx:employeeId", "EMP-1001");
  const [accessToken, setAccessToken] = useState("");

  const [openings, setOpenings] = useState<RecruitmentOpeningItem[]>([]);
  const [referrals, setReferrals] = useState<RecruitmentReferralItem[]>([]);
  const [referralSummary, setReferralSummary] = useState<ReferralSummary>(EMPTY_REFERRAL_SUMMARY);

  const [selectedOpeningId, setSelectedOpeningId] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [note, setNote] = useState("");
  const [stageFilter, setStageFilter] = useState<RecruitmentReferralStage | "all">("all");
  const [referralSearchQuery, setReferralSearchQuery] = useState("");

  const [pending, setPending] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const bearerToken =
    accessToken.trim().length > 0
      ? accessToken.trim()
      : isProductionRuntime
        ? (supabaseSession?.accessToken ?? "")
        : "";
  const usesBearerToken = bearerToken.trim().length > 0;

  const openingById = useMemo(() => {
    const map = new Map<string, RecruitmentOpeningItem>();
    openings.forEach((opening) => {
      map.set(opening.id, opening);
    });
    return map;
  }, [openings]);
  const normalizedReferralSearchQuery = referralSearchQuery.trim().toLowerCase();
  const filteredReferrals = useMemo(() => {
    if (!normalizedReferralSearchQuery) {
      return referrals;
    }
    return referrals.filter((referral) => {
      const openingTitle = (openingById.get(referral.openingId)?.title ?? "").toLowerCase();
      const candidateNameText = referral.candidateName.toLowerCase();
      const candidateEmailText = referral.candidateEmail.toLowerCase();
      const noteText = referral.note.toLowerCase();
      return (
        openingTitle.includes(normalizedReferralSearchQuery) ||
        candidateNameText.includes(normalizedReferralSearchQuery) ||
        candidateEmailText.includes(normalizedReferralSearchQuery) ||
        noteText.includes(normalizedReferralSearchQuery)
      );
    });
  }, [normalizedReferralSearchQuery, openingById, referrals]);

  async function callApi(method: "GET" | "POST", path: string, payload?: Record<string, unknown>) {
    setPending(true);
    try {
      const headers: Record<string, string> = {};
      if (payload) {
        headers["content-type"] = "application/json";
      }

      if (usesBearerToken) {
        headers.authorization = `Bearer ${bearerToken}`;
      } else {
        headers["x-actor-role"] = "employee";
        headers["x-actor-id"] = employeeId.trim() || "EMP-1001";
        headers["x-actor-organization-id"] = organizationId.trim();
      }

      const response = await fetch(path, {
        method,
        headers,
        body: payload ? JSON.stringify(payload) : undefined
      });
      const text = await response.text();
      const parsed = text.trim() ? JSON.parse(text) : {};
      return { response, parsed };
    } finally {
      setPending(false);
    }
  }

  async function loadWorkspace() {
    if (!organizationId.trim() && !usesBearerToken) {
      setStatusMessage(copy.messages.needOrganization);
      return;
    }

    const openingsQuery = buildQuery({ organizationId, status: "OPEN" });
    const referralsQuery = buildQuery({
      organizationId,
      referrerEmployeeId: employeeId,
      stage: stageFilter
    });

    const [openingsRes, referralsRes] = await Promise.all([
      callApi("GET", `/api/recruitment/openings${openingsQuery}`),
      callApi("GET", `/api/recruitment/referrals${referralsQuery}`)
    ]);

    if (!openingsRes.response.ok || !referralsRes.response.ok) {
      setStatusMessage(copy.messages.loadFailed);
      return;
    }

    const nextOpenings = parseOpenings(openingsRes.parsed);
    setOpenings(nextOpenings);
    setReferrals(parseReferrals(referralsRes.parsed));
    setReferralSummary(parseSummary(referralsRes.parsed));
    if (nextOpenings.length > 0 && !selectedOpeningId) {
      setSelectedOpeningId(nextOpenings[0].id);
    }
    setStatusMessage("");
  }

  async function submitReferral() {
    if (!organizationId.trim() && !usesBearerToken) {
      setStatusMessage(copy.messages.needOrganization);
      return;
    }
    if (!selectedOpeningId) {
      setStatusMessage(copy.messages.needOpening);
      return;
    }
    if (!candidateName.trim()) {
      setStatusMessage(copy.messages.needCandidateName);
      return;
    }
    if (!candidateEmail.trim()) {
      setStatusMessage(copy.messages.needCandidateEmail);
      return;
    }
    if (!note.trim()) {
      setStatusMessage(copy.messages.needNote);
      return;
    }

    const { response } = await callApi("POST", "/api/recruitment/referrals", {
      organizationId,
      openingId: selectedOpeningId,
      candidateName,
      candidateEmail,
      referrerEmployeeId: employeeId,
      note
    });

    if (!response.ok) {
      setStatusMessage(copy.messages.loadFailed);
      return;
    }

    setCandidateName("");
    setCandidateEmail("");
    setNote("");
    setStatusMessage(copy.messages.submitted);
    await loadWorkspace();
  }

  async function withdrawReferral(referralId: string) {
    const { response } = await callApi(
      "POST",
      `/api/recruitment/referrals/${encodeURIComponent(referralId)}/withdraw`,
      {}
    );
    if (!response.ok) {
      setStatusMessage(copy.messages.withdrawFailed);
      return;
    }
    setStatusMessage(copy.messages.withdrawn);
    await loadWorkspace();
  }

  function clearReferralSearch() {
    setReferralSearchQuery("");
  }

  return (
    <main className="saas-content">
      <header className="page-header">
        <div>
          <h1 className="page-title">{copy.pageTitle}</h1>
          <p className="page-subtitle">{copy.pageSubtitle}</p>
        </div>
        <div className="page-actions">
          <Link className="btn btn-secondary" href="/employee">
            /employee
          </Link>
          <Link className="btn btn-secondary" href="/admin/recruitment">
            /admin/recruitment
          </Link>
        </div>
      </header>

      <section className="panel-grid">
        <article className="panel">
          <h2>{copy.sessionTitle}</h2>
          <label>
            {copy.organizationIdLabel}
            <input value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} />
          </label>
          <label>
            {copy.employeeIdLabel}
            <input value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} />
          </label>
          <label>
            {copy.accessTokenLabel}
            <textarea rows={2} value={accessToken} onChange={(event) => setAccessToken(event.target.value)} />
          </label>
          <label>
            {copy.stageFilterLabel}
            <select
              value={stageFilter}
              onChange={(event) => setStageFilter(event.target.value as RecruitmentReferralStage | "all")}
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
            {copy.referralSearchLabel}
            <input
              value={referralSearchQuery}
              placeholder={copy.referralSearchPlaceholder}
              onChange={(event) => setReferralSearchQuery(event.target.value)}
            />
          </label>
          <div className="actions">
            <button className="btn btn-primary" type="button" onClick={() => void loadWorkspace()} disabled={pending}>
              {copy.refreshAction}
            </button>
            <button className="btn btn-secondary" type="button" onClick={clearReferralSearch} disabled={pending}>
              {copy.clearSearchAction}
            </button>
          </div>
          <p className="small muted">
            {copy.referralSummaryLabel}: {referralSummary.total} (S {referralSummary.submitted} / SC {referralSummary.screening} / I {referralSummary.interview} / O {referralSummary.offer} / H {referralSummary.hired} / R {referralSummary.rejected} / W {referralSummary.withdrawn}) · {copy.filteredReferralSummaryLabel}: {filteredReferrals.length}
          </p>
          {statusMessage ? <p className="small">{statusMessage}</p> : null}
        </article>

        <article className="panel">
          <h2>{copy.submitTitle}</h2>
          <label>
            {copy.openingLabel}
            <select value={selectedOpeningId} onChange={(event) => setSelectedOpeningId(event.target.value)}>
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
            <input value={candidateName} onChange={(event) => setCandidateName(event.target.value)} maxLength={120} />
          </label>
          <label>
            {copy.candidateEmailLabel}
            <input value={candidateEmail} onChange={(event) => setCandidateEmail(event.target.value)} type="email" maxLength={120} />
          </label>
          <label>
            {copy.noteLabel}
            <textarea rows={4} value={note} onChange={(event) => setNote(event.target.value)} maxLength={1000} />
          </label>
          <div className="actions">
            <button className="btn btn-primary" type="button" onClick={() => void submitReferral()} disabled={pending}>
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
                      {opening.department} · {opening.employmentType}
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
                const openingTitle = openingById.get(referral.openingId)?.title ?? copy.unknownOpeningLabel;
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
                      <br />
                      <span className="small muted">{referral.note}</span>
                      {referral.stage === "SUBMITTED" || referral.stage === "SCREENING" ? (
                        <>
                          <br />
                          <button
                            className="btn btn-secondary btn-small"
                            type="button"
                            disabled={pending}
                            onClick={() => void withdrawReferral(referral.id)}
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

