ALTER TABLE "Organization"
ADD COLUMN "notificationDefaultEmailEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "notificationDefaultInAppEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "notificationDefaultLeaveEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "notificationDefaultAttendanceEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "notificationDefaultPayrollEnabled" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "Employee"
ADD COLUMN "notificationEmailEnabled" BOOLEAN,
ADD COLUMN "notificationInAppEnabled" BOOLEAN,
ADD COLUMN "notificationLeaveEnabled" BOOLEAN,
ADD COLUMN "notificationAttendanceEnabled" BOOLEAN,
ADD COLUMN "notificationPayrollEnabled" BOOLEAN;
