# WI-0642 Main Process Realignment

## Summary
- realigned local workflow drift where work had accumulated directly on `main` without PR routing
- created a dedicated feature branch to publish queued WI changes through standard CI/PR governance
- restored expected delivery process path:
  - `work-items/` linked
  - test/typecheck evidence attached in PR
  - template checklist and delivery-balance section completed
- aligned legacy regression anchor `e2e-wi0128-admin-approval-queue-ux-upgrade` to current admin IA:
  - allows approval queue access via dedicated `/admin/approval-executions` workspace shortcut
  - validates sorting controls on dedicated approval executions page instead of old monolithic `/admin` page state keys
- aligned legacy regression anchor `e2e-wi0217-filing-ops-flat-workflow-route-context-baseline` to current nav policy:
  - accepts root `/admin/payroll-year-end-filing/ops` link as valid nav exposure alongside flat step routes
- aligned legacy regression anchor `e2e-wi0219-self-service-ia-and-approval-queue-split` to current admin IA:
  - accepts dedicated `/admin/approval-executions` shortcut exposure on productized admin dashboard
- aligned legacy regression anchor `e2e-wi0177-admin-dashboard-bloat-section-removal` to current admin navigation IA:
  - keeps `/admin/approval-executions` as a core dedicated-route anchor
  - removes outdated hash-anchor expectations (`/admin#approvals`, `/admin#aggregates`, `/admin#leave-policy`, `/admin#payroll`)
- aligned legacy regression anchor `e2e-wi0394-korean-copy-terminology-normalization-withholding-payslip-contracts` to current locale copy schema:
  - validates session-context labels (`sessionOrganizationLabel`, `sessionEmployeeLabel`) in withholding/payslip ko copy
  - removes outdated `employeeIdLabel` / `organizationIdFallbackLabel` expectations after productized session-only UX
- aligned legacy admin decomposition/locale regression anchors to current productized IA contracts:
  - `e2e-wi0298`, `e2e-wi0299`, `e2e-wi0301`, `e2e-wi0310`, `e2e-wi0313`, `e2e-wi0344`
  - moved locale/queue helper import expectations from `src/app/admin/page.tsx` to orchestrator layer (`src/app/admin/page-panels.tsx`)
  - enforced `/admin` dashboard productization contract (direct workspace shortcuts, no legacy monolithic queue/helper wiring in page root)
- aligned legacy UX/copy anchors with current session-context and Korean copy terminology:
  - `e2e-wi0303`, `e2e-wi0305`, `e2e-wi0307`, `e2e-wi0331`, `e2e-wi0333`
  - replaced outdated labels (`Organization ID optional`, `마감 프리뷰`, inline `ko: {}` assumptions) with current copy/schema (`Session organization`, `마감 미리보기`, `copyKo` mapping style)

## Scope
- process correction only (no additional product feature scope beyond already committed WIs)
- target batch: WI-0618 through WI-0641 commits currently queued locally

## Testing
- CI checks on PR (contract-governance / quality-gates / golden-regression)
