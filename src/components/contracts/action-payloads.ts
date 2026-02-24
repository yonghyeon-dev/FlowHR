import type { ContractDocumentAction } from "@/components/contracts/types";

export function resolveContractDocumentActionRequest(
  documentId: string,
  action: ContractDocumentAction,
  manualExpireReason: string
) {
  const endpointMap: Record<ContractDocumentAction, string> = {
    request: `/api/contracts/documents/${documentId}/request-approval`,
    approve: `/api/contracts/documents/${documentId}/approval`,
    reject: `/api/contracts/documents/${documentId}/approval`,
    send: `/api/contracts/documents/${documentId}/send`,
    expire: `/api/contracts/documents/${documentId}/expire`,
    renew: `/api/contracts/documents/${documentId}/renew`
  };

  const payloadMap: Record<ContractDocumentAction, Record<string, unknown>> = {
    request: {},
    approve: { action: "APPROVE" },
    reject: { action: "REJECT" },
    send: {},
    expire: { reason: manualExpireReason },
    renew: {}
  };

  return {
    endpoint: endpointMap[action],
    payload: payloadMap[action]
  };
}
