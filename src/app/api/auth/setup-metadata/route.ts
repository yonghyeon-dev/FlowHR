import { z } from "zod";

import { personalDataConsentTypes, recordPersonalDataConsents } from "@/features/auth/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { fail, ok } from "@/lib/http";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const metadataRoles = ["admin", "manager", "employee", "payroll_operator"] as const;
type MetadataRole = (typeof metadataRoles)[number];

const setupMetadataSchema = z
  .object({
    role: z.enum(metadataRoles).optional(),
    organization_id: z.string().min(1).optional(),
    organizationId: z.string().min(1).optional(),
    actor_id: z.string().min(1).optional(),
    actorId: z.string().min(1).optional(),
    consentVersion: z.string().min(1).max(64).optional(),
    consentTypes: z.array(z.enum(personalDataConsentTypes)).max(2).optional()
  })
  .superRefine((value, context) => {
    if (!value.role) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "role is required",
        path: ["role"]
      });
    }

    if (!value.organization_id && !value.organizationId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "organization_id is required",
        path: ["organization_id"]
      });
    }
  });

type AuthenticatedSupabaseUser = {
  id: string;
  email: string | null;
  appMetadata: Record<string, unknown>;
};

function readBearerToken(request: Request): string | null {
  const raw = request.headers.get("authorization")?.trim() ?? "";
  if (!raw) {
    return null;
  }

  const [scheme, token] = raw.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token?.trim()) {
    return null;
  }

  return token.trim();
}

function readString(source: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = source[key];
    if (typeof value !== "string") {
      continue;
    }
    const normalized = value.trim();
    if (normalized.length > 0) {
      return normalized;
    }
  }
  return null;
}

function toRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return { ...(value as Record<string, unknown>) };
}

function readClientIpAddress(request: Request): string | null {
  const keys = ["x-forwarded-for", "x-real-ip", "cf-connecting-ip", "x-client-ip"];
  for (const key of keys) {
    const raw = request.headers.get(key)?.trim() ?? "";
    if (!raw) {
      continue;
    }
    const first = raw.split(",")[0]?.trim() ?? "";
    if (first) {
      return first.slice(0, 64);
    }
  }
  return null;
}

function normalizeEmail(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

async function readAuthenticatedUser(request: Request): Promise<AuthenticatedSupabaseUser | null> {
  const accessToken = readBearerToken(request);
  if (!accessToken) {
    return null;
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
  if (error || !data.user) {
    return null;
  }

  return {
    id: data.user.id,
    email: data.user.email ?? null,
    appMetadata: toRecord(data.user.app_metadata)
  };
}

async function verifyActorIdOwnership(input: {
  actorId: string;
  organizationId: string;
  authenticatedEmail: string | null;
}): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const dataAccess = getRuntimeDataAccess();
  const employee = await dataAccess.employees.findById(input.actorId);
  if (!employee) {
    return {
      ok: false,
      status: 400,
      error: "actor_id employee not found"
    };
  }

  if ((employee.organizationId ?? "") !== input.organizationId) {
    return {
      ok: false,
      status: 403,
      error: "actor_id does not belong to organization"
    };
  }

  const employeeEmail = normalizeEmail(employee.email ?? null);
  const authenticatedEmail = normalizeEmail(input.authenticatedEmail);
  if (!employeeEmail || !authenticatedEmail || employeeEmail !== authenticatedEmail) {
    return {
      ok: false,
      status: 403,
      error: "actor_id verification failed"
    };
  }

  return { ok: true };
}

async function resolveActorIdByEmail(input: {
  organizationId: string;
  authenticatedEmail: string | null;
}): Promise<string | null> {
  const normalizedEmail = normalizeEmail(input.authenticatedEmail);
  if (!normalizedEmail) {
    return null;
  }

  const dataAccess = getRuntimeDataAccess();
  const employees = await dataAccess.employees.list({
    organizationId: input.organizationId
  });
  const matches = employees.filter((employee) => normalizeEmail(employee.email ?? null) === normalizedEmail);
  if (matches.length !== 1) {
    return null;
  }
  return matches[0].id;
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid JSON body");
  }

  const parsed = setupMetadataSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  const role = parsed.data.role as MetadataRole;
  const organizationId = (parsed.data.organization_id ?? parsed.data.organizationId ?? "").trim();
  const providedActorId = (parsed.data.actor_id ?? parsed.data.actorId ?? "").trim() || null;
  const consentVersion = parsed.data.consentVersion?.trim() ?? "";
  const consentTypes = parsed.data.consentTypes ?? [];

  const authenticatedUser = await readAuthenticatedUser(request);
  if (!authenticatedUser) {
    return fail(401, "missing or invalid actor context");
  }

  if (consentVersion && consentTypes.length > 0) {
    try {
      await recordPersonalDataConsents({
        userId: authenticatedUser.id,
        consentTypes,
        version: consentVersion,
        ipAddress: readClientIpAddress(request)
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "failed to record personal data consent";
      return fail(500, message);
    }
  }

  if (providedActorId) {
    const ownership = await verifyActorIdOwnership({
      actorId: providedActorId,
      organizationId,
      authenticatedEmail: authenticatedUser.email
    });
    if (!ownership.ok) {
      return fail(ownership.status, ownership.error);
    }
  }

  const currentRole = readString(authenticatedUser.appMetadata, "role");
  const currentOrganizationId = readString(authenticatedUser.appMetadata, "organization_id", "organizationId");
  const currentActorId = readString(
    authenticatedUser.appMetadata,
    "actor_id",
    "employee_id",
    "actorId",
    "employeeId"
  );

  const inferredActorId =
    providedActorId ??
    currentActorId ??
    (await resolveActorIdByEmail({
      organizationId,
      authenticatedEmail: authenticatedUser.email
    }));

  const isAlreadyConfigured =
    currentRole === role &&
    currentOrganizationId === organizationId &&
    (inferredActorId ? currentActorId === inferredActorId : true);

  if (isAlreadyConfigured) {
    return ok({
      skipped: true,
      metadata: {
        role: currentRole,
        organization_id: currentOrganizationId,
        actor_id: currentActorId
      }
    });
  }

  const nextAppMetadata: Record<string, unknown> = {
    ...authenticatedUser.appMetadata,
    role,
    organization_id: organizationId
  };
  if (inferredActorId) {
    nextAppMetadata.actor_id = inferredActorId;
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin.auth.admin.updateUserById(authenticatedUser.id, {
    app_metadata: nextAppMetadata
  });
  if (error) {
    return fail(502, "supabase user metadata update failed", {
      message: error.message ?? "unknown error"
    });
  }

  return ok({
    skipped: false,
    metadata: {
      role,
      organization_id: organizationId,
      actor_id: inferredActorId
    }
  });
}
