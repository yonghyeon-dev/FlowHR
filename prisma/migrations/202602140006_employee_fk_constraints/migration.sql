-- Backfill Employee rows for existing employeeId references before adding FK constraints.
--
-- Note: Employee.updatedAt has no DB default, so we set it explicitly.

INSERT INTO "Employee" ("id", "updatedAt")
SELECT refs.employee_id, CURRENT_TIMESTAMP
FROM (
  SELECT DISTINCT "employeeId" AS employee_id FROM "AttendanceRecord"
  UNION
  SELECT DISTINCT "employeeId" AS employee_id FROM "LeaveRequest"
  UNION
  SELECT DISTINCT "employeeId" AS employee_id FROM "LeaveBalanceProjection"
  UNION
  SELECT DISTINCT "employeeId" AS employee_id FROM "PayrollRun" WHERE "employeeId" IS NOT NULL
) refs
LEFT JOIN "Employee" e ON e."id" = refs.employee_id
WHERE refs.employee_id IS NOT NULL
  AND refs.employee_id <> ''
  AND e."id" IS NULL;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveBalanceProjection" ADD CONSTRAINT "LeaveBalanceProjection_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollRun" ADD CONSTRAINT "PayrollRun_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;