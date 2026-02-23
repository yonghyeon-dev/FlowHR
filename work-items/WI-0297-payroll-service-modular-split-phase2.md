# WI-0297: Payroll Service Modular Split Phase 2

## Background

After WI-0295, `src/features/payroll/service.ts` remained oversized.
This WI continues decomposition by moving year-end settlement hash and audit payload parser helpers to a dedicated module.

## Scope

- Add:
  - `src/features/payroll/year-end-audit-payload-helpers.ts`
- Rewire `src/features/payroll/service.ts` to delegate:
  - settlement hash normalization/resolution
  - year-end finalization payload parsing
  - year-end filing audit payload parsing

## Out of Scope

- New payroll workflow features
- API contract/schema changes
- UI changes

## Acceptance

1. Existing year-end filing/finalization behavior remains unchanged.
2. Parser/hash helper logic is isolated from monolithic service file.
3. Payroll regression checks pass.

## Notes

- Related issue: `#363`
- Refactor-only WI (no contract version bump required)
