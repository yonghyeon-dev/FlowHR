# FlowHR Production Operating Plan

Last updated: 2026-03-11
Owner: PM + Dev execution loop
Primary goal: make FlowHR operationally credible by treating UI/UX as the organizing principle of the product, not a finishing layer.

## 1. Source Of Truth

Use these documents in this order:

1. This file for production target, epics, and execution rules.
2. `docs/ui-ux-first-refactor-blueprint.md` for the large/medium/small refactor structure and contradiction map.
3. `docs/production-operating-progress.md` for live status and the active wave.
4. `docs/production-gap-inventory.md` for the detailed gap list and WI mapping.
5. `work-items/*` for implementation units.
6. `ROADMAP.md` and `docs/execution-plan.md` for historical and governance context.
7. `codex_test/results/prod-*` for production evidence only.

## 2. Reframed Operating Goal

FlowHR is production-ready only when all of the following are true:

1. A customer can understand what the product is and who it is for from the UI alone.
2. Admin and employee experiences feel like role-based views of one product, not two loosely joined apps.
3. Permissions, tenant boundaries, navigation, messaging, and settings behave consistently with the mental model shown in the UI.
4. User-facing surfaces no longer leak internal identifiers, technical wording, or developer-only recovery paths.
5. Core journeys are reliable enough that the UI can be trusted as the source of action, not a shell over manual intervention.

## 3. Product Diagnosis

The remaining issues are no longer best described as isolated bugs.

The main contradictions are:

1. UI/UX has been treated as polish, while the real problems are product-structure problems expressed through UI.
2. Admin, employee, and internal ops concerns are still mixed in the product model and sometimes in the visible surface.
3. Tenant, actor, employee, and organization concepts are not represented cleanly enough to support an intuitive SaaS mental model.
4. Navigation and workspace behavior still reflect implementation convenience more than user intent.

Because of that, FlowHR now needs a UI/UX-led refactor plan, not only a finish pass.

## 4. Active Epics

### Epic A. UI/UX-Led Product Structure Reset

Problem:

- The current product shell, route split, and workspace patterns do not reflect a clean SaaS mental model for customer admins and employees.

Scope:

- Clarify the top-level product shape
- Reassess `/admin`, `/employee`, and hidden `/ops` boundaries
- Standardize shared workspace patterns
- Reduce UI behaviors that exist only because of current implementation constraints

Exit criteria:

1. The product has a clear shell and role-based experience model.
2. Visible navigation maps to stable destinations and understandable product areas.
3. Shared workspace states feel consistent across notices, benefits, recruitment, contracts, payroll, and approvals.

### Epic B. Role, Tenant, And Permission Model Realignment

Problem:

- Platform operator, customer admin, and employee concerns are not cleanly separated in the current domain and routing model.

Scope:

- Define platform operator vs customer admin vs employee responsibilities
- Align tenant membership, acting role, and permission checks
- Remove UI behaviors that imply the wrong ownership boundary
- Resolve customer-admin to employee data flow mismatches

Exit criteria:

1. The product makes it clear who is acting and for which company context.
2. Admin-created entities appear in the correct customer-admin and employee journeys.
3. Ops-only controls are not presented as customer-product affordances.

### Epic C. User-Facing Trust And Language Cleanup

Problem:

- Internal IDs, raw enums, technical wording, and inconsistent formatting still break trust on visible surfaces.

Scope:

- Developer trace removal
- Human-readable labels and summaries
- Localized date/time/status rendering
- Product-grade recovery and error language
- External notification wording

Exit criteria:

1. Korean user-facing surfaces read like a product, not a console.
2. No raw internal identifiers or technical payload language remain on customer-facing surfaces unless intentionally operator-only.
3. Confirmation, success, warning, and recovery language are consistent.

### Epic D. Core Journey Reliability As UX Trust

Problem:

- Reliability issues are not separate from UX; they directly break the credibility of the product experience.

Scope:

- Notice creation reliability
- Year-end and filing conflict recovery
- Contracts bootstrap/session race
- Remaining broken direct journeys
- Write-action feedback and recovery behavior

Exit criteria:

1. Core journeys complete without hidden manual fixes.
2. Recoverable conflicts show product-grade guidance.
3. First-load and first-action behavior is stable on production journeys.

### Epic E. Admin Operational Controls Productization

Problem:

- Critical day-2 operating controls still depend on env vars or API-only surfaces.

Scope:

- Webhook configuration
- Escalation thresholds
- Email notification settings
- Feature management boundaries
- Leave policy management UI
- Attendance security settings
- Employee notification defaults and durable preferences

Exit criteria:

1. Required customer-admin controls exist in admin UI or are explicitly classified as ops-only.
2. Settings persist durably and affect runtime behavior.
3. Product navigation does not leak hidden ops-only controls.

### Epic F. CI Hardening

Status: deferred until the product model and top-priority user-facing contradictions are materially reduced.

Reason:

- The biggest risks are still product-shape, journey, and trust problems rather than missing pipeline execution.

When to start:

- After Epics A to D have reduced the current structural churn.

## 5. Execution Order

### Wave 1. UI/UX-Critical Structure

- Reframe the product around user-visible role boundaries first.
- Identify where the current route split or section-jump model conflicts with actual user intent.
- Stop treating IA and role confusion as polish issues.

### Wave 2. Trust Recovery

- Remove remaining developer trace and technical language.
- Standardize confirmation, success, warning, and recovery feedback.
- Normalize date/time/status language.

### Wave 3. Journey And Model Alignment

- Resolve tenant/role mismatches that break admin-to-employee flow continuity.
- Simplify deep-link and section-jump dependence where those flows behave like pages.
- Align workspace interaction patterns across major surfaces.

### Wave 4. Operational Productization

- Move required operator settings into admin UI.
- Separate customer-admin controls from platform-ops controls.
- Lock down any remaining policy-hidden routes or internal-only affordances.

## 6. Current Work Bundles

### Bundle 1. UI/UX-First Roadmap Reset

- Reposition UI/UX from finish-track to top-level organizing principle.
- Rewrite the operating documents so structural refactors become first-class work.
- Reclassify existing gaps by whether they are structural, trust, reliability, or ops-productization problems.
- Anchor future work to `docs/ui-ux-first-refactor-blueprint.md`.

### Bundle 2. Role And IA Refactor Seed

- Define the intended product shell and role model.
- Identify where `/admin`, `/employee`, and `/ops` do not match the intended experience.
- Select the first refactor seam that can improve structure without a large unsafe rewrite.
- Carry the visual design and density rules from `docs/ui-ux-first-refactor-blueprint.md` into the first shell-level refactor instead of treating design as a later pass.

### Bundle 3. Trust Surface Cleanup

- Continue targeted cleanup only when it clearly supports the new structure.
- Prefer shared language/state primitives over one-off copy fixes.
- Keep removing trust-breaking raw identifiers and technical wording.

### Bundle 6. Visual Design Systemization

- Define the shared admin/employee shell and layout rhythm.
- Lock the product mood, density strategy, context-panel behavior, and mobile-first layout rules.
- Use `HRWIRE` as reference input only where it supports the target product model.

### Bundle 4. Journey Reliability Recovery

- Close reliability gaps that block credible user action.
- Treat error handling and recovery UI as part of journey design.
- Re-verify production flows after each merged slice.

### Bundle 5. Admin Controls Productization

- Keep productizing operator settings that must be customer-admin visible.
- Explicitly classify anything that remains ops-only.

## 7. Delivery Rules

Implementation must follow the verified repo process:

1. Create or update a `work-items/WI-xxxx-*.md`.
2. Branch from `main` using `feature/WI-xxxx-*`.
3. Implement and verify locally.
4. Open a PR with the required template and traceability.
5. Pass CI.
6. Merge to `main`.
7. Confirm `main` CI and `vercel-production-deploy` are green.
8. Delete the remote feature branch and return local checkout to `main`.
9. Update `docs/production-operating-progress.md`.

## 8. Decision Rules

1. If a UI/UX issue reveals a product-model contradiction, treat it as a structural problem first.
2. Prefer removing or redesigning misleading product entry points over preserving broken affordances.
3. Prefer shared interaction and language primitives over repeated screen-level cleanup.
4. Evidence belongs in `codex_test/results`; planning belongs in `docs/production-operating-*`.
