# WI-0404: Employee Interaction Handler Builder Extraction

## Summary
- Goal: reduce `src/app/employee/page.tsx` size and prevent new inline handler stacking.
- Change:
  - Added `buildEmployeeInteractionHandlers` wiring in `src/app/employee/page.tsx` and switched from many page-local wrappers to one handler bundle.
  - Kept behavior the same while moving interaction orchestration into `src/app/employee/page-interaction-actions.ts`.
  - Expanded builder return contract to include attendance correction draft application handler for panel callback wiring.
- Outcome:
  - `src/app/employee/page.tsx` line count reduced to below 1000 (`976` lines in this WI).
  - Interaction orchestration now has a single composition point, reducing future bloat risk.

## Scope
- `src/app/employee/page.tsx`
- `src/app/employee/page-interaction-actions.ts`
- `scripts/tests/e2e-wi0404-employee-interaction-handler-builder-extraction.test.ts`
- `work-items/WI-0404-employee-interaction-handler-builder-extraction.md`
- `ROADMAP.md`

## Validation
- `npm.cmd exec tsx scripts/tests/e2e-wi0343-employee-page-decomposition-phase2.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0351-leave-calendar-cell-click-prefill-leave-form.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0376-employee-request-helper-extraction-and-runtime-datetime-locale.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0383-employee-validation-helper-extraction.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0384-employee-derived-helper-phase3-extraction.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0404-employee-interaction-handler-builder-extraction.test.ts`
- `npm.cmd run build`
