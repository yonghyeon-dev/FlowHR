import { upsertDeductionProfileSchema } from "@/features/payroll/schemas";
import { readDeductionProfile, upsertDeductionProfile } from "@/features/payroll/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

type RouteContext = {
  params: Promise<{
    profileId: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const actor = await readActor(request);
  const dataAccess = getRuntimeDataAccess();
  const { profileId } = await context.params;

  try {
    const profile = await readDeductionProfile(
      {
        actor,
        dataAccess
      },
      profileId
    );
    return ok({ profile });
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}

export async function PUT(request: Request, context: RouteContext) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid JSON body");
  }

  const parsed = upsertDeductionProfileSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  const actor = await readActor(request);
  const dataAccess = getRuntimeDataAccess();
  const { profileId } = await context.params;

  try {
    const result = await upsertDeductionProfile(
      {
        actor,
        dataAccess
      },
      {
        profileId,
        name: parsed.data.name,
        mode: parsed.data.mode,
        withholdingRate: parsed.data.withholdingRate,
        socialInsuranceRate: parsed.data.socialInsuranceRate,
        fixedOtherDeductionKrw: parsed.data.fixedOtherDeductionKrw,
        active: parsed.data.active
      }
    );
    return ok(result);
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}
