# WI-1195: Admin payroll filing diagnostics density follow-up

## Background

`WI-1194` reordered the filing side rail so settlement state, blockers, failure recovery, and diagnostics now follow one operator-priority sequence.
The next seam is the diagnostics density itself. The dev-only logs and supporting side notes still read as generic utility panels instead of one lower-priority payroll-lane follow-up surface.

## Scope

1. Tighten the diagnostics and supporting-note cards inside `/admin/payroll-year-end-filing` so lower-priority follow-up panels share one calmer visual rhythm.
2. Reduce copy noise and spacing in the diagnostics rail so operators can distinguish "blocking" vs "reference" content at a glance.
3. Update any stale regression guards that still expect the older diagnostics-card hierarchy.

## Done When

1. Filing diagnostics read as lower-priority follow-up cards after settlement state, blockers, and failure recovery.
2. Supporting-note copy and spacing match the payroll-lane customer-admin workspace rhythm.
3. Current quality gates remain green.
