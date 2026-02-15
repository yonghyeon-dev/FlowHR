-- WI-0040: Scheduling baseline (WorkSchedule)

-- CreateTable
CREATE TABLE "WorkSchedule" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "breakMinutes" INTEGER NOT NULL DEFAULT 0,
    "isHoliday" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkSchedule_employeeId_startAt_endAt_idx" ON "WorkSchedule"("employeeId", "startAt", "endAt");

-- AddForeignKey
ALTER TABLE "WorkSchedule" ADD CONSTRAINT "WorkSchedule_employeeId_fkey"
FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Tenant isolation (RLS baseline; depends on WI-0037 helper functions).
ALTER TABLE "WorkSchedule" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "flowhr_work_schedule_select" ON "WorkSchedule";
CREATE POLICY "flowhr_work_schedule_select" ON "WorkSchedule"
FOR SELECT
USING (
  public.flowhr_is_system()
  OR EXISTS (
    SELECT 1
    FROM "Employee" e
    WHERE e."id" = "WorkSchedule"."employeeId"
      AND e."organizationId" = public.flowhr_current_organization_id()
  )
);

DROP POLICY IF EXISTS "flowhr_work_schedule_insert" ON "WorkSchedule";
CREATE POLICY "flowhr_work_schedule_insert" ON "WorkSchedule"
FOR INSERT
WITH CHECK (
  public.flowhr_is_system()
  OR EXISTS (
    SELECT 1
    FROM "Employee" e
    WHERE e."id" = "WorkSchedule"."employeeId"
      AND e."organizationId" = public.flowhr_current_organization_id()
  )
);

DROP POLICY IF EXISTS "flowhr_work_schedule_update" ON "WorkSchedule";
CREATE POLICY "flowhr_work_schedule_update" ON "WorkSchedule"
FOR UPDATE
USING (
  public.flowhr_is_system()
  OR EXISTS (
    SELECT 1
    FROM "Employee" e
    WHERE e."id" = "WorkSchedule"."employeeId"
      AND e."organizationId" = public.flowhr_current_organization_id()
  )
)
WITH CHECK (
  public.flowhr_is_system()
  OR EXISTS (
    SELECT 1
    FROM "Employee" e
    WHERE e."id" = "WorkSchedule"."employeeId"
      AND e."organizationId" = public.flowhr_current_organization_id()
  )
);

DROP POLICY IF EXISTS "flowhr_work_schedule_delete" ON "WorkSchedule";
CREATE POLICY "flowhr_work_schedule_delete" ON "WorkSchedule"
FOR DELETE
USING (
  public.flowhr_is_system()
  OR EXISTS (
    SELECT 1
    FROM "Employee" e
    WHERE e."id" = "WorkSchedule"."employeeId"
      AND e."organizationId" = public.flowhr_current_organization_id()
  )
);

-- RBAC seed: add scheduling permissions to default roles (idempotent).
INSERT INTO "RolePermission" ("roleId", "permission", "createdAt")
VALUES
  ('admin', 'scheduling.schedule.write.any', CURRENT_TIMESTAMP),
  ('admin', 'scheduling.schedule.list.any', CURRENT_TIMESTAMP),
  ('admin', 'scheduling.schedule.list.by_employee', CURRENT_TIMESTAMP),
  ('admin', 'scheduling.schedule.list.own', CURRENT_TIMESTAMP),
  ('system', 'scheduling.schedule.write.any', CURRENT_TIMESTAMP),
  ('system', 'scheduling.schedule.list.any', CURRENT_TIMESTAMP),
  ('system', 'scheduling.schedule.list.by_employee', CURRENT_TIMESTAMP),
  ('system', 'scheduling.schedule.list.own', CURRENT_TIMESTAMP),
  ('manager', 'scheduling.schedule.write.any', CURRENT_TIMESTAMP),
  ('manager', 'scheduling.schedule.list.by_employee', CURRENT_TIMESTAMP),
  ('employee', 'scheduling.schedule.list.own', CURRENT_TIMESTAMP),
  ('payroll_operator', 'scheduling.schedule.list.any', CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;
