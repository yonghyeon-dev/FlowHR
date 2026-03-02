# WI-0805 Employee Dashboard Action Priority Badges

## Background

- Employee dashboard already has a single "today's priority" card.
- Users still need quick visibility of all incomplete checklist areas with urgency levels.

## Scope

- Add action-priority badge model for employee submit checklist cards.
- Expose per-card urgency badge (`critical`/`watch`/`stable`) using remaining-check count.
- Render priority badge buttons in the priority panel with direct section-jump actions.

## Acceptance Criteria

1. Priority panel displays multiple action badges from integrated checklist cards.
2. Each badge shows remaining/total checks and urgency label.
3. Badge click jumps to the mapped checklist target section.
4. Regression test and roadmap/work-item links are updated.

## Notes

- Employee dashboard UX enhancement only.
- No API contract/schema changes.
