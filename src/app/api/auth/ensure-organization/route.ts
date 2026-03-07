import { ensureOrganizationRecord } from "@/features/auth/callback-organization-recovery";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { fail, ok } from "@/lib/http";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

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

function readString(source: Record<string, unknown>, ...keys: string[]) {
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

export async function POST(request: Request) {
  const accessToken = readBearerToken(request);
  if (!accessToken) {
    return fail(401, "missing or invalid actor context");
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
  if (error || !data.user) {
    return fail(401, "missing or invalid actor context");
  }

  const appMetadata = toRecord(data.user.app_metadata);
  const userMetadata = toRecord(data.user.user_metadata);
  const organizationId = readString(appMetadata, "organization_id", "organizationId");
  if (!organizationId) {
    return fail(400, "organization_id is required");
  }

  try {
    const organization = await ensureOrganizationRecord({
      dataAccess: getRuntimeDataAccess(),
      organizationId,
      organizationName: readString(userMetadata, "organization_name", "organizationName"),
      email: data.user.email ?? null
    });

    return ok({
      organization: {
        id: organization.id,
        name: organization.name
      }
    });
  } catch (error) {
    return fail(500, error instanceof Error ? error.message : "failed to ensure organization");
  }
}
