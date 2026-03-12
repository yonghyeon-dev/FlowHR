# WI-1210: Admin payroll filing submission row copy tightening follow-up

## Background

`WI-1209` tightens the filing action-rail group copy so the compact operator lane reads faster.
The next seam is the submission row support copy where the metadata line still carries more transport and acknowledgment wording than the denser filing review panel needs.

## Scope

1. Tighten the `/admin/payroll-year-end-filing` submission row copy so transport, format, validation, and acknowledgment details scan faster.
2. Keep the submission review panel understandable in Korean and English while preserving the same operator meaning.
3. Update stale regression guards that still expect the older submission-row copy density.

## Done When

1. Submission row metadata reads shorter without losing operator intent.
2. Korean and English copy stay aligned.
3. Current quality gates remain green.
