# WI-0174: Admin Contracts UX Baseline

## Background and Problem

FlowHR has approval templates and approval execution views, but there is no dedicated admin surface for
electronic contract templates. This leaves a Phase-5 product gap and forces contract preparation work into
unrelated approval screens.

## Scope

### In Scope

- Add new isolated route: `/admin/contracts`
- Provide contract template library baseline:
  - search/filter/sort controls
  - template list with status/category/version/coverage metadata
  - selected template detail panel
- Provide signature readiness cards with one-tap section actions
- Add admin sidebar links:
  - `/admin/contracts`
  - `/admin/contracts#contract-template-library`
  - `/admin/contracts#contract-signature-readiness`
- Add WI-0174 e2e and wire into MVP/FULL suites

### Out of Scope

- Contract DB models or migration changes
- E-sign provider integration
- Contract API write flows
- Scheduler/workflow additions

## User Scenarios

1. Admin opens a dedicated contract template page without navigating giant mixed dashboards.
2. Admin filters templates by category/status and reviews selected template details.
3. Admin checks readiness cards before moving to contract rollout execution.

## Data and API Changes

- None (UI baseline only)

## Rollback Plan

- Remove `/admin/contracts` route and related styles.
- Remove admin sidebar links to contracts route.
- Remove WI-0174 e2e wiring in package scripts.

## Definition of Done (DoD)

- [x] `/admin/contracts` route renders template library + readiness + detail baseline.
- [x] Sidebar includes contracts route and anchor links.
- [x] Responsive styles exist for template/readiness lists.
- [x] WI-0174 e2e is added and included in MVP/FULL suites.
