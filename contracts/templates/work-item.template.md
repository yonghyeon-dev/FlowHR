# WI-XXXX: Title

## Background and Problem

Describe the user/business problem and why this item is needed now.

## Scope

### In Scope

- 

### Out of Scope

- 

## User Scenarios

1. 
2. 

## Payroll Accuracy and Calculation Rules

- Source of truth rule:
- Rounding rule:
- Exception handling rule:

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | System |
| --- | --- | --- | --- | --- |
| Example action | Allow | Allow | Deny | N/A |

## Data Changes (Tables and Migrations)

- Tables:
- Migration IDs:
- Backward compatibility plan:

## API and Event Changes

- Endpoints:
- Events published:
- Events consumed:

## Test Plan

- Unit:
- Integration:
- Regression:
- Authorization:
- Payroll accuracy:

## Observability and Audit Logging

- Audit events:
- Metrics:
- Alert conditions:

## Rollback Plan

- Feature flag behavior:
- DB rollback method:
- Recovery target time:

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
