# Scheduling Test Cases

## Scope

Work schedule assignment and list behavior with tenant isolation and role boundaries.

## Functional Cases

1. Manager assigns a schedule entry for an employee (201).
2. Reject schedule create when `employeeId` does not exist (404).
3. Reject schedule create when `startAt >= endAt` (400).
4. Employee cannot create schedules (403).
5. Reject schedule create when it overlaps an existing schedule for the same employee (409).
6. Manager updates a schedule entry (200).
7. Reject schedule update when `scheduleId` does not exist (404).
8. Reject schedule update when `startAt >= endAt` (400).
9. Reject schedule update when it overlaps another schedule for the same employee (409).
10. Employee cannot update schedules (403).
11. Cross-tenant schedule update returns 404 (no existence leak).
12. Manager deletes a schedule entry (200).
13. Reject schedule delete when `scheduleId` does not exist (404).
14. Employee cannot delete schedules (403).
15. Cross-tenant schedule delete returns 404 (no existence leak).
16. List schedules by period (`from`/`to`) returns expected rows.
17. Employee can list only own schedules (403 when querying other employeeId).
18. Manager list query requires `employeeId` (400).
19. Emit domain events `scheduling.schedule.assigned.v1`, `scheduling.schedule.updated.v1`, `scheduling.schedule.deleted.v1` on successful actions.
20. Append audit logs `scheduling.schedule.assigned`, `scheduling.schedule.updated`, `scheduling.schedule.deleted` with tenant context when available.

## Boundary Cases

1. Overnight schedule windows (crossing midnight) are accepted; business-date attribution is future scope.
2. Break minutes are validated (0..300).
3. Back-to-back schedules (existing `endAt == new startAt`) are allowed.

## Regression Linkage

- none

## QA Gate Expectations

- Spec Gate: contract completeness and role matrix validated.
- Code Gate: unit/integration/e2e checks pass.

