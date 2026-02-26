# WI-0557: Scheduling Template Date Helper Extraction and Line-Budget Recovery

## Summary
- Goal: continue scheduling service modularization by extracting template date/weekday helper cluster.
- Scope:
  - `src/features/scheduling/service.ts`
  - `src/features/scheduling/template-date-helpers.ts`
  - `scripts/tests/e2e-wi0557-scheduling-template-date-helper-extraction-and-line-budget-recovery.test.ts`
  - `ROADMAP.md`

## Delivery
- Extracted date parsing, weekday resolution, date-range enumeration, and date formatting helpers to dedicated module.
- Rewired scheduling service to import extracted helpers.
- Preserved scheduling service <=4000 line guard after extraction.

## Validation
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0557-scheduling-template-date-helper-extraction-and-line-budget-recovery.test.ts`
