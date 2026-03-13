# WI-1225: 신고 검토 검증 칩 카피 정리

## Background
- `/admin/payroll-year-end-filing` review row metadata still renders validation labels with the full option wording.
- The compact review row is already shortening transport and format chips, so validation should follow the same pattern.
- Operators still need the full validation wording in the metadata tooltip/title.

## Goal
- Keep the visible validation chip compact while preserving the full validation label in the tooltip/title.

## Scope
- Add compact validation chip formatting for submission review metadata.
- Preserve full validation labels for `formatSubmissionReviewMetaTitle`.
- Add regression coverage for the compact validation chip contract.

## Non-Goals
- Rework the validation selector itself.
- Rename validation labels outside the compact review metadata line.

## Acceptance Criteria
- Compact review metadata uses a shorter validation chip label.
- The hover tooltip/title still uses the full validation label.
- `npm run typecheck` passes.
- `npm run test:quality-gates:current` passes.
