# WI-0015: Event Governance Traceability Check

## Background and Problem

Current traceability gate validates tables and migrations, but it does not verify that domain events are aligned across runtime code, contracts, and data ownership policy.
This can allow silent drift between published event docs and actual runtime event names.

## Scope

### In Scope

- Extend `scripts/ci/check_traceability.py` with event-level governance checks.
- Validate contract published events against runtime `domainEventNames`.
- Validate data-ownership published events against runtime `domainEventNames` (with process-event allowlist).
- Validate runtime event coverage in contracts and data ownership matrix.

### Out of Scope

- Event payload schema compatibility checks.
- Consumer-side event contract verification.
- Event broker delivery guarantees.

## User Scenarios

1. Developer adds runtime event but forgets contract/docs update and CI blocks merge.
2. Spec/docs introduce invalid event name not used by runtime and CI blocks merge.

## Payroll Accuracy and Calculation Rules

- Source of truth rule: runtime `domainEventNames` defines canonical publishable domain events.
- Rounding rule: not applicable.
- Exception handling rule: process-level orchestration events are allowed via explicit allowlist.

## Authorization and Role Matrix

| Action | Admin | Payroll Operator | Manager | Employee |
| --- | --- | --- | --- | --- |
| Update event governance checks | Allow | Allow | Deny | Deny |
| Merge event-contract drift fixes | Allow | Allow | Deny | Deny |

## Data Changes (Tables and Migrations)

- Tables: none
- Migration IDs: none
- Backward compatibility plan: CI/script and docs-only additive change

## API and Event Changes

- Endpoints: none
- Events published:
  - no new runtime event
  - governance check now enforces existing event set consistency
- Events consumed: none

## Test Plan

- Unit:
  - parse runtime event names from `domain-event-publisher.ts`
  - parse contract `api.events.published` entries
  - parse data ownership published events table entries
- Integration:
  - run `python scripts/ci/check_traceability.py` successfully on current repo
- Regression:
  - CI `contract-governance` fails on event drift
- Authorization:
  - not applicable
- Payroll accuracy:
  - not applicable

## Observability and Audit Logging

- Audit events:
  - none
- Metrics:
  - CI failure signal on event governance drift
- Alert conditions:
  - repeated `check_traceability` event mismatch failures

## Rollback Plan

- Feature flag behavior: not applicable.
- DB rollback method: not applicable.
- Recovery target time: 15m by reverting governance check changes.

## Definition of Ready (DoR)

- [ ] Requirements are unambiguous and testable.
- [ ] Domain contract drafted or updated.
- [ ] Role matrix reviewed by QA.
- [ ] Data migration impact assessed.
- [ ] Risk and rollback drafted.

## Definition of Done (DoD)

- [ ] Implementation matches approved contract.
- [ ] Required tests pass and coverage is updated.
- [ ] Audit logs are emitted for sensitive actions.
- [ ] QA Spec Gate and Code Gate are both passed.
- [ ] ADR linked when architecture/compatibility changed.
