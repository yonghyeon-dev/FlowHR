# WI-1218: Admin payroll filing review time copy tightening follow-up

## Background

`WI-1217` tightens the submission-row action chips so retry and log actions read faster in the compact review panel.
The next seam is the remaining time copy around submission rows where absolute timestamps can still be framed more compactly.

## Scope

1. Tighten the `/admin/payroll-year-end-filing` review time copy around submission rows.
2. Keep Korean and English time phrasing aligned with the compact operator tone.
3. Update stale regression guards that still expect the older review time wording.

## Done When

1. Review time wording reads shorter and remains clear.
2. Korean and English copy stay aligned.
3. Current quality gates remain green.
