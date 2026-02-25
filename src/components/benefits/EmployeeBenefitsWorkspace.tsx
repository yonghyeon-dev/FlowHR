"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { BenefitCatalogItem, BenefitRequestItem, BenefitRequestStatus } from "@/features/benefits/types";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useStickyStringState } from "@/lib/client/useStickyState";
import { useI18n } from "@/lib/i18n/provider";
import { resolveEmployeeBenefitsCopy } from "@/components/benefits/copy";

type RequestSummary = {
  total: number;
  submitted: number;
  approved: number;
  rejected: number;
  canceled: number;
};

const EMPTY_REQUEST_SUMMARY: RequestSummary = {
  total: 0,
  submitted: 0,
  approved: 0,
  rejected: 0,
  canceled: 0
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
    rejected: Number(summary.rejected ?? 0),
    canceled: Number(summary.canceled ?? 0)
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

export default function EmployeeBenefitsWorkspace() {
  const { locale } = useI18n();
  const copy = resolveEmployeeBenefitsCopy(locale);
  const runtimeLocale = locale === "ko" ? "ko-KR" : "en-US";
  const isProductionRuntime = process.env.NODE_ENV === "production";
  const { snapshot: supabaseSession } = useSupabaseSession();

  const [organizationId, setOrganizationId] = useStickyStringState("flowhr:ctx:organizationId", "");
  const [employeeId, setEmployeeId] = useStickyStringState("flowhr:ctx:employeeId", "EMP-1001");
  const [accessToken, setAccessToken] = useState("");

  const [catalog, setCatalog] = useState<BenefitCatalogItem[]>([]);
  const [requests, setRequests] = useState<BenefitRequestItem[]>([]);
  const [requestSummary, setRequestSummary] = useState<RequestSummary>(EMPTY_REQUEST_SUMMARY);

  const [selectedBenefitId, setSelectedBenefitId] = useState("");
  const [amountKrw, setAmountKrw] = useState("100000");
  const [reason, setReason] = useState("");
  const [requestStatusFilter, setRequestStatusFilter] = useState<BenefitRequestStatus | "all">("all");
  const [requestSearchQuery, setRequestSearchQuery] = useState("");

  const [pending, setPending] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const bearerToken =
    accessToken.trim().length > 0
      ? accessToken.trim()
      : isProductionRuntime
        ? (supabaseSession?.accessToken ?? "")
        : "";
  const usesBearerToken = bearerToken.trim().length > 0;

  const catalogById = useMemo(() => {
    const map = new Map<string, BenefitCatalogItem>();
    catalog.forEach((item) => {
      map.set(item.id, item);
    });
    return map;
  }, [catalog]);
  const normalizedRequestSearchQuery = requestSearchQuery.trim().toLowerCase();
  const filteredRequests = useMemo(() => {
    if (!normalizedRequestSearchQuery) {
      return requests;
    }
    return requests.filter((item) => {
      const benefitName = (catalogById.get(item.benefitId)?.name ?? "").toLowerCase();
      const reasonText = item.reason.toLowerCase();
      return (
        benefitName.includes(normalizedRequestSearchQuery) ||
        reasonText.includes(normalizedRequestSearchQuery)
      );
    });
  }, [catalogById, normalizedRequestSearchQuery, requests]);

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

    const catalogQuery = buildQuery({ organizationId, status: "ACTIVE" });
    const requestsQuery = buildQuery({
      organizationId,
      employeeId,
      status: requestStatusFilter
    });

    const [catalogRes, requestsRes] = await Promise.all([
      callApi("GET", `/api/benefits/catalog${catalogQuery}`),
      callApi("GET", `/api/benefits/requests${requestsQuery}`)
    ]);

    if (!catalogRes.response.ok || !requestsRes.response.ok) {
      setStatusMessage(copy.messages.loadFailed);
      return;
    }

    const nextCatalog = parseCatalog(catalogRes.parsed);
    setCatalog(nextCatalog);
    setRequests(parseRequests(requestsRes.parsed));
    setRequestSummary(parseSummary(requestsRes.parsed));
    if (nextCatalog.length > 0 && !selectedBenefitId) {
      setSelectedBenefitId(nextCatalog[0].id);
    }
    setStatusMessage("");
  }

  async function submitRequest() {
    if (!organizationId.trim() && !usesBearerToken) {
      setStatusMessage(copy.messages.needOrganization);
      return;
    }
    if (!selectedBenefitId) {
      setStatusMessage(copy.messages.needCatalog);
      return;
    }
    const amount = Math.max(0, Math.trunc(Number(amountKrw) || 0));
    if (amount <= 0) {
      setStatusMessage(copy.messages.needAmount);
      return;
    }
    if (!reason.trim()) {
      setStatusMessage(copy.messages.needReason);
      return;
    }

    const { response } = await callApi("POST", "/api/benefits/requests", {
      organizationId,
      benefitId: selectedBenefitId,
      employeeId,
      amountKrw: amount,
      reason
    });

    if (!response.ok) {
      setStatusMessage(copy.messages.loadFailed);
      return;
    }

    setReason("");
    setStatusMessage(copy.messages.submitted);
    await loadWorkspace();
  }

  async function cancelRequest(requestId: string) {
    const { response } = await callApi("POST", `/api/benefits/requests/${encodeURIComponent(requestId)}/cancel`, {});
    if (!response.ok) {
      setStatusMessage(copy.messages.cancelFailed);
      return;
    }
    setStatusMessage(copy.messages.canceled);
    await loadWorkspace();
  }

  function clearRequestSearch() {
    setRequestSearchQuery("");
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
          <Link className="btn btn-secondary" href="/admin/benefits">
            /admin/benefits
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
            {copy.requestFilterLabel}
            <select
              value={requestStatusFilter}
              onChange={(event) => setRequestStatusFilter(event.target.value as BenefitRequestStatus | "all")}
            >
              <option value="all">{copy.requestFilter.all}</option>
              <option value="SUBMITTED">{copy.requestFilter.SUBMITTED}</option>
              <option value="APPROVED">{copy.requestFilter.APPROVED}</option>
              <option value="REJECTED">{copy.requestFilter.REJECTED}</option>
              <option value="CANCELED">{copy.requestFilter.CANCELED}</option>
            </select>
          </label>
          <label>
            {copy.requestSearchLabel}
            <input
              value={requestSearchQuery}
              placeholder={copy.requestSearchPlaceholder}
              onChange={(event) => setRequestSearchQuery(event.target.value)}
            />
          </label>
          <div className="actions">
            <button className="btn btn-primary" type="button" onClick={() => void loadWorkspace()} disabled={pending}>
              {copy.refreshAction}
            </button>
            <button className="btn btn-secondary" type="button" onClick={clearRequestSearch} disabled={pending}>
              {copy.clearSearchAction}
            </button>
          </div>
          <p className="small muted">
            {copy.requestSummaryLabel}: {requestSummary.total} (S {requestSummary.submitted} / A {requestSummary.approved} / R {requestSummary.rejected} / C {requestSummary.canceled}) · {copy.filteredRequestSummaryLabel}: {filteredRequests.length}
          </p>
          {statusMessage ? <p className="small">{statusMessage}</p> : null}
        </article>

        <article className="panel">
          <h2>{copy.submitTitle}</h2>
          <label>
            {copy.benefitLabel}
            <select value={selectedBenefitId} onChange={(event) => setSelectedBenefitId(event.target.value)}>
              <option value="">-</option>
              {catalog.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            {copy.amountLabel}
            <input value={amountKrw} onChange={(event) => setAmountKrw(event.target.value)} inputMode="numeric" />
          </label>
          <label>
            {copy.reasonLabel}
            <textarea rows={4} value={reason} onChange={(event) => setReason(event.target.value)} maxLength={1000} />
          </label>
          <div className="actions">
            <button className="btn btn-primary" type="button" onClick={() => void submitRequest()} disabled={pending}>
              {copy.submitAction}
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
                      {copy.annualLimitLabel}: {item.annualLimitKrw.toLocaleString(runtimeLocale)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="panel">
          <h2>{copy.requestTitle}</h2>
          {requests.length === 0 ? (
            <p className="small muted">{copy.emptyRequests}</p>
          ) : filteredRequests.length === 0 ? (
            <p className="small muted">{copy.filteredEmptyRequests}</p>
          ) : (
            <ul className="simple-list">
              {filteredRequests.map((item) => {
                const benefitName = catalogById.get(item.benefitId)?.name ?? copy.unknownBenefitLabel;
                return (
                  <li key={item.id}>
                    <span>
                      <strong>{benefitName}</strong>
                      <br />
                      <span className="small muted">
                        {copy.amountLabel}: {item.amountKrw.toLocaleString(runtimeLocale)} · {copy.statusLabel}: {copy.requestStatus[item.status]}
                      </span>
                      <br />
                      <span className="small muted">
                        {copy.reasonLabel}: {item.reason}
                      </span>
                      <br />
                      <span className="small muted">
                        {copy.requestedAtLabel}: {item.requestedAt}
                      </span>
                      {item.status === "SUBMITTED" ? (
                        <>
                          <br />
                          <button
                            className="btn btn-secondary btn-small"
                            type="button"
                            disabled={pending}
                            onClick={() => void cancelRequest(item.id)}
                          >
                            {copy.cancelAction}
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

