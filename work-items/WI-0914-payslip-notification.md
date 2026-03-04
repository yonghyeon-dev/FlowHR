# WI-0914 Payslip Distribution Employee Notification

## Scope
- When payroll payslips are distributed via `POST /api/payroll/payslips/distribute`, enqueue in-app notifications for target employees.
- Keep the existing payslip distribution domain event flow and extend payload with distributed employee IDs.
- Add end-to-end coverage for `preview -> confirm -> distribute` with event + notification verification.

## API Behavior
- Endpoint: `POST /api/payroll/payslips/distribute` (existing)
- On successful non-dry-run distribution:
  - Existing event is published: `payroll.payslip.distributed.v1`
  - Event payload now includes `employeeIds` and notification summary fields.
  - For each newly distributed target employee:
    - Auto notice is created:
      - `title`: `급여명세서 도착`
      - `body`: `YYYY년 MM월 급여명세서가 발행되었습니다.`
      - `status`: `PUBLISHED`
    - In-app notification queue row is created (`state: QUEUED`, `channel: in_app`).

## Data/Type Changes
- `src/features/shared/data-access.ts`
  - `NoticeNotificationEntity` adds `employeeId: string | null`.
  - `CreateNoticeNotificationInput` adds optional `employeeId`.
  - `NoticeNotificationStore.list` adds optional `employeeId` filter input.
- `src/features/shared/memory-data-access.ts`
  - Notice notification create/clone/list updated to include and filter `employeeId`.
- `src/features/shared/prisma-data-access.ts`
  - Notice notification entity mapping updated to include `employeeId` (`null` fallback).

## Service Changes
- `src/features/payroll/service-payslip-period-helpers.ts`
  - Added Seoul month-based notice body formatter.
  - On distribute apply (`dryRun: false`), enqueue per-employee notice notifications for newly distributed runs.
  - Added `employeeIds` + notification metadata to distribution payload.

## Test
- Added: `scripts/tests/e2e-wi0914-payslip-notification.test.ts`
- Validates:
  - Org/employee setup
  - Payroll run creation through preview API
  - Payroll run confirmation through confirm API
  - Payslip distribute apply call
  - `payroll.payslip.distributed.v1` event emission and `employeeIds` payload
  - Employee-targeted in-app notification queue rows
  - Auto notice title/body content and idempotent re-distribute behavior

## Verification
- `npm.cmd exec tsx scripts/tests/e2e-wi0914-payslip-notification.test.ts`
- `npm.cmd run typecheck`
- `npm.cmd run lint`
