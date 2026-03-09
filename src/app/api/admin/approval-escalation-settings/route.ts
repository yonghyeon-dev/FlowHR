import { z } from "zod";

import {
  resolveOrganizationApprovalEscalationSettings,
  toOrganizationApprovalEscalationUpdateInput
} from "@/features/approval/escalation-settings";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { fail, ok } from "@/lib/http";

import { requireAdmin } from "../reports/shared";

const approvalEscalationSettingsSchema = z
  .object({
    policy: z
      .object({
        stalledHoursMin: z.number().int().min(1).max(24 * 365),
        limit: z.number().int().min(1).max(500),
        notificationChannel: z.string().trim().min(1).max(100)
      })
      .strict()
  })
  .strict();

function toResponse(
  organizationId: string,
  updatedAt: Date,
  payload: ReturnType<typeof resolveOrganizationApprovalEscalationSettings>
) {
  return {
    organizationId,
    ...payload,
    updatedAt: updatedAt.toISOString()
  };
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request, "admin.approval_escalation_settings");
  if (!auth.ok) {
    return auth.response;
  }

  const organization = await getRuntimeDataAccess().organizations.findById(auth.organizationId);
  if (!organization) {
    return fail(404, "admin.approval_escalation_settings.organization_not_found");
  }

  return ok(
    toResponse(
      auth.organizationId,
      organization.updatedAt,
      resolveOrganizationApprovalEscalationSettings(organization)
    )
  );
}

export async function PUT(request: Request) {
  const auth = await requireAdmin(request, "admin.approval_escalation_settings");
  if (!auth.ok) {
    return auth.response;
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid JSON body");
  }

  const parsed = approvalEscalationSettingsSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  const dataAccess = getRuntimeDataAccess();
  const organization = await dataAccess.organizations.findById(auth.organizationId);
  if (!organization) {
    return fail(404, "admin.approval_escalation_settings.organization_not_found");
  }

  const updated = await dataAccess.organizations.update(
    auth.organizationId,
    toOrganizationApprovalEscalationUpdateInput(parsed.data)
  );

  return ok(
    toResponse(
      auth.organizationId,
      updated.updatedAt,
      resolveOrganizationApprovalEscalationSettings(updated)
    )
  );
}
