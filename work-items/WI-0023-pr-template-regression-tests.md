# WI-0023: PR Template Gate Regression Tests

## Background and Problem

`check_pr_template.py` now blocks PRs with missing checklist metadata, but there was no regression harness to lock expected behavior.
Future edits to the script could silently weaken governance checks if pass/fail paths are not tested.

## Scope

### In Scope

- Add `scripts/ci/test_check_pr_template_regression.py` with deterministic pass/fail cases.
- Validate key behaviors:
  - empty body skip
  - valid PR template pass
  - Work Item link missing fail
  - required checkbox unchecked fail
  - break-glass trigger without required fields fail
  - break-glass with all required fields pass
- Wire regression tests into `contract-governance` workflow.

### Out of Scope

- Semantic validation for linked WI/ADR file content.
- PR auto-fix or bot comments.
- Runtime API/product behavior changes.

## User Scenarios

1. Script refactor breaks Work Item validation and CI catches it immediately.
2. Break-glass field validation regression is blocked before merge.
3. Governance rules remain stable across future policy updates.

## Payroll Accuracy and Calculation Rules

- Source of truth rule: PR metadata governance is enforced by executable tests.
- Rounding rule: not applicable.
- Exception handling rule: non-PR/local run remains skip-safe.

## Authorization and Role Matrix

| Action | Orchestrator | QA Agent | Domain Agent | Employee |
| --- | --- | --- | --- | --- |
| Update PR template regression tests | Allow | Allow | Allow | Deny |
| Merge governance regression updates | Allow | Allow | Allow | Deny |

## Data Changes (Tables and Migrations)

- Tables: none
- Migration IDs: none
- Backward compatibility plan: CI-only test harness

## API and Event Changes

- Endpoints: none
- Events published: none
- Events consumed: none

## Test Plan

- Unit:
  - six regression cases in `test_check_pr_template_regression.py`
- Integration:
  - `contract-governance` workflow executes PR template regression tests
- Regression:
  - existing contract/pr/traceability gates remain green

## Observability and Audit Logging

- Audit events:
  - none
- Metrics:
  - contract-governance failure count for PR template regression tests
- Alert conditions:
  - repeated PR template regression failures

## Rollback Plan

- Feature flag behavior: not applicable.
- DB rollback method: not applicable.
- Recovery target time: 15m by removing regression step and reverting script.

## Definition of Ready (DoR)

- [ ] PR template rule set is stable.
- [ ] Required pass/fail examples are identified.
- [ ] CI insertion point is confirmed.

## Definition of Done (DoD)

- [ ] PR template regression test script is implemented.
- [ ] CI runs regression script in governance job.
- [ ] WI and execution plan are updated.
