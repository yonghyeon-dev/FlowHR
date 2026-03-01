"use client";

import { useEffect, useMemo, useState } from "react";

import FilingApiLogsPanel from "@/components/payroll-year-end-filing/FilingApiLogsPanel";
import FilingFailureActionPanel from "@/components/payroll-year-end-filing/FilingFailureActionPanel";
import FilingPreflightBlockerPanel from "@/components/payroll-year-end-filing/FilingPreflightBlockerPanel";
import FilingSettlementSummaryPanels from "@/components/payroll-year-end-filing/FilingSettlementSummaryPanels";
import FilingSubmissionTimelinePanel from "@/components/payroll-year-end-filing/FilingSubmissionTimelinePanel";
import { payrollYearEndFilingCopyByLocale } from "@/components/payroll-year-end-filing/copy";
import {
  appendApiLogEntry,
  buildRequestFailureStatusMessage,
  extractApiErrorMessage,
  type PayrollYearEndFilingFailureAction,
  type PayrollYearEndFilingFailureState
} from "@/components/payroll-year-end-filing/request-feedback-helpers";
import {
  buildAcknowledgeSubmissionPayload,
  buildFilingSubmissionListQuery,
  buildResubmitSubmissionPayload,
  buildSubmitFilingPackagePayload
} from "@/components/payroll-year-end-filing/submission-request-helpers";
import {
  buildActiveSubmissionFiltersSummary,
  replaceSubmissionById,
  upsertSubmissionAtTop
} from "@/components/payroll-year-end-filing/submission-state-helpers";
import { isTruthyFlag } from "@/app/admin/page-helpers";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useI18n } from "@/lib/i18n/provider";
import {
  currentYear,
  type PayrollYearEndPreflightChecklistResponse
} from "@/components/payroll-year-end/types";
import { parseRate, parseRequiredInt } from "@/components/payroll-year-end-filing/value-helpers";
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

export default function PayrollYearEndFilingConsole() {
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
  const [preflightChecklist, setPreflightChecklist] =
    useState<PayrollYearEndPreflightChecklistResponse | null>(null);
  const [finalization, setFinalization] = useState<PayrollYearEndFinalizationResponse | null>(null);
  const [filingExport, setFilingExport] = useState<PayrollYearEndFilingExportResponse | null>(null);
  const [submissionListSummary, setSubmissionListSummary] =
    useState<PayrollYearEndFilingSubmissionListSummary | null>(null);
  const [submissions, setSubmissions] = useState<PayrollYearEndFilingSubmission[]>([]);
  const [timelineEntries, setTimelineEntries] = useState<PayrollYearEndFilingTimelineEntry[]>([]);
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [lastFailure, setLastFailure] = useState<PayrollYearEndFilingFailureState | null>(null);

  const isProductionRuntime = process.env.NODE_ENV === "production";
  const showDevTools = isTruthyFlag(process.env.NEXT_PUBLIC_FLOWHR_DEV_TOOLS);
  const { snapshot: supabaseSession, error: supabaseSessionError } = useSupabaseSession();
  const organizationId = (supabaseSession?.organizationId ?? "").trim();
  const adminActorId = (supabaseSession?.actorId ?? "PAY-1001").trim() || "PAY-1001";
  const { locale } = useI18n();
  const runtimeLocale = locale === "ko" ? "ko-KR" : "en-US";
  const copy = payrollYearEndFilingCopyByLocale[locale];
  const shortcutStatusCopy =
    locale === "ko"
      ? {
        openedPendingQueue: "\uc0ac\uc804\uc810\uac80 \ubc14\ub85c\uac00\uae30\ub85c \uc81c\ucd9c \ub300\uae30 \ud050\ub97c \uc5f4\uc5c8\uc2b5\ub2c8\ub2e4.",
        openedRejectedQueue: "\uc0ac\uc804\uc810\uac80 \ubc14\ub85c\uac00\uae30\ub85c \uac70\uc808 \uc2e0\uace0 \ud050\ub97c \uc5f4\uc5c8\uc2b5\ub2c8\ub2e4."
      }
      : {
        openedPendingQueue: "Opened pending submissions queue from preflight shortcut.",
        openedRejectedQueue: "Opened rejected submissions queue from preflight shortcut."
      };
  const bearerToken = isProductionRuntime ? (supabaseSession?.accessToken ?? "") : "";
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
  const hasFilteredSubmissionEmptyState = useMemo(
    () =>
      Boolean(
        submissionListSummary &&
          submissionListSummary.totalCount > 0 &&
          submissionListSummary.filteredCount === 0
      ),
    [submissionListSummary]
  );
  const activeSubmissionFiltersSummary = useMemo(
    () =>
      buildActiveSubmissionFiltersSummary({
        copy,
        submissionStatusFilter,
        submissionAckStatusFilter,
        submissionValidationStatusFilter,
        submissionTransportFilter,
        submissionSettlementHashFilter,
        submissionSearch,
        submissionSortBy,
        submissionSortDirection
      }),
    [
      copy,
      submissionAckStatusFilter,
      submissionSearch,
      submissionSettlementHashFilter,
      submissionSortBy,
      submissionSortDirection,
      submissionStatusFilter,
      submissionTransportFilter,
      submissionValidationStatusFilter
    ]
  );

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
      year: parseRequiredInt(year, copy.yearLabel, copy.statusFieldMustBeNonNegativeInteger),
      employeeId: employeeId.trim(),
      nonTaxableAnnualIncomeKrw: parseRequiredInt(
        nonTaxableAnnualIncomeKrw,
        copy.nonTaxableAnnualIncomeLabel,
        copy.statusFieldMustBeNonNegativeInteger
      ),
      additionalTaxCreditKrw: parseRequiredInt(
        additionalTaxCreditKrw,
        copy.additionalTaxCreditLabel,
        copy.statusFieldMustBeNonNegativeInteger
      ),
      annualIncomeTaxRate: parseRate(
        annualIncomeTaxRate,
        copy.annualIncomeTaxRateLabel,
        copy.statusFieldRateBetweenZeroAndOne
      ),
      localIncomeTaxRate: parseRate(
        localIncomeTaxRate,
        copy.localIncomeTaxRateLabel,
        copy.statusFieldRateBetweenZeroAndOne
      ),
      deductionItems: {
        personalPensionKrw: parseRequiredInt(
          personalPensionKrw,
          copy.personalPensionLabel,
          copy.statusFieldMustBeNonNegativeInteger
        ),
        insurancePremiumKrw: parseRequiredInt(
          insurancePremiumKrw,
          copy.insurancePremiumLabel,
          copy.statusFieldMustBeNonNegativeInteger
        ),
        medicalExpenseKrw: parseRequiredInt(
          medicalExpenseKrw,
          copy.medicalExpenseLabel,
          copy.statusFieldMustBeNonNegativeInteger
        ),
        educationExpenseKrw: parseRequiredInt(
          educationExpenseKrw,
          copy.educationExpenseLabel,
          copy.statusFieldMustBeNonNegativeInteger
        ),
        donationKrw: parseRequiredInt(
          donationKrw,
          copy.donationLabel,
          copy.statusFieldMustBeNonNegativeInteger
        ),
        housingSavingsKrw: parseRequiredInt(
          housingSavingsKrw,
          copy.housingSavingsLabel,
          copy.statusFieldMustBeNonNegativeInteger
        )
      },
      apply,
      finalizedByNote: finalizedByNote.trim() || undefined
    };
  }

  function appendLog(label: string, response: Pick<Response, "status" | "ok">) {
    setLogs((prev) => appendApiLogEntry(prev, { label, status: response.status, ok: response.ok, runtimeLocale }));
  }

  function recordFailure(
    action: PayrollYearEndFilingFailureAction,
    actionLabel: string,
    status: number | null,
    bodyOrMessage?: unknown,
    submissionId: string | null = null
  ) {
    const detail =
      typeof bodyOrMessage === "string"
        ? bodyOrMessage.trim() || null
        : extractApiErrorMessage(bodyOrMessage);
    const message = buildRequestFailureStatusMessage(copy, status, detail);
    setStatusMessage(message);
    setLastFailure({
      action,
      actionLabel,
      status,
      message,
      occurredAt: new Date().toLocaleString(runtimeLocale),
      submissionId
    });
  }

  function clearFailure() {
    setLastFailure(null);
  }

  async function runFinalization(apply: boolean) {
    const action = apply ? "finalization_apply" : "finalization_preview";
    const actionLabel = apply ? copy.logFinalizeSettlement : copy.logPreviewFinalization;
    try {
      setPendingLabel(apply ? copy.pendingFinalizationApply : copy.pendingFinalizationPreview);
      const response = await fetch("/api/payroll/year-end/finalize-settlement", {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify(buildFinalizePayload(apply))
      });
      const body = (await response.json()) as PayrollYearEndFinalizationResponse | { error: string };
      appendLog(actionLabel, response);
      if (!response.ok || "error" in body) {
        recordFailure(action, actionLabel, response.status, body);
        return;
      }
      clearFailure();
      setFinalization(body);
      setExpectedExportSettlementHash(body.settlement.settlementHash);
      setExpectedAckSettlementHash(body.settlement.settlementHash);
      setStatusMessage(
        body.settlement.finalized
          ? `${copy.statusFinalizedPrefix} ${body.settlement.finalizationId}`
          : copy.statusPreviewLoaded
      );
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (error) {
      recordFailure(action, actionLabel, null, error instanceof Error ? error.message : copy.statusInvalidInput);
    } finally {
      setPendingLabel(null);
    }
  }

  async function runLoadPreflightChecklist() {
    const action: PayrollYearEndFilingFailureAction = "preflight_checklist";
    const actionLabel = locale === "ko" ? "연말정산 사전점검 조회" : "year-end preflight checklist";
    const blockedLabel = locale === "ko" ? "사전점검 미통과" : "preflight blocked";
    try {
      setPendingLabel(actionLabel);
      const requestYear = parseRequiredInt(year, copy.yearLabel, copy.statusFieldMustBeNonNegativeInteger);
      const requestNonTaxableAnnualIncomeKrw = parseRequiredInt(
        nonTaxableAnnualIncomeKrw,
        copy.nonTaxableAnnualIncomeLabel,
        copy.statusFieldMustBeNonNegativeInteger
      );
      const query = new URLSearchParams({
        year: String(requestYear),
        employeeId: employeeId.trim(),
        nonTaxableAnnualIncomeKrw: String(requestNonTaxableAnnualIncomeKrw)
      });
      const response = await fetch(`/api/payroll/year-end/preflight-checklist?${query.toString()}`, {
        method: "GET",
        headers: buildHeaders()
      });
      const body = (await response.json()) as PayrollYearEndPreflightChecklistResponse | { error: string };
      appendLog(actionLabel, response);
      if (!response.ok || "error" in body) {
        recordFailure(action, actionLabel, response.status, body);
        return;
      }
      clearFailure();
      setPreflightChecklist(body);
      const message = body.checklist.summary.readyToFinalize
        ? copy.statusPreviewLoaded
        : `${blockedLabel} (${body.checklist.summary.failCount})`;
      setStatusMessage(message);
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (error) {
      recordFailure(action, actionLabel, null, error instanceof Error ? error.message : copy.statusInvalidInput);
    } finally {
      setPendingLabel(null);
    }
  }

  async function runFilingExport() {
    const action: PayrollYearEndFilingFailureAction = "filing_export";
    const actionLabel = copy.logExportFilingData;
    try {
      setPendingLabel(copy.pendingFilingExport);
      const payload = {
        year: parseRequiredInt(year, copy.yearLabel, copy.statusFieldMustBeNonNegativeInteger),
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
      appendLog(actionLabel, response);
      if (!response.ok || "error" in body) {
        recordFailure(action, actionLabel, response.status, body);
        return;
      }
      clearFailure();
      setFilingExport(body);
      setStatusMessage(
        `${copy.statusExportedPrefix} ${body.filingData.records.length} (${body.filingData.validation.status})`
      );
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (error) {
      recordFailure(action, actionLabel, null, error instanceof Error ? error.message : copy.statusInvalidInput);
    } finally {
      setPendingLabel(null);
    }
  }

  async function runSubmitFilingPackage() {
    const action: PayrollYearEndFilingFailureAction = "filing_submit";
    const actionLabel = copy.logSubmitFilingPackage;
    try {
      setPendingLabel(copy.pendingSubmitPackage);
      const payload = buildSubmitFilingPackagePayload({
        year: parseRequiredInt(year, copy.yearLabel, copy.statusFieldMustBeNonNegativeInteger),
        employeeId,
        format: exportFormat,
        validationMode,
        expectedSettlementHash: expectedExportSettlementHash,
        transport: submissionTransport,
        submissionNote
      });
      const response = await fetch("/api/payroll/year-end/filing-submissions", {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify(payload)
      });
      const body = (await response.json()) as PayrollYearEndFilingSubmissionResponse | { error: string };
      appendLog(actionLabel, response);
      if (!response.ok || "error" in body) {
        recordFailure(action, actionLabel, response.status, body);
        return;
      }
      clearFailure();
      setSubmissions((prev) => upsertSubmissionAtTop(prev, body.submission));
      setAckSubmissionId(body.submission.submissionId);
      setCancelSubmissionId(body.submission.submissionId);
      setStatusMessage(`${copy.statusSubmittedPrefix} ${body.submission.submissionId}`);
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (error) {
      recordFailure(action, actionLabel, null, error instanceof Error ? error.message : copy.statusInvalidInput);
    } finally {
      setPendingLabel(null);
    }
  }

  async function runRefreshSubmissions(settlementHashFilterOverride?: string) {
    const action: PayrollYearEndFilingFailureAction = "submissions_refresh";
    const actionLabel = copy.logListFilingSubmissions;
    try {
      setPendingLabel(copy.pendingListSubmissions);
      const requestYear = parseRequiredInt(year, copy.yearLabel, copy.statusFieldMustBeNonNegativeInteger);
      const requestEmployeeId = employeeId.trim();
      const query = buildFilingSubmissionListQuery({
        year: requestYear,
        employeeId: requestEmployeeId,
        submissionStatusFilter,
        submissionAckStatusFilter,
        submissionValidationStatusFilter,
        submissionTransportFilter,
        submissionSettlementHashFilter: settlementHashFilterOverride ?? submissionSettlementHashFilter,
        submissionSearch,
        submissionSortBy,
        submissionSortDirection
      });
      const response = await fetch(
        `/api/payroll/year-end/filing-submissions?${query.toString()}`,
        {
          method: "GET",
          headers: buildHeaders()
        }
      );
      const body = (await response.json()) as PayrollYearEndFilingSubmissionListResponse | { error: string };
      appendLog(actionLabel, response);
      if (!response.ok || "error" in body) {
        recordFailure(action, actionLabel, response.status, body);
        return;
      }
      clearFailure();
      setSubmissionListSummary(body.summary);
      setSubmissions(body.submissions);
      setStatusMessage(
        `${copy.statusLoadedSubmissionsPrefix} ${body.submissions.length}/${body.summary.totalCount}`
      );
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (error) {
      recordFailure(action, actionLabel, null, error instanceof Error ? error.message : copy.statusInvalidInput);
    } finally {
      setPendingLabel(null);
    }
  }

  function runOpenPendingSubmissionsFromPreflight() {
    setStatusMessage(shortcutStatusCopy.openedPendingQueue);
    setTimeout(() => setStatusMessage(""), 3000);
    setSubmissionStatusFilter("submitted");
    setSubmissionAckStatusFilter("all");
    setSubmissionValidationStatusFilter("all");
    setSubmissionTransportFilter("all");
    setSubmissionSettlementHashFilter("");
    setSubmissionSearch("");
    setSubmissionSortBy("submittedAt");
    setSubmissionSortDirection("desc");
    setTimeout(() => void runRefreshSubmissions(), 0);
  }

  function runOpenRejectedSubmissionsFromPreflight() {
    setStatusMessage(shortcutStatusCopy.openedRejectedQueue);
    setTimeout(() => setStatusMessage(""), 3000);
    setSubmissionStatusFilter("acknowledged");
    setSubmissionAckStatusFilter("rejected");
    setSubmissionValidationStatusFilter("all");
    setSubmissionTransportFilter("all");
    setSubmissionSettlementHashFilter("");
    setSubmissionSearch("");
    setSubmissionSortBy("submittedAt");
    setSubmissionSortDirection("desc");
    setTimeout(() => void runRefreshSubmissions(), 0);
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
    const action: PayrollYearEndFilingFailureAction = "ack_catalog_load";
    const actionLabel = copy.logListAckCatalog;
    try {
      setPendingLabel(copy.pendingAckCatalog);
      const response = await fetch("/api/payroll/year-end/filing-ack-catalog", {
        method: "GET",
        headers: buildHeaders()
      });
      const body = (await response.json()) as PayrollYearEndFilingAckCatalogResponse | { error: string };
      appendLog(actionLabel, response);
      if (!response.ok || "error" in body) {
        recordFailure(action, actionLabel, response.status, body);
        return;
      }
      clearFailure();
      setAckCatalog(body);
      setStatusMessage(
        `${copy.statusLoadedAckCatalogPrefix} (${body.acceptedCodes.length}/${body.rejectedCodes.length}/${body.rejectionReasons.length})`
      );
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (error) {
      recordFailure(action, actionLabel, null, error instanceof Error ? error.message : copy.statusInvalidInput);
    } finally {
      setPendingLabel(null);
    }
  }

  async function runAcknowledgeSubmission(
    submissionIdOverride?: string,
    ackStatusOverride?: "accepted" | "rejected"
  ) {
    const action: PayrollYearEndFilingFailureAction = "submission_ack";
    const actionLabel = copy.logAcknowledgeSubmission;
    const submissionId = (submissionIdOverride ?? ackSubmissionId).trim();
    if (!submissionId) {
      setStatusMessage(copy.statusAckSubmissionIdRequired);
      return;
    }

    try {
      setPendingLabel(copy.pendingAckSubmission);
      const requestAckStatus = ackStatusOverride ?? ackStatus;
      const requestAckCode =
        requestAckStatus === "accepted" && ackStatusOverride === "accepted"
          ? ackCatalog?.acceptedCodes[0]?.code ?? "ACK-OK"
          : ackCode.trim() || undefined;
      const payload = buildAcknowledgeSubmissionPayload({
        year: parseRequiredInt(year, copy.yearLabel, copy.statusFieldMustBeNonNegativeInteger),
        employeeId,
        expectedSettlementHash: expectedAckSettlementHash,
        ackStatus: requestAckStatus,
        ackCode: requestAckCode,
        ackNote,
        rejectionReasonCode,
        rejectionReasonDetail
      });
      const response = await fetch(
        `/api/payroll/year-end/filing-submissions/${encodeURIComponent(submissionId)}/ack`,
        {
          method: "POST",
          headers: buildHeaders(),
          body: JSON.stringify(payload)
        }
      );
      const body = (await response.json()) as PayrollYearEndFilingSubmissionResponse | { error: string };
      appendLog(actionLabel, response);
      if (!response.ok || "error" in body) {
        recordFailure(action, actionLabel, response.status, body, submissionId);
        return;
      }
      clearFailure();
      setSubmissions((prev) => replaceSubmissionById(prev, body.submission));
      setAckSubmissionId(body.submission.submissionId);
      setCancelSubmissionId(body.submission.submissionId);
      if (body.submission.ack?.ackStatus === "rejected") {
        setResubmitSubmissionId(body.submission.submissionId);
      }
      setStatusMessage(`${copy.statusAcknowledgedPrefix} ${body.submission.submissionId}`);
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (error) {
      recordFailure(action, actionLabel, null, error instanceof Error ? error.message : copy.statusInvalidInput, submissionId);
    } finally {
      setPendingLabel(null);
    }
  }

  async function runResubmitSubmission(submissionIdOverride?: string) {
    const action: PayrollYearEndFilingFailureAction = "submission_resubmit";
    const actionLabel = copy.logResubmitSubmission;
    const submissionId = (submissionIdOverride ?? resubmitSubmissionId).trim();
    if (!submissionId) {
      setStatusMessage(copy.statusResubmitSubmissionIdRequired);
      return;
    }

    try {
      setPendingLabel(copy.pendingResubmitSubmission);
      const payload = buildResubmitSubmissionPayload({
        year: parseRequiredInt(year, copy.yearLabel, copy.statusFieldMustBeNonNegativeInteger),
        employeeId,
        format: exportFormat,
        validationMode,
        expectedSettlementHash: expectedExportSettlementHash,
        transport: submissionTransport,
        submissionNote,
        resubmissionReason
      });
      const response = await fetch(
        `/api/payroll/year-end/filing-submissions/${encodeURIComponent(submissionId)}/resubmit`,
        {
          method: "POST",
          headers: buildHeaders(),
          body: JSON.stringify(payload)
        }
      );
      const body = (await response.json()) as PayrollYearEndFilingSubmissionResponse | { error: string };
      appendLog(actionLabel, response);
      if (!response.ok || "error" in body) {
        recordFailure(action, actionLabel, response.status, body, submissionId);
        return;
      }
      clearFailure();
      setSubmissions((prev) => upsertSubmissionAtTop(prev, body.submission));
      setAckSubmissionId(body.submission.submissionId);
      setCancelSubmissionId(body.submission.submissionId);
      setResubmitSubmissionId(body.submission.submissionId);
      setStatusMessage(`${copy.statusResubmittedPrefix} ${body.submission.submissionId}`);
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (error) {
      recordFailure(action, actionLabel, null, error instanceof Error ? error.message : copy.statusInvalidInput, submissionId);
    } finally {
      setPendingLabel(null);
    }
  }

  async function runCancelSubmission(submissionIdOverride?: string) {
    const action: PayrollYearEndFilingFailureAction = "submission_cancel";
    const actionLabel = copy.logCancelSubmission;
    const submissionId = (submissionIdOverride ?? cancelSubmissionId).trim();
    if (!submissionId) {
      setStatusMessage(copy.statusCancelSubmissionIdRequired);
      return;
    }

    try {
      setPendingLabel(copy.pendingCancelSubmission);
      const payload = {
        year: parseRequiredInt(year, copy.yearLabel, copy.statusFieldMustBeNonNegativeInteger),
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
      appendLog(actionLabel, response);
      if (!response.ok || "error" in body) {
        recordFailure(action, actionLabel, response.status, body, submissionId);
        return;
      }
      clearFailure();
      setSubmissions((prev) => replaceSubmissionById(prev, body.submission));
      setReopenSubmissionId(body.submission.submissionId);
      setStatusMessage(`${copy.statusCanceledPrefix} ${body.submission.submissionId}`);
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (error) {
      recordFailure(action, actionLabel, null, error instanceof Error ? error.message : copy.statusInvalidInput, submissionId);
    } finally {
      setPendingLabel(null);
    }
  }

  async function runReopenSubmission(submissionIdOverride?: string) {
    const action: PayrollYearEndFilingFailureAction = "submission_reopen";
    const actionLabel = copy.logReopenSubmission;
    const submissionId = (submissionIdOverride ?? reopenSubmissionId).trim();
    if (!submissionId) {
      setStatusMessage(copy.statusReopenSubmissionIdRequired);
      return;
    }

    try {
      setPendingLabel(copy.pendingReopenSubmission);
      const payload = {
        year: parseRequiredInt(year, copy.yearLabel, copy.statusFieldMustBeNonNegativeInteger),
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
      appendLog(actionLabel, response);
      if (!response.ok || "error" in body) {
        recordFailure(action, actionLabel, response.status, body, submissionId);
        return;
      }
      clearFailure();
      setSubmissions((prev) => replaceSubmissionById(prev, body.submission));
      setCancelSubmissionId(body.submission.submissionId);
      setAckSubmissionId(body.submission.submissionId);
      setStatusMessage(`${copy.statusReopenedPrefix} ${body.submission.submissionId}`);
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (error) {
      recordFailure(action, actionLabel, null, error instanceof Error ? error.message : copy.statusInvalidInput, submissionId);
    } finally {
      setPendingLabel(null);
    }
  }

  async function runLoadSubmissionTimeline(submissionIdOverride?: string) {
    const action: PayrollYearEndFilingFailureAction = "submission_timeline";
    const actionLabel = copy.logListSubmissionTimeline;
    const submissionId = (submissionIdOverride ?? timelineSubmissionId).trim();
    if (!submissionId) {
      setStatusMessage(copy.statusTimelineSubmissionIdRequired);
      return;
    }

    try {
      setPendingLabel(copy.pendingLoadTimeline);
      const requestYear = parseRequiredInt(year, copy.yearLabel, copy.statusFieldMustBeNonNegativeInteger);
      const requestEmployeeId = employeeId.trim();
      const response = await fetch(
        `/api/payroll/year-end/filing-submissions/${encodeURIComponent(submissionId)}/timeline?year=${requestYear}&employeeId=${encodeURIComponent(requestEmployeeId)}`,
        {
          method: "GET",
          headers: buildHeaders()
        }
      );
      const body = (await response.json()) as PayrollYearEndFilingSubmissionTimelineResponse | { error: string };
      appendLog(actionLabel, response);
      if (!response.ok || "error" in body) {
        recordFailure(action, actionLabel, response.status, body, submissionId);
        return;
      }
      clearFailure();
      setTimelineSubmissionId(submissionId);
      setTimelineEntries(body.timeline);
      setSubmissions((prev) => replaceSubmissionById(prev, body.submission));
      setStatusMessage(`${copy.statusLoadedTimelinePrefix} ${body.timeline.length}`);
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (error) {
      recordFailure(action, actionLabel, null, error instanceof Error ? error.message : copy.statusInvalidInput, submissionId);
    } finally {
      setPendingLabel(null);
    }
  }

  async function runAddEvidenceNote(submissionIdOverride?: string) {
    const action: PayrollYearEndFilingFailureAction = "evidence_note_add";
    const actionLabel = copy.logAddEvidenceNote;
    const submissionId = (submissionIdOverride ?? timelineSubmissionId).trim();
    if (!submissionId) {
      setStatusMessage(copy.statusTimelineSubmissionIdRequiredForEvidence);
      return;
    }

    try {
      setPendingLabel(copy.pendingAddEvidence);
      const payload = {
        year: parseRequiredInt(year, copy.yearLabel, copy.statusFieldMustBeNonNegativeInteger),
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
      appendLog(actionLabel, response);
      if (!response.ok || "error" in body) {
        recordFailure(action, actionLabel, response.status, body, submissionId);
        return;
      }
      clearFailure();
      setStatusMessage(`${copy.statusAddedEvidencePrefix} ${body.evidenceNote.submissionId}`);
      await runLoadSubmissionTimeline(submissionId);
    } catch (error) {
      recordFailure(action, actionLabel, null, error instanceof Error ? error.message : copy.statusInvalidInput, submissionId);
    } finally {
      setPendingLabel(null);
    }
  }

  async function retryLastFailureAction() {
    if (!lastFailure) return;
    const submissionId = lastFailure.submissionId ?? undefined;
    switch (lastFailure.action) {
      case "preflight_checklist": return runLoadPreflightChecklist();
      case "finalization_preview": return runFinalization(false);
      case "finalization_apply": return runFinalization(true);
      case "filing_export": return runFilingExport();
      case "filing_submit": return runSubmitFilingPackage();
      case "submissions_refresh": return runRefreshSubmissions();
      case "ack_catalog_load": return runLoadAckCatalog();
      case "submission_ack": return runAcknowledgeSubmission(submissionId);
      case "submission_resubmit": return runResubmitSubmission(submissionId);
      case "submission_cancel": return runCancelSubmission(submissionId);
      case "submission_reopen": return runReopenSubmission(submissionId);
      case "submission_timeline": return runLoadSubmissionTimeline(submissionId);
      case "evidence_note_add":
        if (submissionId) setTimelineSubmissionId(submissionId);
        return runAddEvidenceNote(submissionId);
    }
  }

  return (
    <main className="saas-content">
      <header className="hero">
        <p className="eyebrow">{copy.heroEyebrow}</p>
        <h1>{copy.title}</h1>
        <p>{copy.description}</p>
      </header>

        <section className="panel-grid">
          <article className="panel">
            <h2>{copy.inputTitle}</h2>
            {showDevTools ? (
              <p className="small muted">
                {locale === "ko" ? "세션 조직" : "Session organization"}: <code>{organizationId || "-"}</code> /{" "}
                {locale === "ko" ? "세션 액터" : "Session actor"}: <code>{adminActorId || "-"}</code>
              </p>
            ) : null}
            <div className="input-grid">
            <label>{copy.yearLabel}<input value={year} onChange={(event) => setYear(event.target.value)} /></label>
            <label>{copy.employeeIdLabel}<input value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} /></label>
            <label>{copy.nonTaxableAnnualIncomeLabel}<input value={nonTaxableAnnualIncomeKrw} onChange={(event) => setNonTaxableAnnualIncomeKrw(event.target.value)} /></label>
            <label>{copy.additionalTaxCreditLabel}<input value={additionalTaxCreditKrw} onChange={(event) => setAdditionalTaxCreditKrw(event.target.value)} /></label>
            <label>{copy.annualIncomeTaxRateLabel}<input value={annualIncomeTaxRate} onChange={(event) => setAnnualIncomeTaxRate(event.target.value)} /></label>
            <label>{copy.localIncomeTaxRateLabel}<input value={localIncomeTaxRate} onChange={(event) => setLocalIncomeTaxRate(event.target.value)} /></label>
            <label>{copy.personalPensionLabel}<input value={personalPensionKrw} onChange={(event) => setPersonalPensionKrw(event.target.value)} /></label>
            <label>{copy.insurancePremiumLabel}<input value={insurancePremiumKrw} onChange={(event) => setInsurancePremiumKrw(event.target.value)} /></label>
            <label>{copy.medicalExpenseLabel}<input value={medicalExpenseKrw} onChange={(event) => setMedicalExpenseKrw(event.target.value)} /></label>
            <label>{copy.educationExpenseLabel}<input value={educationExpenseKrw} onChange={(event) => setEducationExpenseKrw(event.target.value)} /></label>
            <label>{copy.donationLabel}<input value={donationKrw} onChange={(event) => setDonationKrw(event.target.value)} /></label>
            <label>{copy.housingSavingsLabel}<input value={housingSavingsKrw} onChange={(event) => setHousingSavingsKrw(event.target.value)} /></label>
            <label>{copy.exportFormatLabel}
              <select
                value={exportFormat}
                onChange={(event) =>
                  setExportFormat(event.target.value as "json" | "csv" | "jsonl" | "hometax_csv")
                }
              >
                <option value="json">{copy.exportFormatOptionLabels.json}</option>
                <option value="csv">{copy.exportFormatOptionLabels.csv}</option>
                <option value="jsonl">{copy.exportFormatOptionLabels.jsonl}</option>
                <option value="hometax_csv">{copy.exportFormatOptionLabels.hometax_csv}</option>
              </select>
            </label>
            <label>{copy.validationModeLabel}
              <select value={validationMode} onChange={(event) => setValidationMode(event.target.value as "basic" | "strict")}>
                <option value="basic">{copy.validationModeOptionLabels.basic}</option>
                <option value="strict">{copy.validationModeOptionLabels.strict}</option>
              </select>
            </label>
            <label>{copy.submissionTransportLabel}
              <select
                value={submissionTransport}
                onChange={(event) =>
                  setSubmissionTransport(
                    event.target.value as "manual_portal" | "hometax_upload" | "nts_api_mock"
                  )
                }
              >
                <option value="manual_portal">{copy.submissionTransportOptionLabels.manual_portal}</option>
                <option value="hometax_upload">{copy.submissionTransportOptionLabels.hometax_upload}</option>
                <option value="nts_api_mock">{copy.submissionTransportOptionLabels.nts_api_mock}</option>
              </select>
            </label>
            <label>{copy.submissionStatusFilterLabel}
              <select
                value={submissionStatusFilter}
                onChange={(event) =>
                  setSubmissionStatusFilter(
                    event.target.value as PayrollYearEndFilingSubmissionStatusFilter
                  )
                }
              >
                <option value="all">{copy.submissionStatusOptionLabels.all}</option>
                <option value="submitted">{copy.submissionStatusOptionLabels.submitted}</option>
                <option value="acknowledged">{copy.submissionStatusOptionLabels.acknowledged}</option>
                <option value="canceled">{copy.submissionStatusOptionLabels.canceled}</option>
              </select>
            </label>
            <label>{copy.ackStatusFilterLabel}
              <select
                value={submissionAckStatusFilter}
                onChange={(event) =>
                  setSubmissionAckStatusFilter(
                    event.target.value as PayrollYearEndFilingSubmissionAckStatusFilter
                  )
                }
              >
                <option value="all">{copy.ackStatusOptionLabels.all}</option>
                <option value="accepted">{copy.ackStatusOptionLabels.accepted}</option>
                <option value="rejected">{copy.ackStatusOptionLabels.rejected}</option>
                <option value="none">{copy.ackStatusOptionLabels.none}</option>
              </select>
            </label>
            <label>{copy.validationStatusFilterLabel}
              <select
                value={submissionValidationStatusFilter}
                onChange={(event) =>
                  setSubmissionValidationStatusFilter(
                    event.target.value as PayrollYearEndFilingSubmissionValidationStatusFilter
                  )
                }
              >
                <option value="all">{copy.validationStatusOptionLabels.all}</option>
                <option value="pass">{copy.validationStatusOptionLabels.pass}</option>
                <option value="fail">{copy.validationStatusOptionLabels.fail}</option>
              </select>
            </label>
            <label>{copy.transportFilterLabel}
              <select
                value={submissionTransportFilter}
                onChange={(event) =>
                  setSubmissionTransportFilter(
                    event.target.value as PayrollYearEndFilingSubmissionTransportFilter
                  )
                }
              >
                <option value="all">{copy.submissionTransportOptionLabels.all}</option>
                <option value="manual_portal">{copy.submissionTransportOptionLabels.manual_portal}</option>
                <option value="hometax_upload">{copy.submissionTransportOptionLabels.hometax_upload}</option>
                <option value="nts_api_mock">{copy.submissionTransportOptionLabels.nts_api_mock}</option>
              </select>
            </label>
            <label>{copy.submissionSearchLabel}
              <input
                value={submissionSearch}
                onChange={(event) => setSubmissionSearch(event.target.value)}
                placeholder={copy.submissionSearchPlaceholder}
              />
            </label>
            <label>{copy.settlementHashFilterLabel}
              <input
                value={submissionSettlementHashFilter}
                onChange={(event) => setSubmissionSettlementHashFilter(event.target.value)}
                placeholder={copy.settlementHashFilterPlaceholder}
              />
            </label>
            <label>{copy.submissionSortByLabel}
              <select
                value={submissionSortBy}
                onChange={(event) =>
                  setSubmissionSortBy(event.target.value as PayrollYearEndFilingSubmissionSortBy)
                }
              >
                <option value="submittedAt">{copy.submissionSortByOptionLabels.submittedAt}</option>
                <option value="attempt">{copy.submissionSortByOptionLabels.attempt}</option>
                <option value="status">{copy.submissionSortByOptionLabels.status}</option>
                <option value="ackStatus">{copy.submissionSortByOptionLabels.ackStatus}</option>
                <option value="validationStatus">{copy.submissionSortByOptionLabels.validationStatus}</option>
                <option value="transport">{copy.submissionSortByOptionLabels.transport}</option>
              </select>
            </label>
            <label>{copy.submissionSortDirectionLabel}
              <select
                value={submissionSortDirection}
                onChange={(event) =>
                  setSubmissionSortDirection(
                    event.target.value as PayrollYearEndFilingSubmissionSortDirection
                  )
                }
              >
                <option value="desc">{copy.submissionSortDirectionOptionLabels.desc}</option>
                <option value="asc">{copy.submissionSortDirectionOptionLabels.asc}</option>
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
                {copy.clearHashFilterAction}
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
                  {copy.hashPrefixLabel}:{chip}
                </button>
              ))}
            </div>
          ) : null}
          <label>{copy.finalizationNoteLabel}<input value={finalizedByNote} onChange={(event) => setFinalizedByNote(event.target.value)} /></label>
          <label>{copy.expectedSettlementHashExportLabel}
            <input
              value={expectedExportSettlementHash}
              onChange={(event) => setExpectedExportSettlementHash(event.target.value)}
              placeholder={copy.expectedSettlementHashPlaceholder}
            />
          </label>
          <label>{copy.expectedSettlementHashAckLabel}
            <input
              value={expectedAckSettlementHash}
              onChange={(event) => setExpectedAckSettlementHash(event.target.value)}
              placeholder={copy.expectedSettlementHashPlaceholder}
            />
          </label>
          <label>{copy.submissionNoteLabel}<input value={submissionNote} onChange={(event) => setSubmissionNote(event.target.value)} /></label>
          <label>{copy.ackSubmissionIdLabel}<input value={ackSubmissionId} onChange={(event) => setAckSubmissionId(event.target.value)} /></label>
          <label>{copy.ackStatusLabel}
            <select value={ackStatus} onChange={(event) => setAckStatus(event.target.value as "accepted" | "rejected")}>
              <option value="accepted">{copy.ackStatusOptionLabels.accepted}</option>
              <option value="rejected">{copy.ackStatusOptionLabels.rejected}</option>
            </select>
          </label>
          <label>{copy.ackCodeLabel}
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
              <label>{copy.rejectionReasonCodeLabel}
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
              <label>{copy.rejectionDetailLabel}<input value={rejectionReasonDetail} onChange={(event) => setRejectionReasonDetail(event.target.value)} /></label>
            </>
          ) : null}
          <label>{copy.ackNoteLabel}<input value={ackNote} onChange={(event) => setAckNote(event.target.value)} /></label>
          <label>{copy.resubmitSubmissionIdLabel}<input value={resubmitSubmissionId} onChange={(event) => setResubmitSubmissionId(event.target.value)} /></label>
          <label>{copy.resubmissionReasonLabel}<input value={resubmissionReason} onChange={(event) => setResubmissionReason(event.target.value)} /></label>
          <label>{copy.cancelSubmissionIdLabel}<input value={cancelSubmissionId} onChange={(event) => setCancelSubmissionId(event.target.value)} /></label>
          <label>{copy.reopenSubmissionIdLabel}<input value={reopenSubmissionId} onChange={(event) => setReopenSubmissionId(event.target.value)} /></label>
          <label>{copy.timelineSubmissionIdLabel}<input value={timelineSubmissionId} onChange={(event) => setTimelineSubmissionId(event.target.value)} /></label>
          <label>{copy.evidenceNoteLabel}<input value={evidenceNote} onChange={(event) => setEvidenceNote(event.target.value)} /></label>
          <div className="panel-actions">
            <button className="btn btn-secondary" onClick={() => void runFinalization(false)} disabled={pendingLabel !== null}>{copy.previewFinalizationAction}</button>
            <button className="btn btn-primary" onClick={() => void runFinalization(true)} disabled={pendingLabel !== null}>{copy.finalizeSettlementAction}</button>
            <button className="btn btn-secondary" onClick={() => void runFilingExport()} disabled={pendingLabel !== null}>{copy.exportFilingDataAction}</button>
            <button className="btn btn-primary" onClick={() => void runSubmitFilingPackage()} disabled={pendingLabel !== null}>{copy.submitFilingPackageAction}</button>
            <button className="btn btn-secondary" onClick={() => void runAcknowledgeSubmission()} disabled={pendingLabel !== null}>{copy.acknowledgeSubmissionAction}</button>
            <button className="btn btn-secondary" onClick={() => void runResubmitSubmission()} disabled={pendingLabel !== null}>{copy.resubmitSubmissionAction}</button>
            <button className="btn btn-secondary" onClick={() => void runCancelSubmission()} disabled={pendingLabel !== null}>{copy.cancelSubmissionAction}</button>
            <button className="btn btn-secondary" onClick={() => void runReopenSubmission()} disabled={pendingLabel !== null}>{copy.reopenSubmissionAction}</button>
            <button className="btn btn-secondary" onClick={() => void runRefreshSubmissions()} disabled={pendingLabel !== null}>{copy.refreshSubmissionsAction}</button>
            <button className="btn btn-secondary" onClick={resetSubmissionFilters} disabled={pendingLabel !== null}>{copy.resetFiltersAction}</button>
            <button className="btn btn-secondary" onClick={() => void runLoadAckCatalog()} disabled={pendingLabel !== null}>{copy.loadAckCatalogAction}</button>
            <button className="btn btn-secondary" onClick={() => void runLoadSubmissionTimeline()} disabled={pendingLabel !== null}>{copy.loadSubmissionTimelineAction}</button>
            <button className="btn btn-secondary" onClick={() => void runAddEvidenceNote()} disabled={pendingLabel !== null}>{copy.addEvidenceNoteAction}</button>
          </div>
          {statusMessage ? <p className="small">{statusMessage}</p> : null}
          {supabaseSessionError ? <p className="small fail">{copy.sessionErrorPrefix}: {supabaseSessionError}</p> : null}
        </article>

        <FilingSettlementSummaryPanels
          copy={copy}
          runtimeLocale={runtimeLocale}
          finalization={finalization}
          filingExport={filingExport}
        />

        <FilingPreflightBlockerPanel
          locale={locale}
          runtimeLocale={runtimeLocale}
          checklist={preflightChecklist}
          copy={copy}
          disabled={pendingLabel !== null}
          onLoadChecklist={() => void runLoadPreflightChecklist()}
          onOpenPendingSubmissions={runOpenPendingSubmissionsFromPreflight}
          onOpenRejectedSubmissions={runOpenRejectedSubmissionsFromPreflight}
          onPreviewFinalization={() => void runFinalization(false)}
          onClearChecklist={() => setPreflightChecklist(null)}
        />

        {showDevTools ? (
          <FilingApiLogsPanel
            copy={copy}
            stats={stats}
            pendingLabel={pendingLabel}
            logs={logs}
          />
        ) : null}

        {lastFailure ? (
          <FilingFailureActionPanel
            locale={locale}
            copy={copy}
            failure={lastFailure}
            disabled={pendingLabel !== null}
            onRetry={() => void retryLastFailureAction()}
            onRefreshSubmissions={() => void runRefreshSubmissions()}
            onLoadPreflightChecklist={() => void runLoadPreflightChecklist()}
            onOpenRejectedSubmissions={runOpenRejectedSubmissionsFromPreflight}
            onLoadAckCatalog={() => void runLoadAckCatalog()}
            onClear={clearFailure}
          />
        ) : null}

        <article className="panel">
          <h2>{copy.filingSubmissionsPanelTitle}</h2>
          {!submissionListSummary ? (
            <p className="small">{copy.noSubmissionSummaryYet}</p>
          ) : (
            <ul className="simple-list">
              <li><span>{copy.totalFilteredLabel}</span><strong>{submissionListSummary.totalCount} / {submissionListSummary.filteredCount}</strong></li>
              <li><span>{copy.statusSummaryLabel}</span><strong>{copy.submissionStatusOptionLabels.submitted} {submissionListSummary.statusCounts.submitted} / {copy.submissionStatusOptionLabels.acknowledged} {submissionListSummary.statusCounts.acknowledged} / {copy.submissionStatusOptionLabels.canceled} {submissionListSummary.statusCounts.canceled}</strong></li>
              <li><span>{copy.ackStatusSummaryLabel}</span><strong>{copy.ackStatusOptionLabels.accepted} {submissionListSummary.ackStatusCounts.accepted} / {copy.ackStatusOptionLabels.rejected} {submissionListSummary.ackStatusCounts.rejected} / {copy.ackStatusOptionLabels.none} {submissionListSummary.ackStatusCounts.none}</strong></li>
              <li><span>{copy.validationSummaryLabel}</span><strong>{copy.validationStatusOptionLabels.pass} {submissionListSummary.validationStatusCounts.pass} / {copy.validationStatusOptionLabels.fail} {submissionListSummary.validationStatusCounts.fail}</strong></li>
              <li><span>{copy.transportSummaryLabel}</span><strong>{copy.transportShortManualLabel} {submissionListSummary.transportCounts.manual_portal} / {copy.transportShortHometaxLabel} {submissionListSummary.transportCounts.hometax_upload} / {copy.transportShortNtsApiMockLabel} {submissionListSummary.transportCounts.nts_api_mock}</strong></li>
              <li><span>{copy.activeFiltersLabel}</span><strong>{activeSubmissionFiltersSummary}</strong></li>
            </ul>
          )}
          {submissions.length === 0 ? <p className="small">{hasFilteredSubmissionEmptyState ? copy.noSubmissionMatchesFilters : copy.noFilingSubmissionYet}</p> : (
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
                    {copy.submissionStatusBadgeLabels[submission.status] ?? submission.status}
                  </span>{" "}
                  {submission.submissionId} / {copy.timelineAttemptLabel} {submission.attempt} / {copy.submissionTransportOptionLabels[submission.transport] ?? submission.transport} / {copy.exportFormatOptionLabels[submission.format] ?? submission.format} / {copy.validationModeOptionLabels[submission.validationMode] ?? submission.validationMode}
                  {submission.settlementHash ? ` / ${copy.hashPrefixLabel} ${submission.settlementHash.slice(0, 12)}...` : ""}
                  {submission.resubmissionOfSubmissionId ? ` / ${copy.resubmissionOfLabel} ${submission.resubmissionOfSubmissionId}` : ""}
                  {submission.ack
                    ? ` / ${copy.timelineAckPrefix} ${copy.ackStatusOptionLabels[submission.ack.ackStatus] ?? submission.ack.ackStatus}${submission.ack.ackCode ? `:${submission.ack.ackCode}` : ""}${
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
                          {copy.quickAckAcceptedAction}
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={() => {
                            void runCancelSubmission(submission.submissionId);
                          }}
                          disabled={pendingLabel !== null}
                        >
                          {copy.quickCancelAction}
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
                        {copy.quickResubmitAction}
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
                        {copy.quickReopenAction}
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
                      {copy.timelineAction}
                    </button>
                  </div>
                  <time>{new Date(submission.submittedAt).toLocaleString(runtimeLocale)}</time>
                </li>
              ))}
            </ul>
          )}
        </article>

        <FilingSubmissionTimelinePanel
          copy={copy}
          runtimeLocale={runtimeLocale}
          timelineEntries={timelineEntries}
        />
      </section>
    </main>
  );
}
