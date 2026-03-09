import { z } from "zod";

import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import {
  resolveOrganizationNotificationDefaults,
  toOrganizationNotificationDefaultUpdateInput
} from "@/features/people/notification-preferences";
import { fail, ok } from "@/lib/http";

import { requireAdmin } from "../reports/shared";

const notificationDefaultsSchema = z
  .object({
    channels: z.object({
      email: z.boolean(),
      inApp: z.boolean()
    }),
    categories: z.object({
      leave: z.boolean(),
      attendance: z.boolean(),
      payroll: z.boolean()
    })
  })
  .strict();

function toResponse(organizationId: string, updatedAt: Date, payload: ReturnType<typeof resolveOrganizationNotificationDefaults>) {
  return {
    organizationId,
    ...payload,
    updatedAt: updatedAt.toISOString()
  };
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request, "admin.notification_defaults");
  if (!auth.ok) {
    return auth.response;
  }

  const organization = await getRuntimeDataAccess().organizations.findById(auth.organizationId);
  if (!organization) {
    return fail(404, "admin.notification_defaults.organization_not_found");
  }

  return ok(toResponse(auth.organizationId, organization.updatedAt, resolveOrganizationNotificationDefaults(organization)));
}

export async function PUT(request: Request) {
  const auth = await requireAdmin(request, "admin.notification_defaults");
  if (!auth.ok) {
    return auth.response;
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid JSON body");
  }

  const parsed = notificationDefaultsSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  const organization = await getRuntimeDataAccess().organizations.findById(auth.organizationId);
  if (!organization) {
    return fail(404, "admin.notification_defaults.organization_not_found");
  }

  const updated = await getRuntimeDataAccess().organizations.update(
    auth.organizationId,
    toOrganizationNotificationDefaultUpdateInput(parsed.data)
  );

  return ok(toResponse(auth.organizationId, updated.updatedAt, resolveOrganizationNotificationDefaults(updated)));
}
