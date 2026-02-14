import { createEmployeeSchema, listEmployeesQuerySchema } from "@/features/people/schemas";
import { createEmployee, listEmployees } from "@/features/people/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = listEmployeesQuerySchema.safeParse({
    active: url.searchParams.get("active") ?? undefined,
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

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid JSON body");
  }

  const parsed = createEmployeeSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  try {
    const employee = await createEmployee(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      {
        id: parsed.data.id,
        organizationId: parsed.data.organizationId ?? null,
        name: parsed.data.name ?? null,
        email: parsed.data.email ?? null,
        active: parsed.data.active
      }
    );
    return ok({ employee }, 201);
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}

