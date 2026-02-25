"use client";

import Link from "next/link";
import { useState } from "react";

import type { RecruitmentOpeningItem, RecruitmentReferralItem } from "@/features/recruitment/types";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useStickyStringState } from "@/lib/client/useStickyState";
import { useI18n } from "@/lib/i18n/provider";
import { resolveEmployeeRecruitmentCopy } from "@/components/recruitment/copy";

function parseOpenings(payload: unknown) {
  const openings = (payload as { openings?: RecruitmentOpeningItem[] } | null)?.openings;
  return Array.isArray(openings) ? openings : [];
}

function parseReferrals(payload: unknown) {
  const referrals = (payload as { referrals?: RecruitmentReferralItem[] } | null)?.referrals;
  return Array.isArray(referrals) ? referrals : [];
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

  const [selectedOpeningId, setSelectedOpeningId] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [note, setNote] = useState("");

  const [pending, setPending] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const bearerToken =
    accessToken.trim().length > 0
      ? accessToken.trim()
      : isProductionRuntime
        ? (supabaseSession?.accessToken ?? "")
        : "";
  const usesBearerToken = bearerToken.trim().length > 0;

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
    const referralsQuery = buildQuery({ organizationId, referrerEmployeeId: employeeId });

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
          <div className="actions">
            <button className="btn btn-primary" type="button" onClick={() => void loadWorkspace()} disabled={pending}>
              {copy.refreshAction}
            </button>
          </div>
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
          ) : (
            <ul className="simple-list">
              {referrals.map((referral) => (
                <li key={referral.id}>
                  <span>
                    <strong>{referral.candidateName}</strong>
                    <br />
                    <span className="small muted">{referral.candidateEmail}</span>
                    <br />
                    <span className="small muted">
                      {copy.stageLabel}: {copy.referralStage[referral.stage]}
                    </span>
                    <br />
                    <span className="small muted">{referral.note}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </main>
  );
}
