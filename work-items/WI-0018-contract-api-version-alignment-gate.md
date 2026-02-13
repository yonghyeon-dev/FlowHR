# WI-0018: Contract/API Version Alignment Gate

## Background and Problem

Contract governance validates `contract.yaml` schema and versioning diffs, but it does not enforce alignment with sibling `api.yaml` version.
This gap can allow inconsistent contract/API version declarations and weaken consumer trust in version signals.

## Scope

### In Scope

- Extend `scripts/ci/check_contracts.py` to require sibling `api.yaml` for each `contract.yaml`.
- Validate `api.yaml` `info.version` format as SemVer.
- Fail CI when `contract.yaml` version differs from `api.yaml` version.
- Record work item and execution-plan completion entry.

### Out of Scope

- OpenAPI schema completeness validation beyond `info.version`.
- Cross-repo consumer contract compatibility checks.
- Automatic version bumping logic.

## User Scenarios

1. Developer updates contract version but forgets API version and CI blocks merge.
2. API version format is invalid and CI fails before review.
3. Missing sibling `api.yaml` is surfaced immediately as governance error.

## Payroll Accuracy and Calculation Rules

- Source of truth rule: contract and API docs must expose identical semantic versions per domain.
- Rounding rule: not applicable.
- Exception handling rule: governance failure blocks merge until version alignment is restored.

## Authorization and Role Matrix

| Action | Orchestrator | Domain Agent | QA Agent | Employee |
| --- | --- | --- | --- | --- |
| Update contract governance script | Allow | Allow | Allow | Deny |
| Merge version-gate changes | Allow | Allow | Allow | Deny |

## Data Changes (Tables and Migrations)

- Tables: none
- Migration IDs: none
- Backward compatibility plan: CI-only guard, no runtime schema impact

## API and Event Changes

- Endpoints: none
- Events published: none
- Events consumed: none

## Test Plan

- Unit:
  - contract lint catches missing sibling `api.yaml`
  - contract lint catches invalid `api.yaml` `info.version`
  - contract lint catches contract/API version mismatch
- Integration:
  - run `python scripts/ci/check_contracts.py` against current repo (expected pass)
- Regression:
  - existing quality gates remain green
- Authorization:
  - not applicable
- Payroll accuracy:
  - not applicable

## Observability and Audit Logging

- Audit events:
  - none
- Metrics:
  - CI governance failure count (existing pipeline metrics)
- Alert conditions:
  - repeated contract-governance failures on version mismatch

## Rollback Plan

- Feature flag behavior: not applicable.
- DB rollback method: not applicable.
- Recovery target time: 15m by reverting script-level validation changes.

## Definition of Ready (DoR)

- [ ] Governance gap is reproducible.
- [ ] Validation rules are deterministic.
- [ ] Scope limited to CI/doc alignment.

## Definition of Done (DoD)

- [ ] `check_contracts.py` enforces sibling API version alignment.
- [ ] Current repository passes updated governance checks.
- [ ] WI and execution plan are updated.
