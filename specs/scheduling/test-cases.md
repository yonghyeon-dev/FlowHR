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
67. Manager anomaly cockpit stream query returns bounded SSE `cockpit-snapshot` events and final `stream-end` event.
68. Employee anomaly cockpit stream query is rejected (403).
69. Cockpit stream query appends `scheduling.anomaly.cockpit.stream.opened` audit log.
70. Cockpit stream query suppresses ticket request domain event even when ticket automation is enabled.
71. Rotation fairness report with `advancedConstraints.preference/laborLaw` returns per-employee `advancedScore` and aggregate `advanced` summary.
72. Multi-objective fairness weighting flips selected offset when preference weight and labor-law weight priorities are inverted.
73. Rotation fairness advanced constraints reject out-of-scope template ids in preference rules (404).
74. Cockpit stream with `incidentAutomation=true` and matching severity emits SSE `incident-automation` event with `TRIGGER_TICKET_AUTOMATION` recommended action.
75. Cockpit stream `incidentCooldownSeconds` suppresses repeated `incident-automation` events across bounded snapshots.
76. Cockpit stream with `incidentAutomation=false` emits no `incident-automation` event while keeping snapshot stream behavior unchanged.
77. Manager can acknowledge anomaly incident (`POST /scheduling/anomalies/incidents/{incidentId}/ack`) and receives lifecycle state `ACKNOWLEDGED`.
78. Manager can assign anomaly incident owner (`POST /assign`) with `assigneeId` and receives lifecycle state `ASSIGNED`.
79. Manager can resolve anomaly incident (`POST /resolve`) with optional `resolutionCode` and receives lifecycle state `RESOLVED`.
80. Employee cannot call anomaly incident lifecycle command endpoints (403).
81. Anomaly incident lifecycle commands append audit log and emit `scheduling.anomaly.incident.updated.v1` event.
82. Manager can list anomaly incident read-model entries (`GET /scheduling/anomalies/incidents`) with total/items response.
83. `state` query filter on incident list returns only matching lifecycle state entries.
84. Manager can read anomaly incident detail (`GET /scheduling/anomalies/incidents/{incidentId}`) with timeline history.
85. Employee cannot access anomaly incident read-model list/detail endpoints (403).
86. Cross-tenant anomaly incident detail request returns 404 (no existence leak).
87. Incident read-model list/detail is reconstructed from persisted lifecycle audit logs (no process-local map dependency).
88. Manager can list anomaly incident SLA monitoring entries (`GET /scheduling/anomalies/incidents/sla`) with status counts and prioritized items.
89. Incident SLA query with `includeResolved=true` includes `RESOLVED` status entries.
90. Employee cannot access anomaly incident SLA endpoint (403).
91. Cross-tenant manager sees only own-tenant incident SLA entries.
92. Manager can trigger anomaly incident escalation command (`POST /scheduling/anomalies/incidents/escalate`) and receives requested/skipped/failed summary.
93. Escalation command emits `scheduling.anomaly.incident.escalation.requested.v1` event for requested candidates and appends request audit.
94. Escalation command enforces cooldown and skips duplicate requests for recently escalated incidents.
95. Employee cannot call anomaly incident escalation command endpoint (403).
96. Manager can execute anomaly incident auto-action command (`POST /scheduling/anomalies/incidents/auto-actions`) and receives assign/skipped summary for escalated candidates.
97. Auto-action command assigns only unassigned incidents when `autoAssignMode=ASSIGN_IF_UNASSIGNED` and preserves existing assignee ownership.
98. Auto-action command `dryRun=true` does not mutate incident assignee while returning deterministic action plan.
99. Employee cannot call anomaly incident auto-action command endpoint (403).
100. Incident detail/list APIs can read incident lifecycle state from durable store even when audit projection source is empty for current process memory.
101. Incident escalation command reads cooldown from durable store `lastEscalationRequestedAt` and skips duplicate escalation within window after restart.
102. Incident escalation command with non-dry-run updates durable cooldown timestamp while preserving lifecycle state/history values.
103. Cross-tenant manager cannot read durable incident detail and receives 404 without existence leak.

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
16. Cockpit stream `intervalSeconds` validates integer range (0..60).
17. Cockpit stream `sampleCount` validates integer range (1..30).
18. Rotation fairness advanced `weight` fields validate integer range (0..100).
19. Cockpit stream `incidentCooldownSeconds` validates integer range (0..3600).
20. Incident assign endpoint rejects payload without `assigneeId` (400).
21. Incident list `topN` validates integer range (1..200).
22. Incident read-model projection still returns consistent history after service restart because source-of-truth is audit log.
23. Incident SLA query validates `slaTargetMinutes` range and `warningMinutes < slaTargetMinutes`.
24. Incident escalation command validates `cooldownMinutes` range and `warningMinutes < slaTargetMinutes`.
25. Incident auto-action command requires non-empty `autoAssigneeId` and validates `warningMinutes < slaTargetMinutes`.
26. Incident durable store history payload normalization tolerates missing/invalid optional fields without breaking read APIs.

## Regression Linkage

- none
- anomaly report is read-only and does not mutate schedule or attendance state.
- anomaly cockpit report is read-only and does not mutate schedule or attendance state.
- anomaly cockpit report remains available even when ticket automation publication/config validation fails.
- anomaly cockpit stream reuses cockpit invariants and does not mutate schedule or attendance state.
- anomaly cockpit stream incident-automation SSE signal remains read-only and does not publish domain events.
- anomaly incident lifecycle command path remains operational-only and does not mutate schedule/attendance state.
- anomaly incident read-model list/detail path remains operational-only and does not mutate schedule/attendance state.
- anomaly incident SLA path remains operational-only and does not mutate schedule/attendance state.
- anomaly incident escalation command path persists cooldown metadata only and does not mutate schedule/attendance state.
- anomaly incident auto-action command path remains operational-only and does not mutate schedule/attendance state.
- anomaly incident read/list/sla/escalation paths remain restart-safe via durable incident store source.
- range assignment preflight overlap conflict does not partially create schedules.
- rotation assignment preflight overlap conflict does not partially create schedules.
- rotation balance report path does not mutate schedule state.
- rotation optimization dry-run path does not mutate schedule state.
- rotation fairness report path does not mutate schedule state.
- rotation fairness global constraints path remains deterministic for identical inputs.
- rotation fairness advanced constraints path remains deterministic for identical inputs.
- rotation fairness apply emits rotation assignment event/audit per employee.

## QA Gate Expectations

- Spec Gate: contract completeness and role matrix validated.
- Code Gate: unit/integration/e2e checks pass.

