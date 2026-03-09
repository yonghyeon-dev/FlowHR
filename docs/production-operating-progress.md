# FlowHR Production Operating Progress

Last updated: 2026-03-09
Status: active

## 1. Current Phase

Phase 0: establish a compact execution system that stays referenced while production hardening work continues.

## 2. Completed In This Wave

- Executed the first implementation pass for `WI-1053` on the highest-risk product surfaces.
- Added a shared surface-language helper:
  - `src/lib/product-language.ts`
- Replaced raw ID, enum, and technical wording on these screens:
  - `src/app/employee/profile/page.tsx`
  - `src/app/employee/people/page.tsx`
  - `src/app/employee/notifications/page.tsx`
  - `src/app/admin/notifications/page.tsx`
  - `src/app/admin/people/page-view-history-panel.tsx`
  - `src/app/admin/people/page-view-compare-panel.tsx`
  - `src/app/admin/audit-logs/page.tsx`
  - `src/app/admin/reports/page.tsx`
  - `src/app/admin/approval-executions/page-sections-work-conditions.tsx`
  - `src/app/admin/approval-executions/page-sections-summary-escalation.tsx`
  - `src/app/admin/approval-executions/page-sections-queue.tsx`
  - `src/app/admin/approval-history/page.tsx`
  - `src/app/admin/approval-policy/page.tsx`
  - `src/app/admin/approval-templates/page.tsx`
  - `src/app/admin/approval-templates/page-sections.tsx`
  - `src/components/admin-approval/ApprovalQueueSearchSortPanel.tsx`
  - `src/components/admin-approval/ApprovalQueueActivitySection.tsx`
  - `src/components/admin-dashboard/AdminPeopleInvitePanels.tsx`
  - `src/components/admin-dashboard/AdminOnboardingAccountPanels.tsx`
  - `src/components/admin-dashboard/AdminPayrollPanel.tsx`
  - `src/components/employee-guide/EmployeeGuideSections.tsx`
  - `src/components/benefits/AdminBenefitsWorkspaceView.tsx`
  - `src/components/benefits/EmployeeBenefitsWorkspaceView.tsx`
  - `src/components/recruitment/AdminRecruitmentWorkspaceView.tsx`
  - `src/components/recruitment/EmployeeRecruitmentWorkspaceView.tsx`
- Changed approval and audit wording from entity/actor internals to operator-facing labels.
- Hid raw employee, actor, template, delegation, and organization identifiers from newly covered production surfaces.
- Recreated the missing `src/components/benefits/EmployeeBenefitsWorkspaceView.tsx` and folded it into the same humanization baseline.
- Reworded benefits, recruitment, and employee-guide copy so session and identifier language reads as workspace/account context instead of raw ID terminology.
- Reworded admin onboarding, KPI, notices, attendance-live, and leave-calendar copy with the same workspace/account terminology.
- Reworded employee onboarding, employee session notices, payslip session copy, and approval queue search labels away from raw ID terminology.
- Reworded payroll close, insurance, payslip delivery, year-end, filing, and contracts copy away from employee/actor/organization ID terminology.
- Cleaned the remaining WI-1053 runtime and workflow wording on scheduling, filing workflow metadata, payslip/year-end runtime diagnostics, and onboarding dev-setting labels.
- Removed the last non-ops `Organization ID` / `Employee ID` / `Actor ID` phrases from production surfaces after a repo-wide rescan.
- Continued `WI-1053` on contracts by replacing raw template/document identifiers in admin and employee contract surfaces with public-facing reference labels.
- Switched the admin dashboard `#approvals` redirect to router-based navigation so direct hash entry and in-app hash jumps route reliably to `/admin/approval-executions`.
- Started `WI-1054` and rewrote approval-escalation plus leave-promotion webhook message bodies into operator-readable summaries with action guidance.
- Started `WI-1057` and removed duplicated contract-session bootstrap reads by passing the resolved bearer token from route entry pages into contract workspaces.
- Hardened `WI-1057` further by adding a shared contracts access-token requirement and applying it to admin reload/action paths, employee response/evidence paths, and the template builder so stale session clicks fail with user-facing guidance instead of bare unauthorized requests.
- Re-verified `WI-1057` against production with a dedicated contracts bootstrap probe and confirmed first-load admin/employee contract requests now resolve as `200` without an initial `401`.
- Started `WI-1058` and added shared conflict-to-guidance mapping for year-end settlement, filing, and withholding flows so production-valid `409` responses surface recovery steps instead of raw diagnostics.
- Extended the same `WI-1058` guidance into the year-end preflight and employee year-end input consoles so adjacent guard failures no longer fall back to raw runtime text.
- Extended the same runtime-message normalization into payroll close and payroll insurance consoles so adjacent catch/session errors no longer fall back to raw diagnostics.
- Closed `WI-1057` through the full GitHub flow and merged it to `main` as `07e84c04ac7aa780fcbc90fc41aba731ccd3580f`, then deleted the feature branch.
- Closed `WI-1058` through the full GitHub flow and merged it to `main` as `38d666fb34d07083d8c9866da9928b2c7931deb1`, then deleted the feature branch.
- Added `WI-1054` regression guards so approval-escalation and leave-promotion operator messages keep their direct action link and stay free of raw `organizationId`, routing channel, and employee/entity identifier leakage.
- Started `WI-1056` cleanup of weak product feedback copy by replacing `request failed; check logs` / `invalid input` wording across payroll, receipt, and leave-related production surfaces with product-safe guidance.
- Continued `WI-1056` with actual interaction cleanup:
  - admin people profile updates now ask for confirmation before commit
  - admin/employee notification pages now show visible success feedback after read actions
  - employee payslip comparison copy now exports a human-readable summary instead of raw JSON
- Added `WI-1056` regression guards and attached them to `test:integration` so CI now enforces:
  - employee dashboard dev-only shortcuts remain gated by `showDevTools`
  - admin people profile updates keep their confirmation dialog
  - admin/employee notifications keep visible read-success feedback
  - employee payslip compare copy stays on a human-readable summary instead of raw JSON
- Closed `WI-1056` through the full GitHub flow and merged it to `main` as `e9bf022731d4849257a2e058d19656a156415b76`, then deleted the feature branch.
- Started `WI-1055` with a dedicated `/admin/leave-policies` product surface so leave policy operations no longer depend on dashboard deep links.
- Wired `WI-1055` into admin navigation and workspace hubs and attached a regression guard to `test:integration`.
- Continued `WI-1055` with a dedicated `/admin/attendance-security` product surface and org-level persistence for GPS-required and geofence controls.
- Wired `WI-1055` attendance security into admin navigation, workspace hubs, integration regression coverage, and a dedicated Prisma migration so attendance policy no longer depends on env-only toggles.
- Closed the `WI-1055` attendance-security slice through the full GitHub flow and merged it to `main` as `8736e97161bd420ad7ed52f6362fbf3abfe89c55`, then deleted the feature branch.
- Started the next `WI-1055` slice for notification durability by replacing localStorage-only employee notification settings with durable employee preferences plus admin-managed organization defaults.
- Closed the `WI-1055` notification-durability slice through the full GitHub flow and merged it to `main` as `5e069280cb3bfc3d20edbcbacd3f77a1b7eb2b11`, then deleted the feature branch.
- Started the next `WI-1055` slice for organization-level operator alert webhook fallback settings covering approval escalation and leave-promotion dispatch.
- Closed the `WI-1055` operator-alert webhook slice through the full GitHub flow and merged it to `main` as `f00e7ccdcd4698f9eb39c111f8b10d1f7e36dd4e`, then deleted the feature branch.
- Started the next `WI-1055` slice for organization-level leave promotion email template settings covering admin-managed endpoint, sender, token rotation, and default template ID.
- Closed the `WI-1055` leave-promotion email settings slice through the full GitHub flow and merged it to `main` as `e7914803d4e8529c1179bfc0a6ac9449f2105915`, then deleted the feature branch.
- Started the next `WI-1055` slice for organization-level approval escalation settings covering stalled threshold, batch limit, and notification channel defaults.
- Closed the `WI-1055` approval escalation settings slice through the full GitHub flow and merged it to `main` as `3290f045b233fa489e63297b47a1d4b0b1c31356`, then deleted the feature branch.
- Started the next `WI-1055` slice for organization-level payroll feature management covering payroll/year-end rollout overrides plus explicit ops-only boundary disclosure.
- Closed the `WI-1055` feature management slice through the full GitHub flow and merged it to `main` as `6388999aa45e8279ff9755fc068862ba4e7a4e7f`, then deleted the feature branch.
- Removed a remaining shared-session dev remnant by replacing raw organization ID output in `src/components/SessionMenu.tsx` with role/account status language and user-facing session errors.
- Adjusted notice compose behavior so `publishAt` no longer defaults to a filled value; notice creation now defaults to draft and explains when to use scheduled or immediate publish.
- Started `WI-1050` to close the remaining notice-create reliability gap by omitting blank `publishAt` from create payloads, preserving explicit null clearing on edit payloads, and adding a dedicated regression guard plus updated people contract coverage.
- Closed `WI-1050` through the full GitHub flow and merged it to `main` as `2c6d518a9bfeb6a326960db1816d15076ac13cec`, then deleted the feature branch.
- Started `WI-1059` as the current follow-up for the remaining desktop-only employee direct-load focus failures after production reverify still showed `5/12` on desktop and `12/12` on mobile.
- Narrowed `WI-1059` to a settled-state retry guard so direct-load focus only closes after hash sync plus in-viewport visibility are both satisfied.
- Verified the current implementation pass with `npm run typecheck`.
- Confirmed the actual development process from repository evidence:
  - WI
  - `feature/WI-xxxx-*` branch
  - PR
  - CI
  - merge
  - deploy
  - branch cleanup
- Reviewed current CI posture and classified it as working but not yet sufficient for product-surface quality.
- Consolidated production findings into five active epic groups:
  - developer trace removal
  - core journey reliability
  - navigation hardening
  - admin controls productization
  - UX/localization finish
- Promoted planning from QA-only reporting to PM + Dev execution.
- Created the canonical operating documents:
  - `docs/production-operating-plan.md`
  - `docs/production-operating-progress.md`
- Replaced `CURRENT-GOAL.md` with a compact pointer to the new canonical documents.
- Added `work-items/WI-1052-production-operating-plan-and-tracking-baseline.md` to preserve this transition as a tracked delivery unit.
- Added the detailed production gap inventory:
  - `docs/production-gap-inventory.md`
- Seeded execution bundles for newly unmapped gaps:
  - `WI-1053`
  - `WI-1054`
  - `WI-1055`
  - `WI-1056`
  - `WI-1057`
  - `WI-1058`

## 3. Current Decisions

- `.claude/memory/*` stays untouched and remains Claude-only.
- `ROADMAP.md` and `docs/execution-plan.md` remain as historical and governance references.
- `codex_test/results/prod-*` remains the evidence archive for production findings.
- Current planning and status tracking moves to `docs/production-operating-*`.

## 4. Next Queue

1. Close the current `WI-1059` employee desktop focus deep-link follow-up through the full GitHub flow (`push -> PR -> CI -> merge -> branch cleanup`).
2. Re-scan remaining core-journey reliability gaps and pick the next highest-value production blocker after `WI-1059`.
3. Re-scan the remaining production surfaces for any unmapped dev-remnant or operator-copy leaks before opening the next execution branch.

## 5. Blockers Or Watch Items

- `ROADMAP.md` and `docs/execution-plan.md` are still referenced by older WI and governance scripts, so they must be transitioned carefully instead of deleted outright.
- CI hardening is intentionally deferred until current product-surface and operational defects are reduced.

## 6. Update Rule

After every meaningful work item or production re-verification:

1. Update this file with the new status.
2. Keep the next queue to at most three active items.
3. Link evidence in `codex_test/results/prod-*` when verification produced new artifacts.

Latest verification evidence:

- `codex_test/results/prod-contracts-reverify-2026-03-09T09-53-21-595Z/REPORT.md`
- `codex_test/results/prod-year-end-conflict-reverify-2026-03-09T10-07-21-859Z/REPORT.md`
- `codex_test/results/prod-completed-items-reverify-2026-03-09T13-37-17-634Z/REPORT.md`
