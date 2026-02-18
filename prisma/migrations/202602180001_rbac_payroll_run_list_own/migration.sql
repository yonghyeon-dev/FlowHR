-- Add employee self-service payroll list permission (confirmed-only enforced in service layer).
INSERT INTO "RolePermission" ("roleId", "permission")
VALUES ('employee', 'payroll.run.list.own')
ON CONFLICT DO NOTHING;

