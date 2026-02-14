# WI-0033: Roadmap Alignment and Phase 1 Backlog Seeding

## Background and Problem

`ROADMAP.md` and `docs/execution-plan.md` describe the current state and the next priorities. As the repo evolves, these documents must remain consistent with:

- merged Work Items under `work-items/`
- contract-first single sources under `specs/`
- production hardening expectations (data integrity, RBAC, multi-tenant isolation)

Right now, Phase 1 priorities (Employee/Organization master, RBAC, multi-tenant) need to be made explicit and traceable in the repo structure.

## Scope

### In Scope

- Update `ROADMAP.md` to reflect newly merged WI status and correct WI numbering going forward.
- Update `docs/execution-plan.md` to align with the roadmap and identify Phase 1 as the next focus.
- Create initial Phase 1 Work Item stubs (Employee/Organization, FK migration, RBAC, multi-tenant RLS) so work can start contract-first.
- Update ops spec artifacts (`specs/ops/*`) to track these planning/governance doc changes.

### Out of Scope

- Implementing Phase 1 runtime (this WI is documentation/backlog seeding only).
- Changing attendance/leave/payroll business rules.

## User Scenarios

1. Maintainer: can see current completed WIs and the next Phase 1 foundation tasks clearly.
2. QA: can review Phase 1 scope and risks before runtime work begins.
3. Operator: planning artifacts remain compatible with CI governance gates.

## Payroll Accuracy and Calculation Rules

- Not applicable.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | System |
| --- | --- | --- | --- | --- |
| Update roadmap and work item stubs | Allow | Deny | Deny | N/A |

## Data Changes (Tables and Migrations)

- Tables: none
- Migration IDs: none
- Backward compatibility plan: not applicable

## API and Event Changes

- Endpoints: none
- Events published: none
- Events consumed: none

## Test Plan

- Unit: not applicable
- Integration: not applicable
- Regression: contract-governance must pass after doc/work-item changes
- Authorization: not applicable
- Payroll accuracy: not applicable

## Observability and Audit Logging

- Audit events: none
- Metrics: none
- Alert conditions: none

## Rollback Plan

- Feature flag behavior: not applicable
- DB rollback method: not applicable
- Recovery target time: revert doc/WI changes

## Definition of Ready (DoR)

- [ ] ROADMAP changes proposed and reviewed.
- [ ] Phase 1 WIs created with clear scope and risks.

## Definition of Done (DoD)

- [ ] ROADMAP and execution plan are consistent with repo state.
- [ ] Phase 1 WI stubs exist and are ready for contract-first expansion.
- [ ] CI governance checks pass.

