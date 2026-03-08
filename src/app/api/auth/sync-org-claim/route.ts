import { z } from "zod";

import { fail, ok } from "@/lib/http";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const syncOrgClaimSchema = z.object({
  organization_id: z.string().min(1).optional(),
  organizationId: z.string().min(1).optional()
});

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

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid JSON body");
  }

  const parsed = syncOrgClaimSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  const organizationId = (parsed.data.organization_id ?? parsed.data.organizationId ?? "").trim();
  if (!organizationId) {
    return fail(400, "organization_id is required");
  }

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
  const currentOrganizationId = readString(appMetadata, "organization_id", "organizationId");
  if (currentOrganizationId && currentOrganizationId !== organizationId) {
    return fail(409, "organization_id already configured");
  }

  if (currentOrganizationId === organizationId) {
    return ok({
      skipped: true,
      organizationId
    });
  }

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(data.user.id, {
    app_metadata: {
      ...appMetadata,
      organization_id: organizationId
    }
  });
  if (updateError) {
    return fail(502, "supabase user metadata update failed", {
      message: updateError.message ?? "unknown error"
    });
  }

  return ok({
    skipped: false,
    organizationId
  });
}
