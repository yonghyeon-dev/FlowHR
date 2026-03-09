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
- Started `WI-1054` and rewrote approval-escalation plus leave-promotion webhook message bodies into operator-readable summaries with action guidance.
- Started `WI-1057` and removed duplicated contract-session bootstrap reads by passing the resolved bearer token from route entry pages into contract workspaces.
- Hardened `WI-1057` further by adding a shared contracts access-token requirement and applying it to admin reload/action paths, employee response/evidence paths, and the template builder so stale session clicks fail with user-facing guidance instead of bare unauthorized requests.
- Started `WI-1058` and added shared conflict-to-guidance mapping for year-end settlement, filing, and withholding flows so production-valid `409` responses surface recovery steps instead of raw diagnostics.
- Extended the same `WI-1058` guidance into the year-end preflight and employee year-end input consoles so adjacent guard failures no longer fall back to raw runtime text.
- Started `WI-1056` cleanup of weak product feedback copy by replacing `request failed; check logs` / `invalid input` wording across payroll, receipt, and leave-related production surfaces with product-safe guidance.
- Continued `WI-1056` with actual interaction cleanup:
  - admin people profile updates now ask for confirmation before commit
  - admin/employee notification pages now show visible success feedback after read actions
  - employee payslip comparison copy now exports a human-readable summary instead of raw JSON
- Removed a remaining shared-session dev remnant by replacing raw organization ID output in `src/components/SessionMenu.tsx` with role/account status language and user-facing session errors.
- Adjusted notice compose behavior so `publishAt` no longer defaults to a filled value; notice creation now defaults to draft and explains when to use scheduled or immediate publish.
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

1. Re-verify `WI-1057` in production to confirm admin and employee contracts no longer emit unauthorized bootstrap or post-click requests.
2. Continue `WI-1058` by extending the same recovery guidance to remaining year-end preflight and employee year-end-input conflict surfaces if they still leak raw runtime text.
3. Review `WI-1054` operator/webhook payload side-effects and any remaining non-user ops remnants that still need productization decisions.

## 5. Blockers Or Watch Items

- `ROADMAP.md` and `docs/execution-plan.md` are still referenced by older WI and governance scripts, so they must be transitioned carefully instead of deleted outright.
- CI hardening is intentionally deferred until current product-surface and operational defects are reduced.

## 6. Update Rule

After every meaningful work item or production re-verification:

1. Update this file with the new status.
2. Keep the next queue to at most three active items.
3. Link evidence in `codex_test/results/prod-*` when verification produced new artifacts.
