import {
  createApprovalLineTemplateSchema,
  listApprovalLineTemplatesQuerySchema
} from "@/features/approval/schemas";
import {
  createApprovalLineTemplate,
  listApprovalLineTemplates
} from "@/features/approval/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

function parseOptionalBoolean(value: string | null): boolean | undefined {
  if (value === null) {
    return undefined;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === "true") {
    return true;
  }
  if (normalized === "false") {
    return false;
  }
  return undefined;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = listApprovalLineTemplatesQuerySchema.safeParse({
    organizationId: url.searchParams.get("organizationId") ?? undefined,
    domain: url.searchParams.get("domain") ?? undefined,
    active: parseOptionalBoolean(url.searchParams.get("active"))
  });
  if (!parsed.success) {
    return fail(400, "invalid query", parsed.error.flatten());
  }

  try {
    const templates = await listApprovalLineTemplates(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      parsed.data
    );
    return ok({ templates });
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

  const parsed = createApprovalLineTemplateSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  try {
    const template = await createApprovalLineTemplate(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      {
        organizationId: parsed.data.organizationId,
        name: parsed.data.name,
        domain: parsed.data.domain,
        approverRoles: parsed.data.approverRoles,
        payrollGrossPayMinKrw: parsed.data.payrollGrossPayMinKrw,
        payrollGrossPayMaxKrw: parsed.data.payrollGrossPayMaxKrw,
        active: parsed.data.active
      }
    );
    return ok({ template }, 201);
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}
