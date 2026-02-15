import { listRoles } from "@/features/rbac/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

export async function GET(request: Request) {
  try {
    const roles = await listRoles({
      actor: await readActor(request),
      dataAccess: getRuntimeDataAccess()
    });
    return ok({ roles });
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}

