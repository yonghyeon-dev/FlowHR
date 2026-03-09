import { z } from "zod";

import {
  resolveOrganizationPayrollFeatureManagementSettings,
  toOrganizationPayrollFeatureManagementUpdateInput
} from "@/features/payroll/feature-management-settings";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { fail, ok } from "@/lib/http";

import { requireAdmin } from "../reports/shared";

const featureModeSchema = z.enum(["default", "enabled", "disabled"]);

const featureManagementSchema = z
  .object({
    payroll: z
      .object({
        deductions: z.object({ mode: featureModeSchema }).strict(),
        deductionProfile: z.object({ mode: featureModeSchema }).strict(),
        krBaseline: z.object({ mode: featureModeSchema }).strict(),
        krInsuranceSettlement: z.object({ mode: featureModeSchema }).strict(),
        closePeriod: z.object({ mode: featureModeSchema }).strict(),
        payslipDelivery: z.object({ mode: featureModeSchema }).strict(),
        yearEnd: z.object({ mode: featureModeSchema }).strict(),
        yearEndDeductionInput: z.object({ mode: featureModeSchema }).strict(),
        yearEndFilingExport: z.object({ mode: featureModeSchema }).strict(),
        yearEndFilingSubmission: z.object({ mode: featureModeSchema }).strict()
      })
      .strict()
  })
  .strict();

function toResponse(
  organizationId: string,
  updatedAt: Date,
  payload: ReturnType<typeof resolveOrganizationPayrollFeatureManagementSettings>
) {
  return {
    organizationId,
    ...payload,
    updatedAt: updatedAt.toISOString()
  };
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request, "admin.feature_management");
  if (!auth.ok) {
    return auth.response;
  }

  const organization = await getRuntimeDataAccess().organizations.findById(auth.organizationId);
  if (!organization) {
    return fail(404, "admin.feature_management.organization_not_found");
  }

  return ok(
    toResponse(
      auth.organizationId,
      organization.updatedAt,
      resolveOrganizationPayrollFeatureManagementSettings(organization)
    )
  );
}

export async function PUT(request: Request) {
  const auth = await requireAdmin(request, "admin.feature_management");
  if (!auth.ok) {
    return auth.response;
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid JSON body");
  }

  const parsed = featureManagementSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  const dataAccess = getRuntimeDataAccess();
  const organization = await dataAccess.organizations.findById(auth.organizationId);
  if (!organization) {
    return fail(404, "admin.feature_management.organization_not_found");
  }

  const updated = await dataAccess.organizations.update(
    auth.organizationId,
    toOrganizationPayrollFeatureManagementUpdateInput(parsed.data)
  );

  return ok(
    toResponse(
      auth.organizationId,
      updated.updatedAt,
      resolveOrganizationPayrollFeatureManagementSettings(updated)
    )
  );
}
