-- WI-0114: Leave policy constraints for minimum advance notice and consecutive-day cap.
ALTER TABLE "LeavePolicy"
ADD COLUMN IF NOT EXISTS "minNoticeDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "maxConsecutiveDays" DECIMAL(6,2);
