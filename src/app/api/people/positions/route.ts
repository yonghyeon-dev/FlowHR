import { createPositionSchema, listPositionsQuerySchema } from "@/features/people/schemas";
import { createPosition, listPositions } from "@/features/people/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = listPositionsQuerySchema.safeParse({
    active: url.searchParams.get("active") ?? undefined,
    organizationId: url.searchParams.get("organizationId") ?? undefined
  });

  if (!parsed.success) {
    return fail(400, "invalid query", parsed.error.flatten());
  }

  try {
    const positions = await listPositions(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      {
        active: parsed.data.active,
        organizationId: parsed.data.organizationId
      }
    );
    return ok({ positions });
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

  const parsed = createPositionSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  try {
    const position = await createPosition(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      {
        organizationId: parsed.data.organizationId,
        code: parsed.data.code,
        name: parsed.data.name,
        active: parsed.data.active
      }
    );
    return ok({ position }, 201);
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}
