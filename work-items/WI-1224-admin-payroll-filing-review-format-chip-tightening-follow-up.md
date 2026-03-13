# WI-1224: 신고 검토 포맷 칩 카피 정리

## Background
- `/admin/payroll-year-end-filing` review row metadata still shows the full export format label even after transport chip compaction.
- `Hometax CSV` is wider than the other compact chips and makes the review row wrap earlier than necessary.
- Operators still need the full format wording inside the row tooltip/title when they hover the compact metadata line.

## Goal
- Keep the visible review-row export format chip compact while preserving the full format wording in the tooltip/title.

## Scope
- Add compact export format chip formatting for submission review metadata.
- Preserve full export format labels for the review-row tooltip/title contract.
- Add regression coverage for the compact chip and full tooltip behavior.

## Non-Goals
- Rework the broader filing review panel layout.
- Rename export format options outside the compact review metadata line.

## Acceptance Criteria
- Review row metadata uses a shorter export format chip for compact rendering.
- `title={formatSubmissionReviewMetaTitle(submission)}` still resolves to the full format wording.
- `npm run typecheck` passes.
- `npm run test:quality-gates:current` passes.
