-- WI-0037: Multi-tenant isolation baseline (Supabase RLS)
-- Notes:
-- - Policies are written for Supabase JWT context (`auth.jwt()`).
-- - Server-side Prisma connections may bypass RLS if using superuser creds.

-- 1) Add tenant(organization) scoping columns for tenant-owned tables.
ALTER TABLE "PayrollRun" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
ALTER TABLE "DeductionProfile" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

-- 2) Foreign keys and indexes.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PayrollRun_organizationId_fkey'
  ) THEN
    ALTER TABLE "PayrollRun"
      ADD CONSTRAINT "PayrollRun_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'DeductionProfile_organizationId_fkey'
  ) THEN
    ALTER TABLE "DeductionProfile"
      ADD CONSTRAINT "DeductionProfile_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AuditLog_organizationId_fkey'
  ) THEN
    ALTER TABLE "AuditLog"
      ADD CONSTRAINT "AuditLog_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "PayrollRun_organizationId_periodStart_periodEnd_idx"
  ON "PayrollRun"("organizationId", "periodStart", "periodEnd");
CREATE INDEX IF NOT EXISTS "DeductionProfile_organizationId_active_idx"
  ON "DeductionProfile"("organizationId", "active");
CREATE INDEX IF NOT EXISTS "AuditLog_organizationId_createdAt_idx"
  ON "AuditLog"("organizationId", "createdAt");

-- 3) Best-effort backfill for existing data.
UPDATE "PayrollRun" pr
SET "organizationId" = e."organizationId"
FROM "Employee" e
WHERE pr."organizationId" IS NULL
  AND pr."employeeId" IS NOT NULL
  AND e."organizationId" IS NOT NULL
  AND e."id" = pr."employeeId";

UPDATE "AuditLog" al
SET "organizationId" = e."organizationId"
FROM "Employee" e
WHERE al."organizationId" IS NULL
  AND al."actorId" IS NOT NULL
  AND e."organizationId" IS NOT NULL
  AND e."id" = al."actorId";

-- 4) Helper functions to extract tenant context from Supabase JWT.
CREATE OR REPLACE FUNCTION public.flowhr_current_role()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(auth.jwt() -> 'app_metadata' ->> 'role', '');
$$;

CREATE OR REPLACE FUNCTION public.flowhr_current_organization_id()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(auth.jwt() -> 'app_metadata' ->> 'organization_id', '');
$$;

CREATE OR REPLACE FUNCTION public.flowhr_is_system()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT public.flowhr_current_role() = 'system';
$$;

-- 5) Enable RLS and define tenant isolation policies.
ALTER TABLE "Organization" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Employee" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AttendanceRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LeaveRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LeaveApproval" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LeaveBalanceProjection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PayrollRun" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DeductionProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

-- Organization: system can insert; tenant can read/update/delete only its own org.
DROP POLICY IF EXISTS "flowhr_org_select" ON "Organization";
CREATE POLICY "flowhr_org_select" ON "Organization"
FOR SELECT
USING (public.flowhr_is_system() OR "id" = public.flowhr_current_organization_id());

DROP POLICY IF EXISTS "flowhr_org_insert" ON "Organization";
CREATE POLICY "flowhr_org_insert" ON "Organization"
FOR INSERT
WITH CHECK (public.flowhr_is_system());

DROP POLICY IF EXISTS "flowhr_org_update" ON "Organization";
CREATE POLICY "flowhr_org_update" ON "Organization"
FOR UPDATE
USING (public.flowhr_is_system() OR "id" = public.flowhr_current_organization_id())
WITH CHECK (public.flowhr_is_system() OR "id" = public.flowhr_current_organization_id());

DROP POLICY IF EXISTS "flowhr_org_delete" ON "Organization";
CREATE POLICY "flowhr_org_delete" ON "Organization"
FOR DELETE
USING (public.flowhr_is_system() OR "id" = public.flowhr_current_organization_id());

-- Employee: tenant can read/write only within org; system can read/write all.
DROP POLICY IF EXISTS "flowhr_employee_select" ON "Employee";
CREATE POLICY "flowhr_employee_select" ON "Employee"
FOR SELECT
USING (public.flowhr_is_system() OR "organizationId" = public.flowhr_current_organization_id());

DROP POLICY IF EXISTS "flowhr_employee_insert" ON "Employee";
CREATE POLICY "flowhr_employee_insert" ON "Employee"
FOR INSERT
WITH CHECK (public.flowhr_is_system() OR "organizationId" = public.flowhr_current_organization_id());

DROP POLICY IF EXISTS "flowhr_employee_update" ON "Employee";
CREATE POLICY "flowhr_employee_update" ON "Employee"
FOR UPDATE
USING (public.flowhr_is_system() OR "organizationId" = public.flowhr_current_organization_id())
WITH CHECK (public.flowhr_is_system() OR "organizationId" = public.flowhr_current_organization_id());

DROP POLICY IF EXISTS "flowhr_employee_delete" ON "Employee";
CREATE POLICY "flowhr_employee_delete" ON "Employee"
FOR DELETE
USING (public.flowhr_is_system() OR "organizationId" = public.flowhr_current_organization_id());

-- AttendanceRecord: tenant match via Employee join.
DROP POLICY IF EXISTS "flowhr_attendance_select" ON "AttendanceRecord";
CREATE POLICY "flowhr_attendance_select" ON "AttendanceRecord"
FOR SELECT
USING (
  public.flowhr_is_system()
  OR EXISTS (
    SELECT 1
    FROM "Employee" e
    WHERE e."id" = "AttendanceRecord"."employeeId"
      AND e."organizationId" = public.flowhr_current_organization_id()
  )
);

DROP POLICY IF EXISTS "flowhr_attendance_insert" ON "AttendanceRecord";
CREATE POLICY "flowhr_attendance_insert" ON "AttendanceRecord"
FOR INSERT
WITH CHECK (
  public.flowhr_is_system()
  OR EXISTS (
    SELECT 1
    FROM "Employee" e
    WHERE e."id" = "AttendanceRecord"."employeeId"
      AND e."organizationId" = public.flowhr_current_organization_id()
  )
);

DROP POLICY IF EXISTS "flowhr_attendance_update" ON "AttendanceRecord";
CREATE POLICY "flowhr_attendance_update" ON "AttendanceRecord"
FOR UPDATE
USING (
  public.flowhr_is_system()
  OR EXISTS (
    SELECT 1
    FROM "Employee" e
    WHERE e."id" = "AttendanceRecord"."employeeId"
      AND e."organizationId" = public.flowhr_current_organization_id()
  )
)
WITH CHECK (
  public.flowhr_is_system()
  OR EXISTS (
    SELECT 1
    FROM "Employee" e
    WHERE e."id" = "AttendanceRecord"."employeeId"
      AND e."organizationId" = public.flowhr_current_organization_id()
  )
);

DROP POLICY IF EXISTS "flowhr_attendance_delete" ON "AttendanceRecord";
CREATE POLICY "flowhr_attendance_delete" ON "AttendanceRecord"
FOR DELETE
USING (
  public.flowhr_is_system()
  OR EXISTS (
    SELECT 1
    FROM "Employee" e
    WHERE e."id" = "AttendanceRecord"."employeeId"
      AND e."organizationId" = public.flowhr_current_organization_id()
  )
);

-- LeaveRequest: tenant match via Employee join.
DROP POLICY IF EXISTS "flowhr_leave_request_select" ON "LeaveRequest";
CREATE POLICY "flowhr_leave_request_select" ON "LeaveRequest"
FOR SELECT
USING (
  public.flowhr_is_system()
  OR EXISTS (
    SELECT 1
    FROM "Employee" e
    WHERE e."id" = "LeaveRequest"."employeeId"
      AND e."organizationId" = public.flowhr_current_organization_id()
  )
);

DROP POLICY IF EXISTS "flowhr_leave_request_insert" ON "LeaveRequest";
CREATE POLICY "flowhr_leave_request_insert" ON "LeaveRequest"
FOR INSERT
WITH CHECK (
  public.flowhr_is_system()
  OR EXISTS (
    SELECT 1
    FROM "Employee" e
    WHERE e."id" = "LeaveRequest"."employeeId"
      AND e."organizationId" = public.flowhr_current_organization_id()
  )
);

DROP POLICY IF EXISTS "flowhr_leave_request_update" ON "LeaveRequest";
CREATE POLICY "flowhr_leave_request_update" ON "LeaveRequest"
FOR UPDATE
USING (
  public.flowhr_is_system()
  OR EXISTS (
    SELECT 1
    FROM "Employee" e
    WHERE e."id" = "LeaveRequest"."employeeId"
      AND e."organizationId" = public.flowhr_current_organization_id()
  )
)
WITH CHECK (
  public.flowhr_is_system()
  OR EXISTS (
    SELECT 1
    FROM "Employee" e
    WHERE e."id" = "LeaveRequest"."employeeId"
      AND e."organizationId" = public.flowhr_current_organization_id()
  )
);

DROP POLICY IF EXISTS "flowhr_leave_request_delete" ON "LeaveRequest";
CREATE POLICY "flowhr_leave_request_delete" ON "LeaveRequest"
FOR DELETE
USING (
  public.flowhr_is_system()
  OR EXISTS (
    SELECT 1
    FROM "Employee" e
    WHERE e."id" = "LeaveRequest"."employeeId"
      AND e."organizationId" = public.flowhr_current_organization_id()
  )
);

-- LeaveApproval: tenant match via LeaveRequest -> Employee join.
DROP POLICY IF EXISTS "flowhr_leave_approval_select" ON "LeaveApproval";
CREATE POLICY "flowhr_leave_approval_select" ON "LeaveApproval"
FOR SELECT
USING (
  public.flowhr_is_system()
  OR EXISTS (
    SELECT 1
    FROM "LeaveRequest" lr
    JOIN "Employee" e ON e."id" = lr."employeeId"
    WHERE lr."id" = "LeaveApproval"."requestId"
      AND e."organizationId" = public.flowhr_current_organization_id()
  )
);

DROP POLICY IF EXISTS "flowhr_leave_approval_insert" ON "LeaveApproval";
CREATE POLICY "flowhr_leave_approval_insert" ON "LeaveApproval"
FOR INSERT
WITH CHECK (
  public.flowhr_is_system()
  OR EXISTS (
    SELECT 1
    FROM "LeaveRequest" lr
    JOIN "Employee" e ON e."id" = lr."employeeId"
    WHERE lr."id" = "LeaveApproval"."requestId"
      AND e."organizationId" = public.flowhr_current_organization_id()
  )
);

DROP POLICY IF EXISTS "flowhr_leave_approval_update" ON "LeaveApproval";
CREATE POLICY "flowhr_leave_approval_update" ON "LeaveApproval"
FOR UPDATE
USING (
  public.flowhr_is_system()
  OR EXISTS (
    SELECT 1
    FROM "LeaveRequest" lr
    JOIN "Employee" e ON e."id" = lr."employeeId"
    WHERE lr."id" = "LeaveApproval"."requestId"
      AND e."organizationId" = public.flowhr_current_organization_id()
  )
)
WITH CHECK (
  public.flowhr_is_system()
  OR EXISTS (
    SELECT 1
    FROM "LeaveRequest" lr
    JOIN "Employee" e ON e."id" = lr."employeeId"
    WHERE lr."id" = "LeaveApproval"."requestId"
      AND e."organizationId" = public.flowhr_current_organization_id()
  )
);

DROP POLICY IF EXISTS "flowhr_leave_approval_delete" ON "LeaveApproval";
CREATE POLICY "flowhr_leave_approval_delete" ON "LeaveApproval"
FOR DELETE
USING (
  public.flowhr_is_system()
  OR EXISTS (
    SELECT 1
    FROM "LeaveRequest" lr
    JOIN "Employee" e ON e."id" = lr."employeeId"
    WHERE lr."id" = "LeaveApproval"."requestId"
      AND e."organizationId" = public.flowhr_current_organization_id()
  )
);

-- LeaveBalanceProjection: tenant match via Employee join.
DROP POLICY IF EXISTS "flowhr_leave_balance_select" ON "LeaveBalanceProjection";
CREATE POLICY "flowhr_leave_balance_select" ON "LeaveBalanceProjection"
FOR SELECT
USING (
  public.flowhr_is_system()
  OR EXISTS (
    SELECT 1
    FROM "Employee" e
    WHERE e."id" = "LeaveBalanceProjection"."employeeId"
      AND e."organizationId" = public.flowhr_current_organization_id()
  )
);

DROP POLICY IF EXISTS "flowhr_leave_balance_insert" ON "LeaveBalanceProjection";
CREATE POLICY "flowhr_leave_balance_insert" ON "LeaveBalanceProjection"
FOR INSERT
WITH CHECK (
  public.flowhr_is_system()
  OR EXISTS (
    SELECT 1
    FROM "Employee" e
    WHERE e."id" = "LeaveBalanceProjection"."employeeId"
      AND e."organizationId" = public.flowhr_current_organization_id()
  )
);

DROP POLICY IF EXISTS "flowhr_leave_balance_update" ON "LeaveBalanceProjection";
CREATE POLICY "flowhr_leave_balance_update" ON "LeaveBalanceProjection"
FOR UPDATE
USING (
  public.flowhr_is_system()
  OR EXISTS (
    SELECT 1
    FROM "Employee" e
    WHERE e."id" = "LeaveBalanceProjection"."employeeId"
      AND e."organizationId" = public.flowhr_current_organization_id()
  )
)
WITH CHECK (
  public.flowhr_is_system()
  OR EXISTS (
    SELECT 1
    FROM "Employee" e
    WHERE e."id" = "LeaveBalanceProjection"."employeeId"
      AND e."organizationId" = public.flowhr_current_organization_id()
  )
);

DROP POLICY IF EXISTS "flowhr_leave_balance_delete" ON "LeaveBalanceProjection";
CREATE POLICY "flowhr_leave_balance_delete" ON "LeaveBalanceProjection"
FOR DELETE
USING (
  public.flowhr_is_system()
  OR EXISTS (
    SELECT 1
    FROM "Employee" e
    WHERE e."id" = "LeaveBalanceProjection"."employeeId"
      AND e."organizationId" = public.flowhr_current_organization_id()
  )
);

-- PayrollRun: tenant scoped via organizationId column.
DROP POLICY IF EXISTS "flowhr_payroll_run_select" ON "PayrollRun";
CREATE POLICY "flowhr_payroll_run_select" ON "PayrollRun"
FOR SELECT
USING (public.flowhr_is_system() OR "organizationId" = public.flowhr_current_organization_id());

DROP POLICY IF EXISTS "flowhr_payroll_run_insert" ON "PayrollRun";
CREATE POLICY "flowhr_payroll_run_insert" ON "PayrollRun"
FOR INSERT
WITH CHECK (public.flowhr_is_system() OR "organizationId" = public.flowhr_current_organization_id());

DROP POLICY IF EXISTS "flowhr_payroll_run_update" ON "PayrollRun";
CREATE POLICY "flowhr_payroll_run_update" ON "PayrollRun"
FOR UPDATE
USING (public.flowhr_is_system() OR "organizationId" = public.flowhr_current_organization_id())
WITH CHECK (public.flowhr_is_system() OR "organizationId" = public.flowhr_current_organization_id());

DROP POLICY IF EXISTS "flowhr_payroll_run_delete" ON "PayrollRun";
CREATE POLICY "flowhr_payroll_run_delete" ON "PayrollRun"
FOR DELETE
USING (public.flowhr_is_system() OR "organizationId" = public.flowhr_current_organization_id());

-- DeductionProfile: tenant scoped via organizationId column.
DROP POLICY IF EXISTS "flowhr_deduction_profile_select" ON "DeductionProfile";
CREATE POLICY "flowhr_deduction_profile_select" ON "DeductionProfile"
FOR SELECT
USING (public.flowhr_is_system() OR "organizationId" = public.flowhr_current_organization_id());

DROP POLICY IF EXISTS "flowhr_deduction_profile_insert" ON "DeductionProfile";
CREATE POLICY "flowhr_deduction_profile_insert" ON "DeductionProfile"
FOR INSERT
WITH CHECK (public.flowhr_is_system() OR "organizationId" = public.flowhr_current_organization_id());

DROP POLICY IF EXISTS "flowhr_deduction_profile_update" ON "DeductionProfile";
CREATE POLICY "flowhr_deduction_profile_update" ON "DeductionProfile"
FOR UPDATE
USING (public.flowhr_is_system() OR "organizationId" = public.flowhr_current_organization_id())
WITH CHECK (public.flowhr_is_system() OR "organizationId" = public.flowhr_current_organization_id());

DROP POLICY IF EXISTS "flowhr_deduction_profile_delete" ON "DeductionProfile";
CREATE POLICY "flowhr_deduction_profile_delete" ON "DeductionProfile"
FOR DELETE
USING (public.flowhr_is_system() OR "organizationId" = public.flowhr_current_organization_id());

-- AuditLog: tenant scoped via organizationId column.
DROP POLICY IF EXISTS "flowhr_audit_log_select" ON "AuditLog";
CREATE POLICY "flowhr_audit_log_select" ON "AuditLog"
FOR SELECT
USING (public.flowhr_is_system() OR "organizationId" = public.flowhr_current_organization_id());

DROP POLICY IF EXISTS "flowhr_audit_log_insert" ON "AuditLog";
CREATE POLICY "flowhr_audit_log_insert" ON "AuditLog"
FOR INSERT
WITH CHECK (public.flowhr_is_system() OR "organizationId" = public.flowhr_current_organization_id());

DROP POLICY IF EXISTS "flowhr_audit_log_update" ON "AuditLog";
CREATE POLICY "flowhr_audit_log_update" ON "AuditLog"
FOR UPDATE
USING (public.flowhr_is_system() OR "organizationId" = public.flowhr_current_organization_id())
WITH CHECK (public.flowhr_is_system() OR "organizationId" = public.flowhr_current_organization_id());

DROP POLICY IF EXISTS "flowhr_audit_log_delete" ON "AuditLog";
CREATE POLICY "flowhr_audit_log_delete" ON "AuditLog"
FOR DELETE
USING (public.flowhr_is_system() OR "organizationId" = public.flowhr_current_organization_id());

