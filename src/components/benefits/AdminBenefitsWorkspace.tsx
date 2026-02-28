"use client";
import { useMemo, useState } from "react";
import type { BenefitCatalogItem, BenefitRequestItem, BenefitRequestStatus } from "@/features/benefits/types";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useI18n } from "@/lib/i18n/provider";
import { resolveAdminBenefitsCopy } from "@/components/benefits/copy";
import AdminBenefitsWorkspaceView from "@/components/benefits/AdminBenefitsWorkspaceView";

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

function parseCatalog(payload: unknown) {
  const catalog = (payload as { catalog?: BenefitCatalogItem[] } | null)?.catalog;
  return Array.isArray(catalog) ? catalog : [];
}

function parseRequests(payload: unknown) {
  const requests = (payload as { requests?: BenefitRequestItem[] } | null)?.requests;
  return Array.isArray(requests) ? requests : [];
}

function parseSummary(payload: unknown) {
  const summary = (payload as { summary?: Partial<RequestSummary> } | null)?.summary;
  if (!summary) {
    return EMPTY_REQUEST_SUMMARY;
  }
  return {
    total: Number(summary.total ?? 0),
    submitted: Number(summary.submitted ?? 0),
    approved: Number(summary.approved ?? 0),
    rejected: Number(summary.rejected ?? 0)
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

function isTruthyFlag(value: string | undefined) {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export default function AdminBenefitsWorkspace() {
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

    const catalogQuery = buildQuery({ organizationId });
    const requestsQuery = buildQuery({ organizationId });

    const [catalogRes, requestsRes] = await Promise.all([
      callApi(copy.refreshAction, "GET", `/api/benefits/catalog${catalogQuery}`),
      callApi(copy.refreshAction, "GET", `/api/benefits/requests${requestsQuery}`)
    ]);

    if (!catalogRes.response.ok || !requestsRes.response.ok) {
      setStatusMessage(copy.messages.loadFailed);
      return;
    }

    setCatalog(parseCatalog(catalogRes.parsed));
    setRequests(parseRequests(requestsRes.parsed));
    setRequestSummary(parseSummary(requestsRes.parsed));
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
      status: "ACTIVE"
    });

    if (!response.ok) {
      setStatusMessage(copy.messages.loadFailed);
      return;
    }

    setCatalogName("");
    setCatalogDescription("");
    setStatusMessage(copy.messages.catalogCreated);
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
      onDecisionNoteChange={setDecisionNote}
      onRequestFilterChange={setRequestFilter}
      onRequestRiskFilterChange={setRequestRiskFilter}
      onRequestSearchQueryChange={setRequestSearchQuery}
      onClearRequestSearch={() => setRequestSearchQuery("")}
      onLoadWorkspace={() => void loadWorkspace()}
      onCreateCatalogItem={() => void createCatalogItem()}
      onDecideRequest={(requestId, decision) => void decideRequest(requestId, decision)}
    />
  );
}
