# WI-0597: Scheduling Side-Effect Helper Extraction and Contract Status Fallbacks

## Summary
- Goal: reduce scheduling service monolith size and harden Korean status fallback labels in contract surfaces.
- Scope:
  - `src/features/scheduling/service.ts`
  - `src/features/scheduling/anomaly-side-effect-helpers.ts`
  - `src/features/scheduling/schedule-input-normalization-helpers.ts`
  - `src/components/contracts/status-label-helpers.ts`
  - `src/components/contracts/AdminContractsWorkspace.tsx`
  - `src/components/contracts/EmployeeContractsResponsePanel.tsx`
  - `src/components/contracts/EmployeeContractsInboxList.tsx`
  - `scripts/tests/e2e-wi0597-scheduling-side-effect-helper-extraction-and-contract-status-fallbacks.test.ts`
  - `ROADMAP.md`

## Delivery
- Extracted scheduling anomaly side-effect emitters from `service.ts` into `anomaly-side-effect-helpers.ts`.
  - `emitAnomalyAlertIfEnabled`
  - `emitAnomalyEscalationIfEnabled`
  - `emitAnomalyCockpitTicketRequestsIfEnabled`
- Extracted scheduling input/validation helpers into `schedule-input-normalization-helpers.ts`.
  - period/threshold/topN validation and schedule/template DTO conversion.
- Added contracts status label fallback helpers in `status-label-helpers.ts`.
  - document fallback: `알 수 없는 상태`
  - approval fallback: `알 수 없는 승인 상태`
- Applied fallback label resolution to:
  - admin contracts document list
  - employee contracts response detail panel
  - employee contracts inbox list (wrapper 유지로 기존 회귀 테스트 호환)

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0597-scheduling-side-effect-helper-extraction-and-contract-status-fallbacks.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0596-korean-residual-bugpack-withholding-payslips-contracts.test.ts`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0578-scheduling-anomaly-lifecycle-audit-response-helper-extraction.test.ts`
- [x] `npm.cmd run lint`
- [x] `npm.cmd run typecheck`
