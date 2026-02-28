# WI-0650 Employee Attendance Prefill Effect Extraction + Line-Budget Recovery

## Summary
- extracted schedule-based attendance-correction prefill effect from `src/app/employee/page.tsx` into:
  - `src/app/employee/page-attendance-prefill-effect.ts`
- moved the `resolveAttendanceCorrectionTargetFromScheduleRange` orchestration into the new hook while preserving existing behavior:
  - initial prefill to check-in/check-out/note
  - idempotent apply using `appliedAttendanceSchedulePrefillRef`
  - correction target auto-selection within schedule range
- reduced `src/app/employee/page.tsx` line count back under 500

## Scope
- employee self-service page maintainability refactor only
- no API/schema/contract changes
- no runtime behavior changes intended

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0616-employee-attendance-correction-prefill-from-schedule-context.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0650-employee-attendance-prefill-effect-extraction-line-budget-recovery.test.ts`
- `npm.cmd run typecheck`
