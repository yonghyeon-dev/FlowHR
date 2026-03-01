"use client";

import { useMemo, useState } from "react";

import {
  EMPTY_EMPLOYEE_REFERRAL_SUMMARY,
  buildRecruitmentQuery,
  countStalledReferrals,
  filterEmployeeReferrals,
  parseRecruitmentOpenings,
  parseRecruitmentReferrals,
  parseRecruitmentReferralSummary,
  type EmployeeReferralRiskFilter
} from "@/components/recruitment/employee-recruitment-helpers";
import EmployeeRecruitmentWorkspaceView from "@/components/recruitment/EmployeeRecruitmentWorkspaceView";
import { resolveEmployeeRecruitmentCopy } from "@/components/recruitment/copy";
import type {
  RecruitmentOpeningItem,
  RecruitmentReferralItem,
  RecruitmentReferralStage
} from "@/features/recruitment/types";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useI18n } from "@/lib/i18n/provider";

function isTruthyFlag(value: string | undefined) {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export default function EmployeeRecruitmentWorkspace() {
  const { locale } = useI18n();
  const copy = resolveEmployeeRecruitmentCopy(locale);
  const showDevTools = isTruthyFlag(process.env.NEXT_PUBLIC_FLOWHR_DEV_TOOLS);
  const { snapshot: supabaseSession } = useSupabaseSession();
  const organizationId = (supabaseSession?.organizationId ?? "").trim();
  const employeeId = (supabaseSession?.actorId ?? supabaseSession?.userId ?? "EMP-1001").trim() || "EMP-1001";

  const [openings, setOpenings] = useState<RecruitmentOpeningItem[]>([]);
  const [referrals, setReferrals] = useState<RecruitmentReferralItem[]>([]);
  const [referralSummary, setReferralSummary] = useState(EMPTY_EMPLOYEE_REFERRAL_SUMMARY);

  const [selectedOpeningId, setSelectedOpeningId] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [note, setNote] = useState("");
  const [stageFilter, setStageFilter] = useState<RecruitmentReferralStage | "all">("all");
  const [riskFilter, setRiskFilter] = useState<EmployeeReferralRiskFilter>("all");
  const [openingFilter, setOpeningFilter] = useState("all");
  const [referralSearchQuery, setReferralSearchQuery] = useState("");

  const [pending, setPending] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const bearerToken = supabaseSession?.accessToken ?? "";
  const usesBearerToken = bearerToken.trim().length > 0;

  const openingById = useMemo(() => {
    const map = new Map<string, RecruitmentOpeningItem>();
    openings.forEach((opening) => {
      map.set(opening.id, opening);
    });
    return map;
  }, [openings]);

  const stageFilteredReferrals = useMemo(
    () =>
      referrals.filter((referral) =>
        stageFilter === "all" ? true : referral.stage === stageFilter
      ),
    [referrals, stageFilter]
  );

  const filteredReferrals = useMemo(
    () =>
      filterEmployeeReferrals({
        referrals: stageFilteredReferrals,
        openingById,
        searchQuery: referralSearchQuery,
        riskFilter,
        openingFilter
      }),
    [openingById, openingFilter, referralSearchQuery, riskFilter, stageFilteredReferrals]
  );

  const stalledReferralCount = useMemo(
    () => countStalledReferrals(referrals, "stalled_7d"),
    [referrals]
  );
  const stalledCriticalReferralCount = useMemo(
    () => countStalledReferrals(referrals, "stalled_14d"),
    [referrals]
  );
  const openingFilteredReferralCount = useMemo(
    () =>
      stageFilteredReferrals.filter((referral) =>
        openingFilter === "all" ? true : referral.openingId === openingFilter
      ).length,
    [openingFilter, stageFilteredReferrals]
  );

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

    const openingsQuery = buildRecruitmentQuery({ organizationId, status: "OPEN" });
    const referralsQuery = buildRecruitmentQuery({
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

    const nextOpenings = parseRecruitmentOpenings(openingsRes.parsed);
    setOpenings(nextOpenings);
    setReferrals(parseRecruitmentReferrals(referralsRes.parsed));
    setReferralSummary(parseRecruitmentReferralSummary(referralsRes.parsed));
    if (nextOpenings.length > 0 && !selectedOpeningId) {
      setSelectedOpeningId(nextOpenings[0].id);
    }
    if (openingFilter !== "all" && !nextOpenings.some((opening) => opening.id === openingFilter)) {
      setOpeningFilter("all");
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

  return (
    <EmployeeRecruitmentWorkspaceView
      copy={copy}
      showDevTools={showDevTools}
      sessionOrganizationId={organizationId}
      sessionEmployeeId={employeeId}
      openings={openings}
      referrals={referrals}
      filteredReferrals={filteredReferrals}
      referralSummary={referralSummary}
      selectedOpeningId={selectedOpeningId}
      candidateName={candidateName}
      candidateEmail={candidateEmail}
      note={note}
      stageFilter={stageFilter}
      riskFilter={riskFilter}
      openingFilter={openingFilter}
      referralSearchQuery={referralSearchQuery}
      stalledReferralCount={stalledReferralCount}
      stalledCriticalReferralCount={stalledCriticalReferralCount}
      openingFilteredReferralCount={openingFilteredReferralCount}
      pending={pending}
      statusMessage={statusMessage}
      onStageFilterChange={setStageFilter}
      onRiskFilterChange={setRiskFilter}
      onOpeningFilterChange={setOpeningFilter}
      onReferralSearchQueryChange={setReferralSearchQuery}
      onClearReferralSearch={() => setReferralSearchQuery("")}
      onLoadWorkspace={() => void loadWorkspace()}
      onSelectedOpeningChange={setSelectedOpeningId}
      onCandidateNameChange={setCandidateName}
      onCandidateEmailChange={setCandidateEmail}
      onNoteChange={setNote}
      onSubmitReferral={() => void submitReferral()}
      onWithdrawReferral={(referralId) => void withdrawReferral(referralId)}
      resolveOpeningTitle={(openingId) => openingById.get(openingId)?.title ?? copy.unknownOpeningLabel}
    />
  );
}
