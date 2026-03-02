# WI-0789 Employee Focus Query Priority Route

## Background

- WI-0787 and WI-0788 added a checklist-driven priority-action panel on `/employee`.
- Priority links existed, but deep-link entry to the target section was not normalized at page-load time.

## Scope

- Add `resolveEmployeeFocusSectionId` in employee query prefill helpers:
  - Parse `?focus=...`
  - Normalize aliases (`overview`, `checklist`, `resubmit`, etc.)
  - Allow-list supported section IDs only
- Update `/employee` page to auto-jump when a valid `focus` query is present.
- Update priority workspace target mapping to use focus-query routes:
  - `/employee?focus=attendance`
  - `/employee?focus=leave`
  - `/employee?focus=request-resubmit`
  - fallback `/employee?focus={sectionId}`
- Add WI-0789 regression guard and roadmap traceability update.

## Acceptance Criteria

1. Valid `?focus=` query values auto-scroll to the related section on `/employee` load.
2. Invalid focus query values are ignored safely.
3. Priority-action secondary CTA routes via focus query links.
4. Regression test + roadmap/work-item links are present.

## Notes

- UI navigation enhancement only.
- No API, schema, or permission changes.
