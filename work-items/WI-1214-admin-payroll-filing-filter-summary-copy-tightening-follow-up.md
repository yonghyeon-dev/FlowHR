# WI-1214: Admin payroll filing filter summary copy tightening follow-up

## Background

`WI-1213` tightens the filing summary value lines so the review metrics scan faster with compact counts.
The next seam is the active filter summary wording where the current filter digest can still read longer than the compact filing review panel needs.

## Scope

1. Tighten the `/admin/payroll-year-end-filing` active filter summary wording so the review panel scans faster.
2. Keep Korean and English filter summary copy aligned with the compact operator tone.
3. Update stale regression guards that still expect the older active filter summary wording.

## Done When

1. Filter summary wording reads shorter and remains clear.
2. Korean and English copy stay aligned.
3. Current quality gates remain green.
