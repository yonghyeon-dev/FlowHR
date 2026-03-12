# WI-1196: Admin payroll filing summary card compaction follow-up

## Background

`WI-1195` calmed the diagnostics rail so reference logs and recovery cues no longer compete with blockers.
The next density seam is the settlement summary itself. The finalization and export summary cards still read like generic stacked note cards instead of one compact payroll-lane summary pair.

## Scope

1. Compact the finalization and filing-export summary cards inside `/admin/payroll-year-end-filing` so key signals read in one quicker scan.
2. Reduce repeated list noise in the settlement summary pair while keeping blocking reasons and validation issues visible.
3. Update any stale regression guards that still expect the older summary-card spacing.

## Done When

1. Finalization and export summary cards read as one compact summary pair with a faster visual scan path.
2. Blocking reasons and validation issues remain visible without dominating the supporting rail.
3. Current quality gates remain green.
