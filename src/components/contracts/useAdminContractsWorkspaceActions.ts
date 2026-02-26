import { useCallback, useEffect, useState } from "react";

import { resolveContractDocumentActionRequest } from "@/components/contracts/action-payloads";
import { type AdminContractsCopy, type ContractCategory } from "@/components/contracts/copy";
import {
  normalizeContractsErrorMessageForRuntime,
  readJson
} from "@/components/contracts/http";
import type {
  AdminContractDocument as ContractDocument,
  ContractDocumentAction,
  ContractTemplate
} from "@/components/contracts/types";
import { formatEmployeeIdForLocaleDisplay } from "@/lib/i18n/employee-id-locale";
import { type FlowLocale } from "@/lib/i18n/locales";

type UseAdminContractsWorkspaceActionsInput = {
  copy: AdminContractsCopy;
  locale: FlowLocale;
  templateName: string;
  templateCategory: ContractCategory;
  templateBody: string;
  normalizedEmployeeIdForApi: string;
  actionLabelByAction: Record<ContractDocumentAction, string>;
};

export function useAdminContractsWorkspaceActions({
  copy,
  locale,
  templateName,
  templateCategory,
  templateBody,
  normalizedEmployeeIdForApi,
  actionLabelByAction
}: UseAdminContractsWorkspaceActionsInput) {
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [documents, setDocuments] = useState<ContractDocument[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const selectedTemplateId = templates[0]?.id ?? "";

  const reload = useCallback(async () => {
    setError(null);
    const [templateBodyRaw, documentBodyRaw] = await Promise.all([
      fetch("/api/contracts/templates", { cache: "no-store" }).then((response) =>
        readJson(response, copy.loadError)
      ),
      fetch("/api/contracts/documents", { cache: "no-store" }).then((response) =>
        readJson(response, copy.loadError)
      )
    ]);
    setTemplates((templateBodyRaw as { templates?: ContractTemplate[] }).templates ?? []);
    setDocuments((documentBodyRaw as { documents?: ContractDocument[] }).documents ?? []);
  }, [copy.loadError]);

  useEffect(() => {
    reload().catch((loadError) => {
      setError(
        loadError instanceof Error
          ? normalizeContractsErrorMessageForRuntime(loadError.message, copy.loadError)
          : copy.loadError
      );
    });
  }, [copy.loadError, reload]);

  const submitTemplate = useCallback(async () => {
    setError(null);
    setMessage(null);
    try {
      await fetch("/api/contracts/templates", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: templateName,
          category: templateCategory,
          body: templateBody,
          status: "DRAFT"
        })
      }).then((response) => readJson(response, copy.templateCreateError));
      setMessage(copy.templateCreatedMessage);
      await reload();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? normalizeContractsErrorMessageForRuntime(submitError.message, copy.templateCreateError)
          : copy.templateCreateError
      );
    }
  }, [
    copy.templateCreateError,
    copy.templateCreatedMessage,
    reload,
    templateBody,
    templateCategory,
    templateName
  ]);

  const createDraftDocument = useCallback(async () => {
    if (!selectedTemplateId || normalizedEmployeeIdForApi.length === 0) {
      setError(copy.requiredTemplateAndEmployeeError);
      return;
    }
    setError(null);
    setMessage(null);
    try {
      await fetch("/api/contracts/documents", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplateId,
          employeeId: normalizedEmployeeIdForApi,
          title: `${copy.draftTitlePrefix} ${formatEmployeeIdForLocaleDisplay(normalizedEmployeeIdForApi, locale)}`,
          requiresApproval: true
        })
      }).then((response) => readJson(response, copy.draftCreateError));
      setMessage(copy.draftCreatedMessage);
      await reload();
    } catch (createError) {
      setError(
        createError instanceof Error
          ? normalizeContractsErrorMessageForRuntime(createError.message, copy.draftCreateError)
          : copy.draftCreateError
      );
    }
  }, [
    copy.draftCreateError,
    copy.draftCreatedMessage,
    copy.draftTitlePrefix,
    copy.requiredTemplateAndEmployeeError,
    locale,
    normalizedEmployeeIdForApi,
    reload,
    selectedTemplateId
  ]);

  const runDocumentAction = useCallback(
    async (documentId: string, action: ContractDocumentAction) => {
      setError(null);
      setMessage(null);
      const request = resolveContractDocumentActionRequest(
        documentId,
        action,
        copy.manualExpireReason
      );
      try {
        await fetch(request.endpoint, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(request.payload)
        }).then((response) =>
          readJson(response, `${copy.actionFailedPrefix}: ${actionLabelByAction[action]}`)
        );
        setMessage(`${copy.actionCompletedPrefix}: ${actionLabelByAction[action]}`);
        await reload();
      } catch (actionError) {
        setError(
          actionError instanceof Error
            ? normalizeContractsErrorMessageForRuntime(
                actionError.message,
                `${copy.actionFailedPrefix}: ${actionLabelByAction[action]}`
              )
            : `${copy.actionFailedPrefix}: ${actionLabelByAction[action]}`
        );
      }
    },
    [
      actionLabelByAction,
      copy.actionCompletedPrefix,
      copy.actionFailedPrefix,
      copy.manualExpireReason,
      reload
    ]
  );

  return {
    templates,
    selectedTemplateId,
    documents,
    message,
    error,
    submitTemplate,
    createDraftDocument,
    runDocumentAction
  };
}
