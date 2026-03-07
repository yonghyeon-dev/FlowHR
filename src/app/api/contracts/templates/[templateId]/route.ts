import { updateContractTemplateSchema } from "@/features/contracts/schemas";
import {
  archiveContractTemplate,
  updateContractTemplate
} from "@/features/contracts/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

type RouteContext = {
  params: Promise<{ templateId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { templateId } = await context.params;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid JSON body");
  }

  const parsed = updateContractTemplateSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  try {
    const result = await updateContractTemplate(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      templateId,
      {
        name: parsed.data.name,
        category: parsed.data.category,
        body: parsed.data.body,
        status: parsed.data.status
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

export async function DELETE(request: Request, context: RouteContext) {
  const { templateId } = await context.params;

  try {
    const result = await archiveContractTemplate(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      templateId
    );
    return ok(result);
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}
