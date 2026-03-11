# WI-1165: Employee requests visual hierarchy

Tighten the route-first employee requests workspace so the hub, monitoring, and resubmit surfaces read like a clear product lane instead of a migrated dashboard fragment.

## Background

- `WI-1117` and `WI-1127` promoted employee request follow-up into dedicated routes.
- `WI-1161` through `WI-1164` lifted employee home and guide into the new employee workspace system.
- `/employee/requests` still carries generic action cards, dense summary rhythm, and resubmit copy/layout that feel older than the surrounding employee shell.

## Scope

1. Rebuild the employee requests hub cards into stronger primary-plus-secondary action groups.
2. Align the requests status strip and detail grid with the employee workspace visual system.
3. Improve resubmit panel copy and detail hierarchy without changing request data flow.
4. Add request-specific visual primitives in `globals.css`.
5. Add a regression guard and wire it into `test:integration`.
6. Update `docs/production-operating-progress.md` with the `WI-1165` start marker.

## Non-Goals

- Changing request API endpoints or request derivation logic
- Reworking employee route semantics beyond the existing request subroutes
- Redesigning attendance or leave draft forms

## Acceptance Criteria

1. `/employee/requests` shows clearer hub cards with explicit primary and secondary actions.
2. Request monitoring/resubmit surfaces use the employee workspace status-strip/detail-grid rhythm instead of generic nested grids.
3. The resubmit workbench copy and candidate presentation read as an operator-facing product surface rather than a raw list handoff.
4. `npm run typecheck`, `npm test`, and `npm run test:integration` stay green.
