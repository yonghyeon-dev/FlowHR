# WI-1198: Admin payroll filing blocker card compaction follow-up

## Background

`WI-1197` compacts the submission timeline card so filing follow-up updates no longer sprawl like a generic log panel.
The next density seam is the blocker card itself. The preflight blocker panel still expands into long stacked failure and warning lists instead of one compact operator-priority block.

## Scope

1. Compact the `/admin/payroll-year-end-filing` blocker card so failed checks, warnings, and next actions scan as one operator-priority block.
2. Reduce repeated list framing in the blocker panel while keeping direct follow-up actions obvious.
3. Update any stale regression guards that still expect the older blocker-card density.

## Done When

1. The blocker card reads as one compact operator-priority block beside the filing workspace.
2. Failed checks and warnings remain actionable without expanding into a generic stacked log list.
3. Current quality gates remain green.
