import { listEmployeesQuerySchema } from "@/features/people/schemas";
import { listEmployees } from "@/features/people/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = listEmployeesQuerySchema.safeParse({
    active: url.searchParams.get("active") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    organizationId: url.searchParams.get("organizationId") ?? undefined
  });

  if (!parsed.success) {
    return fail(400, "invalid query", parsed.error.flatten());
  }

  try {
    const employees = await listEmployees(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      {
        active: parsed.data.active,
        status: parsed.data.status,
        organizationId: parsed.data.organizationId
      }
    );
    return ok({ employees });
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}
