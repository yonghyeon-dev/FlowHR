# ADR-0005: WorkSchedule Scheduling Baseline (API + RLS)

- Status: Proposed
- Date: 2026-02-15
- Owners: FlowCoder
- Related Work Item: `work-items/WI-0040-scheduling-baseline.md`
- Related Contracts:
  - `specs/scheduling/contract.yaml`
  - `specs/people/contract.yaml`
  - `specs/rbac/contract.yaml`

## Context

FlowHR currently records actual attendance (clock-in/out) but lacks a minimal schedule model.
Without planned schedules, operations cannot:

- assign and communicate expected working windows per employee
- build schedule-to-attendance anomaly detection
- evolve toward shift templates and rotations (Phase 2)

Scheduling data must also be tenant-safe by default and consistent with the existing RBAC + RLS baseline.

## Decision

1. Domain model:
   - Introduce `WorkSchedule` as a minimal planned schedule entry.
   - Fields: `employeeId`, `startAt`, `endAt`, `breakMinutes`, `isHoliday`, `notes`.
2. API:
   - `POST /api/scheduling/schedules` to assign a schedule entry.
   - `GET /api/scheduling/schedules` to list schedules by period.
3. Authorization:
   - New permissions:
     - `scheduling.schedule.write.any`
     - `scheduling.schedule.list.any`
     - `scheduling.schedule.list.by_employee`
     - `scheduling.schedule.list.own`
   - Default policy:
     - admin/system: create/list any
     - manager: create + list by employee
     - employee: list own only
4. Audit and events:
   - Audit action: `scheduling.schedule.assigned`
   - Domain event: `scheduling.schedule.assigned.v1`
5. Tenant isolation:
   - Enable RLS on `WorkSchedule`.
   - Policies enforce tenant match via `Employee.organizationId` join.
   - `system` role bypass is allowed for platform operations.

## Alternatives Considered

1. No schedule model (attendance-only)
   - Pros: simplest.
   - Cons: blocks scheduling features and anomaly detection.
2. Store planned schedule inside `AttendanceRecord`
   - Pros: fewer tables.
   - Cons: mixes planned vs actual data; hurts auditability and future evolution.
3. Use external calendar service as system of record
   - Pros: feature-rich scheduling.
   - Cons: not compatible with contract-first MVP and tenant/RBAC requirements.

## Consequences

- Positive:
  - Minimal scheduling capability to unlock Phase 2 features.
  - Tenant-safe by default (RLS baseline).
  - Auditable schedule assignments with a stable domain event.
- Negative:
  - Adds a new table and permissions that must be maintained across RBAC modes.

## Compatibility and Migration

- Additive migration id: `202602150003_scheduling_baseline`.
- No changes to attendance-to-payroll calculations in MVP.
- Rollback: feature-gate behavior (doc-only) + break-glass RLS adjustment if required.

## Validation Plan

- E2E:
  - tenant-scoped schedule assignment and list boundaries in memory mode
- CI:
  - contract governance + traceability + golden regression gates must pass.

