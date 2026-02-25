"use client";

import { useMemo, useState } from "react";

import type { BenefitCatalogItem, BenefitRequestItem } from "@/features/benefits/types";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useStickyStringState } from "@/lib/client/useStickyState";
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

export default function AdminBenefitsWorkspace() {
  const { locale } = useI18n();
  const copy = resolveAdminBenefitsCopy(locale);
  const runtimeLocale = locale === "ko" ? "ko-KR" : "en-US";
  const isProductionRuntime = process.env.NODE_ENV === "production";
  const { snapshot: supabaseSession } = useSupabaseSession();

  const [organizationId, setOrganizationId] = useStickyStringState("flowhr:ctx:organizationId", "");
  const [actorId, setActorId] = useStickyStringState("flowhr:ctx:adminId", "ADM-1001");
  const [accessToken, setAccessToken] = useState("");

  const [catalogName, setCatalogName] = useState("");
  const [catalogDescription, setCatalogDescription] = useState("");
  const [annualLimitKrw, setAnnualLimitKrw] = useState("300000");
  const [decisionNote, setDecisionNote] = useState("");

  const [catalog, setCatalog] = useState<BenefitCatalogItem[]>([]);
  const [requests, setRequests] = useState<BenefitRequestItem[]>([]);
  const [requestSummary, setRequestSummary] = useState<RequestSummary>(EMPTY_REQUEST_SUMMARY);
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [logs, setLogs] = useState<string[]>([]);

  const bearerToken =
    accessToken.trim().length > 0
      ? accessToken.trim()
      : isProductionRuntime
        ? (supabaseSession?.accessToken ?? "")
        : "";
  const usesBearerToken = bearerToken.trim().length > 0;

  const catalogStats = useMemo(() => {
    const active = catalog.filter((item) => item.status === "ACTIVE").length;
    return {
      total: catalog.length,
      active,
      inactive: catalog.length - active
    };
  }, [catalog]);

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
      organizationId={organizationId}
      actorId={actorId}
      accessToken={accessToken}
      catalogName={catalogName}
      catalogDescription={catalogDescription}
      annualLimitKrw={annualLimitKrw}
      decisionNote={decisionNote}
      catalog={catalog}
      requests={requests}
      requestSummary={requestSummary}
      catalogStats={catalogStats}
      pendingLabel={pendingLabel}
      statusMessage={statusMessage}
      logs={logs}
      onOrganizationIdChange={setOrganizationId}
      onActorIdChange={setActorId}
      onAccessTokenChange={setAccessToken}
      onCatalogNameChange={setCatalogName}
      onCatalogDescriptionChange={setCatalogDescription}
      onAnnualLimitChange={setAnnualLimitKrw}
      onDecisionNoteChange={setDecisionNote}
      onLoadWorkspace={() => void loadWorkspace()}
      onCreateCatalogItem={() => void createCatalogItem()}
      onDecideRequest={(requestId, decision) => void decideRequest(requestId, decision)}
    />
  );
}
