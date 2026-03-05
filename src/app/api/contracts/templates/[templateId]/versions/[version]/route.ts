import { contractTemplateVersionPathSchema } from "@/features/contracts/schemas";
import { getContractTemplateVersion } from "@/features/contracts/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

type RouteContext = {
  params: Promise<{ templateId: string; version: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const parsedPath = contractTemplateVersionPathSchema.safeParse(await context.params);
  if (!parsedPath.success) {
    return fail(400, "invalid path", parsedPath.error.flatten());
  }

  try {
    const result = await getContractTemplateVersion(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      parsedPath.data.templateId,
      parsedPath.data.version
    );
    return ok(result);
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}
