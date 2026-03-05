# WI-0949: Prevent Negative Leave Balance on Leave Request

## Background and Problem

Leave requests can currently be created even when they would drive an employee's effective balance below zero.
This creates data integrity issues and allows pending double-booking against the same entitlement.

## Scope

### In Scope

- Add pre-create leave balance guard to `POST /api/leave/requests`.
- Balance formula:
  - `available = total entitlement - (approved leaves + pending leaves)`.
  - Pending leave requests must be included.
- Add helper:
  - `getAvailableLeaveBalance(employeeId, leaveType, year)`.
  - returns `{ total, used, pending, available }`.
- Add UI-facing balance API:
  - `GET /api/leave/balance/[employeeId]`.
  - employee can view own balance, admin can view any employee balance.
- Add e2e test:
  - `scripts/tests/e2e-wi0949-leave-balance-guard.test.ts`.

### Out of Scope

- Leave policy model redesign (type-specific entitlement pools).
- UI redesign of leave request forms and dashboard widgets.
- Historical backfill/remediation for previously overbooked requests.

## API and Validation Notes

- Leave create now checks available balance before persistence.
- If request exceeds available balance:
  - return `400 Bad Request`
  - clear error message includes available balance and requested days.
- New balance endpoint returns summary object:
  - `{ total, used, pending, available }`
  - computed by employee + leave type + year.

## Test Plan

- `scripts/tests/e2e-wi0949-leave-balance-guard.test.ts`
  - sufficient balance request returns `201`
  - exceeding balance returns `400` with balance details
  - pending requests consuming balance return `400`
  - admin can view employee balance with correct calculation
  - employee can view own balance with correct calculation

## Rollback Plan

- Remove pre-create balance guard from leave request service.
- Remove `getAvailableLeaveBalance` helper and balance summary logic.
- Remove `/api/leave/balance/[employeeId]` route.
- Remove WI-0949 e2e test and this work-item document.
