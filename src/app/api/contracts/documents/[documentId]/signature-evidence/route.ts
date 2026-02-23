import { getContractDocumentSignatureEvidenceQuerySchema } from "@/features/contracts/schemas";
import { getContractDocumentSignatureEvidence } from "@/features/contracts/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

export async function GET(
  request: Request,
  context: {
    params: Promise<{
      documentId: string;
    }>;
  }
) {
  const { documentId } = await context.params;
  const url = new URL(request.url);
  const parsed = getContractDocumentSignatureEvidenceQuerySchema.safeParse({
    format: url.searchParams.get("format") ?? undefined
  });
  if (!parsed.success) {
    return fail(400, "invalid query", parsed.error.flatten());
  }

  const actor = await readActor(request);
  const dataAccess = getRuntimeDataAccess();

  try {
    const result = await getContractDocumentSignatureEvidence(
      {
        actor,
        dataAccess
      },
      documentId,
      parsed.data
    );
    return ok(result);
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}
