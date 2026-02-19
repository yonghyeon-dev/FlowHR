import { updateApprovalLineTemplateSchema } from "@/features/approval/schemas";
import { updateApprovalLineTemplate } from "@/features/approval/service";
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

  const parsed = updateApprovalLineTemplateSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  try {
    const template = await updateApprovalLineTemplate(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      templateId,
      {
        name: parsed.data.name,
        domain: parsed.data.domain,
        approverRoles: parsed.data.approverRoles,
        active: parsed.data.active
      }
    );
    return ok({ template });
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}
