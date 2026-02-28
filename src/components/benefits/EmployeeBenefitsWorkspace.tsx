"use client";

import { useMemo, useState } from "react";

import {
  EMPTY_EMPLOYEE_BENEFIT_REQUEST_SUMMARY,
  buildBenefitsQuery,
  filterBenefitRequests,
  isBenefitRequestPendingAgingRisk,
  parseBenefitCatalog,
  parseBenefitRequests,
  parseBenefitRequestSummary,
  type EmployeeBenefitRequestRiskFilter
} from "@/components/benefits/employee-benefits-helpers";
import EmployeeBenefitsWorkspaceView from "@/components/benefits/EmployeeBenefitsWorkspaceView";
import { resolveEmployeeBenefitsCopy } from "@/components/benefits/copy";
import type { BenefitCatalogItem, BenefitRequestItem, BenefitRequestStatus } from "@/features/benefits/types";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useI18n } from "@/lib/i18n/provider";

export default function EmployeeBenefitsWorkspace() {
  const { locale } = useI18n();
  const copy = resolveEmployeeBenefitsCopy(locale);
  const runtimeLocale = locale === "ko" ? "ko-KR" : "en-US";
  const { snapshot: supabaseSession } = useSupabaseSession();

  const organizationId = (supabaseSession?.organizationId ?? "").trim();
  const employeeId = (supabaseSession?.actorId ?? supabaseSession?.userId ?? "EMP-1001").trim() || "EMP-1001";

  const [catalog, setCatalog] = useState<BenefitCatalogItem[]>([]);
  const [requests, setRequests] = useState<BenefitRequestItem[]>([]);
  const [requestSummary, setRequestSummary] = useState(EMPTY_EMPLOYEE_BENEFIT_REQUEST_SUMMARY);

  const [selectedBenefitId, setSelectedBenefitId] = useState("");
  const [amountKrw, setAmountKrw] = useState("100000");
  const [reason, setReason] = useState("");
  const [requestStatusFilter, setRequestStatusFilter] = useState<BenefitRequestStatus | "all">("all");
  const [requestRiskFilter, setRequestRiskFilter] = useState<EmployeeBenefitRequestRiskFilter>("all");
  const [requestSearchQuery, setRequestSearchQuery] = useState("");

  const [pending, setPending] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const bearerToken = supabaseSession?.accessToken ?? "";
  const usesBearerToken = bearerToken.trim().length > 0;

  const catalogById = useMemo(() => {
    const map = new Map<string, BenefitCatalogItem>();
    catalog.forEach((item) => {
      map.set(item.id, item);
    });
    return map;
  }, [catalog]);

  const statusFilteredRequests = useMemo(
    () =>
      requests.filter((item) =>
        requestStatusFilter === "all" ? true : item.status === requestStatusFilter
      ),
    [requestStatusFilter, requests]
  );

  const filteredRequests = useMemo(
    () =>
      filterBenefitRequests({
        requests: statusFilteredRequests,
        catalogById,
        searchQuery: requestSearchQuery,
        riskFilter: requestRiskFilter
      }),
    [catalogById, requestRiskFilter, requestSearchQuery, statusFilteredRequests]
  );

  const pendingAgingRiskCount = useMemo(
    () => requests.filter((item) => isBenefitRequestPendingAgingRisk(item)).length,
    [requests]
  );

  const selectedBenefit = useMemo(
    () => (selectedBenefitId ? catalogById.get(selectedBenefitId) ?? null : null),
    [catalogById, selectedBenefitId]
  );

  const selectedBenefitUsage = useMemo(
    () =>
      requests
        .filter(
          (item) =>
            item.benefitId === selectedBenefitId &&
            (item.status === "SUBMITTED" || item.status === "APPROVED")
        )
        .reduce((total, item) => total + item.amountKrw, 0),
    [requests, selectedBenefitId]
  );

  const requestAmount = Math.max(0, Math.trunc(Number(amountKrw) || 0));
  const estimatedRemainingAmount =
    selectedBenefit ? selectedBenefit.annualLimitKrw - selectedBenefitUsage - requestAmount : null;
  const isProjectedOverLimit =
    typeof estimatedRemainingAmount === "number" && estimatedRemainingAmount < 0;

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

    const catalogQuery = buildBenefitsQuery({ organizationId, status: "ACTIVE" });
    const requestsQuery = buildBenefitsQuery({
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

    const nextCatalog = parseBenefitCatalog(catalogRes.parsed);
    setCatalog(nextCatalog);
    setRequests(parseBenefitRequests(requestsRes.parsed));
    setRequestSummary(parseBenefitRequestSummary(requestsRes.parsed));
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

  return (
    <EmployeeBenefitsWorkspaceView
      copy={copy}
      runtimeLocale={runtimeLocale}
      sessionOrganizationId={organizationId}
      sessionEmployeeId={employeeId}
      catalog={catalog}
      requests={requests}
      filteredRequests={filteredRequests}
      requestSummary={requestSummary}
      requestStatusFilter={requestStatusFilter}
      requestRiskFilter={requestRiskFilter}
      requestSearchQuery={requestSearchQuery}
      pendingAgingRiskCount={pendingAgingRiskCount}
      selectedBenefitId={selectedBenefitId}
      amountKrw={amountKrw}
      reason={reason}
      selectedBenefitUsage={selectedBenefitUsage}
      estimatedRemainingAmount={estimatedRemainingAmount}
      isProjectedOverLimit={isProjectedOverLimit}
      pending={pending}
      statusMessage={statusMessage}
      onRequestStatusFilterChange={setRequestStatusFilter}
      onRequestRiskFilterChange={setRequestRiskFilter}
      onRequestSearchQueryChange={setRequestSearchQuery}
      onClearRequestSearch={() => setRequestSearchQuery("")}
      onLoadWorkspace={() => void loadWorkspace()}
      onSelectedBenefitChange={setSelectedBenefitId}
      onAmountChange={setAmountKrw}
      onReasonChange={setReason}
      onSubmitRequest={() => void submitRequest()}
      onCancelRequest={(requestId) => void cancelRequest(requestId)}
      resolveBenefitName={(benefitId) => catalogById.get(benefitId)?.name ?? copy.unknownBenefitLabel}
      selectedBenefit={selectedBenefit}
    />
  );
}
