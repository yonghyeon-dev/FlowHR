-- WI-0048: Attendance capture channel metadata baseline

-- CreateEnum
CREATE TYPE "AttendanceCaptureChannel" AS ENUM ('MANUAL', 'GPS', 'QR', 'WIFI', 'DEVICE');

-- AlterTable
ALTER TABLE "AttendanceRecord"
ADD COLUMN "captureChannel" "AttendanceCaptureChannel" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN "captureDeviceId" TEXT,
ADD COLUMN "captureIpAddress" TEXT,
ADD COLUMN "captureLatitude" DOUBLE PRECISION,
ADD COLUMN "captureLongitude" DOUBLE PRECISION,
ADD COLUMN "captureAccuracyMeters" INTEGER;

-- AddConstraint
ALTER TABLE "AttendanceRecord"
ADD CONSTRAINT "AttendanceRecord_captureLatitude_check"
CHECK ("captureLatitude" IS NULL OR ("captureLatitude" >= -90 AND "captureLatitude" <= 90));

-- AddConstraint
ALTER TABLE "AttendanceRecord"
ADD CONSTRAINT "AttendanceRecord_captureLongitude_check"
CHECK ("captureLongitude" IS NULL OR ("captureLongitude" >= -180 AND "captureLongitude" <= 180));

-- AddConstraint
ALTER TABLE "AttendanceRecord"
ADD CONSTRAINT "AttendanceRecord_captureAccuracyMeters_check"
CHECK ("captureAccuracyMeters" IS NULL OR ("captureAccuracyMeters" >= 0 AND "captureAccuracyMeters" <= 10000));

-- AddConstraint
ALTER TABLE "AttendanceRecord"
ADD CONSTRAINT "AttendanceRecord_captureCoordinatesPair_check"
CHECK (("captureLatitude" IS NULL) = ("captureLongitude" IS NULL));

-- AddConstraint
ALTER TABLE "AttendanceRecord"
ADD CONSTRAINT "AttendanceRecord_captureGpsCoordinates_check"
CHECK (
  "captureChannel" <> 'GPS'
  OR ("captureLatitude" IS NOT NULL AND "captureLongitude" IS NOT NULL)
);
