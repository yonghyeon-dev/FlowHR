import {
  createContractDocumentSchema,
  listContractDocumentsQuerySchema
} from "@/features/contracts/schemas";
import {
  createContractDocument,
  listContractDocuments
} from "@/features/contracts/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

function parseOptionalInt(value: string | null): number | undefined {
  if (value === null) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : undefined;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = listContractDocumentsQuerySchema.safeParse({
    organizationId: url.searchParams.get("organizationId") ?? undefined,
    employeeId: url.searchParams.get("employeeId") ?? undefined,
    templateId: url.searchParams.get("templateId") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    approvalStatus: url.searchParams.get("approvalStatus") ?? undefined,
    expiresWithinDays: parseOptionalInt(url.searchParams.get("expiresWithinDays"))
  });

  if (!parsed.success) {
    return fail(400, "invalid query", parsed.error.flatten());
  }

  try {
    const result = await listContractDocuments(
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

  const parsed = createContractDocumentSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  try {
    const result = await createContractDocument(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      {
        organizationId: parsed.data.organizationId,
        templateId: parsed.data.templateId,
        employeeId: parsed.data.employeeId,
        title: parsed.data.title,
        expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined,
        requiresApproval: parsed.data.requiresApproval
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
