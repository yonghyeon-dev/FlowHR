import { z } from "zod";

import { resolveOrganizationOperatorAlertSettings, toOrganizationOperatorAlertUpdateInput } from "@/features/people/operator-alert-settings";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { fail, ok } from "@/lib/http";

import { requireAdmin } from "../reports/shared";

const operatorAlertsSchema = z
  .object({
    fallbackWebhook: z
      .object({
        url: z.string().trim().nullable(),
        provider: z.enum(["discord", "slack"]).nullable()
      })
      .strict(),
    flows: z
      .object({
        approvalEscalation: z.boolean(),
        leavePromotion: z.boolean()
      })
      .strict()
  })
  .strict()
  .superRefine((value, ctx) => {
    const url = value.fallbackWebhook.url?.trim() ?? "";
    if (url.length === 0 && value.fallbackWebhook.provider !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fallbackWebhook", "provider"],
        message: "provider must be empty when webhook url is empty"
      });
    }
    if (url.length > 0) {
      const urlParsed = z.string().url().safeParse(url);
      if (!urlParsed.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["fallbackWebhook", "url"],
          message: "fallback webhook url must be a valid URL"
        });
      }
      if (value.fallbackWebhook.provider === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["fallbackWebhook", "provider"],
          message: "provider is required when webhook url is set"
        });
      }
    }
  });

function toResponse(organizationId: string, updatedAt: Date, payload: ReturnType<typeof resolveOrganizationOperatorAlertSettings>) {
  return {
    organizationId,
    ...payload,
    updatedAt: updatedAt.toISOString()
  };
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request, "admin.operator_alerts");
  if (!auth.ok) {
    return auth.response;
  }

  const organization = await getRuntimeDataAccess().organizations.findById(auth.organizationId);
  if (!organization) {
    return fail(404, "admin.operator_alerts.organization_not_found");
  }

  return ok(
    toResponse(
      auth.organizationId,
      organization.updatedAt,
      resolveOrganizationOperatorAlertSettings(organization)
    )
  );
}

export async function PUT(request: Request) {
  const auth = await requireAdmin(request, "admin.operator_alerts");
  if (!auth.ok) {
    return auth.response;
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid JSON body");
  }

  const parsed = operatorAlertsSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  const dataAccess = getRuntimeDataAccess();
  const organization = await dataAccess.organizations.findById(auth.organizationId);
  if (!organization) {
    return fail(404, "admin.operator_alerts.organization_not_found");
  }

  const updated = await dataAccess.organizations.update(
    auth.organizationId,
    toOrganizationOperatorAlertUpdateInput(parsed.data)
  );

  return ok(
    toResponse(
      auth.organizationId,
      updated.updatedAt,
      resolveOrganizationOperatorAlertSettings(updated)
    )
  );
}
