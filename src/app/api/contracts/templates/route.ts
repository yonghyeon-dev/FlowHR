import {
  createContractTemplateSchema,
  listContractTemplatesQuerySchema
} from "@/features/contracts/schemas";
import {
  createContractTemplate,
  listContractTemplates
} from "@/features/contracts/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = listContractTemplatesQuerySchema.safeParse({
    organizationId: url.searchParams.get("organizationId") ?? undefined,
    category: url.searchParams.get("category") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    search: url.searchParams.get("search") ?? undefined
  });
  if (!parsed.success) {
    return fail(400, "invalid query", parsed.error.flatten());
  }

  try {
    const result = await listContractTemplates(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      parsed.data
    );
    return ok(result);
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

  const parsed = createContractTemplateSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  try {
    const result = await createContractTemplate(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      {
        organizationId: parsed.data.organizationId,
        name: parsed.data.name,
        category: parsed.data.category,
        body: parsed.data.body,
        status: parsed.data.status
      }
    );
    return ok(result, 201);
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}
