# WI-0795 Employee Layout Dev Admin Label Clarity

## Background

- Employee layout admin shortcut is correctly hidden behind `showDevTools`, but label wording remained plain `관리자/Admin`.
- This could still look like a product-mode navigation path instead of a development-only shortcut.

## Scope

- Update `employee.nav.admin` runtime copy in `src/lib/i18n/messages.ts`:
  - ko: `(개발) 관리자`
  - en: `(dev) Admin`
- Keep existing `showDevTools` gating behavior in `src/app/employee/layout.tsx`.
- Add WI-0795 regression guard and roadmap traceability update.

## Acceptance Criteria

1. Employee layout admin shortcut label is explicitly dev-only in ko/en locale copy.
2. Employee layout admin shortcut remains gated by `showDevTools`.
3. Regression test and roadmap/work-item links are updated.

## Notes

- Copy clarity and UX boundary hardening only.
- No API/schema/auth contract changes.
