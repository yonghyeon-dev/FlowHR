# WI-0021: PR Template Compliance Gate

## Background and Problem

PR template has required checklists (Work Item/contract/test/QA/ADR/break-glass), but completion is manual and unenforced.
Unchecked or incomplete PR metadata can bypass governance intent even when code-level tests pass.

## Scope

### In Scope

- Add `scripts/ci/check_pr_template.py` to validate PR body against required checklist items.
- Enforce Work Item link format in PR summary.
- Enforce ADR section choice (ADR added or Not required with reason).
- Validate break-glass required fields when emergency triggers are checked.
- Wire script into `contract-governance` workflow for `pull_request` events.

### Out of Scope

- Semantic validation of linked WI/ADR file content.
- Automatic PR body auto-fix.
- Runtime product behavior changes.

## User Scenarios

1. PR with unchecked required checklist cannot pass governance gate.
2. PR missing Work Item link fails early before merge.
3. Break-glass PR with missing incident/approval fields is blocked.

## Payroll Accuracy and Calculation Rules

- Source of truth rule: PR-level governance evidence must be complete before merge.
- Rounding rule: not applicable.
- Exception handling rule: break-glass remains allowed only with complete metadata.

## Authorization and Role Matrix

| Action | Orchestrator | Domain Agent | QA Agent | Employee |
| --- | --- | --- | --- | --- |
| Update PR compliance checks | Allow | Allow | Allow | Deny |
| Merge PR template gate changes | Allow | Allow | Allow | Deny |

## Data Changes (Tables and Migrations)

- Tables: none
- Migration IDs: none
- Backward compatibility plan: CI-only governance change

## API and Event Changes

- Endpoints: none
- Events published: none
- Events consumed: none

## Test Plan

- Unit:
  - missing required checkbox fails
  - missing Work Item summary link fails
  - ADR choice missing fails
  - break-glass trigger with missing required fields fails
- Integration:
  - script executes in `contract-governance` workflow for PR events
- Regression:
  - non-PR/local execution without PR body safely skips

## Observability and Audit Logging

- Audit events:
  - none
- Metrics:
  - PR template compliance failure count in `contract-governance` job
- Alert conditions:
  - repeated PR metadata compliance failures

## Rollback Plan

- Feature flag behavior: not applicable.
- DB rollback method: not applicable.
- Recovery target time: 15m by reverting compliance step/script.

## Definition of Ready (DoR)

- [ ] Required PR checklist labels are finalized.
- [ ] Work item and break-glass field requirements are defined.
- [ ] Workflow insertion point is agreed.

## Definition of Done (DoD)

- [ ] PR template compliance script is added.
- [ ] `contract-governance` workflow executes the script on PRs.
- [ ] WI and execution plan are updated.
