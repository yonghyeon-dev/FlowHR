# WI-0004: External Domain Event HTTP Transport

## Background and Problem

FlowHR publishes contract events in-process only (`noop`/`memory`) and lacks external delivery path.
Without external transport, downstream integrations cannot subscribe to operational events in real time.

## Scope

### In Scope

- Runtime transport mode `http` for domain events.
- Configurable timeout/retry/fail-open policy.
- Delivery header/body contract documentation.
- Integration test for transport success/failure behavior.

### Out of Scope

- Kafka/SQS/NATS specific adapters.
- Consumer-side replay and dead-letter queue implementation.
- Guaranteed exactly-once semantics.

## User Scenarios

1. Operator enables `FLOWHR_EVENT_PUBLISHER=http` and events are POSTed to receiver endpoint.
2. Temporary receiver outage occurs and fail-open policy keeps core API flow available.
3. Strict mode (`fail-open=false`) blocks API completion on transport failure.

## Payroll Accuracy and Calculation Rules

- Not directly changing payroll formulas.
- Event emission must not alter payroll calculation result determinism.

## Authorization and Role Matrix

| Action | Admin | Manager | Employee | Payroll Operator |
| --- | --- | --- | --- | --- |
| Configure runtime event transport env | Allow | Deny | Deny | Allow (ops policy dependent) |
| Trigger domain event via business API | Allow | Allow | Allow (authorized scope) | Allow |

## Data Changes (Tables and Migrations)

- Tables: none
- Migration IDs: none
- Backward compatibility plan:
  - no DB schema impact

## API and Event Changes

- Endpoints:
  - internal outbound POST to configured event receiver
- Events published:
  - existing domain events (`*.v1`) without name changes
- Events consumed:
  - none

## Test Plan

- Unit:
  - runtime publisher mode selection
- Integration:
  - HTTP delivery success path
  - fail-open/fail-closed behavior
- Regression:
  - existing e2e event assertions remain green
- Authorization:
  - unchanged (existing business API authorization reused)
- Payroll accuracy:
  - no calculation logic change

## Observability and Audit Logging

- Audit events:
  - business audit events unchanged
- Metrics:
  - transport success/failure count (receiver side and app logs)
- Alert conditions:
  - repeated transport failures within retry budget

## Rollback Plan

- Feature flag behavior:
  - set `FLOWHR_EVENT_PUBLISHER=noop` for immediate rollback
- DB rollback method:
  - not applicable
- Recovery target time:
  - 10 minutes

## Definition of Ready (DoR)

- [x] Requirements are unambiguous and testable.
- [x] Domain contract impact reviewed.
- [x] Failure policy (fail-open/fail-closed) defined.
- [x] Test strategy prepared.
- [x] Rollback path documented.

## Definition of Done (DoD)

- [ ] HTTP transport mode works in integration tests.
- [ ] Existing CI quality gates stay green.
- [ ] Runtime configuration guide is documented.
- [ ] QA Spec Gate and Code Gate are both passed.
- [ ] ADR linked when architecture/compatibility changed.
