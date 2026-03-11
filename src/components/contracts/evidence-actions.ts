import { toDateText, type EmployeeContractsCopy } from "@/components/contracts/copy";
import { readJson, requireContractsAccessToken } from "@/components/contracts/http";
import { type ContractSignatureEvidenceResponse } from "@/components/contracts/types";

type CopyEvidenceMetadataInput = {
  copy: Pick<
    EmployeeContractsCopy,
    | "evidenceFileLabel"
    | "generatedAtLabel"
    | "contentShaLabel"
    | "copiedEvidenceMetadataStatus"
    | "copyEvidenceMetadataError"
  >;
  evidence: ContractSignatureEvidenceResponse["evidence"];
  displayFileName: string;
  runtimeLocale: string;
};

type LoadContractSignatureEvidenceInput = {
  accessToken: string;
  documentId: string;
  format: "json" | "text";
  evidenceLoadError: string;
};

export function downloadContractEvidence(
  evidence: ContractSignatureEvidenceResponse["evidence"],
  downloadFileName: string
) {
  const blob = new Blob([evidence.content], { type: evidence.contentType });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = downloadFileName;
  window.document.body.appendChild(anchor);
  anchor.click();
  window.document.body.removeChild(anchor);
  URL.revokeObjectURL(objectUrl);
}

export async function copyContractEvidenceMetadata({
  copy,
  evidence,
  displayFileName,
  runtimeLocale
}: CopyEvidenceMetadataInput) {
  const metadataText = [
    `${copy.evidenceFileLabel}: ${displayFileName}`,
    `${copy.generatedAtLabel}: ${toDateText(evidence.generatedAt, runtimeLocale)}`,
    `${copy.contentShaLabel}: ${evidence.contentSha256}`
  ].join("\n");

  try {
    await navigator.clipboard.writeText(metadataText);
    return { error: null, message: copy.copiedEvidenceMetadataStatus };
  } catch {
    return { error: copy.copyEvidenceMetadataError, message: null };
  }
}

export async function loadContractSignatureEvidence({
  accessToken,
  documentId,
  format,
  evidenceLoadError
}: LoadContractSignatureEvidenceInput) {
  const sessionToken = requireContractsAccessToken(accessToken);
  const response = await fetch(`/api/contracts/documents/${documentId}/signature-evidence?format=${format}`, {
    method: "GET",
    headers: { authorization: `Bearer ${sessionToken}` }
  });

  return (await readJson(response, evidenceLoadError)) as ContractSignatureEvidenceResponse;
}
