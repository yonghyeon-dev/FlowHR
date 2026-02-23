"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useStickyStringState } from "@/lib/client/useStickyState";
import { currentYear, formatKrw } from "@/components/payroll-year-end/types";
import type {
  ApiLog,
  PayrollYearEndFilingAckCatalogResponse,
  PayrollYearEndFilingSubmissionAckStatusFilter,
  PayrollYearEndFilingEvidenceNoteResponse,
  PayrollYearEndFilingExportResponse,
  PayrollYearEndFilingSubmission,
  PayrollYearEndFilingSubmissionListResponse,
  PayrollYearEndFilingSubmissionListSummary,
  PayrollYearEndFilingSubmissionResponse,
  PayrollYearEndFilingSubmissionSortBy,
  PayrollYearEndFilingSubmissionSortDirection,
  PayrollYearEndFilingSubmissionStatusFilter,
  PayrollYearEndFilingSubmissionTimelineResponse,
  PayrollYearEndFilingSubmissionTransportFilter,
  PayrollYearEndFilingSubmissionValidationStatusFilter,
  PayrollYearEndFilingTimelineEntry,
  PayrollYearEndFinalizationResponse
} from "@/components/payroll-year-end-filing/types";

function parseRequiredInt(value: string, fieldName: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${fieldName} must be a non-negative integer`);
  }
  return parsed;
}

function parseRate(value: string, fieldName: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
    throw new Error(`${fieldName} must be between 0 and 1`);
  }
  return parsed;
}

function formatTimelineEntry(entry: PayrollYearEndFilingTimelineEntry) {
  if (entry.action === "submitted" || entry.action === "resubmitted") {
    const parts = [
      `${entry.action.toUpperCase()} attempt ${entry.attempt ?? "-"}`,
      entry.resubmissionOfSubmissionId ? `from ${entry.resubmissionOfSubmissionId}` : null,
      entry.resubmissionReason ? `reason: ${entry.resubmissionReason}` : null,
      entry.submissionNote ? `note: ${entry.submissionNote}` : null
    ].filter(Boolean);
    return parts.join(" / ");
  }
  if (entry.action === "acknowledged") {
    return `ACK ${entry.ackStatus ?? "-"}${entry.ackCode ? ` (${entry.ackCode})` : ""}${
      entry.rejectionReasonCode ? ` / reason ${entry.rejectionReasonCode}` : ""
    }${entry.rejectionReasonDetail ? ` / detail ${entry.rejectionReasonDetail}` : ""}${
      entry.ackNote ? ` / ${entry.ackNote}` : ""
    }`;
  }
  if (entry.action === "canceled") {
    return "SUBMISSION CANCELED";
  }
  if (entry.action === "reopened") {
    return "SUBMISSION REOPENED";
  }
  return `EVIDENCE NOTE: ${entry.evidenceNote ?? "-"}`;
}

export default function PayrollYearEndFilingConsole() {
  const [organizationId, setOrganizationId] = useStickyStringState("flowhr:ctx:organizationId", "");
  const [adminActorId, setAdminActorId] = useStickyStringState("flowhr:ctx:adminId", "ADM-1001");
  const [accessToken, setAccessToken] = useState("");
  const [year, setYear] = useState(String(currentYear()));
  const [employeeId, setEmployeeId] = useState("EMP-1001");
  const [nonTaxableAnnualIncomeKrw, setNonTaxableAnnualIncomeKrw] = useState("0");
  const [additionalTaxCreditKrw, setAdditionalTaxCreditKrw] = useState("0");
  const [annualIncomeTaxRate, setAnnualIncomeTaxRate] = useState("0.03");
  const [localIncomeTaxRate, setLocalIncomeTaxRate] = useState("0.1");
  const [personalPensionKrw, setPersonalPensionKrw] = useState("0");
  const [insurancePremiumKrw, setInsurancePremiumKrw] = useState("0");
  const [medicalExpenseKrw, setMedicalExpenseKrw] = useState("0");
  const [educationExpenseKrw, setEducationExpenseKrw] = useState("0");
  const [donationKrw, setDonationKrw] = useState("0");
  const [housingSavingsKrw, setHousingSavingsKrw] = useState("0");
  const [finalizedByNote, setFinalizedByNote] = useState("year-end baseline finalize");
  const [exportFormat, setExportFormat] = useState<"json" | "csv" | "jsonl" | "hometax_csv">("json");
  const [validationMode, setValidationMode] = useState<"basic" | "strict">("basic");
  const [expectedExportSettlementHash, setExpectedExportSettlementHash] = useState("");
  const [expectedAckSettlementHash, setExpectedAckSettlementHash] = useState("");
  const [submissionTransport, setSubmissionTransport] = useState<
    "manual_portal" | "hometax_upload" | "nts_api_mock"
  >("manual_portal");
  const [submissionNote, setSubmissionNote] = useState("wi0191 filing package submit");
  const [submissionStatusFilter, setSubmissionStatusFilter] =
    useState<PayrollYearEndFilingSubmissionStatusFilter>("all");
  const [submissionAckStatusFilter, setSubmissionAckStatusFilter] =
    useState<PayrollYearEndFilingSubmissionAckStatusFilter>("all");
  const [submissionValidationStatusFilter, setSubmissionValidationStatusFilter] =
    useState<PayrollYearEndFilingSubmissionValidationStatusFilter>("all");
  const [submissionTransportFilter, setSubmissionTransportFilter] =
    useState<PayrollYearEndFilingSubmissionTransportFilter>("all");
  const [submissionSettlementHashFilter, setSubmissionSettlementHashFilter] = useState("");
  const [submissionSearch, setSubmissionSearch] = useState("");
  const [submissionSortBy, setSubmissionSortBy] =
    useState<PayrollYearEndFilingSubmissionSortBy>("submittedAt");
  const [submissionSortDirection, setSubmissionSortDirection] =
    useState<PayrollYearEndFilingSubmissionSortDirection>("desc");
  const [ackSubmissionId, setAckSubmissionId] = useState("");
  const [ackStatus, setAckStatus] = useState<"accepted" | "rejected">("accepted");
  const [ackCode, setAckCode] = useState("ACK-OK");
  const [ackNote, setAckNote] = useState("baseline acknowledgement");
  const [rejectionReasonCode, setRejectionReasonCode] = useState("OTHER");
  const [rejectionReasonDetail, setRejectionReasonDetail] = useState("");
  const [ackCatalog, setAckCatalog] = useState<PayrollYearEndFilingAckCatalogResponse | null>(null);
  const [resubmitSubmissionId, setResubmitSubmissionId] = useState("");
  const [resubmissionReason, setResubmissionReason] = useState("resubmit after rejected ack");
  const [cancelSubmissionId, setCancelSubmissionId] = useState("");
  const [reopenSubmissionId, setReopenSubmissionId] = useState("");
  const [timelineSubmissionId, setTimelineSubmissionId] = useState("");
  const [evidenceNote, setEvidenceNote] = useState("filing evidence note");
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [finalization, setFinalization] = useState<PayrollYearEndFinalizationResponse | null>(null);
  const [filingExport, setFilingExport] = useState<PayrollYearEndFilingExportResponse | null>(null);
  const [submissionListSummary, setSubmissionListSummary] =
    useState<PayrollYearEndFilingSubmissionListSummary | null>(null);
  const [submissions, setSubmissions] = useState<PayrollYearEndFilingSubmission[]>([]);
  const [timelineEntries, setTimelineEntries] = useState<PayrollYearEndFilingTimelineEntry[]>([]);
  const [logs, setLogs] = useState<ApiLog[]>([]);

  const isProductionRuntime = process.env.NODE_ENV === "production";
  const { snapshot: supabaseSession, error: supabaseSessionError } = useSupabaseSession();
  const bearerToken =
    accessToken.trim().length > 0
      ? accessToken.trim()
      : isProductionRuntime
        ? (supabaseSession?.accessToken ?? "")
        : "";
  const usesBearerToken = bearerToken.trim().length > 0;

  const stats = useMemo(() => {
    const total = logs.length;
    const success = logs.filter((log) => log.ok).length;
    return { total, success, fail: total - success };
  }, [logs]);

  const ackCodeOptions = useMemo(() => {
    if (ackStatus === "accepted") {
      return ackCatalog?.acceptedCodes ?? [];
    }
    return ackCatalog?.rejectedCodes ?? [];
  }, [ackStatus, ackCatalog]);

  const rejectionReasonOptions = useMemo(() => ackCatalog?.rejectionReasons ?? [], [ackCatalog]);
  const settlementHashFilterChips = useMemo(() => {
    const chips: string[] = [];
    const seen = new Set<string>();
    for (const submission of submissions) {
      const hash = submission.settlementHash?.trim().toLowerCase();
      if (!hash) {
        continue;
      }
      const chip = hash.slice(0, 12);
      if (seen.has(chip)) {
        continue;
      }
      seen.add(chip);
      chips.push(chip);
      if (chips.length >= 6) {
        break;
      }
    }
    return chips;
  }, [submissions]);

  useEffect(() => {
    if (ackCodeOptions.length === 0) {
      return;
    }
    if (!ackCodeOptions.some((item) => item.code === ackCode)) {
      setAckCode(ackCodeOptions[0].code);
    }
  }, [ackCode, ackCodeOptions]);

  useEffect(() => {
    if (ackStatus !== "rejected") {
      return;
    }
    if (rejectionReasonOptions.length === 0) {
      return;
    }
    if (!rejectionReasonOptions.some((item) => item.code === rejectionReasonCode)) {
      setRejectionReasonCode(rejectionReasonOptions[0].code);
    }
  }, [ackStatus, rejectionReasonCode, rejectionReasonOptions]);

  useEffect(() => {
    if (ackStatus === "accepted" && rejectionReasonDetail.length > 0) {
      setRejectionReasonDetail("");
    }
  }, [ackStatus, rejectionReasonDetail]);

  function buildHeaders() {
    const headers: Record<string, string> = {
      "content-type": "application/json"
    };
    if (usesBearerToken) {
      headers.authorization = `Bearer ${bearerToken}`;
    } else {
      headers["x-actor-role"] = "payroll_operator";
      headers["x-actor-id"] = adminActorId.trim() || "PAY-1001";
      if (organizationId.trim()) {
        headers["x-actor-organization-id"] = organizationId.trim();
      }
    }
    return headers;
  }

  function buildFinalizePayload(apply: boolean) {
    return {
      year: parseRequiredInt(year, "year"),
      employeeId: employeeId.trim(),
      nonTaxableAnnualIncomeKrw: parseRequiredInt(
        nonTaxableAnnualIncomeKrw,
        "nonTaxableAnnualIncomeKrw"
      ),
      additionalTaxCreditKrw: parseRequiredInt(additionalTaxCreditKrw, "additionalTaxCreditKrw"),
      annualIncomeTaxRate: parseRate(annualIncomeTaxRate, "annualIncomeTaxRate"),
      localIncomeTaxRate: parseRate(localIncomeTaxRate, "localIncomeTaxRate"),
      deductionItems: {
        personalPensionKrw: parseRequiredInt(personalPensionKrw, "personalPensionKrw"),
        insurancePremiumKrw: parseRequiredInt(insurancePremiumKrw, "insurancePremiumKrw"),
        medicalExpenseKrw: parseRequiredInt(medicalExpenseKrw, "medicalExpenseKrw"),
        educationExpenseKrw: parseRequiredInt(educationExpenseKrw, "educationExpenseKrw"),
        donationKrw: parseRequiredInt(donationKrw, "donationKrw"),
        housingSavingsKrw: parseRequiredInt(housingSavingsKrw, "housingSavingsKrw")
      },
      apply,
      finalizedByNote: finalizedByNote.trim() || undefined
    };
  }

  async function runFinalization(apply: boolean) {
    try {
      setPendingLabel(apply ? "year-end finalization apply" : "year-end finalization preview");
      const response = await fetch("/api/payroll/year-end/finalize-settlement", {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify(buildFinalizePayload(apply))
      });
      const body = (await response.json()) as PayrollYearEndFinalizationResponse | { error: string };
      setLogs((prev) => [
        {
          id: Date.now(),
          label: apply ? "finalize settlement" : "preview finalization",
          status: response.status,
          ok: response.ok,
          at: new Date().toLocaleString("ko-KR")
        },
        ...prev
      ]);
      if (!response.ok || "error" in body) {
        setStatusMessage("request failed; check logs");
        return;
      }
      setFinalization(body);
      setExpectedExportSettlementHash(body.settlement.settlementHash);
      setExpectedAckSettlementHash(body.settlement.settlementHash);
      setStatusMessage(body.settlement.finalized ? `finalized ${body.settlement.finalizationId}` : "preview loaded");
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "invalid input");
    } finally {
      setPendingLabel(null);
    }
  }

  async function runFilingExport() {
    try {
      setPendingLabel("year-end filing export");
      const payload = {
        year: parseRequiredInt(year, "year"),
        employeeId: employeeId.trim(),
        format: exportFormat,
        validationMode,
        expectedSettlementHash: expectedExportSettlementHash.trim() || undefined
      };
      const response = await fetch("/api/payroll/year-end/export-filing-data", {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify(payload)
      });
      const body = (await response.json()) as PayrollYearEndFilingExportResponse | { error: string };
      setLogs((prev) => [
        {
          id: Date.now(),
          label: "export filing data",
          status: response.status,
          ok: response.ok,
          at: new Date().toLocaleString("ko-KR")
        },
        ...prev
      ]);
      if (!response.ok || "error" in body) {
        setStatusMessage("request failed; check logs");
        return;
      }
      setFilingExport(body);
      setStatusMessage(
        `exported ${body.filingData.records.length} records (${body.filingData.validation.status})`
      );
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "invalid input");
    } finally {
      setPendingLabel(null);
    }
  }

  async function runSubmitFilingPackage() {
    try {
      setPendingLabel("year-end filing package submit");
      const payload = {
        year: parseRequiredInt(year, "year"),
        employeeId: employeeId.trim(),
        format: exportFormat,
        validationMode,
        expectedSettlementHash: expectedExportSettlementHash.trim() || undefined,
        transport: submissionTransport,
        submissionNote: submissionNote.trim() || undefined
      };
      const response = await fetch("/api/payroll/year-end/filing-submissions", {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify(payload)
      });
      const body = (await response.json()) as PayrollYearEndFilingSubmissionResponse | { error: string };
      setLogs((prev) => [
        {
          id: Date.now(),
          label: "submit filing package",
          status: response.status,
          ok: response.ok,
          at: new Date().toLocaleString("ko-KR")
        },
        ...prev
      ]);
      if (!response.ok || "error" in body) {
        setStatusMessage("request failed; check logs");
        return;
      }
      setSubmissions((prev) => [body.submission, ...prev.filter((item) => item.submissionId !== body.submission.submissionId)]);
      setAckSubmissionId(body.submission.submissionId);
      setCancelSubmissionId(body.submission.submissionId);
      setStatusMessage(`submitted ${body.submission.submissionId}`);
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "invalid input");
    } finally {
      setPendingLabel(null);
    }
  }

  async function runRefreshSubmissions(settlementHashFilterOverride?: string) {
    try {
      setPendingLabel("year-end filing submissions list");
      const requestYear = parseRequiredInt(year, "year");
      const requestEmployeeId = employeeId.trim();
      const query = new URLSearchParams({
        year: String(requestYear),
        employeeId: requestEmployeeId
      });
      if (submissionStatusFilter !== "all") {
        query.set("status", submissionStatusFilter);
      }
      if (submissionAckStatusFilter !== "all") {
        query.set("ackStatus", submissionAckStatusFilter);
      }
      if (submissionValidationStatusFilter !== "all") {
        query.set("validationStatus", submissionValidationStatusFilter);
      }
      if (submissionTransportFilter !== "all") {
        query.set("transport", submissionTransportFilter);
      }
      const settlementHashFilter = (
        settlementHashFilterOverride ?? submissionSettlementHashFilter
      ).trim();
      if (settlementHashFilter.length > 0) {
        query.set("settlementHash", settlementHashFilter);
      }
      if (submissionSearch.trim().length > 0) {
        query.set("search", submissionSearch.trim());
      }
      query.set("sortBy", submissionSortBy);
      query.set("sortDirection", submissionSortDirection);
      const response = await fetch(
        `/api/payroll/year-end/filing-submissions?${query.toString()}`,
        {
          method: "GET",
          headers: buildHeaders()
        }
      );
      const body = (await response.json()) as PayrollYearEndFilingSubmissionListResponse | { error: string };
      setLogs((prev) => [
        {
          id: Date.now(),
          label: "list filing submissions",
          status: response.status,
          ok: response.ok,
          at: new Date().toLocaleString("ko-KR")
        },
        ...prev
      ]);
      if (!response.ok || "error" in body) {
        setStatusMessage("request failed; check logs");
        return;
      }
      setSubmissionListSummary(body.summary);
      setSubmissions(body.submissions);
      setStatusMessage(
        `loaded ${body.submissions.length}/${body.summary.totalCount} submissions (filters/search/sort applied)`
      );
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "invalid input");
    } finally {
      setPendingLabel(null);
    }
  }

  function resetSubmissionFilters() {
    setSubmissionStatusFilter("all");
    setSubmissionAckStatusFilter("all");
    setSubmissionValidationStatusFilter("all");
    setSubmissionTransportFilter("all");
    setSubmissionSettlementHashFilter("");
    setSubmissionSearch("");
    setSubmissionSortBy("submittedAt");
    setSubmissionSortDirection("desc");
  }

  async function runLoadAckCatalog() {
    try {
      setPendingLabel("year-end filing ack catalog");
      const response = await fetch("/api/payroll/year-end/filing-ack-catalog", {
        method: "GET",
        headers: buildHeaders()
      });
      const body = (await response.json()) as PayrollYearEndFilingAckCatalogResponse | { error: string };
      setLogs((prev) => [
        {
          id: Date.now(),
          label: "list filing ack catalog",
          status: response.status,
          ok: response.ok,
          at: new Date().toLocaleString("ko-KR")
        },
        ...prev
      ]);
      if (!response.ok || "error" in body) {
        setStatusMessage("request failed; check logs");
        return;
      }
      setAckCatalog(body);
      setStatusMessage(
        `loaded ack catalog (${body.acceptedCodes.length}/${body.rejectedCodes.length}/${body.rejectionReasons.length})`
      );
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "invalid input");
    } finally {
      setPendingLabel(null);
    }
  }

  async function runAcknowledgeSubmission(
    submissionIdOverride?: string,
    ackStatusOverride?: "accepted" | "rejected"
  ) {
    const submissionId = (submissionIdOverride ?? ackSubmissionId).trim();
    if (!submissionId) {
      setStatusMessage("ack submission ID is required");
      return;
    }

    try {
      setPendingLabel("year-end filing package ack");
      const requestAckStatus = ackStatusOverride ?? ackStatus;
      const requestAckCode =
        requestAckStatus === "accepted" && ackStatusOverride === "accepted"
          ? ackCatalog?.acceptedCodes[0]?.code ?? "ACK-OK"
          : ackCode.trim() || undefined;
      const payload = {
        year: parseRequiredInt(year, "year"),
        employeeId: employeeId.trim(),
        expectedSettlementHash: expectedAckSettlementHash.trim() || undefined,
        ackStatus: requestAckStatus,
        ackCode: requestAckCode,
        ackNote: ackNote.trim() || undefined,
        rejectionReasonCode:
          requestAckStatus === "rejected" ? rejectionReasonCode.trim() || undefined : undefined,
        rejectionReasonDetail:
          requestAckStatus === "rejected" ? rejectionReasonDetail.trim() || undefined : undefined
      };
      const response = await fetch(
        `/api/payroll/year-end/filing-submissions/${encodeURIComponent(submissionId)}/ack`,
        {
          method: "POST",
          headers: buildHeaders(),
          body: JSON.stringify(payload)
        }
      );
      const body = (await response.json()) as PayrollYearEndFilingSubmissionResponse | { error: string };
      setLogs((prev) => [
        {
          id: Date.now(),
          label: "ack filing package",
          status: response.status,
          ok: response.ok,
          at: new Date().toLocaleString("ko-KR")
        },
        ...prev
      ]);
      if (!response.ok || "error" in body) {
        setStatusMessage("request failed; check logs");
        return;
      }
      setSubmissions((prev) =>
        prev.map((item) => (item.submissionId === body.submission.submissionId ? body.submission : item))
      );
      setAckSubmissionId(body.submission.submissionId);
      setCancelSubmissionId(body.submission.submissionId);
      if (body.submission.ack?.ackStatus === "rejected") {
        setResubmitSubmissionId(body.submission.submissionId);
      }
      setStatusMessage(`acknowledged ${body.submission.submissionId}`);
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "invalid input");
    } finally {
      setPendingLabel(null);
    }
  }

  async function runResubmitSubmission(submissionIdOverride?: string) {
    const submissionId = (submissionIdOverride ?? resubmitSubmissionId).trim();
    if (!submissionId) {
      setStatusMessage("resubmit submission ID is required");
      return;
    }

    try {
      setPendingLabel("year-end filing package resubmit");
      const payload = {
        year: parseRequiredInt(year, "year"),
        employeeId: employeeId.trim(),
        format: exportFormat,
        validationMode,
        expectedSettlementHash: expectedExportSettlementHash.trim() || undefined,
        transport: submissionTransport,
        submissionNote: submissionNote.trim() || undefined,
        resubmissionReason: resubmissionReason.trim() || undefined
      };
      const response = await fetch(
        `/api/payroll/year-end/filing-submissions/${encodeURIComponent(submissionId)}/resubmit`,
        {
          method: "POST",
          headers: buildHeaders(),
          body: JSON.stringify(payload)
        }
      );
      const body = (await response.json()) as PayrollYearEndFilingSubmissionResponse | { error: string };
      setLogs((prev) => [
        {
          id: Date.now(),
          label: "resubmit filing package",
          status: response.status,
          ok: response.ok,
          at: new Date().toLocaleString("ko-KR")
        },
        ...prev
      ]);
      if (!response.ok || "error" in body) {
        setStatusMessage("request failed; check logs");
        return;
      }
      setSubmissions((prev) => [body.submission, ...prev.filter((item) => item.submissionId !== body.submission.submissionId)]);
      setAckSubmissionId(body.submission.submissionId);
      setCancelSubmissionId(body.submission.submissionId);
      setResubmitSubmissionId(body.submission.submissionId);
      setStatusMessage(`resubmitted ${body.submission.submissionId}`);
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "invalid input");
    } finally {
      setPendingLabel(null);
    }
  }

  async function runCancelSubmission(submissionIdOverride?: string) {
    const submissionId = (submissionIdOverride ?? cancelSubmissionId).trim();
    if (!submissionId) {
      setStatusMessage("cancel submission ID is required");
      return;
    }

    try {
      setPendingLabel("year-end filing package cancel");
      const payload = {
        year: parseRequiredInt(year, "year"),
        employeeId: employeeId.trim()
      };
      const response = await fetch(
        `/api/payroll/year-end/filing-submissions/${encodeURIComponent(submissionId)}/cancel`,
        {
          method: "POST",
          headers: buildHeaders(),
          body: JSON.stringify(payload)
        }
      );
      const body = (await response.json()) as PayrollYearEndFilingSubmissionResponse | { error: string };
      setLogs((prev) => [
        {
          id: Date.now(),
          label: "cancel filing package",
          status: response.status,
          ok: response.ok,
          at: new Date().toLocaleString("ko-KR")
        },
        ...prev
      ]);
      if (!response.ok || "error" in body) {
        setStatusMessage("request failed; check logs");
        return;
      }
      setSubmissions((prev) =>
        prev.map((item) => (item.submissionId === body.submission.submissionId ? body.submission : item))
      );
      setReopenSubmissionId(body.submission.submissionId);
      setStatusMessage(`canceled ${body.submission.submissionId}`);
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "invalid input");
    } finally {
      setPendingLabel(null);
    }
  }

  async function runReopenSubmission(submissionIdOverride?: string) {
    const submissionId = (submissionIdOverride ?? reopenSubmissionId).trim();
    if (!submissionId) {
      setStatusMessage("reopen submission ID is required");
      return;
    }

    try {
      setPendingLabel("year-end filing package reopen");
      const payload = {
        year: parseRequiredInt(year, "year"),
        employeeId: employeeId.trim()
      };
      const response = await fetch(
        `/api/payroll/year-end/filing-submissions/${encodeURIComponent(submissionId)}/reopen`,
        {
          method: "POST",
          headers: buildHeaders(),
          body: JSON.stringify(payload)
        }
      );
      const body = (await response.json()) as PayrollYearEndFilingSubmissionResponse | { error: string };
      setLogs((prev) => [
        {
          id: Date.now(),
          label: "reopen filing package",
          status: response.status,
          ok: response.ok,
          at: new Date().toLocaleString("ko-KR")
        },
        ...prev
      ]);
      if (!response.ok || "error" in body) {
        setStatusMessage("request failed; check logs");
        return;
      }
      setSubmissions((prev) =>
        prev.map((item) => (item.submissionId === body.submission.submissionId ? body.submission : item))
      );
      setCancelSubmissionId(body.submission.submissionId);
      setAckSubmissionId(body.submission.submissionId);
      setStatusMessage(`reopened ${body.submission.submissionId}`);
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "invalid input");
    } finally {
      setPendingLabel(null);
    }
  }

  async function runLoadSubmissionTimeline(submissionIdOverride?: string) {
    const submissionId = (submissionIdOverride ?? timelineSubmissionId).trim();
    if (!submissionId) {
      setStatusMessage("timeline submission ID is required");
      return;
    }

    try {
      setPendingLabel("year-end filing submission timeline");
      const requestYear = parseRequiredInt(year, "year");
      const requestEmployeeId = employeeId.trim();
      const response = await fetch(
        `/api/payroll/year-end/filing-submissions/${encodeURIComponent(submissionId)}/timeline?year=${requestYear}&employeeId=${encodeURIComponent(requestEmployeeId)}`,
        {
          method: "GET",
          headers: buildHeaders()
        }
      );
      const body = (await response.json()) as PayrollYearEndFilingSubmissionTimelineResponse | { error: string };
      setLogs((prev) => [
        {
          id: Date.now(),
          label: "list filing submission timeline",
          status: response.status,
          ok: response.ok,
          at: new Date().toLocaleString("ko-KR")
        },
        ...prev
      ]);
      if (!response.ok || "error" in body) {
        setStatusMessage("request failed; check logs");
        return;
      }
      setTimelineSubmissionId(submissionId);
      setTimelineEntries(body.timeline);
      setSubmissions((prev) =>
        prev.map((item) => (item.submissionId === body.submission.submissionId ? body.submission : item))
      );
      setStatusMessage(`loaded timeline ${body.timeline.length} events`);
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "invalid input");
    } finally {
      setPendingLabel(null);
    }
  }

  async function runAddEvidenceNote() {
    const submissionId = timelineSubmissionId.trim();
    if (!submissionId) {
      setStatusMessage("timeline submission ID is required for evidence note");
      return;
    }

    try {
      setPendingLabel("year-end filing evidence note");
      const payload = {
        year: parseRequiredInt(year, "year"),
        employeeId: employeeId.trim(),
        note: evidenceNote.trim()
      };
      const response = await fetch(
        `/api/payroll/year-end/filing-submissions/${encodeURIComponent(submissionId)}/evidence-note`,
        {
          method: "POST",
          headers: buildHeaders(),
          body: JSON.stringify(payload)
        }
      );
      const body = (await response.json()) as PayrollYearEndFilingEvidenceNoteResponse | { error: string };
      setLogs((prev) => [
        {
          id: Date.now(),
          label: "add filing evidence note",
          status: response.status,
          ok: response.ok,
          at: new Date().toLocaleString("ko-KR")
        },
        ...prev
      ]);
      if (!response.ok || "error" in body) {
        setStatusMessage("request failed; check logs");
        return;
      }
      setStatusMessage(`added evidence note for ${body.evidenceNote.submissionId}`);
      await runLoadSubmissionTimeline(submissionId);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "invalid input");
    } finally {
      setPendingLabel(null);
    }
  }

  return (
    <main className="saas-content">
      <header className="hero">
        <p className="eyebrow">FlowHR Admin</p>
        <h1>Payroll Year-End Finalization, Filing Search/Sort, ACK Catalog, and Lifecycle Console</h1>
        <p>Finalize year-end settlement, manage filing submissions with status/search/sort filters plus quick actions, and trace timeline/evidence notes and cancel/reopen transitions per submission.</p>
      </header>

      <section className="panel-grid">
        <article className="panel">
          <h2>Input</h2>
          <div className="input-grid">
            <label>Year<input value={year} onChange={(event) => setYear(event.target.value)} /></label>
            <label>Employee ID<input value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} /></label>
            <label>Non-taxable Annual Income<input value={nonTaxableAnnualIncomeKrw} onChange={(event) => setNonTaxableAnnualIncomeKrw(event.target.value)} /></label>
            <label>Additional Tax Credit<input value={additionalTaxCreditKrw} onChange={(event) => setAdditionalTaxCreditKrw(event.target.value)} /></label>
            <label>Annual Income Tax Rate<input value={annualIncomeTaxRate} onChange={(event) => setAnnualIncomeTaxRate(event.target.value)} /></label>
            <label>Local Income Tax Rate<input value={localIncomeTaxRate} onChange={(event) => setLocalIncomeTaxRate(event.target.value)} /></label>
            <label>Personal Pension<input value={personalPensionKrw} onChange={(event) => setPersonalPensionKrw(event.target.value)} /></label>
            <label>Insurance Premium<input value={insurancePremiumKrw} onChange={(event) => setInsurancePremiumKrw(event.target.value)} /></label>
            <label>Medical Expense<input value={medicalExpenseKrw} onChange={(event) => setMedicalExpenseKrw(event.target.value)} /></label>
            <label>Education Expense<input value={educationExpenseKrw} onChange={(event) => setEducationExpenseKrw(event.target.value)} /></label>
            <label>Donation<input value={donationKrw} onChange={(event) => setDonationKrw(event.target.value)} /></label>
            <label>Housing Savings<input value={housingSavingsKrw} onChange={(event) => setHousingSavingsKrw(event.target.value)} /></label>
            <label>Export Format
              <select
                value={exportFormat}
                onChange={(event) =>
                  setExportFormat(event.target.value as "json" | "csv" | "jsonl" | "hometax_csv")
                }
              >
                <option value="json">json</option>
                <option value="csv">csv</option>
                <option value="jsonl">jsonl</option>
                <option value="hometax_csv">hometax_csv</option>
              </select>
            </label>
            <label>Validation Mode
              <select value={validationMode} onChange={(event) => setValidationMode(event.target.value as "basic" | "strict")}>
                <option value="basic">basic</option>
                <option value="strict">strict</option>
              </select>
            </label>
            <label>Submission Transport
              <select
                value={submissionTransport}
                onChange={(event) =>
                  setSubmissionTransport(
                    event.target.value as "manual_portal" | "hometax_upload" | "nts_api_mock"
                  )
                }
              >
                <option value="manual_portal">manual_portal</option>
                <option value="hometax_upload">hometax_upload</option>
                <option value="nts_api_mock">nts_api_mock</option>
              </select>
            </label>
            <label>Submission Status Filter
              <select
                value={submissionStatusFilter}
                onChange={(event) =>
                  setSubmissionStatusFilter(
                    event.target.value as PayrollYearEndFilingSubmissionStatusFilter
                  )
                }
              >
                <option value="all">all</option>
                <option value="submitted">submitted</option>
                <option value="acknowledged">acknowledged</option>
                <option value="canceled">canceled</option>
              </select>
            </label>
            <label>ACK Status Filter
              <select
                value={submissionAckStatusFilter}
                onChange={(event) =>
                  setSubmissionAckStatusFilter(
                    event.target.value as PayrollYearEndFilingSubmissionAckStatusFilter
                  )
                }
              >
                <option value="all">all</option>
                <option value="accepted">accepted</option>
                <option value="rejected">rejected</option>
                <option value="none">none</option>
              </select>
            </label>
            <label>Validation Status Filter
              <select
                value={submissionValidationStatusFilter}
                onChange={(event) =>
                  setSubmissionValidationStatusFilter(
                    event.target.value as PayrollYearEndFilingSubmissionValidationStatusFilter
                  )
                }
              >
                <option value="all">all</option>
                <option value="pass">pass</option>
                <option value="fail">fail</option>
              </select>
            </label>
            <label>Transport Filter
              <select
                value={submissionTransportFilter}
                onChange={(event) =>
                  setSubmissionTransportFilter(
                    event.target.value as PayrollYearEndFilingSubmissionTransportFilter
                  )
                }
              >
                <option value="all">all</option>
                <option value="manual_portal">manual_portal</option>
                <option value="hometax_upload">hometax_upload</option>
                <option value="nts_api_mock">nts_api_mock</option>
              </select>
            </label>
            <label>Submission Search
              <input
                value={submissionSearch}
                onChange={(event) => setSubmissionSearch(event.target.value)}
                placeholder="submissionId, ackCode, note"
              />
            </label>
            <label>Settlement Hash Filter
              <input
                value={submissionSettlementHashFilter}
                onChange={(event) => setSubmissionSettlementHashFilter(event.target.value)}
                placeholder="hash prefix (8-64 hex)"
              />
            </label>
            <label>Submission Sort By
              <select
                value={submissionSortBy}
                onChange={(event) =>
                  setSubmissionSortBy(event.target.value as PayrollYearEndFilingSubmissionSortBy)
                }
              >
                <option value="submittedAt">submittedAt</option>
                <option value="attempt">attempt</option>
                <option value="status">status</option>
                <option value="ackStatus">ackStatus</option>
                <option value="validationStatus">validationStatus</option>
                <option value="transport">transport</option>
              </select>
            </label>
            <label>Submission Sort Direction
              <select
                value={submissionSortDirection}
                onChange={(event) =>
                  setSubmissionSortDirection(
                    event.target.value as PayrollYearEndFilingSubmissionSortDirection
                  )
                }
              >
                <option value="desc">desc</option>
                <option value="asc">asc</option>
              </select>
            </label>
          </div>
          {settlementHashFilterChips.length > 0 ? (
            <div className="panel-actions">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setSubmissionSettlementHashFilter("");
                  void runRefreshSubmissions("");
                }}
                disabled={pendingLabel !== null}
              >
                Clear Hash Filter
              </button>
              {settlementHashFilterChips.map((chip) => (
                <button
                  key={chip}
                  className="btn btn-secondary"
                  onClick={() => {
                    setSubmissionSettlementHashFilter(chip);
                    void runRefreshSubmissions(chip);
                  }}
                  disabled={pendingLabel !== null}
                >
                  hash:{chip}
                </button>
              ))}
            </div>
          ) : null}
          <label>Finalization Note<input value={finalizedByNote} onChange={(event) => setFinalizedByNote(event.target.value)} /></label>
          <label>Expected Settlement Hash (Export/Submit Guard)
            <input
              value={expectedExportSettlementHash}
              onChange={(event) => setExpectedExportSettlementHash(event.target.value)}
              placeholder="64-char sha256 hash (optional)"
            />
          </label>
          <label>Expected Settlement Hash (ACK Guard)
            <input
              value={expectedAckSettlementHash}
              onChange={(event) => setExpectedAckSettlementHash(event.target.value)}
              placeholder="64-char sha256 hash (optional)"
            />
          </label>
          <label>Submission Note<input value={submissionNote} onChange={(event) => setSubmissionNote(event.target.value)} /></label>
          <label>Ack Submission ID<input value={ackSubmissionId} onChange={(event) => setAckSubmissionId(event.target.value)} /></label>
          <label>Ack Status
            <select value={ackStatus} onChange={(event) => setAckStatus(event.target.value as "accepted" | "rejected")}>
              <option value="accepted">accepted</option>
              <option value="rejected">rejected</option>
            </select>
          </label>
          <label>Ack Code
            <select value={ackCode} onChange={(event) => setAckCode(event.target.value)}>
              {ackCodeOptions.length === 0 ? (
                <option value={ackCode}>{ackCode || "ACK-OK"}</option>
              ) : (
                ackCodeOptions.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.code} - {item.label}
                  </option>
                ))
              )}
            </select>
          </label>
          {ackStatus === "rejected" ? (
            <>
              <label>Rejection Reason Code
                <select
                  value={rejectionReasonCode}
                  onChange={(event) => setRejectionReasonCode(event.target.value)}
                >
                  {rejectionReasonOptions.length === 0 ? (
                    <option value={rejectionReasonCode || "OTHER"}>
                      {rejectionReasonCode || "OTHER"}
                    </option>
                  ) : (
                    rejectionReasonOptions.map((item) => (
                      <option key={item.code} value={item.code}>
                        {item.code} - {item.label}
                      </option>
                    ))
                  )}
                </select>
              </label>
              <label>Rejection Detail<input value={rejectionReasonDetail} onChange={(event) => setRejectionReasonDetail(event.target.value)} /></label>
            </>
          ) : null}
          <label>Ack Note<input value={ackNote} onChange={(event) => setAckNote(event.target.value)} /></label>
          <label>Resubmit Submission ID<input value={resubmitSubmissionId} onChange={(event) => setResubmitSubmissionId(event.target.value)} /></label>
          <label>Resubmission Reason<input value={resubmissionReason} onChange={(event) => setResubmissionReason(event.target.value)} /></label>
          <label>Cancel Submission ID<input value={cancelSubmissionId} onChange={(event) => setCancelSubmissionId(event.target.value)} /></label>
          <label>Reopen Submission ID<input value={reopenSubmissionId} onChange={(event) => setReopenSubmissionId(event.target.value)} /></label>
          <label>Timeline Submission ID<input value={timelineSubmissionId} onChange={(event) => setTimelineSubmissionId(event.target.value)} /></label>
          <label>Evidence Note<input value={evidenceNote} onChange={(event) => setEvidenceNote(event.target.value)} /></label>
          <label>Access Token (optional)<input value={accessToken} onChange={(event) => setAccessToken(event.target.value)} placeholder="Bearer token" /></label>
          <label>Actor ID (dev fallback)<input value={adminActorId} onChange={(event) => setAdminActorId(event.target.value)} /></label>
          <label>Organization ID (dev fallback)<input value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} /></label>
          <div className="panel-actions">
            <button className="btn btn-secondary" onClick={() => void runFinalization(false)} disabled={pendingLabel !== null}>Preview Finalization</button>
            <button className="btn btn-primary" onClick={() => void runFinalization(true)} disabled={pendingLabel !== null}>Finalize Settlement</button>
            <button className="btn btn-secondary" onClick={() => void runFilingExport()} disabled={pendingLabel !== null}>Export Filing Data</button>
            <button className="btn btn-primary" onClick={() => void runSubmitFilingPackage()} disabled={pendingLabel !== null}>Submit Filing Package</button>
            <button className="btn btn-secondary" onClick={() => void runAcknowledgeSubmission()} disabled={pendingLabel !== null}>Acknowledge Submission</button>
            <button className="btn btn-secondary" onClick={() => void runResubmitSubmission()} disabled={pendingLabel !== null}>Resubmit Submission</button>
            <button className="btn btn-secondary" onClick={() => void runCancelSubmission()} disabled={pendingLabel !== null}>Cancel Submission</button>
            <button className="btn btn-secondary" onClick={() => void runReopenSubmission()} disabled={pendingLabel !== null}>Reopen Submission</button>
            <button className="btn btn-secondary" onClick={() => void runRefreshSubmissions()} disabled={pendingLabel !== null}>Refresh Submissions</button>
            <button className="btn btn-secondary" onClick={resetSubmissionFilters} disabled={pendingLabel !== null}>Reset Filters</button>
            <button className="btn btn-secondary" onClick={() => void runLoadAckCatalog()} disabled={pendingLabel !== null}>Load ACK Catalog</button>
            <button className="btn btn-secondary" onClick={() => void runLoadSubmissionTimeline()} disabled={pendingLabel !== null}>Load Submission Timeline</button>
            <button className="btn btn-secondary" onClick={() => void runAddEvidenceNote()} disabled={pendingLabel !== null}>Add Evidence Note</button>
          </div>
          {statusMessage ? <p className="small">{statusMessage}</p> : null}
          {supabaseSessionError ? <p className="small fail">Session error: {supabaseSessionError}</p> : null}
        </article>

        <article className="panel">
          <h2>Finalization</h2>
          {!finalization ? <p className="small">No finalization summary yet.</p> : (
            <ul className="simple-list">
              <li><span>Can Finalize / Finalized</span><strong>{finalization.settlement.canFinalize ? "YES" : "NO"} / {finalization.settlement.finalized ? "YES" : "NO"}</strong></li>
              <li><span>Finalization ID</span><strong>{finalization.settlement.finalizationId}</strong></li>
              <li><span>Settlement Hash</span><strong>{finalization.settlement.settlementHash}</strong></li>
              <li><span>Tax Liability</span><strong>{formatKrw(finalization.settlement.settlementKrw.annualTaxLiabilityKrw)}</strong></li>
              <li><span>Withholding Delta</span><strong>{formatKrw(finalization.settlement.settlementKrw.withholdingDeltaKrw)}</strong></li>
              <li><span>Applied Deduction</span><strong>{formatKrw(finalization.settlement.deductionItemsKrw.appliedIncomeDeductionKrw)}</strong></li>
              <li><span>Blocking Reasons</span><strong>{finalization.settlement.blockingReasons.join(" | ") || "-"}</strong></li>
            </ul>
          )}
        </article>

        <article className="panel">
          <h2>Filing Export</h2>
          {!filingExport ? <p className="small">No export yet.</p> : (
            <ul className="simple-list">
              <li><span>Finalization ID</span><strong>{filingExport.filingData.finalizationId}</strong></li>
              <li><span>Settlement Hash</span><strong>{filingExport.filingData.settlementHash}</strong></li>
              <li><span>Format</span><strong>{filingExport.filingData.format}</strong></li>
              <li><span>Validation Mode</span><strong>{filingExport.filingData.validationMode}</strong></li>
              <li><span>Validation Status</span><strong>{filingExport.filingData.validation.status}</strong></li>
              <li><span>Exported Records</span><strong>{filingExport.filingData.records.length}</strong></li>
              <li><span>Tax Liability</span><strong>{formatKrw(filingExport.filingData.settlementKrw.annualTaxLiabilityKrw)}</strong></li>
              <li><span>Withholding Delta</span><strong>{formatKrw(filingExport.filingData.settlementKrw.withholdingDeltaKrw)}</strong></li>
              <li><span>CSV</span><strong>{filingExport.filingData.csv ? "ready" : "-"}</strong></li>
              <li><span>Artifact</span><strong>{filingExport.filingData.artifact.fileName}</strong></li>
              <li><span>Checksum</span><strong>{filingExport.filingData.artifact.checksumSha256.slice(0, 16)}...</strong></li>
              <li><span>Validation Issues</span><strong>{filingExport.filingData.validation.issues.join(" | ") || "-"}</strong></li>
            </ul>
          )}
        </article>

        <article className="panel">
          <h2>API Logs</h2>
          <p className="small">total {stats.total} / success {stats.success} / fail {stats.fail}{pendingLabel ? ` / running ${pendingLabel}` : ""}</p>
          {logs.length === 0 ? <p className="small">No API call yet.</p> : (
            <ul className="log-list">
              {logs.map((log) => (
                <li key={log.id}>
                  <span className={log.ok ? "ok" : "fail"}>{log.ok ? "OK" : "FAIL"}</span> {log.label} / {log.status}
                  <time>{log.at}</time>
                </li>
              ))}
            </ul>
          )}
          <div className="panel-actions">
            <Link href="/admin/payroll-year-end-filing/ops" className="btn btn-secondary">Open Filing Ops Dashboard</Link>
            <Link href="/admin/payroll-year-end" className="btn btn-secondary">Back to Year-End</Link>
            <Link href="/admin" className="btn btn-secondary">Back to Admin</Link>
          </div>
        </article>

        <article className="panel">
          <h2>Filing Submissions</h2>
          {!submissionListSummary ? (
            <p className="small">No submission summary yet. Run Refresh Submissions.</p>
          ) : (
            <ul className="simple-list">
              <li><span>Total / Filtered</span><strong>{submissionListSummary.totalCount} / {submissionListSummary.filteredCount}</strong></li>
              <li><span>Status</span><strong>submitted {submissionListSummary.statusCounts.submitted} / acknowledged {submissionListSummary.statusCounts.acknowledged} / canceled {submissionListSummary.statusCounts.canceled}</strong></li>
              <li><span>ACK Status</span><strong>accepted {submissionListSummary.ackStatusCounts.accepted} / rejected {submissionListSummary.ackStatusCounts.rejected} / none {submissionListSummary.ackStatusCounts.none}</strong></li>
              <li><span>Validation</span><strong>pass {submissionListSummary.validationStatusCounts.pass} / fail {submissionListSummary.validationStatusCounts.fail}</strong></li>
              <li><span>Transport</span><strong>manual {submissionListSummary.transportCounts.manual_portal} / hometax {submissionListSummary.transportCounts.hometax_upload} / nts_api_mock {submissionListSummary.transportCounts.nts_api_mock}</strong></li>
              <li><span>Active Filters</span><strong>status={submissionStatusFilter}, ackStatus={submissionAckStatusFilter}, validation={submissionValidationStatusFilter}, transport={submissionTransportFilter}, settlementHash={submissionSettlementHashFilter.trim() || "-"}, search={submissionSearch.trim() || "-"}, sort={submissionSortBy}:{submissionSortDirection}</strong></li>
            </ul>
          )}
          {submissions.length === 0 ? <p className="small">No filing submission yet.</p> : (
            <ul className="log-list">
              {submissions.map((submission) => (
                <li key={submission.submissionId}>
                  <span
                    className={
                      submission.status === "acknowledged"
                        ? "ok"
                        : submission.status === "canceled"
                          ? "fail"
                          : "small"
                    }
                  >
                    {submission.status.toUpperCase()}
                  </span>{" "}
                  {submission.submissionId} / attempt {submission.attempt} / {submission.transport} / {submission.format} / {submission.validationMode}
                  {submission.settlementHash ? ` / hash ${submission.settlementHash.slice(0, 12)}...` : ""}
                  {submission.resubmissionOfSubmissionId ? ` / resubmissionOf ${submission.resubmissionOfSubmissionId}` : ""}
                  {submission.ack
                    ? ` / ACK ${submission.ack.ackStatus}${submission.ack.ackCode ? `:${submission.ack.ackCode}` : ""}${
                        submission.ack.rejectionReasonCode ? `(${submission.ack.rejectionReasonCode})` : ""
                      }`
                    : ""}
                  <div className="panel-actions">
                    {submission.status === "submitted" ? (
                      <>
                        <button
                          className="btn btn-secondary"
                          onClick={() => {
                            void runAcknowledgeSubmission(submission.submissionId, "accepted");
                          }}
                          disabled={pendingLabel !== null}
                        >
                          Quick ACK Accepted
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={() => {
                            void runCancelSubmission(submission.submissionId);
                          }}
                          disabled={pendingLabel !== null}
                        >
                          Quick Cancel
                        </button>
                      </>
                    ) : null}
                    {submission.status === "acknowledged" && submission.ack?.ackStatus === "rejected" ? (
                      <button
                        className="btn btn-secondary"
                        onClick={() => {
                          void runResubmitSubmission(submission.submissionId);
                        }}
                        disabled={pendingLabel !== null}
                      >
                        Quick Resubmit
                      </button>
                    ) : null}
                    {submission.status === "canceled" ? (
                      <button
                        className="btn btn-secondary"
                        onClick={() => {
                          void runReopenSubmission(submission.submissionId);
                        }}
                        disabled={pendingLabel !== null}
                      >
                        Quick Reopen
                      </button>
                    ) : null}
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        setTimelineSubmissionId(submission.submissionId);
                        void runLoadSubmissionTimeline(submission.submissionId);
                      }}
                      disabled={pendingLabel !== null}
                    >
                      Timeline
                    </button>
                  </div>
                  <time>{new Date(submission.submittedAt).toLocaleString("ko-KR")}</time>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="panel">
          <h2>Submission Timeline</h2>
          {timelineEntries.length === 0 ? <p className="small">No timeline loaded.</p> : (
            <ul className="log-list">
              {timelineEntries.map((entry, index) => (
                <li key={`${entry.action}-${entry.occurredAt}-${index}`}>
                  <span
                    className={
                      entry.action === "acknowledged" && entry.ackStatus === "accepted"
                        ? "ok"
                        : entry.action === "canceled"
                          ? "fail"
                          : "small"
                    }
                  >
                    {entry.action}
                  </span>{" "}
                  {entry.submissionId} / {formatTimelineEntry(entry)}
                  <time>{new Date(entry.occurredAt).toLocaleString("ko-KR")}</time>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </main>
  );
}
