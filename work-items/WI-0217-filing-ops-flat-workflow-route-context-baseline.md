# WI-0217: Filing Ops Flat Workflow Route and Context Baseline

## Background and Problem

`docs/codex-guide.md` Part 1.5 identifies repeated filing-ops layering as the second bloat pattern. The existing flow depends on deeply nested routes and scattered URL gate params, making each follow-up WI larger and harder to maintain.

## Scope

### In Scope

- Add flat workflow route entry:
  - `/admin/payroll-year-end-filing/ops/[step]`
- Introduce shared workflow state container:
  - `src/contexts/FilingWorkflowContext.tsx`
  - unified state for `currentStep`, gate flags, metadata, and action logs
- Add workflow helper/type modules:
  - `filing-types.ts`
  - `filing-workflow-helpers.ts`
  - step-segment mapping (including `checklist -> checklist-flow` compatibility mapping)
- Add reusable workflow UI modules:
  - `FilingDashboard.tsx`
  - `FilingStepPanel.tsx`
  - `FilingGateCard.tsx`
  - `FilingActionLog.tsx`
  - `FilingExportBundle.tsx`
  - `FilingOpsWorkflowStepPage.tsx`
- Add admin navigation links for flat workflow steps (`alert`, `checklist-flow`, `review`, `close-off`, `delivery`, `archive`, `report`).
- Add WI-0217 regression test and wire to MVP/FULL e2e chains.
- Update roadmap/work-item docs.

### Out of Scope

- Deleting legacy nested checklist/review routes
- Migrating all existing WI-0198~0216 UI/tests to flat route in one change
- API/contract/schema changes

## Data and API Changes

- No DB migration
- No API/contract changes

## Rollback Plan

- Remove `[step]` flat route and workflow context/modules.
- Revert admin flat-step navigation links.
- Remove WI-0217 test and script wiring.
- Revert roadmap/work-item updates.

## Definition of Done (DoD)

- [x] Flat step route exists and resolves known workflow steps.
- [x] Filing workflow state is centrally managed via shared context.
- [x] New reusable workflow components are separated and file-size bounded.
- [x] WI-0217 regression test is wired in MVP/FULL suites.
