import { expireContractDocumentSchema } from "@/features/contracts/schemas";
import { expireContractDocument } from "@/features/contracts/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

type RouteContext = {
  params: Promise<{ documentId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { documentId } = await context.params;

  let payload: unknown = {};
  try {
    payload = (await request.json()) as unknown;
  } catch {
    payload = {};
  }

  const parsed = expireContractDocumentSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  try {
    const result = await expireContractDocument(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      documentId,
      {
        reason: parsed.data.reason,
        expiredAt: parsed.data.expiredAt ? new Date(parsed.data.expiredAt) : undefined
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
