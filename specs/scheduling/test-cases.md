# Scheduling Test Cases

## Scope

Work schedule assignment and list behavior with tenant isolation and role boundaries.

## Functional Cases

1. Manager assigns a schedule entry for an employee (201).
2. Reject schedule create when `employeeId` does not exist (404).
3. Reject schedule create when `startAt >= endAt` (400).
4. Employee cannot create schedules (403).
5. Reject schedule create when it overlaps an existing schedule for the same employee (409).
6. List schedules by period (`from`/`to`) returns expected rows.
7. Employee can list only own schedules (403 when querying other employeeId).
8. Manager list query requires `employeeId` (400).
9. Emit domain event `scheduling.schedule.assigned.v1` once per schedule create.
10. Append audit log `scheduling.schedule.assigned` with tenant context when available.

## Boundary Cases

1. Overnight schedule windows (crossing midnight) are accepted; business-date attribution is future scope.
2. Break minutes are validated (0..300).
3. Back-to-back schedules (existing `endAt == new startAt`) are allowed.

## Regression Linkage

- none

## QA Gate Expectations

- Spec Gate: contract completeness and role matrix validated.
- Code Gate: unit/integration/e2e checks pass.

