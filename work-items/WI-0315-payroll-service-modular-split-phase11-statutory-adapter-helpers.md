# WI-0315: Payroll Service Modular Split Phase 11 (Statutory Adapter Helpers)

## Background

`src/features/payroll/service.ts` still carried KR statutory helper wrapper logic
and related adapter types inline. This mixed domain orchestration with adapter
details and made the service file harder to maintain.

## Scope

- Extract KR statutory helper wrappers and adapter types into:
  - `src/features/payroll/service-statutory-adapter-helpers.ts`
- Rewire `src/features/payroll/service.ts` to consume the extracted module.
- Add WI-0315 regression test coverage.

## Out of Scope

- API/schema/contract changes
- New payroll feature behavior
- UI changes

## Acceptance

1. `service.ts` imports statutory wrapper helpers/types from the new adapter module.
2. Inline adapter types and wrapper functions are removed from `service.ts`.
3. WI-0315 regression and build checks pass.

## Notes

- Related issue: `#399`
- Structural decomposition WI (backend-only)
