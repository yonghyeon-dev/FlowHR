import { z } from "zod";

import {
  resolveOrganizationLeavePromotionEmailSettings,
  toOrganizationLeavePromotionEmailUpdateInput
} from "@/features/leave/promotion-email-settings";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { fail, ok } from "@/lib/http";

import { requireAdmin } from "../reports/shared";

const leavePromotionEmailSettingsSchema = z
  .object({
    emailTemplate: z
      .object({
        url: z.string().trim().nullable(),
        from: z.string().trim().nullable(),
        defaultTemplateId: z.string().trim().nullable(),
        token: z.string().trim().nullable(),
        clearToken: z.boolean()
      })
      .strict()
  })
  .strict()
  .superRefine((value, ctx) => {
    const url = value.emailTemplate.url?.trim() ?? "";
    const from = value.emailTemplate.from?.trim() ?? "";
    const defaultTemplateId = value.emailTemplate.defaultTemplateId?.trim() ?? "";
    const token = value.emailTemplate.token?.trim() ?? "";

    if (value.emailTemplate.clearToken && token.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["emailTemplate", "token"],
        message: "token cannot be set when clearToken is true"
      });
    }

    if (url.length > 0) {
      const parsed = z.string().url().safeParse(url);
      if (!parsed.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["emailTemplate", "url"],
          message: "email template url must be a valid URL"
        });
      }
    }

    if (from.length > 0) {
      const parsed = z.string().email().safeParse(from);
      if (!parsed.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["emailTemplate", "from"],
          message: "from must be a valid email address"
        });
      }
    }

    if ((url.length > 0 && from.length === 0) || (from.length > 0 && url.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["emailTemplate"],
        message: "url and from must be set together"
      });
    }

    if (defaultTemplateId.includes("\n")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["emailTemplate", "defaultTemplateId"],
        message: "default template id must be a single line"
      });
    }
  });

function toResponse(
  organizationId: string,
  updatedAt: Date,
  payload: ReturnType<typeof resolveOrganizationLeavePromotionEmailSettings>
) {
  return {
    organizationId,
    ...payload,
    updatedAt: updatedAt.toISOString()
  };
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request, "admin.leave_promotion_email_settings");
  if (!auth.ok) {
    return auth.response;
  }

  const organization = await getRuntimeDataAccess().organizations.findById(auth.organizationId);
  if (!organization) {
    return fail(404, "admin.leave_promotion_email_settings.organization_not_found");
  }

  return ok(
    toResponse(
      auth.organizationId,
      organization.updatedAt,
      resolveOrganizationLeavePromotionEmailSettings(organization)
    )
  );
}

export async function PUT(request: Request) {
  const auth = await requireAdmin(request, "admin.leave_promotion_email_settings");
  if (!auth.ok) {
    return auth.response;
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid JSON body");
  }

  const parsed = leavePromotionEmailSettingsSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  const dataAccess = getRuntimeDataAccess();
  const organization = await dataAccess.organizations.findById(auth.organizationId);
  if (!organization) {
    return fail(404, "admin.leave_promotion_email_settings.organization_not_found");
  }

  const updated = await dataAccess.organizations.update(
    auth.organizationId,
    toOrganizationLeavePromotionEmailUpdateInput({
      organization,
      payload: parsed.data
    })
  );

  return ok(
    toResponse(
      auth.organizationId,
      updated.updatedAt,
      resolveOrganizationLeavePromotionEmailSettings(updated)
    )
  );
}
