import { contractTemplatePathSchema } from "@/features/contracts/schemas";
import { listContractTemplateVersions } from "@/features/contracts/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

type RouteContext = {
  params: Promise<{ templateId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const parsedPath = contractTemplatePathSchema.safeParse(await context.params);
  if (!parsedPath.success) {
    return fail(400, "invalid path", parsedPath.error.flatten());
  }

  try {
    const result = await listContractTemplateVersions(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      parsedPath.data.templateId
    );
    return ok(result);
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}
