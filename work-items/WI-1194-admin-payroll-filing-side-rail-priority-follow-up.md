# WI-1194: Admin payroll filing side rail priority follow-up

## Background

`WI-1193` rebalanced the main filing workspace so setup, response follow-up, and submission queue no longer collapse into one overloaded toolbar card.
The next density seam is the supporting side rail. Settlement summary, preflight blockers, failure follow-up, and dev-only logs still need a clearer priority order once the main workspace card is stabilized.

## Scope

1. Reorder the `/admin/payroll-year-end-filing` supporting panels so settlement state and blockers lead before lower-priority follow-up diagnostics.
2. Tighten side-rail copy and card hierarchy so operators can scan the next blocking action without reading every panel.
3. Update any stale current regression guards to the new side-rail priority baseline.

## Done When

1. The filing workspace side rail reads in a clear priority order: settlement state, blockers, failure recovery, then diagnostics.
2. Supporting cards use the same customer-admin payroll lane rhythm as the main filing workspace.
3. Current quality gates remain green.
