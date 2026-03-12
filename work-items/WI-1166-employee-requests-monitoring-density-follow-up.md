# WI-1166: Employee requests monitoring density follow-up

Continue the requests route-first cleanup by tightening the monitoring surface so feedback, search, and timeline follow-up read like a focused employee workspace instead of a stacked legacy panel bundle.

## Background

- `WI-1165` rebuilt the requests hub action hierarchy and aligned the resubmit workbench closer to the employee workspace system.
- The `/employee/requests/monitoring` route still renders as three generic list-heavy panels with dense filter controls and weak summary framing.
- The next step is to make the monitoring route feel like a deliberate follow-up workspace with clearer scanning rhythm.

## Scope

1. Rebuild the monitoring route into a clearer summary-plus-detail hierarchy.
2. Tighten filter/search toolbar density and action emphasis for request monitoring.
3. Introduce monitoring-specific visual primitives in `globals.css` without changing request API logic.
4. Add a regression guard and wire it into `test:integration`.
5. Update `docs/production-operating-progress.md` with the closed `WI-1165` state and the `WI-1166` start marker.

## Non-Goals

- Changing employee request APIs or derived request search logic
- Reworking request submission forms
- Redesigning unrelated employee document or settings workspaces

## Acceptance Criteria

1. `/employee/requests/monitoring` has a clearer top-level hierarchy than the current stacked panels.
2. Monitoring controls and follow-up actions read as focused employee workspace tools rather than a debug-style filter bundle.
3. Existing request monitoring behaviors remain intact.
4. `npm run typecheck`, `npm test`, and `npm run test:integration` stay green.
