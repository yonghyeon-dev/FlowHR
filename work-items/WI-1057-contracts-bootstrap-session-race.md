# WI-1057: Contracts bootstrap session race

## Background

Production verification repeatedly observed `/admin/contracts` and `/employee/contracts` issuing an initial unauthorized request and then succeeding on retry. The visible symptom is a first-load `401` followed by a successful second request once session state settles.

## Goal

Remove first-load unauthorized contract requests by aligning bootstrap timing with session readiness.

## In Scope

- Admin contracts bootstrap timing
- Employee contracts bootstrap timing
- Guarding initial document/template requests until bearer session is ready

## Out Of Scope

- Contract workflow redesign
- Contract signature lifecycle changes

## Acceptance Criteria

1. Contracts pages do not emit first-load `401` requests in production.
2. Admin and employee contract surfaces both load on the first authenticated attempt.
3. Session bootstrap logic remains compatible with existing contract filters and actions.

## Implementation Progress

- Moved bearer-token resolution to the route entry pages for `/admin/contracts` and `/employee/contracts`.
- Updated admin and employee contract workspaces to consume the already-resolved access token instead of starting a second local session bootstrap.
- Updated the admin contracts action hook to use the injected access token so the initial template/document bootstrap aligns with the route-level authenticated state.
- Added a shared contract-session guard so admin template/document actions, employee respond/evidence actions, and the template builder fail early with user-facing session recovery guidance instead of sending unauthenticated fallback requests.
- Re-verified production on 2026-03-09 with `codex_test/production-contracts-reverify.mjs`; `/admin/contracts` and `/employee/contracts` both emitted first-load `200` contract API responses with no leading `401`.
