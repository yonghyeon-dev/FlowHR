# WI-1172: V2 core route shell rollout

`WI-1170` established the shared V2 shell and design system. This WI applies that baseline to the first customer-facing core routes so admin and employee entry surfaces no longer mix the old workspace shell with the new V2 product rhythm.

## Scope

1. Roll the V2 route shell into the admin settings route and the employee requests route.
2. Align those routes with the V2 header, tab, card, and action hierarchy.
3. Reclassify stale shell guards that still expect the pre-V2 route shape.

## Acceptance Criteria

1. `/admin/settings` and `/employee/requests*` use the V2 route shell baseline without regressing the existing route-first flow.
2. Current V2 shell regression guards are green.
3. `main` CI and production deploy are green after merge.
