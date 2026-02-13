# WI-0020: Contract Governance Regression Test Harness

## Background and Problem

`check_contracts.py` has expanded rules (SemVer, breaking change major bump, contract/API alignment, API/contract coupling), but these rules were not protected by dedicated regression tests.
Script refactors could silently weaken governance enforcement if behavior is not fixed by automated tests.

## Scope

### In Scope

- Add Python regression tests for core `check_contracts.py` behaviors.
- Cover sibling `api.yaml` requirement and version mismatch detection.
- Cover API-only spec change blocking logic.
- Cover version bump and breaking change MAJOR bump rules.
- Run regression tests in `contract-governance` CI job.

### Out of Scope

- OpenAPI semantic diffing by endpoint payload.
- Consumer SDK compatibility tests.
- Runtime API behavior changes.

## User Scenarios

1. CI fails immediately if someone breaks API-only coupling logic.
2. CI fails if script regression stops enforcing SemVer bump rule.
3. Team can refactor governance code with confidence due to fixed regression suite.

## Payroll Accuracy and Calculation Rules

- Source of truth rule: contract governance scripts are release gates; regressions must fail pre-merge.
- Rounding rule: not applicable.
- Exception handling rule: not applicable.

## Authorization and Role Matrix

| Action | Orchestrator | Domain Agent | QA Agent | Employee |
| --- | --- | --- | --- | --- |
| Update governance regression tests | Allow | Allow | Allow | Deny |
| Merge governance gate test changes | Allow | Allow | Allow | Deny |

## Data Changes (Tables and Migrations)

- Tables: none
- Migration IDs: none
- Backward compatibility plan: CI-only change, no runtime migration impact

## API and Event Changes

- Endpoints: none
- Events published: none
- Events consumed: none

## Test Plan

- Unit:
  - missing sibling `api.yaml` is detected
  - contract/API version mismatch is detected
  - API-only change without contract update is blocked
  - unchanged contract version after change is blocked
  - `breaking_changes=true` without MAJOR bump is blocked
- Integration:
  - `python scripts/ci/test_check_contracts_regression.py` runs in CI `contract-governance` job
- Regression:
  - `python scripts/ci/check_contracts.py` still passes for current repository

## Observability and Audit Logging

- Audit events:
  - none
- Metrics:
  - contract-governance regression test failures (CI)
- Alert conditions:
  - repeated failures in contract-governance job

## Rollback Plan

- Feature flag behavior: not applicable.
- DB rollback method: not applicable.
- Recovery target time: 15m by reverting regression harness integration.

## Definition of Ready (DoR)

- [ ] Governance rules and expected behavior are documented.
- [ ] Test fixtures/cases are deterministic.
- [ ] CI location for execution is confirmed.

## Definition of Done (DoD)

- [ ] Regression test script is added and executable.
- [ ] CI contract-governance job runs the regression test script.
- [ ] WI and execution plan reflect completion.
