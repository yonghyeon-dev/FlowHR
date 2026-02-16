# Attendance Test Cases

## Scope

Attendance create/update/approval behavior and output consistency for payroll aggregation.

## Functional Cases

1. Create attendance record within same business day.
2. Reject attendance create/update when `employeeId` does not exist (404).
3. Update attendance before approval.
4. Approve correction by manager role.
5. Reject attendance by manager role with optional reason and verify exclusion from payroll aggregation.
6. Reject unauthorized approval/rejection attempt.
7. Emit final-state event once (`approved` or `rejected`).
8. Rejection reason is preserved in audit/event payload when provided.
9. Reject API returns `400` for invalid JSON body and oversized reason payload.
10. List attendance records by period (`from`/`to`) with role boundary guards (employee self-only, manager requires employeeId).
11. List attendance aggregates by period (`from`/`to`) with role boundary guards and verify totals are derived from approved records only.
12. Create attendance with capture metadata (GPS/QR/WIFI/device) and verify fields are persisted in response.
13. Update pending attendance capture metadata and verify audit/event trace includes capture fields.
14. Reject attendance create/update when capture payload is invalid (GPS without coordinates, partial coordinate pair).
15. When `FLOWHR_ATTENDANCE_GPS_REQUIRED=true`, employee non-GPS create/update is rejected while manager correction path remains allowed.
16. When `FLOWHR_ATTENDANCE_GEOFENCE_ENABLED=true`, employee GPS create/update outside configured radius is rejected while manager correction path remains allowed.
17. When `FLOWHR_ATTENDANCE_TRUSTED_DEVICE_ENABLED=true`, employee write with missing/untrusted deviceId is rejected while trusted deviceId is accepted.
18. When `FLOWHR_ATTENDANCE_MULTI_SITE_GEOFENCE_ENABLED=true`, employee GPS create/update must match at least one configured site geofence while manager correction path remains allowed.
19. When `FLOWHR_ATTENDANCE_DEVICE_ATTESTATION_ENABLED=true`, employee write with missing/mismatched capture attestation token is rejected while mapped device/token pair is accepted.
20. When `FLOWHR_ATTENDANCE_ANTI_SPOOFING_ENABLED=true`, employee write with risk score above threshold is rejected while low-risk capture payload is accepted and manager correction path remains allowed.
21. When `FLOWHR_ATTENDANCE_ANTI_SPOOFING_SIGNAL_FUSION_ENABLED=true`, employee write with high-risk device/ip reputation or insufficient signal fusion count is rejected while safe fused payload is accepted.
22. When `FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_ENABLED=true`, employee write uses remote reputation high-risk device/ip signals and rejects high-risk payload while manager correction path remains allowed.
23. When multi-provider external reputation is enabled with `majority` aggregation, employee write is accepted below threshold and rejected when provider-hit count reaches threshold.
24. When strict mode and provider `min_success` are enabled, employee write is rejected if successful provider count is below configured minimum.
25. When provider circuit-breaker is enabled, failed providers are skipped during cooldown and strict `min_success` continues to gate employee writes.

## Boundary and Accuracy Cases

1. Overnight shift crossing midnight is mapped using 04:00 workday boundary.
2. Minute rounding behavior matches common SSoT rules.
3. Correction after initial approval creates auditable recalculation signal.
4. Reject reason length `> 500` is blocked and does not create audit/event side effects.
5. GPS capture channel without both latitude/longitude is blocked.
6. Latitude/longitude must be provided as a complete pair or omitted together.
7. GPS policy feature flag only applies to employee write path and is ignored when disabled.
8. Geofence policy feature flag only applies to employee write path and validates configured radius boundary.
9. Trusted device policy feature flag only applies to employee write path and validates configured allowlist.
10. Multi-site geofence policy feature flag only applies to employee write path and validates configured site list format and radius boundaries.
11. Device attestation policy feature flag only applies to employee write path and validates configured device/token mapping.
12. Anti-spoofing policy feature flag only applies to employee write path and validates allowed channel, GPS accuracy, and risk threshold configuration.
13. Signal-fusion/reputation policy feature flag only applies to employee write path and validates min-signal/reputation-penalty/high-risk-list configuration.
14. External reputation integration validates provider mode/URL/timeout/cache/strict-mode configuration and remote payload parsing.
15. Multi-provider external reputation integration validates URLs/aggregation/majority-threshold/min-success configuration.
16. External reputation circuit-breaker validates failure-threshold/cooldown configuration and open-circuit skip behavior.

## Regression Linkage

- `GC-001-standard-day.json`
- `GC-002-overnight-boundary.json`
- `GC-003-late-correction.json`
- `GC-005-retroactive-recalc.json`

## QA Gate Expectations

- Spec Gate: contract completeness and role matrix validated.
- Code Gate: unit/integration tests and fixture regression pass.
