# WI-0062: Attendance External Reputation Integration Baseline

## Background and Problem

Anti-spoofing signal-fusion baseline (WI-0060) supports static risk lists, but operations need dynamic external reputation signals without redeploying config.

Phase 2 requires a controlled dynamic reputation integration path that can merge remote risk lists into anti-spoofing scoring while keeping feature-flag safety.

## Scope

### In Scope

- Extend anti-spoofing runtime to optionally load remote reputation snapshot:
  - provider mode: `static` or `remote`
  - remote snapshot fields: high-risk device IDs, high-risk IP addresses
- Add dynamic reputation flags/config:
  - `FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_ENABLED`
  - `FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_PROVIDER`
  - `FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_URL`
  - `FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_TIMEOUT_MS`
  - `FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_CACHE_TTL_SECONDS`
  - `FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_STRICT_MODE`
- Merge remote lists with static local lists when enabled.
- Strict mode:
  - provider failure/invalid payload -> request rejected
- Non-strict mode:
  - provider failure -> static list fallback
- Keep existing employee-only enforcement and manager bypass behavior.

### Out of Scope

- Provider-side authentication/secret rotation orchestration
- Circuit-breaker dashboard and operational auto-remediation
- Multi-provider consensus/ranking

## User Scenarios

1. Employee write with device/IP marked high-risk by remote provider is rejected.
2. Employee write with safe remote reputation is accepted.
3. Manager correction path remains allowed regardless of remote reputation result.
4. Strict mode fails closed when remote provider cannot be loaded.

## Payroll Accuracy and Calculation Rules

- Policy impacts attendance write acceptance only.
- Payroll calculation logic remains unchanged.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | System |
| --- | --- | --- | --- | --- |
| External reputation enforcement on attendance write | Bypass | Bypass | Enforced | Bypass |
| Attendance write | Allow | Allow | Own-only | Allow |

## Data Changes (Tables and Migrations)

- Tables impacted:
  - none
- Migration IDs:
  - none (runtime policy behavior only)
- Backward compatibility:
  - additive flag/config behavior only

## API and Event Changes

- Endpoint behavior updates:
  - `POST /attendance/records` applies dynamic external reputation penalties when enabled
  - `PATCH /attendance/records/{recordId}` applies dynamic external reputation penalties on effective capture when enabled
- Events published:
  - none (existing attendance events unchanged)
- Events consumed:
  - none

## Test Plan

- Unit:
  - provider mode parsing and config validation
  - remote payload parsing boundaries
  - strict-mode and fallback behavior
- Integration:
  - remote high-risk device/ip rejection
  - safe remote reputation acceptance
  - manager bypass path remains allowed
- Regression:
  - WI-0060 signal-fusion baseline remains valid when external reputation disabled
- Authorization:
  - employee-only enforcement
- Payroll accuracy:
  - no-impact assertion

## Observability and Audit Logging

- Audit events:
  - existing attendance audit events unchanged
- Metrics:
  - `attendance_anti_spoofing_external_reputation_reject_count` (optional)
- Alert conditions:
  - none

## Rollback Plan

- Feature toggle:
  - disable `FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_ENABLED`
- DB rollback:
  - none
- Recovery target:
  - < 15m

## Definition of Ready (DoR)

- [x] Requirements are unambiguous and testable.
- [x] Domain contract drafted or updated.
- [x] Role matrix reviewed by QA.
- [x] Data migration impact assessed.
- [x] Risk and rollback drafted.

## Definition of Done (DoD)

- [ ] Implementation matches approved contract.
- [ ] Required tests pass and coverage is updated.
- [ ] Audit logs are emitted for sensitive actions.
- [ ] QA Spec Gate and Code Gate are both passed.
- [ ] ADR linked when architecture/compatibility changed.
