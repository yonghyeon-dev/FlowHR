"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  EMPTY_EMPLOYEE_BENEFIT_REQUEST_SUMMARY,
  buildBenefitsQuery,
  filterBenefitRequests,
  isBenefitRequestPendingAgingRisk,
  normalizeEmployeeBenefitRequestStatusFilter,
  normalizeEmployeeBenefitRiskFilter,
  parseBenefitCatalog,
  parseEmployeeBenefitSearchQuery,
  parseBenefitRequests,
  parseBenefitRequestSummary,
  type EmployeeBenefitRequestRiskFilter
} from "@/components/benefits/employee-benefits-helpers";
import EmployeeBenefitsWorkspaceView from "@/components/benefits/EmployeeBenefitsWorkspaceView";
import { resolveEmployeeBenefitsCopy } from "@/components/benefits/copy";
import type { BenefitCatalogItem, BenefitRequestItem, BenefitRequestStatus } from "@/features/benefits/types";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useI18n } from "@/lib/i18n/provider";

function isTruthyFlag(value: string | undefined) {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export default function EmployeeBenefitsWorkspace() {
  const searchParams = useSearchParams();
  const { locale } = useI18n();
  const copy = resolveEmployeeBenefitsCopy(locale);
  const runtimeLocale = locale === "ko" ? "ko-KR" : "en-US";
  const showDevTools = isTruthyFlag(process.env.NEXT_PUBLIC_FLOWHR_DEV_TOOLS);
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
  const [autoLoadAttempted, setAutoLoadAttempted] = useState(false);

  const bearerToken = supabaseSession?.accessToken ?? "";
  const usesBearerToken = bearerToken.trim().length > 0;

  const catalogById = useMemo(() => {
    const map = new Map<string, BenefitCatalogItem>();
    catalog.forEach((item) => {
      map.set(item.id, item);
    });
    return map;
  }, [catalog]);
  const requestableCatalog = useMemo(
    () => catalog.filter((item) => item.status === "ACTIVE"),
    [catalog]
  );

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

    const catalogQuery = buildBenefitsQuery({ organizationId });
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
    const nextRequestableCatalog = nextCatalog.filter((item) => item.status === "ACTIVE");
    if (!selectedBenefitId && nextRequestableCatalog.length > 0) {
      setSelectedBenefitId(nextRequestableCatalog[0].id);
    } else if (
      selectedBenefitId &&
      !nextRequestableCatalog.some((item) => item.id === selectedBenefitId)
    ) {
      setSelectedBenefitId(nextRequestableCatalog[0]?.id ?? "");
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
    if (selectedBenefit?.status !== "ACTIVE") {
      setStatusMessage(copy.messages.inactiveCatalog);
      return;
    }

    const { response, parsed } = await callApi("POST", "/api/benefits/requests", {
      organizationId,
      benefitId: selectedBenefitId,
      employeeId,
      amountKrw: amount,
      reason
    });

    if (!response.ok) {
      if ((parsed as { error?: string } | null)?.error === "benefits.catalog.inactive") {
        setStatusMessage(copy.messages.inactiveCatalog);
        return;
      }
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

  useEffect(() => {
    setRequestStatusFilter(
      normalizeEmployeeBenefitRequestStatusFilter(searchParams.get("status"))
    );
    setRequestRiskFilter(
      normalizeEmployeeBenefitRiskFilter(searchParams.get("risk"))
    );
    setRequestSearchQuery(parseEmployeeBenefitSearchQuery(searchParams.get("q")));
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
    <EmployeeBenefitsWorkspaceView
      copy={copy}
      isKoLocale={locale === "ko"}
      runtimeLocale={runtimeLocale}
      showDevTools={showDevTools}
      sessionOrganizationId={organizationId}
      sessionEmployeeId={employeeId}
      requestableCatalog={requestableCatalog}
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
