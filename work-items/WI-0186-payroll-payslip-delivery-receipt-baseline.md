# WI-0186: Payroll Payslip Delivery and Receipt Confirmation Baseline

## Background and Problem

FlowHR can calculate/confirm payroll runs and close periods, but there is no explicit workflow to distribute confirmed payslips and record employee receipt confirmation.
To continue Phase 4 payroll hardening with customer-facing value, WI-0186 adds dedicated delivery/receipt APIs and isolated Admin/Employee routes.

## Scope

### In Scope

- Add payslip delivery API:
  - `POST /payroll/payslips/distribute`
  - period/employee scoped distribution summary for confirmed runs
  - dry-run/apply workflow (`dryRun=true/false`)
  - per-run delivery metadata update (`payslipDeliveryChannel`, `payslipDistributedAt`, `payslipDistributedBy`)
- Add payslip receipt confirmation API:
  - `POST /payroll/payslips/{runId}/acknowledge`
  - owner employee (or payroll admin/operator) receipt confirmation
  - distributed + confirmed run state guard
  - per-run receipt metadata update (`payslipReceiptConfirmedAt`, `payslipReceiptConfirmedBy`)
- Add payroll service logic:
  - feature flag gate (`FLOWHR_PAYROLL_PAYSLIP_DELIVERY_V1`)
  - permission and tenant boundary enforcement
  - audit/domain event publication for dry-run/apply/receipt-confirm
- Add dedicated routes:
  - Admin: `/admin/payroll-payslip-delivery`
  - Employee: `/employee/payslip-receipts`
- Add persistence support:
  - Prisma schema + migration for payslip delivery/receipt columns on `PayrollRun`
  - memory/prisma data access mapping updates
- Add WI-0186 regression test:
  - `scripts/tests/e2e-wi0186-payroll-payslip-delivery-receipt-baseline.test.ts`
- Wire WI-0186 into MVP/FULL e2e chains
- Update payroll specs (contract/api/test-cases)

### Out of Scope

- PDF renderer or file attachment generation pipeline
- External email provider template orchestration
- Multi-step reminder/escalation scheduler

## User Scenarios

1. Payroll operator dry-runs payslip distribution for a month and sees confirmed/previewed run split and target counts.
2. Payroll operator applies distribution and records channel/distributed timestamp on newly eligible runs.
3. Employee reviews distributed payslips and confirms receipt for own confirmed run.

## Data Changes

- New APIs:
  - POST /payroll/payslips/distribute
  - POST /payroll/payslips/{runId}/acknowledge
- Updated model:
  - `PayrollRun` (delivery/receipt tracking fields)
- DB migration:
  - `202602210001_wi0186_payroll_payslip_delivery_receipt`
  - adds delivery/receipt columns to `PayrollRun`

## Rollback Plan

- Disable `FLOWHR_PAYROLL_PAYSLIP_DELIVERY_V1`
- Revert payslip delivery/receipt routes and service logic
- Revert admin/employee dedicated routes and nav links
- Revert payroll spec/e2e updates
- Roll back migration if required by release process

## Definition of Done (DoD)

- [x] Payslip distribution dry-run/apply summary is deterministic for the same run set.
- [x] Apply path updates delivery metadata only for confirmed runs not yet distributed.
- [x] Receipt confirmation enforces distributed+confirmed+ownership guards and is audit/event traced.
- [x] Admin/Employee dedicated routes exist without adding new sections to legacy large pages.
- [x] Payroll contract/api/test-cases include payslip delivery/receipt endpoints, invariants, and feature flag.
- [x] WI-0186 regression test exists and is wired into MVP/FULL suites.
