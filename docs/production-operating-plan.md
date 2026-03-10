# FlowHR Production Operating Plan

Last updated: 2026-03-11
Owner: PM + Dev execution loop
Primary goal: make FlowHR operationally credible for real production use.

## 1. Source Of Truth

Use these documents in this order:

1. This file for production target, scope, epics, and execution rules.
2. `docs/production-operating-progress.md` for live status and the current wave.
3. `docs/production-gap-inventory.md` for the detailed production gap list and WI mapping.
4. `work-items/*` for implementation units.
5. `ROADMAP.md` and `docs/execution-plan.md` for historical and governance context.
6. `codex_test/results/prod-*` for production evidence only.

## 2. Production Bar

FlowHR is production-ready only when all of the following are true:

1. User-visible surfaces no longer expose internal IDs, enums, actor context, entity types, or developer-formatted payloads.
2. Admin and employee core journeys complete end-to-end without manual data fixes or tenant mismatches.
3. Operators can manage required settings through product UI instead of only environment variables.
4. Navigation, messaging, date/time formatting, and feedback behave like a user-facing product, not an internal toolset.

## 3. Active Epics

### Epic A. User-Facing Developer Trace Removal

Problem:

- Internal IDs, raw enums, technical labels, and developer payloads are still exposed in production UI and external notifications.

Scope:

- Approval queue titles and reasons
- Employee profile metadata
- People history/compare panels
- Reports tables
- Notification type labels
- Audit logs
- Approval escalation UI copy
- Discord/Slack webhook message formatting

Exit criteria:

1. No raw CUID, employeeId, organizationId, entityId, enum, or developer placeholder is shown in user/admin surfaces unless explicitly intended for operators.
2. External notifications use human-readable subject, actor, state, and action links.
3. Technical errors shown to users are replaced with localized product messages.

### Epic B. Core Journey Reliability

Problem:

- Several core write and read/write journeys still fail or behave inconsistently in production.

Scope:

- Notice creation payload mismatch
- Year-end and filing `409` conflict flows
- Contracts initial session race
- Admin/employee tenant mismatch
- Any remaining broken admin/employee direct journeys found during production verification

Exit criteria:

1. Admin-created entities are visible to the correct employee tenant and role journey.
2. Notice creation works for immediate publish and scheduled publish.
3. Year-end settlement, filing, and receipt journeys either complete successfully or show product-grade recoverable guidance.
4. Contracts pages do not emit first-load unauthorized requests.

### Epic C. Information Architecture And Navigation Hardening

Problem:

- Employee navigation depends too heavily on fragile `?focus=` and hash jumping. Some admin shortcuts and dead links have also been unreliable.

Scope:

- Employee direct `?focus=` deep links
- Employee client-side section jumps
- Mobile hash anchors
- Admin hash shortcuts
- Removal or redesign of routes that are not meaningful in production

Exit criteria:

1. Every visible navigation entry lands on a stable destination.
2. Employee dashboard sections either become robust deep links or are promoted to clearer dedicated routes.
3. Production does not expose dead or policy-hidden routes as active product entry points.

### Epic D. Admin Operational Controls Productization

Problem:

- Critical operating settings still live in env vars or API-only surfaces.

Scope:

- Webhook configuration
- Escalation policy thresholds
- Email notification settings
- Feature flags with operator ownership
- Leave policy management UI
- Attendance security settings such as GPS and geofence
- Employee notification defaults and durable preferences

Exit criteria:

1. Required day-2 operational settings are manageable in admin UI or are explicitly classified as ops-only.
2. Settings persist in durable storage and affect runtime behavior.
3. Hidden ops-only controls are not leaked into user-facing navigation.

### Epic E. UX And Localization Finish

Problem:

- Product polish is uneven across copy, feedback, confirmation, date formatting, and interaction response.

Scope:

- ISO timestamps in UI and notifications
- English headings or enums in Korean surfaces
- Missing toast or success feedback
- Unsafe immediate actions without confirmation
- JSON payload copy behaviors
- Dev tool remnants in employee surfaces

Exit criteria:

1. Korean user-facing surfaces use Korean product language consistently.
2. All meaningful write actions provide clear confirmation and success/failure feedback.
3. Dates and times render in user-facing locale formats.

Execution track:

1. Remove trust-breaking UX first:
   - missing confirmation before destructive or irreversible actions
   - missing success/error feedback after write actions
   - empty states that look broken
2. Normalize user-facing wording:
   - Korean headings
   - localized date/time formatting
   - human-readable status labels
3. Simplify interaction flows:
   - reduce fragile deep-link-only entry points
   - prefer stable dedicated routes when a section behaves like a page
4. Finish cross-device consistency:
   - mobile anchor/section movement
   - responsive navigation and sticky action behavior

### Epic F. CI Hardening

Status: deferred until product surface and journey issues are under control.

Reason:

- CI is alive, but current gaps are more product-surface and operational-model issues than broken pipeline execution.

When to start:

- After Epics A to C are materially reduced and core production journeys stabilize.

## 4. Initial Work Bundles

### Bundle 1. Production Surface Sanitization

- Convert the 30-item developer-trace audit into WI bundles by surface.
- Fix the highest-risk P0 exposures first:
  - approval queue
  - employee profile
  - employee status labels
  - notification types
  - Discord/Slack escalation messages

### Bundle 2. Reliability Recovery

- Resolve notice creation payload mismatch.
- Resolve tenant mismatch between admin-generated data and employee consumption.
- Resolve contracts first-load session race.
- Reassess year-end and filing `409` flows after tenant and state fixes.

### Bundle 3. Navigation Simplification

- Close remaining desktop focus deep-link failures.
- Remove or redesign fragile deep-link-only IA.
- Verify every visible admin and employee navigation target.

### Bundle 4. Admin Settings Productization

- Define which env-backed settings must move into `/admin/settings`.
- Split true ops-only controls from customer-admin controls.
- Implement durable settings and safe defaults.

### Bundle 5. UI/UX Finish Track

- Standardize confirmation, toast, and recovery feedback across employee/admin write actions.
- Normalize Korean copy, date/time formatting, and status wording on remaining mixed-language surfaces.
- Revisit employee self-service IA where sections still behave like hidden subpages.
- Re-check mobile/desktop parity after each UX slice so navigation and feedback stay consistent across devices.

## 5.1 UI/UX Finish Plan

Treat Epic E as a rolling finish track, not a single cleanup ticket.

Wave 1. Trust and recovery feedback

- Add confirmation before destructive or irreversible actions.
- Standardize success, warning, and recovery feedback after write actions.
- Replace broken-looking empty states with clear guidance and next actions.

Wave 2. Product language and localization

- Remove remaining mixed Korean/English headings and enum leakage.
- Normalize date/time, status, and summary wording to user-facing Korean product language.
- Replace technical fallback messages with recovery-oriented copy.

Wave 3. Flow and IA simplification

- Reduce fragile deep-link-only entry points.
- Promote sections that behave like full pages into clearer dedicated routes when needed.
- Revisit dashboards and hubs where hidden subpages still create navigation ambiguity.

Wave 4. Cross-device parity

- Re-check mobile anchor and section movement after each UX slice.
- Align sticky actions, navigation affordances, and feedback surfaces between desktop and mobile.
- Close parity gaps only after the corresponding desktop product flow is already stable.

## 6. Delivery Rules

Implementation must follow the verified repo process:

1. Create or update a `work-items/WI-xxxx-*.md`.
2. Branch from `main` using `feature/WI-xxxx-*`.
3. Implement and verify locally.
4. Open a PR with the required template and traceability.
5. Pass CI.
6. Merge to `main`.
7. Verify on the actual deployed production site.
8. Update `docs/production-operating-progress.md`.

## 7. Decision Rules

1. Do not add new surface area while a higher-priority production defect remains in the same flow.
2. Prefer deleting dead product entry points over preserving broken routes.
3. Prefer UI productization for operator settings when customer operations depend on them.
4. Evidence belongs in `codex_test/results`; planning belongs in `docs/production-operating-*`.
