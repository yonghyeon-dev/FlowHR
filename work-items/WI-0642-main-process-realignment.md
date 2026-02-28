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

## Scope
- process correction only (no additional product feature scope beyond already committed WIs)
- target batch: WI-0618 through WI-0641 commits currently queued locally

## Testing
- CI checks on PR (contract-governance / quality-gates / golden-regression)
