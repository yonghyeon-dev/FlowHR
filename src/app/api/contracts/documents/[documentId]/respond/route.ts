import { respondContractDocumentSchema } from "@/features/contracts/schemas";
import { respondContractDocument } from "@/features/contracts/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

type RouteContext = {
  params: Promise<{ documentId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { documentId } = await context.params;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid JSON body");
  }

  const parsed = respondContractDocumentSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  try {
    const result = await respondContractDocument(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      documentId,
      {
        action: parsed.data.action,
        comment: parsed.data.comment,
        signatureInput: parsed.data.signatureInput,
        expectedDocumentHash: parsed.data.expectedDocumentHash,
        respondedAt: parsed.data.respondedAt ? new Date(parsed.data.respondedAt) : undefined
      }
    );
    return ok(result);
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}
