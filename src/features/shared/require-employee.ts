import type { DataAccess, EmployeeEntity } from "@/features/shared/data-access";
import { ServiceError } from "@/features/shared/service-error";

export async function requireEmployeeExists(
  dataAccess: DataAccess,
  employeeId: string
): Promise<EmployeeEntity> {
  const employee = await dataAccess.employees.findById(employeeId);
  if (!employee) {
    throw new ServiceError(404, "employee not found");
  }
  return employee;
}

