# WI-1167: Employee requests search timeline card tidy

Continue the employee requests monitoring cleanup by tightening the request-search and timeline result cards so follow-up work is easier to scan on desktop and mobile.

## Background

- `WI-1166` introduced monitoring summary cards and stronger panel framing for `/employee/requests/monitoring`.
- The search results and timeline entries still use dense generic list items with weak emphasis between summary, detail, and meta actions.
- The next pass should improve card rhythm without touching request logic.

## Scope

1. Tighten request search result card hierarchy for summary, detail, and meta chips.
2. Improve timeline entry card readability and channel/status emphasis.
3. Add request monitoring card-specific visual primitives in `globals.css`.
4. Add a regression guard and wire it into `test:integration`.
5. Update `docs/production-operating-progress.md` with the closed `WI-1166` state and the `WI-1167` start marker.

## Non-Goals

- Changing request APIs or derived search/timeline data
- Reworking request submission or resubmit flows
- Redesigning unrelated employee workspace surfaces

## Acceptance Criteria

1. Search result cards are easier to scan than the current flat stacked rows.
2. Timeline entries have clearer channel/status emphasis and cleaner meta rhythm.
3. Existing request monitoring behavior remains intact.
4. `npm run typecheck`, `npm test`, and `npm run test:integration` stay green.
