import { resolvePayrollRuntimeFeatureFlags } from "@/features/payroll/feature-management-settings";
import type { ServiceContext } from "@/features/payroll/service-context-helpers";

export async function loadPayrollRuntimeFeatureFlags(context: ServiceContext) {
  const organizationId = context.actor?.organizationId?.trim() ?? "";
  if (!organizationId) {
    return resolvePayrollRuntimeFeatureFlags(null);
  }

  const organization = await context.dataAccess.organizations.findById(organizationId);
  return resolvePayrollRuntimeFeatureFlags(organization);
}
