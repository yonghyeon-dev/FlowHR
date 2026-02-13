# Golden Cases for Attendance to Payroll

Golden cases are fixed regression references for:

`attendance record -> attendance aggregation -> payroll gross pay`.

## Usage

- Fixtures live in `qa/golden/fixtures/*.json`.
- CI validates fixture schema and blocks invalid changes.
- Domain tests should load these fixtures and compare with expected output.

## Covered Scenario Set

| Fixture ID | Scenario | Risk Focus |
| --- | --- | --- |
| GC-001 | Standard daytime attendance | Baseline correctness |
| GC-002 | Overnight shift crossing workday boundary | Boundary correctness |
| GC-003 | Late arrival with approved correction | Correction and recalculation |
| GC-004 | Holiday work with overtime | Multiplier correctness |
| GC-005 | Retroactive edit after payroll preview | Recalculation traceability |
| GC-006 | Phase2 deduction profile mode preview | Net pay and profile trace determinism |

## Expected Outputs (Minimum)

Each fixture must provide:

- normalized attendance summary
- categorized payable minutes
- expected gross pay (KRW)
- expected phase2 deductions/net pay when applicable
- expected audit event sequence

## Change Control

- Any expected output change must include:
  - linked work item
  - contract version bump
  - ADR if behavior is breaking
