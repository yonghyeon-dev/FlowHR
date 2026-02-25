"use client";

import Link from "next/link";
import { useState } from "react";

import type { RecruitmentOpeningItem, RecruitmentReferralItem, RecruitmentReferralStage } from "@/features/recruitment/types";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useStickyStringState } from "@/lib/client/useStickyState";
import { useI18n } from "@/lib/i18n/provider";
import { resolveAdminRecruitmentCopy } from "@/components/recruitment/copy";

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

export default function AdminRecruitmentWorkspace() {
  const { locale } = useI18n();
  const copy = resolveAdminRecruitmentCopy(locale);
  const isProductionRuntime = process.env.NODE_ENV === "production";
  const { snapshot: supabaseSession } = useSupabaseSession();

  const [organizationId, setOrganizationId] = useStickyStringState("flowhr:ctx:organizationId", "");
  const [actorId, setActorId] = useStickyStringState("flowhr:ctx:adminId", "ADM-1001");
  const [accessToken, setAccessToken] = useState("");

  const [openingTitle, setOpeningTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [employmentType, setEmploymentType] = useState("정규직");

  const [openings, setOpenings] = useState<RecruitmentOpeningItem[]>([]);
  const [referrals, setReferrals] = useState<RecruitmentReferralItem[]>([]);
  const [pending, setPending] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [stageSelection, setStageSelection] = useState<Record<string, RecruitmentReferralStage>>({});

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
        headers["x-actor-role"] = "admin";
        headers["x-actor-id"] = actorId.trim() || "ADM-1001";
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

    const openingQuery = buildQuery({ organizationId });
    const referralQuery = buildQuery({ organizationId });

    const [openingsRes, referralsRes] = await Promise.all([
      callApi("GET", `/api/recruitment/openings${openingQuery}`),
      callApi("GET", `/api/recruitment/referrals${referralQuery}`)
    ]);

    if (!openingsRes.response.ok || !referralsRes.response.ok) {
      setStatusMessage(copy.messages.loadFailed);
      return;
    }

    const nextReferrals = parseReferrals(referralsRes.parsed);
    setOpenings(parseOpenings(openingsRes.parsed));
    setReferrals(nextReferrals);
    setStageSelection((previous) => {
      const next: Record<string, RecruitmentReferralStage> = {};
      nextReferrals.forEach((item) => {
        next[item.id] = previous[item.id] ?? item.stage;
      });
      return next;
    });
    setStatusMessage("");
  }

  async function createOpening() {
    if (!organizationId.trim() && !usesBearerToken) {
      setStatusMessage(copy.messages.needOrganization);
      return;
    }
    if (!openingTitle.trim()) {
      setStatusMessage(copy.messages.needTitle);
      return;
    }
    if (!department.trim()) {
      setStatusMessage(copy.messages.needDepartment);
      return;
    }
    if (!employmentType.trim()) {
      setStatusMessage(copy.messages.needEmploymentType);
      return;
    }

    const { response } = await callApi("POST", "/api/recruitment/openings", {
      organizationId,
      title: openingTitle,
      department,
      employmentType,
      status: "OPEN"
    });

    if (!response.ok) {
      setStatusMessage(copy.messages.loadFailed);
      return;
    }

    setOpeningTitle("");
    setDepartment("");
    setStatusMessage(copy.messages.openingCreated);
    await loadWorkspace();
  }

  async function updateStage(referralId: string) {
    const stage = stageSelection[referralId];
    if (!stage) {
      return;
    }

    const { response } = await callApi(
      "POST",
      `/api/recruitment/referrals/${encodeURIComponent(referralId)}/stage`,
      { stage }
    );

    if (!response.ok) {
      setStatusMessage(copy.messages.loadFailed);
      return;
    }

    setStatusMessage(copy.messages.referralUpdated);
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
            <input value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} />
          </label>
          <label>
            {copy.actorIdLabel}
            <input value={actorId} onChange={(event) => setActorId(event.target.value)} />
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
          <h2>{copy.createOpeningTitle}</h2>
          <label>
            {copy.openingTitleLabel}
            <input value={openingTitle} onChange={(event) => setOpeningTitle(event.target.value)} maxLength={120} />
          </label>
          <label>
            {copy.departmentLabel}
            <input value={department} onChange={(event) => setDepartment(event.target.value)} maxLength={120} />
          </label>
          <label>
            {copy.employmentTypeLabel}
            <input value={employmentType} onChange={(event) => setEmploymentType(event.target.value)} maxLength={60} />
          </label>
          <div className="actions">
            <button className="btn btn-primary" type="button" onClick={() => void createOpening()} disabled={pending}>
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
                        setStageSelection((previous) => ({
                          ...previous,
                          [referral.id]: event.target.value as RecruitmentReferralStage
                        }))
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
                      onClick={() => void updateStage(referral.id)}
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
