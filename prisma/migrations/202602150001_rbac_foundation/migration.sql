-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permission")
);

-- CreateIndex
CREATE INDEX "Role_name_idx" ON "Role"("name");

-- CreateIndex
CREATE INDEX "RolePermission_permission_idx" ON "RolePermission"("permission");

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed default roles
INSERT INTO "Role" ("id", "name", "description", "createdAt", "updatedAt")
VALUES
  ('admin', 'Admin', 'Full access role (default)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('manager', 'Manager', 'Manager role (default)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('employee', 'Employee', 'Employee role (default)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('payroll_operator', 'Payroll Operator', 'Payroll operator role (default)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('system', 'System', 'System automation role (default)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Seed default role-permission mappings
INSERT INTO "RolePermission" ("roleId", "permission")
VALUES
  -- RBAC management
  ('admin', 'rbac.manage'),
  ('system', 'rbac.manage'),

  -- People
  ('admin', 'people.organizations.manage'),
  ('admin', 'people.employees.manage'),
  ('system', 'people.organizations.manage'),
  ('system', 'people.employees.manage'),

  -- Attendance
  ('admin', 'attendance.record.write.any'),
  ('admin', 'attendance.record.approve'),
  ('admin', 'attendance.record.reject'),
  ('admin', 'attendance.record.list.any'),
  ('admin', 'attendance.record.list.by_employee'),
  ('admin', 'attendance.record.list.own'),
  ('admin', 'attendance.aggregate.list.any'),
  ('admin', 'attendance.aggregate.list.by_employee'),
  ('admin', 'attendance.aggregate.list.own'),

  ('system', 'attendance.record.write.any'),
  ('system', 'attendance.record.approve'),
  ('system', 'attendance.record.reject'),
  ('system', 'attendance.record.list.any'),
  ('system', 'attendance.record.list.by_employee'),
  ('system', 'attendance.record.list.own'),
  ('system', 'attendance.aggregate.list.any'),
  ('system', 'attendance.aggregate.list.by_employee'),
  ('system', 'attendance.aggregate.list.own'),

  ('manager', 'attendance.record.write.any'),
  ('manager', 'attendance.record.approve'),
  ('manager', 'attendance.record.reject'),
  ('manager', 'attendance.record.list.by_employee'),
  ('manager', 'attendance.aggregate.list.by_employee'),

  ('employee', 'attendance.record.write.own'),
  ('employee', 'attendance.record.list.own'),
  ('employee', 'attendance.aggregate.list.own'),

  ('payroll_operator', 'attendance.record.list.any'),
  ('payroll_operator', 'attendance.aggregate.list.any'),

  -- Leave
  ('admin', 'leave.request.write.any'),
  ('admin', 'leave.request.approve'),
  ('admin', 'leave.request.reject'),
  ('admin', 'leave.request.list.any'),
  ('admin', 'leave.request.list.by_employee'),
  ('admin', 'leave.request.list.own'),
  ('admin', 'leave.balance.read.any'),
  ('admin', 'leave.balance.read.own'),
  ('admin', 'leave.accrual.settle'),

  ('system', 'leave.request.write.any'),
  ('system', 'leave.request.approve'),
  ('system', 'leave.request.reject'),
  ('system', 'leave.request.list.any'),
  ('system', 'leave.request.list.by_employee'),
  ('system', 'leave.request.list.own'),
  ('system', 'leave.balance.read.any'),
  ('system', 'leave.balance.read.own'),
  ('system', 'leave.accrual.settle'),

  ('manager', 'leave.request.write.any'),
  ('manager', 'leave.request.approve'),
  ('manager', 'leave.request.reject'),
  ('manager', 'leave.request.list.by_employee'),
  ('manager', 'leave.balance.read.any'),

  ('employee', 'leave.request.write.own'),
  ('employee', 'leave.request.list.own'),
  ('employee', 'leave.balance.read.own'),

  ('payroll_operator', 'leave.request.list.any'),
  ('payroll_operator', 'leave.balance.read.any'),
  ('payroll_operator', 'leave.accrual.settle'),

  -- Payroll
  ('admin', 'payroll.run.preview'),
  ('admin', 'payroll.run.confirm'),
  ('admin', 'payroll.run.list'),
  ('admin', 'payroll.deduction_profile.read'),
  ('admin', 'payroll.deduction_profile.write'),

  ('system', 'payroll.run.preview'),
  ('system', 'payroll.run.confirm'),
  ('system', 'payroll.run.list'),
  ('system', 'payroll.deduction_profile.read'),
  ('system', 'payroll.deduction_profile.write'),

  ('payroll_operator', 'payroll.run.preview'),
  ('payroll_operator', 'payroll.run.confirm'),
  ('payroll_operator', 'payroll.run.list'),
  ('payroll_operator', 'payroll.deduction_profile.read'),
  ('payroll_operator', 'payroll.deduction_profile.write');

