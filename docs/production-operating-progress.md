# FlowHR Production Operating Progress

Last updated: 2026-03-11
Status: active

## 1. Current Phase

Phase 2: reset the operating roadmap so UI/UX becomes the top-level execution axis and structural refactors are planned beneath it.

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
- Started `WI-1060` as the direct follow-up after `WI-1059` left target-specific desktop direct-load gaps on sections that mount late or reflow after snapshot bootstrap.
- Reworked employee direct-load focus handling so it no longer relies on a one-phase retry window alone; it now keeps hash synchronization aligned and observes later DOM insertion/replacement until the target section actually settles.
- Re-verified `WI-1060` on deployed production and confirmed employee focus direct-load now closes at `desktop 12/12`, `mobile 12/12`.
- Started `WI-1061` to clean up false positives in the production completed-items reverify script so `/admin#approvals` redirect behavior and the intended `/admin/leave-promotion` 404 policy no longer reopen closed issues.
- Closed `WI-1061` through the full GitHub flow and merged it to `main` as `d9e6c66082ce63050e719cddc664ff1d82122e40`, then deleted the feature branch.
- Re-verified the deployed `WI-1061` pass and confirmed `codex_test/results/prod-completed-items-reverify-2026-03-10T03-38-09-835Z` closes at `focus desktop 12/12`, `focus mobile 12/12`, `admin checks 8/8`, `failures 0`.
- Started `WI-1062` to remove the remaining raw hash/ID/code traces from year-end and filing summaries, timelines, and success feedback.
- Started `WI-1063` to rewrite remaining year-end filing operator labels, filter summaries, and response wording away from raw hash/ACK/submission key terminology.
- Closed `WI-1063` through the full GitHub flow and merged it to `main` as `4d4359109867847f7f34b5209684846958ef02ba`, then deleted the feature branch.
- Started `WI-1064` to remove the remaining ACK-centric recovery wording and English-only filing workflow copy from year-end and filing operator surfaces.
- Closed `WI-1065` through the full GitHub flow and merged it to `main` as `5c0a7aeafa067545fdc93c57abd6699b40c99e19`, then deleted the feature branch.
- Started `WI-1066` to replace the remaining year-end and withholding explanation labels that still exposed vector-hash, reason-code, and settlement-hash terminology.
- Closed `WI-1066` through the full GitHub flow and merged it to `main` as `011f5bc52395de96279e5c2771decd1d7df5e509`, then deleted the feature branch.
- Started `WI-1067` to remove the remaining raw code leakage from filing response-category and rejection-reason selectors.
- Closed `WI-1067` through the full GitHub flow and merged it to `main` as `f239235319e347af709ac41753eeace4efa80cb7`, then deleted the feature branch.
- Started `WI-1068` to remove the remaining raw finalization and document-integrity traces from withholding receipt summaries, copied metadata, and load-status messages.
- Closed `WI-1068` through the full GitHub flow and merged it to `main` as `8065209e37a31ceffa6d2a4fdf38256a940fb81b`, then deleted the feature branch.
- Investigated repeated `vercel-production-deploy` failures from `WI-1064` onward and confirmed the common failure point is Vercel `npm run build` OOM during the deploy step after successful Prisma migration.
- Started `WI-1069` to scope Next production build lint/typecheck to app source so repository-wide `scripts/tests` growth no longer pushes Vercel builds over memory limits.
- Closed `WI-1069` through the full GitHub flow and merged it to `main` as `9dcb0fa067231d84edb96bf31141cf5040d0e42d`, then deleted the feature branch.
- Re-verified `WI-1069` at deploy time and confirmed Vercel production build still fails with the same OOM signature, so the root cause is reduced but not yet removed.
- Started `WI-1070` to force Next webpack build-worker memory settings and disable memory-costly parallel server build options during production builds.
- Closed `WI-1070` through the full GitHub flow and merged it to `main` as `89ac05c637a5b55d45915f412d1d55e21058af8c`, then deleted the feature branch.
- Re-verified `WI-1070` at deploy time and confirmed Vercel production build still fails with the same OOM signature, though the failing run shortened after applying the memory worker flags.
- Started `WI-1071` to throttle Next build worker concurrency with `cpus: 1` and memory-based worker counting.
- Closed `WI-1071` through the full GitHub flow and merged it to `main` as `a65c3fbb`, then deleted the feature branch.
- Re-verified `WI-1071` at deploy time and confirmed `vercel-production-deploy` still fails after `WI-1064` with the same `npm run build` `SIGKILL` / `OOM` signature.
- Started `WI-1072` to isolate hidden `/ops` console routes behind thin server wrappers and move the heavy client implementations into `page-client.tsx` modules.
- Closed `WI-1072` through the full GitHub flow and merged it to `main` as `cf6af29befaebb1f12a4a81163178760b27da63d`, then deleted the feature branch.
- Re-verified `WI-1072` at deploy time and confirmed `vercel-production-deploy` still fails with the same `Restored build cache -> next build -> SIGKILL/OOM` pattern.
- Started `WI-1073` to force a cold Vercel production deploy without reusing build cache.
- Closed `WI-1073` through the full GitHub flow and merged it to `main` as `7e804760975bc5b1e679d9da36c7e7368da8b605`, then deleted the feature branch.
- Re-verified `WI-1073` at deploy time and confirmed `vercel-production-deploy` returns to green when production deploy runs with a forced cold Vercel build.
- Started `WI-1074` to remove the remaining raw parent and manager identifier fallback from the admin department-management surface.
- Closed `WI-1074` through the full GitHub flow and merged it to `main` as `fd58431ca7a07c25b299973d8d384a03f7fbe6e8`, then deleted the feature branch.
- Re-verified `WI-1074` at deploy time and confirmed `vercel-production-deploy` stays green after the department-management surface cleanup.
- Started `WI-1075` to remove the remaining raw employee identifier fallback from the admin people org chart surface.
- Closed `WI-1075` through the full GitHub flow and merged it to `main` as `c1226bb3e90b541368eb7428ea08b62ff4f8edcf`, then deleted the feature branch.
- Re-verified `WI-1075` at deploy time and confirmed `vercel-production-deploy` stays green after the admin org chart surface cleanup.
- Started `WI-1076` to remove the remaining raw employee and schedule identifier fallback from the admin scheduling surface.
- Closed `WI-1076` through the full GitHub flow and merged it to `main` as `332642728bf823bb1f932ed4ec1bc973a0bc1307`, then deleted the feature branch.
- Re-verified `WI-1076` at deploy time and confirmed `vercel-production-deploy` stays green after the admin scheduling surface cleanup.
- Started `WI-1077` to remove the remaining raw employee identifier fallback from the admin attendance aggregate surface.
- Closed `WI-1077` through the full GitHub flow and merged it to `main` as `a8f9c29793f483d510d1aebb23044d8163c1675f`, then deleted the feature branch.
- Re-verified `WI-1077` at deploy time and confirmed `vercel-production-deploy` stays green after the admin attendance aggregate surface cleanup.
- Started `WI-1078` to remove the remaining raw employee identifier fallback from the admin attendance live surface.
- Closed `WI-1078` through the full GitHub flow and merged it to `main` as `e927dfe645352624a35931da95c852a402d1f118`, then deleted the feature branch.
- Re-verified `WI-1078` at deploy time and confirmed `vercel-production-deploy` stays green after the admin attendance live surface cleanup.
- Started `WI-1079` to remove raw `Run ID` wording and free-text internal run selection from the admin payroll confirmation surface.
- Closed `WI-1079` through the full GitHub flow and merged it to `main` as `9839644820edb97f0536b26bf95c4da70796896c`, then deleted the feature branch.
- Re-verified `WI-1079` at deploy time and confirmed `vercel-production-deploy` stays green after the admin payroll confirmation cleanup.
- Started `WI-1080` to remove the remaining raw target-organization editing from the admin invite surface and keep invite creation on the selected workspace only.
- Closed `WI-1080` through the full GitHub flow and merged it to `main` as `0b9290b443f0328800427fcc94ebbc393ba42d32`, then deleted the feature branch.
- Re-verified `WI-1080` at deploy time and confirmed `vercel-production-deploy` stays green after the admin invite workspace cleanup.
- Closed `WI-1081` through the full GitHub flow and merged it to `main` as `840e8fe5f7caaed61a3c6322acf643a6fe2ff027`, then deleted the feature branch.
- Re-verified `WI-1081` at deploy time and confirmed both `ci` and `vercel-production-deploy` stay green after the admin organization fallback cleanup.
- Started `WI-1082` to replace raw session organization and session actor ID devtools context lines on admin dashboard core surfaces with connection-state product wording.
- Closed `WI-1082` through the full GitHub flow and merged it to `main` as `c93b3ad8368442a3e7028925942625774ae7e5cb`, then deleted the feature branch.
- Re-verified `WI-1082` at deploy time and confirmed both `ci` and `vercel-production-deploy` stay green after the admin dashboard session-context cleanup.
- Started `WI-1083` to replace raw session organization and session actor ID devtools context lines on approval policy/history/templates surfaces with connection-state product wording.
- Closed `WI-1083` through the full GitHub flow and merged it to `main` as `d80769f28af5680f533590a9aa5ebc5e28488da5`, then deleted the feature branch.
- Re-verified `WI-1083` at deploy time and confirmed both `ci` and `vercel-production-deploy` stay green after the admin approval session-context cleanup.
- Started `WI-1084` to replace raw session organization and admin actor ID devtools context lines on payroll insurance, leave calendar, year-end, preflight, and filing consoles with connection-state product wording.
- Closed `WI-1084` through the full GitHub flow and merged it to `main` as `d01a758a612270a68ec8c7779195b6e8c5d93853`, then deleted the feature branch.
- Re-verified `WI-1084` at deploy time and confirmed both `ci` and `vercel-production-deploy` stay green after the admin payroll session-context cleanup.
- Started `WI-1085` to replace raw session organization and employee ID devtools context lines on employee dashboard account overview and employee year-end input surfaces with connection-state product wording.
- Started `WI-1086` to replace raw session organization, employee session, and userId fallback wording on employee payslip and withholding self-service devtools surfaces with signed-in account and connection-state product wording.
- Closed `WI-1086` through the full GitHub flow and merged it to `main` as `497c4a7a8566773ec7d99851f8bf93b4a3331bdf`, then deleted the feature branch.
- Re-verified `WI-1086` at deploy time and confirmed both `ci` and `vercel-production-deploy` stay green after the employee payroll self-service session-copy cleanup.
- Started `WI-1087` to replace the remaining userId fallback and session-number wording on employee account and guide entry surfaces with product-facing account copy.
- Closed `WI-1087` through the full GitHub flow and merged it to `main` as `8d87be5906727d5ceaa0e209b552805c69c8f458`, then deleted the feature branch.
- Re-verified `WI-1087` at deploy time and confirmed both `ci` and `vercel-production-deploy` stay green after the employee account and guide session-copy cleanup.
- Started `WI-1088` to remove the remaining raw `userId` fallback and ad-hoc session wording from the shared admin/employee session menu.
- Closed `WI-1088` through the full GitHub flow and merged it to `main` as `5a2bc2b98305c5030f31aae93e4e7dc220c71271`, then deleted the feature branch.
- Re-verified `WI-1088` at deploy time and confirmed both `ci` and `vercel-production-deploy` stay green after the shared session-menu copy cleanup.
- Started `WI-1089` to replace raw session organization and session actor code-like devtools context on leave accrual, payroll close, and payslip delivery with workspace/admin session status wording.
- Closed `WI-1089` through the full GitHub flow and merged it to `main` as `b3d3fd346b0ed304462d7e5ca69475e8e5600447`, then deleted the feature branch.
- Re-verified `WI-1089` at deploy time and confirmed both `ci` and `vercel-production-deploy` stay green after the admin payroll operational session-copy cleanup.
- Started `WI-1090` to replace raw session organization / actor / employee wording on admin and employee scheduling devtools with connection-state product wording.
- Closed `WI-1090` through the full GitHub flow and merged it to `main` as `0dc56436a62bd6fc9aea1803faad30083576ca04`, then deleted the feature branch.
- Re-verified `WI-1090` at deploy time and confirmed both `ci` and `vercel-production-deploy` stay green after the scheduling session-copy cleanup.
- Started `WI-1091` to replace the remaining session-organization and session-actor wording on the admin people directory filters with workspace/admin session status copy.
- Closed `WI-1091` through the full GitHub flow and merged it to `main` as `dd884a057b8359d16c2aeb379ad3b7d4b2a09cfa`, then deleted the feature branch.
- Re-verified `WI-1091` at deploy time and confirmed both `ci` and `vercel-production-deploy` stay green after the admin people session-copy cleanup.
- Started `WI-1092` to replace the remaining approval-policy, approval-history, approval-templates, and approval-executions session wording with workspace/admin session status copy.
- Started `WI-1093` to remove the remaining raw workspace/session wording, organization summary ID output, and raw employee/status fallback traces from the admin leave-accrual surface.
- Closed `WI-1093` through the full GitHub flow and merged it to `main` as `7b58db0af0d68b1e28397de34df0dd997918f120`, then deleted the feature branch.
- Started `WI-1094` to remove the remaining raw workspace error wording, organization summary ID output, and raw employee identifier fallback traces from the admin leave-calendar surface.
- Closed `WI-1094` through the full GitHub flow and merged it to `main` as `f013f848768acab96f5b6d8394fd764bfd3766c3`, then deleted the feature branch.
- Started `WI-1095` to replace the remaining raw organization, actor, and employee identifier context lines on admin and employee notices surfaces with session-status product wording.
- Closed `WI-1095` through the full GitHub flow and merged it to `main` as `ce230023844d295abdd4badb5230bf6dd405bd24`, then deleted the feature branch.
- Closed `WI-1096` through the full GitHub flow and merged it to `main` as `2715b8eff75f430ffe8cc0bf000c61919527b7ad`, then deleted the feature branch.
- Closed `WI-1097` through the full GitHub flow and merged it to `main` as `bad592eff903c06a009a2858b5a782278a77cc39`, then deleted the feature branch.
- Re-verified `WI-1097` on the delivery path and confirmed both `ci` (`22911661857`) and `vercel-production-deploy` (`22911661872`) stay green after the employee self-service session-guidance cleanup.
- Restored `CURRENT-GOAL.md` as a readable Korean entry point and tightened the operating documents so the next UI/UX finish track is explicit.
- Closed `WI-1098` through the full GitHub flow and merged it to `main` as `e1103d5ea8ab2efd6b3f0039cbb12235cf3ef0d9`, then deleted the feature branch.
- Re-verified `WI-1098` on the delivery path and confirmed both `ci` (`22912777200`) and `vercel-production-deploy` (`22912777224`) stay green after the operating-document accuracy pass.
- Started `WI-1099` as the first explicit Epic E implementation slice for admin notice confirmation, feedback, and empty-state recovery.
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

1. Close `WI-1131` by aligning guide and mobile-menu primary attendance/leave entry points to the new stable subroutes instead of the compatibility base routes.
2. Continue the next employee route-first pass by trimming the remaining compatibility-only base-route entry points from non-legacy shortcuts and copy surfaces.
3. Begin the next admin route-first slice after employee primary-entry parity is explicit.

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
- `codex_test/results/prod-completed-items-reverify-2026-03-09T14-59-52-362Z/REPORT.md`
- `codex_test/results/prod-completed-items-reverify-2026-03-10T03-38-09-835Z/REPORT.md`

Latest planning reset:

- Started `WI-1101` to reposition UI/UX from a finish track to the central operating principle and to move role/tenant/IA refactoring into the active execution order.
- Added `docs/ui-ux-first-refactor-blueprint.md` so contradictions, refactor categories, dependency rules, and next WI candidates are explicit before the next implementation wave starts.
- Integrated the visual design system direction into the same blueprint so layout model, density, mobile behavior, and HRWIRE adoption rules are fixed before the next shell refactor.
- Closed `WI-1102` and froze `docs/role-tenant-product-shell-blueprint.md` as the role/tenant/product-shell operating model.
- Closed `WI-1103` and froze `docs/first-ia-refactor-seam-migration-plan.md` so the first safe IA seam is explicit before implementation starts.
- Started `WI-1104` to define the shared workspace interaction contract that future UI implementation WIs must follow.
- Closed `WI-1104` and added `docs/shared-workspace-interaction-contract.md` as the common workspace frame and state contract for future admin/employee surfaces.
- Started `WI-1105` to define shared feedback, confirmation, recovery, and empty-state primitives before shell regrouping begins.
- Closed `WI-1105` and added `docs/shared-feedback-and-confirmation-primitives.md` as the shared feedback/confirmation primitive baseline.
- Started `WI-1106` to define shared product language, status mapping, and date/time rules before the first employee shell implementation slice.
- Closed `WI-1106` and added `docs/shared-product-language-and-date-time-standardization.md` as the shared language, status, and date/time baseline.
- Closed `WI-1107` and regrouped employee self-service navigation into role-based shell sections.
- Closed `WI-1108` and regrouped admin navigation into the same grouped-shell model.
- Closed `WI-1109` and aligned the admin control-tower dashboard entries with the grouped shell baseline.
- Started `WI-1116` to align admin workspace hubs with grouped shell sections while preserving operational settings and source-context risk entry links.
- Closed `WI-1116` and aligned admin workspace hubs with grouped shell sections while preserving operational settings and source-context risk entry links.
- Started `WI-1117` to create the first stable employee requests route seam and reduce top-level dependence on hidden-subpage entry points.
- Started `WI-1118` to extract request feedback, search, timeline, and resubmit follow-up from the Today home into the dedicated `/employee/requests` workspace while preserving route-based draft handoff back to employee forms.
- Closed `WI-1118` through the full GitHub flow and merged it to `main` as `5a86b081718d1435c4a73b2b1b996c221a033af8`, then deleted the feature branch.
- Re-verified `WI-1118` on the delivery path and confirmed both `ci` (`22927102521`) and `vercel-production-deploy` (`22927102517`) stay green after the employee requests workspace extraction.
- Started `WI-1119` to promote attendance correction, leave request, and leave calendar work from the Today home into dedicated employee routes while preserving schedule-based draft handoff.
- Closed `WI-1119` through the full GitHub flow and merged it to `main` as `747986123be689035e9d8de87703789cf6f1b1ce`, then deleted the feature branch.
- Re-verified `WI-1119` on the delivery path and confirmed both `ci` (`22928605264`) and `vercel-production-deploy` (`22928605256`) stay green after the employee attendance and leave route promotion.
- Started `WI-1120` to remove the remaining schedule-heavy panel from Today home, promote `schedule` focus entry to `/employee/schedule`, and keep only schedule summary plus next actions on the home surface.
- Closed `WI-1120` through the full GitHub flow and merged it to `main` as `491f7f0b9f1cd64f8027f25cdf5ce235bad2e2a9`, then deleted the feature branch.
- Re-verified `WI-1120` on the delivery path and confirmed both `ci` (`22929428664`) and `vercel-production-deploy` (`22929428657`) stay green after the employee schedule route-first home relief.
- Started `WI-1121` to align employee workspace hero framing, source hints, and return affordances across request / attendance / leave / schedule workspaces.
- Closed `WI-1121` through the full GitHub flow and merged it to `main` as `b835618b9ca007df5febfa0e86cb1a493523d8cc`, then deleted the feature branch.
- Re-verified `WI-1121` on the delivery path and confirmed both `ci` (`22930076868`) and `vercel-production-deploy` (`22930076871`) stay green after the employee workspace hero alignment.
- Started `WI-1122` to remove the last requests-workspace resubmit handoff that still returned through the hidden home `?focus=` path.
- Closed `WI-1122` through the full GitHub flow and merged it to `main` as `9c0d6354ae65c03e5efe173c7e74a4e498406638`, then deleted the feature branch.
- Re-verified `WI-1122` on the delivery path and confirmed both `ci` (`22930562197`) and `vercel-production-deploy` (`22930562196`) stay green after the requests resubmit route promotion.
- Started `WI-1123` to align mobile-menu entry context with the same employee route-first source model already used by dashboard, guide, requests, and schedule surfaces.
- Closed `WI-1123` through the full GitHub flow and merged it to `main` as `6a5d5649cd24e576230a300b378e278a2bd5e817`, then deleted the feature branch.
- Re-verified `WI-1123` on the delivery path and confirmed both `ci` (`22931403925`) and `vercel-production-deploy` (`22931403938`) stay green after the employee mobile source-context alignment.
- Started `WI-1124` to extract `/employee/attendance` and `/employee/leave` away from the home-route `EmployeeSelfServicePage` mode switch and into a dedicated attendance/leave workspace client.
- Closed `WI-1124` through the full GitHub flow and merged it to `main` as `c6b0b447c93d2dc1dc3d1ec16ced41bfbb7b90dc`, then deleted the feature branch.
- Re-verified `WI-1124` locally with `npm run build`, but the first `main` production deploy failed because `src/app/employee/page.tsx` still exposed the invalid named export `EmployeeSelfServicePage` from a Next page file.
- Started `WI-1125` to remove the invalid home-page named export and restore green production deploy after the attendance / leave workspace extraction.
- Closed `WI-1125` through the full GitHub flow and merged it to `main` as `c3cba8f69f9814acc1a5c04cb6c9ffe1362077e7`, then deleted the feature branch.
- Re-verified `WI-1125` on the delivery path and confirmed both `ci` (`22932415439`) and `vercel-production-deploy` (`22932415420`) stay green after the home-page export cleanup.
- Started `WI-1126` to remove the remaining dead attendance / leave mode branches from `src/app/employee/page.tsx`, keep the employee home route home-only, and decouple `EmployeeApiLogsPanel` from attendance/leave workspace-only props.
- Closed `WI-1126` through the full GitHub flow and merged it to `main` as `5eec94cabb9a676ac055d108f9896586a46aa15e`, then deleted the feature branch.
- Re-verified `WI-1126` on the delivery path and confirmed both `ci` (`22934173121`) and `vercel-production-deploy` (`22934173130`) stay green after the employee home dead-mode cleanup.
- Started `WI-1127` to promote employee request monitoring and resubmit follow-up into stable subroutes so dashboard, guide, and shortcut entry points no longer depend on `/employee/requests` hash targets.
- Closed `WI-1127` through the full GitHub flow and merged it to `main` as `4571ffcab8c101319ff49cf892a7f947b4cb9a9d`, then deleted the feature branch.
- Re-verified `WI-1127` on the delivery path and confirmed both `ci` (`22934931479`) and `vercel-production-deploy` (`22934931488`) stay green after the employee requests subroute promotion.
- Started `WI-1128` to promote admin payroll queue pseudo-focus links into stable subroutes and keep legacy `?focus=` entries on compatibility redirects only.
- Closed `WI-1128` through the full GitHub flow and merged it to `main` as `7877b61bf315ad8a5a919d634da7618db9a54df9`, then deleted the feature branch.
- Re-verified `WI-1128` on the delivery path and confirmed both `ci` (`22935717065`) and `vercel-production-deploy` (`22935717062`) stay green after the admin payroll queue subroute promotion.
- Started `WI-1129` to promote the employee leave-calendar hash destination onto `/employee/leave/calendar` and keep the legacy hash entry as compatibility-only behavior.
- Closed `WI-1129` through the full GitHub flow and merged it to `main` as `8bdc6a9013060f986b7b386c8156b24c7aa2c9b8`, then deleted the feature branch.
- Re-verified `WI-1129` on the delivery path and confirmed both `ci` (`22936407717`) and `vercel-production-deploy` (`22936407714`) stay green after the employee leave-calendar subroute promotion.
- Started `WI-1130` to promote the employee attendance and leave primary task surfaces onto stable subroutes and remove the remaining `#attendance` / `#leave` dependency from route-first employee IA.
- Closed `WI-1130` through the full GitHub flow and merged it to `main` as `12d6aee821ba69e04b70082b51695fa91c59a5a5`, then deleted the feature branch.
- Re-verified `WI-1130` on the delivery path and confirmed both `ci` (`22937377911`) and `vercel-production-deploy` (`22937377906`) stay green after the employee attendance and leave primary subroute promotion.
- Started `WI-1131` to align guide and mobile-menu primary attendance/leave entry points with the new stable employee subroutes and keep the base routes compatibility-only.
