# WI-0135: Admin People UX Phase 2 - Filtering, Change Highlight, Mobile Navigation Flow

## Background and Problem

`/admin/people` already supports organization tree, employee compare, and history cards.  
However, admins still need faster triage in three points:

- finer filtering by department/position/recent update window
- clearer visual highlight for where profile changes happened
- faster section-to-section navigation on mobile screens

This WI adds those UX improvements without changing backend contracts.

## Scope

### In Scope

- Extend directory filters in `/admin/people`
  - department filter
  - position filter
  - updated window filter (`all`, `7`, `30`, `90` days)
  - filter reset action and summary line
- Add change-point highlight UX
  - compare table change chip (`CHANGED`)
  - history change summary chips (field-level counts)
  - per-change highlight tone classes by field group
- Add mobile navigation flow panel
  - section jump actions (`filters`, `org chart`, `compare`, `history`)
  - inline navigation feedback message
- Add admin sidebar anchors for new `/admin/people` sections
- Add styles and responsive rules for new panels/chips/highlights
- Add WI-0135 e2e test and wire it into MVP/FULL test suites

### Out of Scope

- People API schema changes
- DB migration/model changes
- scheduler/cron/workflow additions

## User Scenarios

1. Admin narrows people list quickly using department/position/recent update filters.
2. Admin identifies exactly which profile area changed from highlighted history and compare chips.
3. Admin navigates between people sub-sections quickly on mobile with section jump buttons.

## Data and API Changes

- No DB schema changes
- No API contract changes
- UI-only improvements in admin people page and shared styles

## Rollback Plan

- Remove phase 2 filter controls, change highlights, and mobile navigation panel.
- Remove sidebar anchors added for `/admin/people` sections.
- Revert only UI/tests/docs files; backend rollback is not needed.

## Definition of Done (DoD)

- [x] Department/position/updated-window filters and reset behavior work in UI.
- [x] Compare/history change highlights and summary chips are rendered.
- [x] Mobile navigation flow panel jumps to each section and shows feedback.
- [x] Admin sidebar includes anchors to phase 2 people sections.
- [x] WI-0135 e2e is added and connected to MVP/FULL suites.
