# WI-1053: Production surface humanization and identifier sanitization

## Background

Production review found multiple user-visible surfaces still exposing raw IDs, enums, entity labels, technical wording, and ISO timestamps. This makes FlowHR look like an internal tool instead of an operator-facing HR product.

## Goal

Replace internal and technical surface language with human-readable product language across the highest-risk user and admin surfaces.

## In Scope

- Approval queue title and reason rendering
- Employee profile labels
- Admin people history and compare panels
- Reports employee labels
- Employee status display labels
- Approval escalation field labels
- Audit-log target wording and filters
- Notification type labels
- User-facing date/time formatting on audited surfaces
- Human-readable user error messaging for technical auth/context failures

## Out Of Scope

- Deep domain model redesign
- New reporting features
- External webhook payload formatting

## Acceptance Criteria

1. No raw CUID, employeeId, organizationId, entity type, or enum leaks on the in-scope product surfaces.
2. Audited screens render human-readable labels in Korean product language.
3. User-facing timestamps on in-scope surfaces render in localized date/time format.
4. Technical runtime/auth wording is replaced with product recovery guidance.

## Implementation Progress

- Added a shared helper at `src/lib/product-language.ts` for human-readable status, type, role, channel, and error labels.
- Updated employee-facing profile, people, and notifications surfaces.
- Updated admin notifications, people history/compare, audit logs, reports, approval executions, approval history, and dashboard approval queue surfaces.
- Extended the same pass into admin approval policy and approval template management surfaces.
- Extended the same pass into admin invite/onboarding/payroll panels and employee guide session hints.
- Removed raw session and referrer identifiers from benefits and recruitment workspace views, and restored the deleted employee benefits workspace view during the cleanup.
- Reworded benefits, recruitment, and employee-guide copy from raw identifier vocabulary to workspace/account language.
- Reworded admin onboarding, KPI, notices, attendance-live, and leave-calendar copy to the same product-facing vocabulary baseline.
- Reworded employee onboarding recovery messages, employee session notices, payslip session copy, and approval queue search labels to the same baseline.
- Reworded payroll close, insurance, payslip delivery, year-end, filing, and contracts copy to the same product-facing vocabulary baseline.
- Remaining follow-up is limited to copy-level `Organization ID` / `Employee ID` wording and uncovered console-like production surfaces outside this first pass.
