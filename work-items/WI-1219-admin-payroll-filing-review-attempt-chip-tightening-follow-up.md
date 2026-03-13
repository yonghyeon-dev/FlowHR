# WI-1219: Admin payroll filing review attempt chip tightening follow-up

## Background

`WI-1218` tightens the submission-row time copy so each review row keeps a compact time chip while preserving the full timestamp in a tooltip.
The next seam is the remaining attempt chip wording where the review row still carries a longer attempt label than the compact operator panel needs.

## Scope

1. Tighten the `/admin/payroll-year-end-filing` review attempt chip wording.
2. Keep Korean and English attempt wording aligned with the compact operator tone.
3. Update stale regression guards that still expect the older attempt wording.

## Done When

1. Review attempt wording reads shorter and remains clear.
2. Korean and English copy stay aligned.
3. Current quality gates remain green.
