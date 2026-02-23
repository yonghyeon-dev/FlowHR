import { sendContractDocumentSchema } from "@/features/contracts/schemas";
import { sendContractDocument } from "@/features/contracts/service";
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

  const parsed = sendContractDocumentSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  try {
    const result = await sendContractDocument(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      documentId,
      {
        sentAt: parsed.data.sentAt ? new Date(parsed.data.sentAt) : undefined,
        bypassApproval: parsed.data.bypassApproval
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
