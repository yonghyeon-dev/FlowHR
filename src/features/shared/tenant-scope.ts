import type { Actor } from "@/lib/actor";
import { requireTenantScope } from "@/lib/tenancy";
import type { DataAccess, EmployeeEntity } from "@/features/shared/data-access";
import { requireEmployeeExists } from "@/features/shared/require-employee";
import { ServiceError } from "@/features/shared/service-error";

export function resolveTenantScope(actor: Actor | null): string | null {
  return requireTenantScope(actor);
}

export function ensureTenantMatch(
  tenantScope: string | null,
  entityOrganizationId: string | null,
  notFoundMessage: string
) {
  if (!tenantScope) {
    return;
  }
  if (entityOrganizationId !== tenantScope) {
    throw new ServiceError(404, notFoundMessage);
  }
}

export async function requireEmployeeWithinTenant(
  dataAccess: DataAccess,
  actor: Actor | null,
  employeeId: string
): Promise<EmployeeEntity> {
  const employee = await requireEmployeeExists(dataAccess, employeeId);
  const tenantScope = requireTenantScope(actor);
  if (tenantScope && employee.organizationId !== tenantScope) {
    throw new ServiceError(404, "employee not found");
  }
  return employee;
}

