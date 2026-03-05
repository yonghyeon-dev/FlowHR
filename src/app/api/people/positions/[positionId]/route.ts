import { updatePositionSchema } from "@/features/people/schemas";
import { deletePosition, getPosition, updatePosition } from "@/features/people/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

type RouteContext = {
  params: Promise<{ positionId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { positionId } = await context.params;

  try {
    const position = await getPosition(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      { positionId }
    );
    return ok({ position });
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid JSON body");
  }

  const parsed = updatePositionSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  const { positionId } = await context.params;
  try {
    const position = await updatePosition(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      {
        positionId,
        code: parsed.data.code,
        name: parsed.data.name,
        title: parsed.data.title,
        grade: parsed.data.grade,
        description: parsed.data.description,
        active: parsed.data.active
      }
    );
    return ok({ position });
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const { positionId } = await context.params;

  try {
    const position = await deletePosition(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      { positionId }
    );
    return ok({ position });
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}
