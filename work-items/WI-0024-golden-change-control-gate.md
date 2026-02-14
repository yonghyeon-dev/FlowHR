# WI-0024: Golden Fixture Change-Control Gate

## Background and Problem

`qa/golden-cases.md` defines strict change-control rules for fixture updates, but previous CI only validated JSON structure.
Without diff-aware enforcement, fixture behavior changes could merge without linked work item, contract update, or ADR for breaking changes.

## Scope

### In Scope

- Extend `check_golden_fixtures.py` with diff-aware change-control checks (`--base/--head`):
  - fixture changes require linked `work-items/WI-*.md` update
  - fixture changes require `specs/*/contract.yaml` update
  - breaking fixture changes require ADR update (`adr/ADR-*.md`)
- Define breaking fixture heuristic:
  - fixture delete/rename
  - fixture id change in modified JSON
- Add regression tests for golden change-control logic.
- Wire checks into CI `golden-regression` job.

### Out of Scope

- Automatic semantic classification of all fixture expectation changes.
- PR auto-fix for missing links.
- Runtime payroll engine changes.

## User Scenarios

1. Developer edits fixture expected values but forgets work item/contract update and CI blocks merge.
2. Developer renames/removes fixture without ADR and CI blocks merge.
3. Governance refactor breaks golden change-control logic and regression tests fail immediately.

## Payroll Accuracy and Calculation Rules

- Source of truth rule: golden fixtures are release safety artifacts and must be trace-linked to contract/work item.
- Rounding rule: not applicable.
- Exception handling rule: not applicable.

## Authorization and Role Matrix

| Action | Orchestrator | QA Agent | Domain Agent | Employee |
| --- | --- | --- | --- | --- |
| Update golden change-control gate | Allow | Allow | Allow | Deny |
| Merge golden governance updates | Allow | Allow | Allow | Deny |

## Data Changes (Tables and Migrations)

- Tables: none
- Migration IDs: none
- Backward compatibility plan: CI-only governance enforcement

## API and Event Changes

- Endpoints: none
- Events published: none
- Events consumed: none

## Test Plan

- Unit:
  - `evaluate_change_control` validates required linked updates
  - `detect_breaking_fixture_change` validates delete/rename/id-change behavior
- Integration:
  - CI passes base/head SHAs into `check_golden_fixtures.py`
  - regression script `test_check_golden_fixtures_regression.py` runs in workflow
- Regression:
  - existing golden fixture schema checks remain green

## Observability and Audit Logging

- Audit events:
  - none
- Metrics:
  - golden-regression gate failure count for link policy violations
- Alert conditions:
  - repeated change-control violations on fixture updates

## Rollback Plan

- Feature flag behavior: not applicable.
- DB rollback method: not applicable.
- Recovery target time: 15m by reverting golden change-control policy patch.

## Definition of Ready (DoR)

- [ ] Golden change-control rules are documented.
- [ ] Breaking fixture heuristic is agreed.
- [ ] CI workflow integration points are identified.

## Definition of Done (DoD)

- [ ] Golden diff-aware change-control checks are implemented.
- [ ] Regression tests for golden governance script are added.
- [ ] CI executes new checks and tests.
- [ ] WI and execution plan are updated.
