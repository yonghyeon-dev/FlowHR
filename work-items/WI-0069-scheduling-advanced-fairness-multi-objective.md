# WI-0069: Scheduling Advanced Fairness Multi-Objective Optimizer

## Background and Problem

Tenant-level fairness solver currently optimizes planned-minute/weekday balance (plus optional global gap).
Operators also need weighted decisions using employee template preferences and labor-law style constraints
without introducing manual per-employee schedule tuning.

## Scope

### In Scope

- Extend fairness report/apply payload with optional `advancedConstraints`:
  - `preference`:
    - `weight` (0..100)
    - per-employee rules (`preferredTemplateIds`, `avoidTemplateIds`)
  - `laborLaw`:
    - `weight` (0..100)
    - `minRestMinutesBetweenShifts` (optional)
    - `maxConsecutiveWorkDays` (optional)
- Extend fairness report response:
  - per-employee `advancedScore`
  - aggregate `advanced` summary
- Keep deterministic solver behavior for identical input.
- Preserve existing global constraints and write-back invariants.

### Out of Scope

- Legally final compliance engine for all jurisdictions
- Cross-tenant optimization
- Automatic remediation/retry for strict overlap conflict paths

## User Scenarios

1. Manager applies preference-heavy weighting and receives recommendation biased toward preferred templates.
2. Manager applies labor-law-heavy weighting and receives recommendation biased toward lower rest/consecutive violations.
3. Manager applies advanced fairness in one request and receives created schedule ids plus advanced summary.

## Payroll Accuracy and Calculation Rules

- Advanced fairness changes planned schedule recommendation only.
- Attendance and payroll arithmetic logic remain unchanged.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | System |
| --- | --- | --- | --- | --- |
| Fairness report with advanced constraints | Allow | Allow | Deny | Allow |
| Fairness apply with advanced constraints | Allow | Allow | Deny | Allow |

## Data Changes (Tables and Migrations)

- Tables impacted:
  - none (runtime scoring only)
- Migration IDs:
  - none
- Backward compatibility:
  - additive payload/response fields only

## API and Event Changes

- Updated endpoints:
  - `POST /scheduling/rotations/fairness`
  - `POST /scheduling/rotations/fairness/apply`
- Added request field:
  - `advancedConstraints`
- Added response fields:
  - `report.advanced`
  - `report.results[].advancedScore`
  - `result.advanced` (apply response)
- Events published:
  - none new (existing scheduling rotation events unchanged)

## Test Plan

- Unit:
  - advanced constraints normalization and weight/rule validation
  - deterministic multi-objective option scoring
- Integration:
  - preference-heavy and labor-heavy weight inversion changes selected offset
  - advanced summary and advancedScore payload shape/assertions
  - invalid preference template scope returns 404
- Regression:
  - no advanced constraints path remains backward compatible
  - global constraints behavior remains deterministic
- Authorization:
  - employee role denied on fairness report/apply
- Payroll accuracy:
  - no-impact assertion

## Observability and Audit Logging

- Audit events:
  - `scheduling.rotation.fairness.report.generated` (advanced summary payload extension)
  - `scheduling.rotation.fairness.applied` (advanced summary payload extension)
- Metrics:
  - `schedule_rotation_fairness_advanced_solver_count` (optional)
- Alert conditions:
  - none

## Rollback Plan

- Feature toggle:
  - none (additive behavior)
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
