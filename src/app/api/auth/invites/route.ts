import { z } from "zod";

import {
  createAuthInvite,
  inviteDeliveryModes,
  inviteRoles,
  listAuthInvites
} from "@/features/auth/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(inviteRoles).optional(),
  organizationId: z.string().min(1).optional(),
  actorId: z.string().min(1).optional(),
  redirectTo: z.string().url().optional(),
  deliveryMode: z.enum(inviteDeliveryModes).optional()
});

const listInviteQuerySchema = z.object({
  organizationId: z.string().min(1).optional(),
  role: z.enum(inviteRoles).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional()
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = listInviteQuerySchema.safeParse({
    organizationId: url.searchParams.get("organizationId") ?? undefined,
    role: url.searchParams.get("role") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined
  });
  if (!parsed.success) {
    return fail(400, "invalid query", parsed.error.flatten());
  }

  const actor = await readActor(request);
  try {
    const invites = await listAuthInvites(
      {
        actor,
        dataAccess: getRuntimeDataAccess(),
        supabaseAdmin: getSupabaseAdmin()
      },
      {
        organizationId: parsed.data.organizationId,
        role: parsed.data.role,
        limit: parsed.data.limit
      }
    );

    const uniqueEmails = new Set(invites.map((invite) => invite.email));
    return ok({
      invites: invites.map((invite) => ({
        ...invite,
        createdAt: invite.createdAt.toISOString()
      })),
      summary: {
        total: invites.length,
        uniqueEmailCount: uniqueEmails.size
      }
    });
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

  const parsed = inviteSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  const actor = await readActor(request);
  const redirectTo = parsed.data.redirectTo?.trim() || `${new URL(request.url).origin}/login`;

  try {
    const invite = await createAuthInvite(
      {
        actor,
        dataAccess: getRuntimeDataAccess(),
        supabaseAdmin: getSupabaseAdmin()
      },
      {
        email: parsed.data.email,
        role: parsed.data.role,
        organizationId: parsed.data.organizationId,
        actorId: parsed.data.actorId,
        redirectTo,
        deliveryMode: parsed.data.deliveryMode
      }
    );
    return ok({ invite }, 201);
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}
