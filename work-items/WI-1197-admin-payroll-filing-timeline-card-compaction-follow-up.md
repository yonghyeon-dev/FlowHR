# WI-1197: Admin payroll filing timeline card compaction follow-up

## Background

`WI-1196` compressed the settlement summary pair so finalization and export signals now scan faster in the supporting rail.
The next seam is the submission timeline card. Timeline entries still read like a long generic note card instead of one compact follow-up stream that matches the surrounding payroll-lane density.

## Scope

1. Compact the `/admin/payroll-year-end-filing` submission timeline card so entry actions, timestamps, and response notes read in one tighter follow-up stream.
2. Reduce repeated copy and spacing in the timeline panel while keeping response and evidence notes legible.
3. Update any stale regression guards that still expect the older timeline-card density.

## Done When

1. The filing timeline card reads as one compact payroll-lane follow-up stream.
2. Response and evidence notes remain visible without expanding the panel into a generic log block.
3. Current quality gates remain green.
