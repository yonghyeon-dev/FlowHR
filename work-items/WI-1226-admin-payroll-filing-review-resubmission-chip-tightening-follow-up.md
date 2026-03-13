# WI-1226: 신고 검토 재제출 칩 카피 정리

## Background
- `/admin/payroll-year-end-filing` review row metadata still renders the full resubmission reason string.
- Long retry reasons now dominate the compact review row even after transport, format, and validation chip tightening.
- Operators still need the full reason in the tooltip/title for audit context.

## Goal
- Keep the visible resubmission reason chip compact while preserving the full retry reason in the tooltip/title.

## Scope
- Add compact resubmission reason chip formatting for submission review metadata.
- Preserve full resubmission reason wording for the tooltip/title contract.
- Add regression coverage for the compact retry chip contract.

## Non-Goals
- Change how retry reasons are entered.
- Rename resubmission labels outside the compact review metadata line.

## Acceptance Criteria
- Compact review metadata truncates long resubmission reasons behind a shorter retry chip.
- The row tooltip/title still exposes the full retry reason.
- `npm run typecheck` passes.
- `npm run test:quality-gates:current` passes.
