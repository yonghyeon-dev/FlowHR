# WI-0030: Deduction Profile List API

## Background and Problem

Deduction profiles can be created/updated and read by ID, but there is no list API to discover available profiles.
The MVP console and future UI need an endpoint to list profiles for selection and review.

## Scope

### In Scope

- Add `GET /payroll/deduction-profiles` to list deduction profiles.
- Optional filters:
  - `active=true|false`
  - `mode=manual|profile`
- Authorization:
  - `admin`, `payroll_operator`: allow
  - other roles: deny

### Out of Scope

- Pagination and cursor-based listing.
- Soft-delete or archive semantics.

## User Scenarios

1. Payroll operator lists active profiles to pick one for profile-mode preview.
2. Admin lists all profiles (active + inactive) for audit.

## Payroll Accuracy and Calculation Rules

- Source of truth rule: returns persisted `DeductionProfile` rows.
- Rounding rule: not applicable.
- Exception handling rule: invalid query returns `400`.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | Payroll Operator | System |
| --- | --- | --- | --- | --- | --- |
| List deduction profiles | Allow | Deny | Deny | Allow | N/A |

## Data Changes (Tables and Migrations)

- Tables: none
- Migration IDs: none
- Backward compatibility plan: additive API only

## API and Event Changes

- Endpoints:
  - `GET /payroll/deduction-profiles`
- Events published: none
- Events consumed: none

## Test Plan

- Unit:
  - query parsing (`active`, `mode`)
  - role guard (403)
- Integration:
  - list returns upserted profiles
  - filter by active/mode works
- Regression:
  - existing WI-0006 profile-mode flow remains green

## Observability and Audit Logging

- Audit events: none for MVP (avoid noise)
- Metrics: none
- Alert conditions: none

## Rollback Plan

- Feature flag behavior: not applicable (additive endpoint)
- DB rollback method: not applicable
- Recovery target time: immediate by reverting route/service changes

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

