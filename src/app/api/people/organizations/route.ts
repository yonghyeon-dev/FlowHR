import { createOrganizationSchema } from "@/features/people/schemas";
import { createOrganization, listOrganizations } from "@/features/people/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

export async function GET(request: Request) {
  try {
    const organizations = await listOrganizations({
      actor: await readActor(request),
      dataAccess: getRuntimeDataAccess()
    });
    return ok({ organizations });
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

  const parsed = createOrganizationSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  try {
    const organization = await createOrganization(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      {
        name: parsed.data.name
      }
    );
    return ok({ organization }, 201);
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}

