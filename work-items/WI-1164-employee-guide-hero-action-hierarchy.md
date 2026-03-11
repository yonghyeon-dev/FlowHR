# WI-1164: Employee guide hero action hierarchy

Promote the employee guide from a dense status sheet into a clearer route-first onboarding surface with a stronger hero, visible progress framing, and an explicit next recommended action.

## Background

- `WI-1161` moved the guide into the route-first workspace family.
- `WI-1163` repaired guide copy and card density, but the page still reads like a stacked checklist instead of a guided first-run workspace.
- The next step is to make the guide feel like a product walkthrough: strong header, visible progress, and a clear next action.

## Scope

1. Replace the guide header with the shared employee workspace hero pattern.
2. Surface guide progress and the next recommended action in the first panel.
3. Give quick action cards explicit CTA labels and support chips instead of generic repeated buttons.
4. Keep the current guide data model and API flow intact.
5. Add a regression guard and wire it into `test:integration`.

## Non-Goals

- Changing guide API endpoints or checklist logic
- Reworking employee route semantics
- Broadly redesigning employee home or requests surfaces

## Acceptance Criteria

1. `/employee/guide` uses the shared workspace hero pattern with guide-specific meta context.
2. The first guide panel shows progress framing and the next recommended action.
3. Quick action cards expose per-action CTA labels and support chips.
4. `npm run typecheck`, `npm test`, and `npm run test:integration` stay green.
