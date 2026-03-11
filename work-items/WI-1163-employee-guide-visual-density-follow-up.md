# WI-1163: Employee guide visual density follow-up

Tighten the employee guide reading rhythm after the route-first migration and remove broken Korean copy from the guide surface.

## Background

- `WI-1161` promoted `/employee/guide` into the route-first workspace family.
- `WI-1162` reduced density on the employee home lane, but the guide route still carried mojibake Korean copy and list-heavy card layouts.
- The guide should read like a product walkthrough, not a debug checklist panel.

## Scope

1. Restore readable Korean copy in `src/components/employee-guide/copy.ts`.
2. Rebuild guide context, quick actions, and checklist panels into clearer visual groupings.
3. Introduce guide-specific visual primitives in `globals.css` without changing guide data flow.
4. Add a regression guard and wire it into `test:integration`.
5. Update `docs/production-operating-progress.md` with the closed `WI-1162` state and the `WI-1163` start marker.

## Non-Goals

- Changing employee guide API fetching or checklist logic
- Reworking employee route semantics
- Replacing the wider workspace design system

## Acceptance Criteria

1. Employee guide Korean copy resolves correctly at runtime and no longer contains mojibake text.
2. Quick actions render as action cards instead of flat inline-link lists.
3. Guide context and checklist panels use guide-specific card/group classes while preserving existing behaviors.
4. `npm run typecheck`, `npm test`, and `npm run test:integration` stay green.
