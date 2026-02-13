import assert from "node:assert/strict";
import type { Actor } from "../../src/lib/actor.ts";
import { canMutateAttendance, hasAnyRole } from "../../src/lib/permissions.ts";

const admin: Actor = { id: "A-1", role: "admin" };
const manager: Actor = { id: "M-1", role: "manager" };
const employee: Actor = { id: "E-1", role: "employee" };
const otherEmployee: Actor = { id: "E-2", role: "employee" };
const payroll: Actor = { id: "P-1", role: "payroll_operator" };

assert.equal(canMutateAttendance(admin, "E-1"), true, "admin can mutate attendance");
assert.equal(canMutateAttendance(manager, "E-1"), true, "manager can mutate attendance");
assert.equal(canMutateAttendance(employee, "E-1"), true, "employee can mutate own attendance");
assert.equal(
  canMutateAttendance(otherEmployee, "E-1"),
  false,
  "employee cannot mutate another employee attendance"
);

assert.equal(hasAnyRole(payroll, ["admin", "payroll_operator"]), true);
assert.equal(hasAnyRole(employee, ["admin", "payroll_operator"]), false);

console.log("integration.test passed");
