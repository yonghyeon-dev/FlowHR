# WI-0035: employeeId String to FK Migration

## Background and Problem

Attendance/leave/payroll tables currently store `employeeId` as an unvalidated string. Once Employee master exists, we must migrate to foreign keys to enforce referential integrity and enable safe tenant scoping.

## Scope

### In Scope

- Add `employeeId` foreign key relations in Prisma schema for core domain tables.
- Provide a safe migration path (expand/contract) that preserves existing data.
- Update APIs to accept/emit Employee identifiers consistently.
- Update tests and golden fixtures to cover invalid employee references (400/409 as appropriate).

### Out of Scope

- Organization-wide re-keying of historical data beyond the core tables.

## User Scenarios

1. API rejects attendance/leave/payroll actions referencing a non-existent employee.
2. Existing data is migrated without loss and remains queryable.

## Payroll Accuracy and Calculation Rules

- Not applicable (integrity only).

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | System |
| --- | --- | --- | --- | --- |
| Run migration / backfill | Allow | Deny | Deny | Allow |

## Data Changes (Tables and Migrations)

- Tables: core domain tables will reference Employee via FK (exact tables TBD)
- Migration IDs: TBD
- Backward compatibility plan: expand/contract; temporary dual-write if needed

## API and Event Changes

- Endpoints: validate employee existence on write paths
- Events published: none
- Events consumed: none

## Test Plan

- Unit: request validation for employee existence
- Integration: FK integrity checks via prisma-backed tests
- Regression: WI-0001/WI-0002/WI-0005 flows remain green

## Observability and Audit Logging

- Audit events: migration run trace (optional)
- Metrics: not required
- Alert conditions: not required

## Rollback Plan

- Feature flag behavior: not applicable
- DB rollback method: revert migration if possible; otherwise forward-fix
- Recovery target time: 60m

## Definition of Ready (DoR)

- [ ] Employee master model is merged.
- [ ] Migration strategy documented (expand/contract).

## Definition of Done (DoD)

- [ ] FK constraints enforced for core tables.
- [ ] APIs reject invalid employee references.
- [ ] CI (quality-gates + golden-regression) remains green.

