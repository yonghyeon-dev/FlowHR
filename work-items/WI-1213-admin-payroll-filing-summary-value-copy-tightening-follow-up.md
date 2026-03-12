# WI-1213: Admin payroll filing summary value copy tightening follow-up

## Background

`WI-1212` tightens the filing summary pill labels so the review panel metrics scan faster.
The next seam is the summary value line where several metric values still carry longer wording than the compact filing operator surface needs.

## Scope

1. Tighten the `/admin/payroll-year-end-filing` summary value wording so the review metrics scan faster without losing meaning.
2. Keep Korean and English summary values aligned with the compact operator tone.
3. Update stale regression guards that still expect the older summary value wording.

## Done When

1. Summary value lines read shorter and remain clear.
2. Korean and English copy stay aligned.
3. Current quality gates remain green.
