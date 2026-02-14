import { listDeductionProfilesQuerySchema } from "@/features/payroll/schemas";
import { listDeductionProfiles } from "@/features/payroll/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

function normalize(value: string | null) {
  if (!value) {
    return undefined;
  }
  return value.trim();
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = listDeductionProfilesQuerySchema.safeParse({
    active: normalize(url.searchParams.get("active")),
    mode: normalize(url.searchParams.get("mode"))
  });

  if (!parsed.success) {
    return fail(400, "invalid query", parsed.error.flatten());
  }

  const active =
    parsed.data.active === undefined ? undefined : parsed.data.active.toLowerCase() === "true";

  try {
    const profiles = await listDeductionProfiles(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      {
        active,
        mode: parsed.data.mode
      }
    );
    return ok({ profiles });
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}

