import { useCallback, type Dispatch, type SetStateAction } from "react";

import {
  normalizeWithholdingDocumentFileName,
  parseRequiredInt,
  type WithholdingReceiptCopy
} from "@/components/withholding-receipt/copy-runtime";
import type {
  ApiLog,
  FinalizedYearEndSettlementResponse,
  WithholdingReceiptDocumentResponse,
  WithholdingReceiptResponse
} from "@/components/withholding-receipt/types";
import { defaultEmployeeIdForApi } from "@/lib/i18n/employee-id-locale";
import { type FlowLocale } from "@/lib/i18n/locales";

type WithholdingRequestMethod = "GET" | "POST";

type RequestConfig = {
  label: string;
  pending: string;
  url: string;
  method: WithholdingRequestMethod;
  body?: Record<string, unknown>;
};

type UseWithholdingReceiptRequestsInput = {
  copy: WithholdingReceiptCopy;
  locale: FlowLocale;
  runtimeLocale: string;
  year: string;
  organizationId: string;
  documentFormat: "json" | "text";
  allowHeaderActorFallback: boolean;
  requiresLoginSession: boolean;
  usesBearerToken: boolean;
  bearerToken: string;
  normalizedEmployeeIdForApi: string;
  setPendingLabel: Dispatch<SetStateAction<string | null>>;
  setStatusMessage: Dispatch<SetStateAction<string>>;
  setLogs: Dispatch<SetStateAction<ApiLog[]>>;
  setReceipt: Dispatch<SetStateAction<WithholdingReceiptResponse | null>>;
  setReceiptDocument: Dispatch<SetStateAction<WithholdingReceiptDocumentResponse | null>>;
  setFinalizedSettlement: Dispatch<SetStateAction<FinalizedYearEndSettlementResponse | null>>;
};

function isErrorPayload(value: unknown): value is { error: string } {
  return typeof value === "object" && value !== null && "error" in value;
}

export function useWithholdingReceiptRequests({
  copy,
  locale,
  runtimeLocale,
  year,
  organizationId,
  documentFormat,
  allowHeaderActorFallback,
  requiresLoginSession,
  usesBearerToken,
  bearerToken,
  normalizedEmployeeIdForApi,
  setPendingLabel,
  setStatusMessage,
  setLogs,
  setReceipt,
  setReceiptDocument,
  setFinalizedSettlement
}: UseWithholdingReceiptRequestsInput) {
  const buildHeaders = useCallback(() => {
    const headers: Record<string, string> = {
      "content-type": "application/json"
    };
    if (usesBearerToken) {
      headers.authorization = `Bearer ${bearerToken}`;
    } else if (allowHeaderActorFallback) {
      headers["x-actor-role"] = "employee";
      headers["x-actor-id"] = normalizedEmployeeIdForApi || defaultEmployeeIdForApi;
      if (organizationId.trim()) {
        headers["x-actor-organization-id"] = organizationId.trim();
      }
    } else {
      throw new Error(copy.productionSessionRequiredNotice);
    }
    return headers;
  }, [
    allowHeaderActorFallback,
    bearerToken,
    copy.productionSessionRequiredNotice,
    normalizedEmployeeIdForApi,
    organizationId,
    usesBearerToken
  ]);

  const appendLog = useCallback(
    (label: string, response: Response) => {
      setLogs((prev) => [
        {
          id: Date.now(),
          label,
          status: response.status,
          ok: response.ok,
          at: new Date().toLocaleString(runtimeLocale)
        },
        ...prev
      ]);
    },
    [runtimeLocale, setLogs]
  );

  const runRequest = useCallback(
    async <T,>({ label, pending, url, method, body }: RequestConfig) => {
      if (requiresLoginSession) {
        setStatusMessage(copy.productionSessionRequiredNotice);
        return null;
      }
      try {
        setPendingLabel(pending);
        const response = await fetch(url, {
          method,
          headers: buildHeaders(),
          body: body ? JSON.stringify(body) : undefined
        });
        const payload = (await response.json()) as T | { error: string };
        appendLog(label, response);
        if (!response.ok || isErrorPayload(payload)) {
          setStatusMessage(copy.requestFailedCheckLogsStatus);
          return null;
        }
        return payload as T;
      } catch {
        setStatusMessage(copy.invalidInputStatus);
        return null;
      } finally {
        setPendingLabel(null);
      }
    },
    [
      appendLog,
      buildHeaders,
      copy.invalidInputStatus,
      copy.productionSessionRequiredNotice,
      copy.requestFailedCheckLogsStatus,
      requiresLoginSession,
      setPendingLabel,
      setStatusMessage
    ]
  );

  const previewReceipt = useCallback(async () => {
    if (!normalizedEmployeeIdForApi) {
      setStatusMessage(copy.invalidInputStatus);
      return;
    }

    let parsedYear: number;
    try {
      parsedYear = parseRequiredInt(year, copy.yearLabel, locale);
    } catch {
      setStatusMessage(copy.invalidInputStatus);
      return;
    }

    const body = await runRequest<WithholdingReceiptResponse>({
      label: copy.logPreviewReceipt,
      pending: copy.pendingReceiptPreview,
      url: "/api/payroll/year-end/withholding-receipts",
      method: "POST",
      body: {
        year: parsedYear,
        employeeId: normalizedEmployeeIdForApi,
        issue: false
      }
    });
    if (!body) {
      return;
    }

    setReceipt(body);
    setStatusMessage(`${copy.loadedReceiptPrefix} ${body.receipt.receiptNumber}`);
    setTimeout(() => setStatusMessage(""), 3000);
  }, [
    copy.invalidInputStatus,
    copy.loadedReceiptPrefix,
    copy.logPreviewReceipt,
    copy.pendingReceiptPreview,
    copy.yearLabel,
    locale,
    normalizedEmployeeIdForApi,
    runRequest,
    setReceipt,
    setStatusMessage,
    year
  ]);

  const loadIssuedDocument = useCallback(async () => {
    if (!normalizedEmployeeIdForApi) {
      setStatusMessage(copy.invalidInputStatus);
      return;
    }

    let parsedYear: number;
    try {
      parsedYear = parseRequiredInt(year, copy.yearLabel, locale);
    } catch {
      setStatusMessage(copy.invalidInputStatus);
      return;
    }

    const query = new URLSearchParams({
      year: String(parsedYear),
      employeeId: normalizedEmployeeIdForApi,
      format: documentFormat
    });
    const body = await runRequest<WithholdingReceiptDocumentResponse>({
      label: copy.logLoadDocument,
      pending: copy.pendingReceiptDocument,
      url: `/api/payroll/year-end/withholding-receipts?${query.toString()}`,
      method: "GET"
    });
    if (!body) {
      return;
    }

    setReceiptDocument(body);
    const normalizedFileName = normalizeWithholdingDocumentFileName(
      body.document.fileName,
      body.document.receiptNumber,
      body.document.format,
      locale
    );
    setStatusMessage(`${copy.loadedDocumentPrefix} ${normalizedFileName}`);
    setTimeout(() => setStatusMessage(""), 3000);
  }, [
    copy.invalidInputStatus,
    copy.loadedDocumentPrefix,
    copy.logLoadDocument,
    copy.pendingReceiptDocument,
    copy.yearLabel,
    documentFormat,
    locale,
    normalizedEmployeeIdForApi,
    runRequest,
    setReceiptDocument,
    setStatusMessage,
    year
  ]);

  const loadFinalizedSettlement = useCallback(async () => {
    if (!normalizedEmployeeIdForApi) {
      setStatusMessage(copy.invalidInputStatus);
      return;
    }

    let parsedYear: number;
    try {
      parsedYear = parseRequiredInt(year, copy.yearLabel, locale);
    } catch {
      setStatusMessage(copy.invalidInputStatus);
      return;
    }

    const query = new URLSearchParams({
      year: String(parsedYear),
      employeeId: normalizedEmployeeIdForApi
    });
    const body = await runRequest<FinalizedYearEndSettlementResponse>({
      label: copy.logLoadFinalizedSettlement,
      pending: copy.pendingFinalizedSettlement,
      url: `/api/payroll/year-end/finalized-settlement?${query.toString()}`,
      method: "GET"
    });
    if (!body) {
      return;
    }

    setFinalizedSettlement(body);
    setStatusMessage(`${copy.loadedFinalizedSettlementPrefix} ${body.settlement.finalizationId}`);
    setTimeout(() => setStatusMessage(""), 3000);
  }, [
    copy.invalidInputStatus,
    copy.loadedFinalizedSettlementPrefix,
    copy.logLoadFinalizedSettlement,
    copy.pendingFinalizedSettlement,
    copy.yearLabel,
    locale,
    normalizedEmployeeIdForApi,
    runRequest,
    setFinalizedSettlement,
    setStatusMessage,
    year
  ]);

  return { previewReceipt, loadIssuedDocument, loadFinalizedSettlement };
}
