# WI-1221: Admin payroll filing review chip overflow tooltip follow-up

## Background

`WI-1220` tightens the acknowledgement detail chip so rejected review rows use a shorter detail marker.
The next seam is discoverability for compact review chips where operators still need the full overflow text on demand.

## Scope

1. Add on-demand full-text affordance for compact review chips in `/admin/payroll-year-end-filing`.
2. Keep Korean and English tooltip/fallback wording aligned with the compact operator tone.
3. Update stale regression guards that still assume no overflow affordance exists.

## Done When

1. Compact review chips preserve access to full overflow text.
2. Korean and English affordance wording stay aligned.
3. Current quality gates remain green.
