import assert from "node:assert/strict";
import type { Actor } from "../../src/lib/actor.ts";
import {
  requireOwnOrAny,
  requirePermission,
  resolveActorPermissions
} from "../../src/lib/permissions.ts";
import { Permissions } from "../../src/lib/rbac.ts";
import { memoryDataAccess, resetMemoryDataAccess } from "../../src/features/shared/memory-data-access.ts";
import { ServiceError } from "../../src/features/shared/service-error.ts";

const admin: Actor = { id: "A-1", role: "admin" };
const manager: Actor = { id: "M-1", role: "manager" };
const employee: Actor = { id: "E-1", role: "employee" };
const otherEmployee: Actor = { id: "E-2", role: "employee" };
const unknown: Actor = { id: "U-1", role: "unknown" as never };

function isServiceErrorWithStatus(status: number) {
  return (error: unknown) => error instanceof ServiceError && error.status === status;
}

async function run() {
  resetMemoryDataAccess();

  // Own vs any permission policy checks.
  await requireOwnOrAny(
    { actor: employee, dataAccess: memoryDataAccess },
    {
      own: Permissions.attendanceRecordWriteOwn,
      any: Permissions.attendanceRecordWriteAny,
      employeeId: "E-1"
    }
  );

  await requireOwnOrAny(
    { actor: manager, dataAccess: memoryDataAccess },
    {
      own: Permissions.attendanceRecordWriteOwn,
      any: Permissions.attendanceRecordWriteAny,
      employeeId: "E-1"
    }
  );

  await requireOwnOrAny(
    { actor: admin, dataAccess: memoryDataAccess },
    {
      own: Permissions.attendanceRecordWriteOwn,
      any: Permissions.attendanceRecordWriteAny,
      employeeId: "E-2"
    }
  );

  await assert.rejects(
    () =>
      requireOwnOrAny(
        { actor: otherEmployee, dataAccess: memoryDataAccess },
        {
          own: Permissions.attendanceRecordWriteOwn,
          any: Permissions.attendanceRecordWriteAny,
          employeeId: "E-1"
        }
      ),
    isServiceErrorWithStatus(403),
    "employee cannot mutate another employee attendance"
  );

  // Permission checks.
  await requirePermission({ actor: admin, dataAccess: memoryDataAccess }, Permissions.rbacManage);

  await assert.rejects(
    () => requirePermission({ actor: unknown, dataAccess: memoryDataAccess }, Permissions.rbacManage),
    isServiceErrorWithStatus(403),
    "unknown role should have no permissions"
  );

  // RBAC-on path should still resolve seeded permissions in memory mode.
  const previousFlag = process.env.FLOWHR_RBAC_V1;
  process.env.FLOWHR_RBAC_V1 = "true";
  try {
    const permissions = await resolveActorPermissions({
      actor: admin,
      dataAccess: memoryDataAccess
    });
    assert.equal(permissions.has(Permissions.rbacManage), true, "admin should resolve rbac.manage");
  } finally {
    if (previousFlag === undefined) {
      delete process.env.FLOWHR_RBAC_V1;
    } else {
      process.env.FLOWHR_RBAC_V1 = previousFlag;
    }
  }

  console.log("integration.test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
