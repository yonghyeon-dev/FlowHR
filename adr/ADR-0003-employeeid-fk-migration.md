# ADR-0003: Enforce Employee Referential Integrity (employeeId FK)

- Status: Proposed
- Date: 2026-02-14
- Owners: FlowCoder
- Related Work Item: `work-items/WI-0035-employeeid-fk-migration.md`
- Related Contracts:
  - `specs/attendance/contract.yaml`
  - `specs/leave/contract.yaml`
  - `specs/payroll/contract.yaml`

## Context

FlowHR now has a People master domain (`Organization`, `Employee`), but core runtime tables still store
`employeeId` as an unvalidated string reference. This allows creation of attendance/leave/payroll data for
non-existent employees, which breaks downstream invariants (aggregation, authorization, tenant scoping).

We need referential integrity at the database layer, while preserving existing data and keeping the API behavior
consistent and auditable.

## Decision

1. Add Prisma FK relations from core domain tables to `Employee.id`.
2. Add a forward-only migration that:
   - backfills missing `Employee` rows based on historical `employeeId` references
   - applies FK constraints
3. Enforce runtime behavior:
   - write paths that reference an employee must reject unknown `employeeId` with `404 employee not found`
   - for payroll `preview*` requests, `FLOWHR_PAYROLL_DEDUCTIONS_V1` feature-flag validation still happens first
4. Deletion semantics:
   - `PayrollRun.employeeId` is nullable and uses `onDelete: SetNull` to avoid deleting historical payroll runs
     when an employee is removed.

## Alternatives Considered

1. Runtime-only validation (no FK)
   - Pros: no DB migration risk.
   - Cons: allows integrity violations via direct DB writes; weaker safety for multi-tenant/RLS.
2. Auto-provision employee rows when first referenced
   - Pros: fewer client-side changes.
   - Cons: creates shadow employees without People domain semantics; weak auditability and governance.
3. Introduce a new surrogate numeric employee PK
   - Pros: conventional relational design.
   - Cons: breaking change across APIs/contracts; increases migration complexity for MVP.

## Consequences

- Positive:
  - Database-level integrity for employee references.
  - Clear API contract: unknown employee IDs are rejected (404).
  - Enables safe future work for RBAC and multi-tenant isolation.
- Negative:
  - Clients must create employees before recording attendance/leave/payroll flows.
  - Migration requires careful sequencing in environments that already contain data.

## Compatibility and Migration

- Backward compatibility:
  - Historical records are preserved; the migration backfills `Employee` rows for existing references.
- Migration strategy:
  - Expand/contract style migration with id `202602140006_employee_fk_constraints`.
- Rollback strategy:
  - Prefer forward-fix (restore missing employee rows / repair invalid refs) over dropping constraints.
  - If rollback is required in a non-production environment, revert the migration and redeploy.

## Security and Compliance Impact

- PII impact: no new PII fields are introduced.
- Audit impact: runtime reject paths are audited consistently; integrity reduces ambiguous historical data.
- Legal/regulatory notes: none for this change.

## Validation Plan

- Tests:
  - Unit/integration/e2e + golden regression gates must pass.
  - Prisma route-level e2e must pass in staging schema CI when enabled.
- Metrics/alerts:
  - Existing ops alerting remains unchanged.
- Release checkpoints:
  - Apply migration to staging schema first, then production following `docs/break-glass.md` only if required.

