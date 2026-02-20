import { z } from "zod";

import {
  createAuthInvite,
  inviteDeliveryModes,
  inviteRoles
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
