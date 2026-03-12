# WI-1168: Employee requests feedback cause card tidy

Continue the employee requests monitoring cleanup by rebuilding the feedback rows and failure-cause rows into clearer cards so the monitoring route reads like one focused follow-up workspace.

## Background

- `WI-1166` established the monitoring summary grid and stronger panel framing for `/employee/requests/monitoring`.
- `WI-1167` tightened the search and timeline result cards.
- The feedback list and failure-cause list still lean on generic list styling and inline spacing, so the route still feels visually split between new and old patterns.

## Scope

1. Turn request feedback rows into monitoring-specific cards with clearer title, message, and time grouping.
2. Turn failure-cause rows into operator-readable cards with stronger heading and action rhythm.
3. Remove the remaining inline spacing in these panels and replace it with reusable CSS primitives.
4. Add a regression guard and wire it into `test:integration`.
5. Update `docs/production-operating-progress.md` with the closed `WI-1167` state and the `WI-1168` start marker.

## Non-Goals

- Changing request monitoring logic or filtering behavior
- Reworking resubmit flows or draft routing
- Redesigning unrelated employee workspace routes

## Acceptance Criteria

1. Feedback rows read as deliberate monitoring cards rather than plain list rows.
2. Failure-cause rows and copy actions feel visually aligned with the rest of the monitoring route.
3. No request monitoring behavior regresses.
4. `npm run typecheck`, `npm run lint`, `npm test`, and the relevant `test:integration` coverage stay green.
