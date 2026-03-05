DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'LeaveType'
      AND n.nspname = current_schema()
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE t.typname = 'LeaveType'
        AND n.nspname = current_schema()
        AND e.enumlabel = 'MATERNITY'
    ) THEN
      ALTER TYPE "LeaveType" ADD VALUE 'MATERNITY';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE t.typname = 'LeaveType'
        AND n.nspname = current_schema()
        AND e.enumlabel = 'PATERNITY'
    ) THEN
      ALTER TYPE "LeaveType" ADD VALUE 'PATERNITY';
    END IF;
  END IF;
END $$;
