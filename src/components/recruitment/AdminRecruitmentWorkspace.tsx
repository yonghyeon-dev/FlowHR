"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { RecruitmentOpeningItem, RecruitmentOpeningStatus, RecruitmentReferralItem, RecruitmentReferralStage } from "@/features/recruitment/types";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useI18n } from "@/lib/i18n/provider";
import { resolveAdminRecruitmentCopy } from "@/components/recruitment/copy";
import AdminRecruitmentWorkspaceView from "@/components/recruitment/AdminRecruitmentWorkspaceView";
import {
  buildRecruitmentQuery,
  normalizeRecruitmentReferralRiskFilter,
  normalizeRecruitmentReferralStageFilter,
  parseRecruitmentOpenings,
  parseRecruitmentReferrals,
  parseRecruitmentSearchQuery,
  TERMINAL_REFERRAL_STAGES
} from "@/components/recruitment/employee-recruitment-helpers";
const STALLED_REFERRAL_DAYS = 7;
const CRITICAL_STALLED_REFERRAL_DAYS = 14;
function isTruthyFlag(value: string | undefined) {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}
type AdminRecruitmentCopy = ReturnType<typeof resolveAdminRecruitmentCopy>;

function resolveRecruitmentAnalyticsFocusLabel(
  copy: AdminRecruitmentCopy,
  locale: "ko" | "en",
  focusMetric: string | null,
  stage: string | null,
  risk: string | null
) {
  if (focusMetric === "recruitmentStalledReferral7dCount") {
    return copy.referralRiskFilter.stalled7d;
  }
  if (focusMetric === "recruitmentSubmittedReferralCount") {
    return copy.referralStageFilter.SUBMITTED;
  }
  if (focusMetric === "recruitmentActiveReferralCount") {
    return locale === "ko" ? "진행 중 추천 후보" : "Active referrals";
  }
  if (focusMetric === "recruitmentOpenOpeningCount") {
    return copy.openingsTitle;
  }
  if (risk === "stalled_7d") {
    return copy.referralRiskFilter.stalled7d;
  }
  if (risk === "stalled_14d") {
    return copy.referralRiskFilter.stalled14d;
  }
  if (stage === "SUBMITTED") {
    return copy.referralStageFilter.SUBMITTED;
  }
  return "";
}
export default function AdminRecruitmentWorkspace() {
  const searchParams = useSearchParams();
  const { locale } = useI18n();
  const copy = resolveAdminRecruitmentCopy(locale);
  const source = searchParams.get("source");
  const analyticsFocusLabel = resolveRecruitmentAnalyticsFocusLabel(
    copy,
    locale === "ko" ? "ko" : "en",
    searchParams.get("focusMetric"),
    searchParams.get("stage"),
    searchParams.get("risk")
  );
  const sourceHint =
    source === "admin-dashboard"
      ? locale === "ko"
        ? "관리자 대시보드에서 이동했습니다."
        : "Opened from admin dashboard."
      : source === "admin-analytics"
        ? locale === "ko"
          ? `관리자 분석 대시보드에서 이동했습니다.${analyticsFocusLabel ? ` · 집중 큐: ${analyticsFocusLabel}` : ""}`
          : `Opened from admin analytics.${analyticsFocusLabel ? ` · Focus queue: ${analyticsFocusLabel}` : ""}`
      : "";
  const showDevTools = isTruthyFlag(process.env.NEXT_PUBLIC_FLOWHR_DEV_TOOLS);
  const { snapshot: supabaseSession } = useSupabaseSession();
  const organizationId = (supabaseSession?.organizationId ?? "").trim();
  const actorId = (supabaseSession?.actorId ?? "ADM-1001").trim() || "ADM-1001";
  const [openingTitle, setOpeningTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [employmentType, setEmploymentType] = useState("정규직");
  const [referralFilter, setReferralFilter] = useState<RecruitmentReferralStage | "all">(
    normalizeRecruitmentReferralStageFilter(searchParams.get("stage"))
  );
  const [referralRiskFilter, setReferralRiskFilter] = useState<"all" | "stalled_7d" | "stalled_14d">(
    normalizeRecruitmentReferralRiskFilter(searchParams.get("risk"))
  );
  const [referralSearchQuery, setReferralSearchQuery] = useState(parseRecruitmentSearchQuery(searchParams.get("q")));
  const [openings, setOpenings] = useState<RecruitmentOpeningItem[]>([]);
  const [referrals, setReferrals] = useState<RecruitmentReferralItem[]>([]);
  const [pending, setPending] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [stageSelection, setStageSelection] = useState<Record<string, RecruitmentReferralStage>>({});
  const [autoLoadAttempted, setAutoLoadAttempted] = useState(false);
  const bearerToken = supabaseSession?.accessToken ?? "";
  const usesBearerToken = bearerToken.trim().length > 0;
  const openingTitleById = useMemo(() => {
    const next: Record<string, string> = {};
    openings.forEach((opening) => {
      next[opening.id] = opening.title;
    });
    return next;
  }, [openings]);
  const stalledThresholdMs = STALLED_REFERRAL_DAYS * 24 * 60 * 60 * 1000;
  const criticalStalledThresholdMs = CRITICAL_STALLED_REFERRAL_DAYS * 24 * 60 * 60 * 1000;
  const stalledReferralCount = useMemo(() => {
    const nowMs = Date.now();
    return referrals.filter((referral) => {
      if (TERMINAL_REFERRAL_STAGES.includes(referral.stage)) {
        return false;
      }
      const updatedAtMs = Date.parse(referral.updatedAt);
      return Number.isFinite(updatedAtMs) && nowMs - updatedAtMs >= stalledThresholdMs;
    }).length;
  }, [referrals, stalledThresholdMs]);
  const stalledCriticalReferralCount = useMemo(() => {
    const nowMs = Date.now();
    return referrals.filter((referral) => {
      if (TERMINAL_REFERRAL_STAGES.includes(referral.stage)) {
        return false;
      }
      const updatedAtMs = Date.parse(referral.updatedAt);
      return Number.isFinite(updatedAtMs) && nowMs - updatedAtMs >= criticalStalledThresholdMs;
    }).length;
  }, [criticalStalledThresholdMs, referrals]);
  const filteredReferrals = useMemo(() => {
    const nowMs = Date.now();
    const query = referralSearchQuery.trim().toLowerCase();
    return referrals.filter((referral) => {
      if (referralFilter !== "all" && referral.stage !== referralFilter) {
        return false;
      }
      if (referralRiskFilter === "stalled_7d" || referralRiskFilter === "stalled_14d") {
        if (TERMINAL_REFERRAL_STAGES.includes(referral.stage)) {
          return false;
        }
        const updatedAtMs = Date.parse(referral.updatedAt);
        const thresholdMs =
          referralRiskFilter === "stalled_14d" ? criticalStalledThresholdMs : stalledThresholdMs;
        if (!Number.isFinite(updatedAtMs) || nowMs - updatedAtMs < thresholdMs) {
          return false;
        }
      }
      if (query.length === 0) {
        return true;
      }
      const openingTitle = (openingTitleById[referral.openingId] ?? "").toLowerCase();
      const haystack =
        `${referral.candidateName} ${referral.candidateEmail} ${referral.referrerEmployeeId} ${openingTitle} ${referral.note}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [
    criticalStalledThresholdMs,
    openingTitleById,
    referralFilter,
    referralRiskFilter,
    referralSearchQuery,
    referrals,
    stalledThresholdMs
  ]);
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
    const openingQuery = buildRecruitmentQuery({ organizationId });
    const referralQuery = buildRecruitmentQuery({ organizationId, sort: "stalled_priority" });
    const [openingsRes, referralsRes] = await Promise.all([
      callApi("GET", `/api/recruitment/openings${openingQuery}`),
      callApi("GET", `/api/recruitment/referrals${referralQuery}`)
    ]);
    if (!openingsRes.response.ok || !referralsRes.response.ok) {
      setStatusMessage(copy.messages.loadFailed);
      return;
    }
    const nextReferrals = parseRecruitmentReferrals(referralsRes.parsed);
    setOpenings(parseRecruitmentOpenings(openingsRes.parsed));
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
  async function updateOpeningStatus(openingId: string, status: RecruitmentOpeningStatus) {
    const { response, parsed } = await callApi(
      "POST",
      `/api/recruitment/openings/${encodeURIComponent(openingId)}/status`,
      { status }
    );
    if (!response.ok) {
      const errorCode = (parsed as { error?: string } | null)?.error;
      if (status === "CLOSED" && errorCode === "recruitment.opening.status.pending_referrals") {
        const forceCloseMessage =
          locale === "ko"
            ? "진행 중 추천 후보가 있습니다. 그래도 공고를 마감할까요?"
            : "There are active referrals in progress. Close this opening anyway?";
        if (window.confirm(forceCloseMessage)) {
          const forced = await callApi(
            "POST",
            `/api/recruitment/openings/${encodeURIComponent(openingId)}/status`,
            { status, force: true }
          );
          if (!forced.response.ok) {
            setStatusMessage(copy.messages.loadFailed);
            return;
          }
          setStatusMessage("");
          await loadWorkspace();
          return;
        }
      }
      setStatusMessage(copy.messages.loadFailed);
      return;
    }
    setStatusMessage("");
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
  // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot auto-load intentionally keys off session readiness only
  useEffect(() => {
    if (autoLoadAttempted || (!organizationId.trim() && !usesBearerToken)) {
      return;
    }
    setAutoLoadAttempted(true);
    void loadWorkspace();
  }, [autoLoadAttempted, organizationId, usesBearerToken]);
  return (
    <AdminRecruitmentWorkspaceView
      copy={copy}
      sourceHint={sourceHint}
      showDevTools={showDevTools}
      sessionOrganizationId={organizationId}
      sessionActorId={actorId}
      openingTitle={openingTitle}
      department={department}
      employmentType={employmentType}
      openings={openings}
      referrals={referrals}
      filteredReferrals={filteredReferrals}
      openingTitleById={openingTitleById}
      referralFilter={referralFilter}
      referralRiskFilter={referralRiskFilter}
      referralSearchQuery={referralSearchQuery}
      stalledReferralCount={stalledReferralCount}
      stalledCriticalReferralCount={stalledCriticalReferralCount}
      stageSelection={stageSelection}
      pending={pending}
      statusMessage={statusMessage}
      onOpeningTitleChange={setOpeningTitle}
      onDepartmentChange={setDepartment}
      onEmploymentTypeChange={setEmploymentType}
      onReferralFilterChange={setReferralFilter}
      onReferralRiskFilterChange={setReferralRiskFilter}
      onReferralSearchQueryChange={setReferralSearchQuery}
      onClearReferralSearch={() => setReferralSearchQuery("")}
      onLoadWorkspace={() => void loadWorkspace()}
      onCreateOpening={() => void createOpening()}
      onUpdateOpeningStatus={(openingId, status) => void updateOpeningStatus(openingId, status)}
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

