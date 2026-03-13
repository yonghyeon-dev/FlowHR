# WI-1223: Admin payroll filing review transport tooltip follow-up

## Background

`WI-1222` shortens the visible transport chip wording for the compact review row.
The next seam is restoring the full transport wording inside the row tooltip so operators still see the complete route label on demand.

## Scope

1. Keep the visible review transport chip compact.
2. Restore the full transport wording in the review row tooltip.
3. Update stale regression guards that still expect the older review-meta builder contract.

## Done When

1. Compact review chips keep the shorter transport wording.
2. Tooltip copy expands transport wording back to the full route label.
3. Current quality gates remain green.
