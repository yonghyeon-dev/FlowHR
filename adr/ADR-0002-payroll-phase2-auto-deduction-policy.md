# ADR-0002: Payroll Phase2 Auto Deduction Policy Mode

- Status: Accepted
- Date: 2026-02-13
- Related Work Item: `work-items/WI-0006-payroll-phase2-deduction-policy-runtime.md`

## Context

Phase2 payroll currently requires deduction values to be passed directly on each preview request.  
This increases operator error risk and makes repeated payroll runs hard to reproduce.

## Decision

Introduce a deduction profile model and extend phase2 preview with two explicit modes:

- `manual`: caller provides concrete deduction values.
- `profile`: server derives deduction values from versioned `DeductionProfile`.

Persist profile trace metadata on payroll run so confirmed net pay can be audited.

## Consequences

### Positive

- Reduces manual input variance.
- Improves auditability with profile version trace.
- Keeps current manual flow for backward compatibility.

### Negative

- Adds schema and API complexity.
- Requires profile lifecycle governance and authorization checks.

### Risks and Mitigations

- Risk: stale profile used for payroll run.
  - Mitigation: include profile version in run payload and audit event.
- Risk: mode confusion by consumers.
  - Mitigation: explicit mode enum + contract validation + test cases.

## Compatibility

- Contract change type: non-breaking additive (SemVer minor).
- Existing `preview-with-deductions` request remains valid in `manual` mode.

## Rollout

1. Add contract/spec and tests.
2. Implement runtime behind feature flag (`payroll_deduction_profile_v1`).
3. Enable per-environment after regression and QA gate pass.
