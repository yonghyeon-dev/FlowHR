"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { BenefitCatalogItem, BenefitRequestItem } from "@/features/benefits/types";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useStickyStringState } from "@/lib/client/useStickyState";
import { useI18n } from "@/lib/i18n/provider";
import { resolveAdminBenefitsCopy } from "@/components/benefits/copy";

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
          <Link className="btn btn-secondary" href="/employee/benefits">
            /employee/benefits
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
            <button className="btn btn-primary" type="button" onClick={() => void loadWorkspace()}>
              {copy.refreshAction}
            </button>
          </div>
          <p className="small muted">
            {copy.statsLabel}: {catalogStats.total} (A {catalogStats.active} / I {catalogStats.inactive})
          </p>
          <p className="small muted">
            {copy.requestStatsLabel}: {requestSummary.total} (S {requestSummary.submitted} / A {requestSummary.approved} / R {requestSummary.rejected})
            {pendingLabel ? ` · ${pendingLabel}` : ""}
          </p>
          {statusMessage ? <p className="small">{statusMessage}</p> : null}
        </article>

        <article className="panel">
          <h2>{copy.createCatalogTitle}</h2>
          <label>
            {copy.nameLabel}
            <input value={catalogName} onChange={(event) => setCatalogName(event.target.value)} maxLength={120} />
          </label>
          <label>
            {copy.descriptionLabel}
            <textarea rows={4} value={catalogDescription} onChange={(event) => setCatalogDescription(event.target.value)} maxLength={1000} />
          </label>
          <label>
            {copy.annualLimitLabel}
            <input value={annualLimitKrw} onChange={(event) => setAnnualLimitKrw(event.target.value)} inputMode="numeric" />
          </label>
          <div className="actions">
            <button className="btn btn-primary" type="button" onClick={() => void createCatalogItem()}>
              {copy.createCatalogAction}
            </button>
          </div>
        </article>

        <article className="panel">
          <h2>{copy.catalogTitle}</h2>
          {catalog.length === 0 ? (
            <p className="small muted">{copy.emptyCatalog}</p>
          ) : (
            <ul className="simple-list">
              {catalog.map((item) => (
                <li key={item.id}>
                  <span>
                    <strong>{item.name}</strong>
                    <br />
                    <span className="small muted">{item.description}</span>
                    <br />
                    <span className="small muted">
                      {copy.annualLimitLabel}: {item.annualLimitKrw.toLocaleString(runtimeLocale)} · {copy.statusLabel}: {copy.catalogStatus[item.status]}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="panel">
          <h2>{copy.requestTitle}</h2>
          <label>
            {copy.decisionNoteLabel}
            <input value={decisionNote} onChange={(event) => setDecisionNote(event.target.value)} maxLength={1000} />
          </label>
          {requests.length === 0 ? (
            <p className="small muted">{copy.emptyRequests}</p>
          ) : (
            <ul className="simple-list">
              {requests.map((request) => (
                <li key={request.id}>
                  <span>
                    <strong>{request.employeeId}</strong>
                    <br />
                    <span className="small muted">
                      {copy.amountLabel}: {request.amountKrw.toLocaleString(runtimeLocale)} · {copy.statusLabel}: {copy.requestStatus[request.status]}
                    </span>
                    <br />
                    <span className="small muted">
                      {copy.reasonLabel}: {request.reason}
                    </span>
                    <br />
                    <span className="small muted">
                      {copy.requestedAtLabel}: {request.requestedAt}
                    </span>
                  </span>
                  <div className="actions" style={{ marginTop: 0 }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      onClick={() => void decideRequest(request.id, "APPROVED")}
                      disabled={request.status !== "SUBMITTED"}
                    >
                      {copy.approveAction}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      onClick={() => void decideRequest(request.id, "REJECTED")}
                      disabled={request.status !== "SUBMITTED"}
                    >
                      {copy.rejectAction}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="panel">
          <h2>{copy.logsTitle}</h2>
          {logs.length === 0 ? (
            <p className="small muted">-</p>
          ) : (
            <ul className="log-list">
              {logs.map((log) => (
                <li key={log}>{log}</li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </main>
  );
}
