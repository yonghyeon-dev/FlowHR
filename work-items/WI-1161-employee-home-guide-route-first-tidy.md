# WI-1161: 직원 홈 가이드 route-first 정리

Guide route cleanup for the employee home lane.

## Background

- `WI-1160` aligned the remaining employee document consoles to the shared workspace shell.
- `/employee/guide` still carries a legacy static page and a separate runtime dashboard structure, which splits the employee guide surface into two competing implementations.
- The guide route should read like the rest of the employee route-first workspace family: shared shell, shared summary strip, shared page actions, and stable copy.

## Scope

1. Replace the legacy `/employee/guide` page body with the current guide dashboard entry point.
2. Align `src/components/employee-guide/EmployeeGuideDashboard.tsx` to the shared employee workspace shell.
3. Align `src/components/employee-guide/EmployeeGuideSections.tsx` to shared workspace cards and normalize visible guide copy.
4. Add a static regression guard and connect it to `test:integration`.
5. Update `docs/production-operating-progress.md` with the closed `WI-1160` state and the `WI-1161` start marker.

## Non-Goals

- Changing employee guide API endpoints or onboarding checklist logic
- Reworking employee home route semantics
- Promoting the guide route into a new top-level IA branch

## Acceptance Criteria

1. `/employee/guide` renders through `EmployeeGuideDashboard` and no longer ships the legacy static guide body.
2. The guide dashboard renders with `workspace-shell employee-workspace-shell`, `workspace-page-header`, and `workspace-summary-strip`.
3. Guide panels use `workspace-section-card` rhythm and preserve refresh, quick actions, and checklist behaviors.
4. `npm run typecheck`, `npm test`, and `npm run test:integration` stay green.
