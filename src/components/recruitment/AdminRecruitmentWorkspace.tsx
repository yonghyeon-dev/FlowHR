"use client";

import { useMemo, useState } from "react";

import type { RecruitmentOpeningItem, RecruitmentReferralItem, RecruitmentReferralStage } from "@/features/recruitment/types";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useStickyStringState } from "@/lib/client/useStickyState";
import { useI18n } from "@/lib/i18n/provider";
import { resolveAdminRecruitmentCopy } from "@/components/recruitment/copy";
import AdminRecruitmentWorkspaceView from "@/components/recruitment/AdminRecruitmentWorkspaceView";

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
  const [referralFilter, setReferralFilter] = useState<RecruitmentReferralStage | "all">("all");
  const [referralSearchQuery, setReferralSearchQuery] = useState("");

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
  const openingTitleById = useMemo(() => {
    const next: Record<string, string> = {};
    openings.forEach((opening) => {
      next[opening.id] = opening.title;
    });
    return next;
  }, [openings]);
  const filteredReferrals = useMemo(() => {
    const query = referralSearchQuery.trim().toLowerCase();
    return referrals.filter((referral) => {
      if (referralFilter !== "all" && referral.stage !== referralFilter) {
        return false;
      }
      if (query.length === 0) {
        return true;
      }
      const openingTitle = (openingTitleById[referral.openingId] ?? "").toLowerCase();
      const haystack =
        `${referral.candidateName} ${referral.candidateEmail} ${referral.referrerEmployeeId} ${openingTitle} ${referral.note}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [openingTitleById, referralFilter, referralSearchQuery, referrals]);

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
    <AdminRecruitmentWorkspaceView
      copy={copy}
      organizationId={organizationId}
      actorId={actorId}
      accessToken={accessToken}
      openingTitle={openingTitle}
      department={department}
      employmentType={employmentType}
      openings={openings}
      referrals={referrals}
      filteredReferrals={filteredReferrals}
      openingTitleById={openingTitleById}
      referralFilter={referralFilter}
      referralSearchQuery={referralSearchQuery}
      stageSelection={stageSelection}
      pending={pending}
      statusMessage={statusMessage}
      onOrganizationIdChange={setOrganizationId}
      onActorIdChange={setActorId}
      onAccessTokenChange={setAccessToken}
      onOpeningTitleChange={setOpeningTitle}
      onDepartmentChange={setDepartment}
      onEmploymentTypeChange={setEmploymentType}
      onReferralFilterChange={setReferralFilter}
      onReferralSearchQueryChange={setReferralSearchQuery}
      onClearReferralSearch={() => setReferralSearchQuery("")}
      onLoadWorkspace={() => void loadWorkspace()}
      onCreateOpening={() => void createOpening()}
      onStageSelectionChange={(referralId, stage) =>
        setStageSelection((previous) => ({
          ...previous,
          [referralId]: stage
        }))
      }
      onUpdateStage={(referralId) => void updateStage(referralId)}
    />
  );
}
