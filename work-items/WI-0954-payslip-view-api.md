# WI-0954: Payslip View API for Employees

## Background and Problem

Employees need a dedicated read-only API to view finalized payroll results as payslips.
Admins also need organization-scoped visibility into employee payslips for support and audit workflows.

## Scope

### In Scope

- Add `GET /api/payslips?period=YYYY-MM`:
  - employee: own confirmed payslips only
  - admin: confirmed payslips in own organization
  - admin supports optional `employeeId` filter
  - response:
    - `[{ id, employeeId, employeeName, period, basePay, overtimePay, totalDeductions, netPay, status, confirmedAt }]`
- Add `GET /api/payslips/[id]`:
  - employee: own payslip only
    - ownership validation: `recipientId == actor.id` (`PayrollRun.employeeId` is treated as recipient id)
  - admin: any payslip in own organization
  - response includes breakdown arrays:
    - `{ ...payslip, items: [{ type, description, amount }], deductions: [{ type, description, amount }] }`
- Use `PayrollRun` as source model.
- Expose only `CONFIRMED` payroll runs as payslips.
- Add E2E coverage:
  - `scripts/tests/e2e-wi0954-payslip-view.test.ts`

### Out of Scope

- Payslip UI page and printing/format UX changes.
- Payslip delivery/acknowledgement workflow changes.
- Payroll computation or deduction rule changes.

## API and Validation Notes

- `period` query accepts `YYYY-MM`.
- Invalid `period` returns `400`.
- Employee access to other employee payslip detail returns `403`.
- Admin scope is restricted to actor organization id.

## Test Plan

- `scripts/tests/e2e-wi0954-payslip-view.test.ts`
  - employee views own payslips: `200`
  - employee views another employee payslip: `403`
  - admin views any payslip in organization: `200`
  - period and employee filters return correct list results
  - detail payload includes `items` and `deductions` breakdown

## Rollback Plan

- Remove `/api/payslips` and `/api/payslips/[id]` routes.
- Remove shared payslip mapping helpers used by the new routes.
- Remove WI-0954 E2E test and this work-item document.
