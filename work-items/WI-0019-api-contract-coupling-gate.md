# WI-0019: API/Contract Coupling Gate

## Background and Problem

Even with version alignment checks, `api.yaml` can still be edited alone in a PR without a sibling `contract.yaml` version bump.
This allows undocumented API changes to bypass contract version governance intent.

## Scope

### In Scope

- Extend contract governance diff checks so changed `api.yaml` requires sibling `contract.yaml` change.
- Fail CI when `api.yaml` changed but same-domain `contract.yaml` did not change.
- Document the new rule in versioning policy.
- Add WI and execution-plan completion entries.

### Out of Scope

- OpenAPI semantic diff classification.
- Automatic version bump suggestion bot.
- Runtime API behavior changes.

## User Scenarios

1. Developer edits `specs/attendance/api.yaml` but forgets contract update and CI fails.
2. Developer updates API + contract together and CI passes.
3. Reviewer can rely on CI to enforce contract-first discipline for API spec changes.

## Payroll Accuracy and Calculation Rules

- Source of truth rule: API surface changes must be reflected in same-domain contract revision.
- Rounding rule: not applicable.
- Exception handling rule: API-only spec change is blocked until contract/version updates are included.

## Authorization and Role Matrix

| Action | Orchestrator | Domain Agent | QA Agent | Employee |
| --- | --- | --- | --- | --- |
| Update governance check scripts | Allow | Allow | Allow | Deny |
| Merge API contract-coupling policy changes | Allow | Allow | Allow | Deny |

## Data Changes (Tables and Migrations)

- Tables: none
- Migration IDs: none
- Backward compatibility plan: CI guard only, no runtime schema changes

## API and Event Changes

- Endpoints: none
- Events published: none
- Events consumed: none

## Test Plan

- Unit:
  - changed `api.yaml` without changed sibling `contract.yaml` fails
  - changed `api.yaml` with changed sibling `contract.yaml` passes coupling check
- Integration:
  - `python scripts/ci/check_contracts.py` passes on current repository
- Regression:
  - existing governance checks continue to pass
- Authorization:
  - not applicable
- Payroll accuracy:
  - not applicable

## Observability and Audit Logging

- Audit events:
  - none
- Metrics:
  - contract-governance failure count for API-only changes
- Alert conditions:
  - repeated API-only governance failures

## Rollback Plan

- Feature flag behavior: not applicable.
- DB rollback method: not applicable.
- Recovery target time: 15m by reverting coupling rule.

## Definition of Ready (DoR)

- [ ] API-only governance gap is reproducible.
- [ ] Coupling rule has deterministic domain mapping.
- [ ] Scope constrained to CI policy.

## Definition of Done (DoD)

- [ ] `check_contracts.py` blocks API-only spec changes without sibling contract update.
- [ ] Versioning policy reflects the new coupling rule.
- [ ] WI and execution plan are updated.
