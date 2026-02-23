import { decideContractDocumentApprovalSchema } from "@/features/contracts/schemas";
import { decideContractDocumentApproval } from "@/features/contracts/service";
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

  const parsed = decideContractDocumentApprovalSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  try {
    const result = await decideContractDocumentApproval(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      documentId,
      {
        action: parsed.data.action,
        decidedAt: parsed.data.decidedAt ? new Date(parsed.data.decidedAt) : undefined
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
