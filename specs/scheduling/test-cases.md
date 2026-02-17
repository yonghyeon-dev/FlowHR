# Scheduling Test Cases

## Scope

Work schedule CRUD + template/rotation assignment + schedule-to-attendance anomaly behavior with tenant isolation and role boundaries.

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
21. Manager creates a schedule template (201) and lists templates (200).
22. Employee cannot create/list templates (403).
23. Manager assigns template to employee for one date (201) and schedule is created.
24. Reject template assignment when requested date weekday is outside template weekdays (409).
25. Reject template assignment when template is from another tenant (404).
26. Emit domain events `scheduling.template.created.v1`, `scheduling.template.assigned.v1` on successful actions.
27. Append audit logs `scheduling.template.created`, `scheduling.template.assigned` with tenant context.
28. Manager lists anomaly report for an employee and receives `LATE`/`NO_SHOW` rows (200).
29. Manager anomaly query without `employeeId` is rejected (400).
30. Employee can list own anomaly report only (403 on other employeeId).
31. Cross-tenant anomaly query for `employeeId` returns 404 (no existence leak).
32. Append audit log `scheduling.anomaly.report.generated` for successful report reads.
33. Manager assigns template by range and creates schedules only on matching weekdays (201).
34. Reject range assignment when date range is invalid or exceeds limit (400).
35. Reject range assignment when any generated window overlaps existing schedule (409) and no schedules are created.
36. Employee cannot call template range assignment endpoint (403).
37. Emit domain event `scheduling.template.range_assigned.v1` on successful range assignment.
38. Append audit log `scheduling.template.range_assigned` with created-count and date-range payload.
39. Manager assigns rotation with multiple templates and creates alternating schedules on matched weekdays (201).
40. Reject rotation assignment when `templateIds` includes duplicates or fewer than 2 entries (400).
41. Reject rotation assignment when templates have different weekday sets (409).
42. Reject rotation assignment when any generated window overlaps existing schedule (409) and no schedules are created.
43. Employee cannot call rotation assignment endpoint (403).
44. Emit domain event `scheduling.rotation.assigned.v1` on successful rotation assignment.
45. Append audit log `scheduling.rotation.assigned` with template sequence and created count.
46. When `FLOWHR_SCHEDULING_ANOMALY_ALERTS_ENABLED=true` and anomalies exist, emit `scheduling.anomaly.detected.v1` and append `scheduling.anomaly.alert.triggered` audit log.
47. When anomaly alert automation is disabled, anomaly report still succeeds and does not emit automation event.
48. When `FLOWHR_SCHEDULING_ANOMALY_ESCALATION_ENABLED=true` and anomalies exist, emit `scheduling.anomaly.escalated.v1` with severity/owner/retry payload and append `scheduling.anomaly.escalation.triggered` audit log.
49. When anomaly escalation automation is disabled, anomaly report still succeeds and does not emit escalation event.
50. Manager lists rotation balance report for an employee and receives weekday load/planned-minute aggregates with grade/recommendations (200).
51. Manager rotation balance query without `employeeId` is rejected (400).
52. Employee can list own rotation balance report only (403 on other employeeId).
53. Manager rotation optimization dry-run returns recommended start offset, optimized template order, and score payload (201).
54. Rotation optimization with `apply=true` creates schedules using optimized template order and returns created schedule ids.
55. Rotation optimization dry-run path does not mutate schedules.
56. Manager generates tenant-level rotation fairness report and receives aggregated metrics with per-employee recommendations (200).
57. Rotation fairness report rejects employee ids outside organization scope (404).
58. Employee cannot call rotation fairness report endpoint (403).
59. Manager fairness apply creates schedules for selected employees and returns per-employee created schedule ids (201).
60. Employee cannot call rotation fairness apply endpoint (403).
61. Rotation fairness report with `globalConstraints` returns global summary and diversified offset recommendations.
62. Rotation fairness apply returns 409 with no writes when `maxDailyPlannedMinutesGap` threshold is breached.
63. Manager anomaly cockpit query returns tenant-level severity summary, employee aggregates, and prioritized queue.
64. Employee anomaly cockpit query is rejected (403).
65. When `FLOWHR_SCHEDULING_ANOMALY_TICKET_AUTOMATION_ENABLED=true` and queue severity matches policy, cockpit query emits `scheduling.anomaly.ticket.requested.v1` and appends `scheduling.anomaly.ticket.requested` audit log.
66. When ticket automation is disabled, cockpit query succeeds and does not emit ticket request event.

## Boundary Cases

1. Overnight schedule windows (crossing midnight) are accepted; business-date attribution is future scope.
2. Break minutes are validated (0..300).
3. Back-to-back schedules (existing `endAt == new startAt`) are allowed.
4. `lateThresholdMinutes` query validates integer range (0..240).
5. Range assignment supports overnight templates and enforces overlap preflight before writes.
6. Rotation assignment uses max 62-day window and supports overnight templates.
7. Alert automation failure path does not fail anomaly report response.
8. Escalation automation failure path does not fail anomaly report response.
9. Rotation balance report is read-only and does not mutate schedule state.
10. Rotation optimization evaluate path is deterministic for identical inputs.
11. Rotation fairness report is deterministic for identical inputs.
12. Rotation fairness apply preflights overlaps before write-back.
13. Rotation fairness global constraint threshold validates integer range (0..100000).
14. Anomaly cockpit `topN` query validates integer range (1..200) and limits queue size.
15. Invalid ticket automation config does not fail cockpit response and appends `scheduling.anomaly.ticket.request.failed` audit log.

## Regression Linkage

- none
- anomaly report is read-only and does not mutate schedule or attendance state.
- anomaly cockpit report is read-only and does not mutate schedule or attendance state.
- anomaly cockpit report remains available even when ticket automation publication/config validation fails.
- range assignment preflight overlap conflict does not partially create schedules.
- rotation assignment preflight overlap conflict does not partially create schedules.
- rotation balance report path does not mutate schedule state.
- rotation optimization dry-run path does not mutate schedule state.
- rotation fairness report path does not mutate schedule state.
- rotation fairness global constraints path remains deterministic for identical inputs.
- rotation fairness apply emits rotation assignment event/audit per employee.

## QA Gate Expectations

- Spec Gate: contract completeness and role matrix validated.
- Code Gate: unit/integration/e2e checks pass.

