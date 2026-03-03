"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { BenefitCatalogItem, BenefitCatalogStatus, BenefitRequestItem, BenefitRequestStatus } from "@/features/benefits/types";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useI18n } from "@/lib/i18n/provider";
import { resolveAdminBenefitsCopy } from "@/components/benefits/copy";
import AdminBenefitsWorkspaceView from "@/components/benefits/AdminBenefitsWorkspaceView";
import {
  buildBenefitWorkspaceQuery,
  isTruthyFlag,
  normalizeBenefitRequestFilter,
  normalizeBenefitRiskFilter,
  parseBenefitCatalog,
  parseBenefitRequests,
  parseBenefitRequestSummary,
  parseBenefitSearchQuery
} from "@/components/benefits/admin-benefits-workspace-helpers";

type RequestSummary = {
  total: number;
  submitted: number;
  approved: number;
  rejected: number;
};

const EMPTY_REQUEST_SUMMARY: RequestSummary = {
  total: 0,
  submitted: 0,
  approved: 0,
  rejected: 0
};

export default function AdminBenefitsWorkspace() {
  const searchParams = useSearchParams();
  const { locale } = useI18n();
  const copy = resolveAdminBenefitsCopy(locale);
  const runtimeLocale = locale === "ko" ? "ko-KR" : "en-US";
  const showDevTools = isTruthyFlag(process.env.NEXT_PUBLIC_FLOWHR_DEV_TOOLS);
  const { snapshot: supabaseSession } = useSupabaseSession();
  const organizationId = (supabaseSession?.organizationId ?? "").trim();
  const actorId = (supabaseSession?.actorId ?? "ADM-1001").trim() || "ADM-1001";
  const [catalogName, setCatalogName] = useState("");
  const [catalogDescription, setCatalogDescription] = useState("");
  const [annualLimitKrw, setAnnualLimitKrw] = useState("300000");
  const [catalogStatus, setCatalogStatus] = useState<BenefitCatalogStatus>("ACTIVE");
  const [decisionNote, setDecisionNote] = useState("");
  const [requestFilter, setRequestFilter] = useState<BenefitRequestStatus | "all">("all");
  const [requestRiskFilter, setRequestRiskFilter] = useState<"all" | "over_limit">("all");
  const [requestSearchQuery, setRequestSearchQuery] = useState("");

  const [catalog, setCatalog] = useState<BenefitCatalogItem[]>([]);
  const [requests, setRequests] = useState<BenefitRequestItem[]>([]);
  const [requestSummary, setRequestSummary] = useState<RequestSummary>(EMPTY_REQUEST_SUMMARY);
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [autoLoadAttempted, setAutoLoadAttempted] = useState(false);
  const bearerToken = supabaseSession?.accessToken ?? "";
  const usesBearerToken = bearerToken.trim().length > 0;

  const catalogStats = useMemo(() => {
    const active = catalog.filter((item) => item.status === "ACTIVE").length;
    return {
      total: catalog.length,
      active,
      inactive: catalog.length - active
    };
  }, [catalog]);
  const catalogById = useMemo(() => {
    const next: Record<string, BenefitCatalogItem> = {};
    catalog.forEach((item) => {
      next[item.id] = item;
    });
    return next;
  }, [catalog]);
  const catalogNameById = useMemo(() => {
    const next: Record<string, string> = {};
    Object.entries(catalogById).forEach(([id, item]) => {
      next[id] = item.name;
    });
    return next;
  }, [catalogById]);
  const overLimitRequestCount = useMemo(
    () =>
      requests.filter((request) => {
        const annualLimitKrw = catalogById[request.benefitId]?.annualLimitKrw ?? Number.POSITIVE_INFINITY;
        return request.amountKrw > annualLimitKrw;
      }).length,
    [catalogById, requests]
  );
  const visibleRequests = useMemo(() => {
    const query = requestSearchQuery.trim().toLowerCase();
    return requests.filter((request) => {
      if (requestFilter !== "all" && request.status !== requestFilter) {
        return false;
      }
      if (requestRiskFilter === "over_limit") {
        const annualLimitKrw = catalogById[request.benefitId]?.annualLimitKrw ?? Number.POSITIVE_INFINITY;
        if (request.amountKrw <= annualLimitKrw) {
          return false;
        }
      }
      if (query.length === 0) {
        return true;
      }
      const benefitName = (catalogNameById[request.benefitId] ?? "").toLowerCase();
      const haystack = `${request.employeeId} ${benefitName} ${request.reason}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [catalogById, catalogNameById, requestFilter, requestRiskFilter, requestSearchQuery, requests]);

  function appendLog(label: string) {
    setLogs((previous) => [`${new Date().toLocaleString(runtimeLocale)} · ${label}`, ...previous]);
  }

  async function callApi(action: string, method: "GET" | "POST", path: string, payload?: Record<string, unknown>) {
    setPendingLabel(action);
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
      appendLog(`${action} (${response.status})`);
      return { response, parsed };
    } catch {
      appendLog(`${action} (500)`);
      return { response: { ok: false, status: 500 } as Response, parsed: {} };
    } finally {
      setPendingLabel(null);
    }
  }

  async function loadWorkspace() {
    if (!organizationId.trim() && !usesBearerToken) {
      setStatusMessage(copy.messages.needOrganization);
      return;
    }

    const catalogQuery = buildBenefitWorkspaceQuery({ organizationId });
    const requestsQuery = buildBenefitWorkspaceQuery({ organizationId, sort: "pending_priority" });

    const [catalogRes, requestsRes] = await Promise.all([
      callApi(copy.refreshAction, "GET", `/api/benefits/catalog${catalogQuery}`),
      callApi(copy.refreshAction, "GET", `/api/benefits/requests${requestsQuery}`)
    ]);

    if (!catalogRes.response.ok || !requestsRes.response.ok) {
      setStatusMessage(copy.messages.loadFailed);
      return;
    }

    setCatalog(parseBenefitCatalog(catalogRes.parsed));
    setRequests(parseBenefitRequests(requestsRes.parsed));
    setRequestSummary(parseBenefitRequestSummary(requestsRes.parsed, EMPTY_REQUEST_SUMMARY));
    setStatusMessage("");
  }

  async function createCatalogItem() {
    if (!organizationId.trim() && !usesBearerToken) {
      setStatusMessage(copy.messages.needOrganization);
      return;
    }
    if (!catalogName.trim()) {
      setStatusMessage(copy.messages.needName);
      return;
    }
    if (!catalogDescription.trim()) {
      setStatusMessage(copy.messages.needDescription);
      return;
    }

    const amount = Math.max(0, Math.trunc(Number(annualLimitKrw) || 0));
    const { response } = await callApi(copy.createCatalogAction, "POST", "/api/benefits/catalog", {
      organizationId,
      name: catalogName,
      description: catalogDescription,
      annualLimitKrw: amount,
      status: catalogStatus
    });

    if (!response.ok) {
      setStatusMessage(copy.messages.loadFailed);
      return;
    }

    setCatalogName("");
    setCatalogDescription("");
    setCatalogStatus("ACTIVE");
    setStatusMessage(copy.messages.catalogCreated);
    await loadWorkspace();
  }

  async function updateCatalogStatus(benefitId: string, status: BenefitCatalogStatus) {
    const { response } = await callApi(
      status === "ACTIVE" ? copy.activateCatalogAction : copy.deactivateCatalogAction,
      "POST",
      `/api/benefits/catalog/${encodeURIComponent(benefitId)}/status`,
      { status }
    );
    if (!response.ok) {
      setStatusMessage(copy.messages.loadFailed);
      return;
    }
    setStatusMessage(copy.messages.catalogStatusChanged);
    await loadWorkspace();
  }

  async function decideRequest(requestId: string, decision: "APPROVED" | "REJECTED") {
    const { response } = await callApi(
      decision === "APPROVED" ? copy.approveAction : copy.rejectAction,
      "POST",
      `/api/benefits/requests/${encodeURIComponent(requestId)}/decision`,
      {
        decision,
        reviewNote: decisionNote
      }
    );

    if (!response.ok) {
      setStatusMessage(copy.messages.loadFailed);
      return;
    }

    setStatusMessage(copy.messages.requestDecided);
    await loadWorkspace();
  }

  useEffect(() => {
    setRequestFilter(normalizeBenefitRequestFilter(searchParams.get("status")));
    setRequestRiskFilter(normalizeBenefitRiskFilter(searchParams.get("risk")));
    setRequestSearchQuery(parseBenefitSearchQuery(searchParams.get("q")));
  }, [searchParams]);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot auto-load intentionally keys off session readiness only
  useEffect(() => {
    if (autoLoadAttempted || (!organizationId.trim() && !usesBearerToken)) {
      return;
    }
    setAutoLoadAttempted(true);
    void loadWorkspace();
  }, [autoLoadAttempted, organizationId, usesBearerToken]);

  return (
    <AdminBenefitsWorkspaceView
      copy={copy}
      runtimeLocale={runtimeLocale}
      showDevTools={showDevTools}
      sessionOrganizationId={organizationId}
      sessionActorId={actorId}
      catalogName={catalogName}
      catalogDescription={catalogDescription}
      annualLimitKrw={annualLimitKrw}
      catalogStatus={catalogStatus}
      decisionNote={decisionNote}
      catalog={catalog}
      requests={requests}
      visibleRequests={visibleRequests}
      catalogNameById={catalogNameById}
      requestFilter={requestFilter}
      requestRiskFilter={requestRiskFilter}
      requestSearchQuery={requestSearchQuery}
      requestSummary={requestSummary}
      overLimitRequestCount={overLimitRequestCount}
      catalogStats={catalogStats}
      pendingLabel={pendingLabel}
      statusMessage={statusMessage}
      logs={logs}
      onCatalogNameChange={setCatalogName}
      onCatalogDescriptionChange={setCatalogDescription}
      onAnnualLimitChange={setAnnualLimitKrw}
      onCatalogStatusChange={setCatalogStatus}
      onDecisionNoteChange={setDecisionNote}
      onRequestFilterChange={setRequestFilter}
      onRequestRiskFilterChange={setRequestRiskFilter}
      onRequestSearchQueryChange={setRequestSearchQuery}
      onClearRequestSearch={() => setRequestSearchQuery("")}
      onLoadWorkspace={() => void loadWorkspace()}
      onCreateCatalogItem={() => void createCatalogItem()}
      onUpdateCatalogStatus={(benefitId, status) => void updateCatalogStatus(benefitId, status)}
      onDecideRequest={(requestId, decision) => void decideRequest(requestId, decision)}
    />
  );
}
