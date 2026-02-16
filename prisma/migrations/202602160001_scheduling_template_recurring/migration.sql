-- WI-0044: Scheduling template + recurring assignment baseline

-- CreateTable
CREATE TABLE "WorkScheduleTemplate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,
    "breakMinutes" INTEGER NOT NULL DEFAULT 0,
    "isHoliday" BOOLEAN NOT NULL DEFAULT false,
    "weekdays" INTEGER[] NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkScheduleTemplate_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "WorkScheduleTemplate_startMinute_check" CHECK ("startMinute" >= 0 AND "startMinute" < 1440),
    CONSTRAINT "WorkScheduleTemplate_endMinute_check" CHECK ("endMinute" >= 0 AND "endMinute" < 1440),
    CONSTRAINT "WorkScheduleTemplate_breakMinutes_check" CHECK ("breakMinutes" >= 0 AND "breakMinutes" <= 300),
    CONSTRAINT "WorkScheduleTemplate_start_end_not_equal_check" CHECK ("startMinute" <> "endMinute")
);

-- CreateIndex
CREATE INDEX "WorkScheduleTemplate_organizationId_name_idx" ON "WorkScheduleTemplate"("organizationId", "name");

-- AddForeignKey
ALTER TABLE "WorkScheduleTemplate" ADD CONSTRAINT "WorkScheduleTemplate_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Tenant isolation (RLS baseline; depends on WI-0037 helper functions).
ALTER TABLE "WorkScheduleTemplate" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "flowhr_work_schedule_template_select" ON "WorkScheduleTemplate";
CREATE POLICY "flowhr_work_schedule_template_select" ON "WorkScheduleTemplate"
FOR SELECT
USING (
  public.flowhr_is_system()
  OR "organizationId" = public.flowhr_current_organization_id()
);

DROP POLICY IF EXISTS "flowhr_work_schedule_template_insert" ON "WorkScheduleTemplate";
CREATE POLICY "flowhr_work_schedule_template_insert" ON "WorkScheduleTemplate"
FOR INSERT
WITH CHECK (
  public.flowhr_is_system()
  OR "organizationId" = public.flowhr_current_organization_id()
);

DROP POLICY IF EXISTS "flowhr_work_schedule_template_update" ON "WorkScheduleTemplate";
CREATE POLICY "flowhr_work_schedule_template_update" ON "WorkScheduleTemplate"
FOR UPDATE
USING (
  public.flowhr_is_system()
  OR "organizationId" = public.flowhr_current_organization_id()
)
WITH CHECK (
  public.flowhr_is_system()
  OR "organizationId" = public.flowhr_current_organization_id()
);

DROP POLICY IF EXISTS "flowhr_work_schedule_template_delete" ON "WorkScheduleTemplate";
CREATE POLICY "flowhr_work_schedule_template_delete" ON "WorkScheduleTemplate"
FOR DELETE
USING (
  public.flowhr_is_system()
  OR "organizationId" = public.flowhr_current_organization_id()
);

