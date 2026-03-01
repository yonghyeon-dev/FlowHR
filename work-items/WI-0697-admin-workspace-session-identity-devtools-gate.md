# WI-0697 Admin Workspace Session Identity Devtools Gate

## Summary
- gated read-only session identity metadata (`organizationId`, `actorId`) behind
  `NEXT_PUBLIC_FLOWHR_DEV_TOOLS` on core admin workspaces:
  - `src/components/scheduling/AdminSchedulingWorkspaceView.tsx`
  - `src/components/notices/AdminNoticeWorkspaceView.tsx`
  - `src/components/benefits/AdminBenefitsWorkspaceView.tsx`
  - `src/components/recruitment/AdminRecruitmentWorkspaceView.tsx`
- added `showDevTools` propagation to recruitment workspace orchestration
  (`src/components/recruitment/AdminRecruitmentWorkspace.tsx`) so behavior is
  aligned with other admin workspaces.
- kept session-derived runtime auth flow unchanged; only default UI exposure was
  reduced for product mode.

## Scope
- admin workspace UI exposure control only
- no API/schema/contract changes
- no ops route changes

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0697-admin-workspace-session-identity-devtools-gate.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0619-admin-scheduling-session-context-and-devtools-log-gate.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0620-notice-benefits-recruitment-session-context-productization.test.ts`
- `npm.cmd run typecheck`
