# WI-1220: Admin payroll filing review ack chip detail copy tightening follow-up

## Background

`WI-1219` tightens the submission-row attempt chip wording so each review row uses a shorter retry marker.
The next seam is the remaining acknowledgement detail chip where rejected responses still render a longer free-text tail than the compact review lane needs.

## Scope

1. Tighten the `/admin/payroll-year-end-filing` review acknowledgement detail chip wording.
2. Keep Korean and English acknowledgement detail wording aligned with the compact operator tone.
3. Update stale regression guards that still expect the older acknowledgement detail wording.

## Done When

1. Review acknowledgement detail wording reads shorter and remains clear.
2. Korean and English copy stay aligned.
3. Current quality gates remain green.
