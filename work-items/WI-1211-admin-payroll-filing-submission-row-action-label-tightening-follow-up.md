# WI-1211: Admin payroll filing submission row action label tightening follow-up

## Background

`WI-1210` tightens the filing submission-row metadata so the review panel scans faster with compact transport and response chips.
The next seam is the per-row quick action labeling where the button group can still be shortened to match the denser submission review rail.

## Scope

1. Tighten the `/admin/payroll-year-end-filing` submission-row quick action labels so they scan faster without losing operator meaning.
2. Keep Korean and English row actions aligned with the current compact filing review panel.
3. Update stale regression guards that still expect the older quick-action wording.

## Done When

1. Submission-row quick actions read shorter and remain clear.
2. Korean and English copy stay aligned.
3. Current quality gates remain green.
