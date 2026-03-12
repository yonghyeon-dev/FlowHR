# FlowHR Service Readiness Execution Map

Last updated: 2026-03-12  
Purpose: define the concrete work-item program that moves FlowHR from ongoing refactor to an actually operable HR SaaS for customer-facing production use.

## 1. Service Readiness Definition

FlowHR is considered ready for real service only when all of the following are true:

1. The product identity is understandable from the UI without operator explanation.
2. Customer admin and employee experiences feel like role views of one product.
3. Core daily journeys complete without hidden manual intervention.
4. Customer admins can operate the service from product UI rather than env vars or internal-only workflows.
5. Visual design, language, empty states, and error recovery feel intentional across the main surfaces.
6. The release loop is stable enough that merges do not outpace deploy verification.

## 2. Program Structure

## Phase A. Product Shell and Design System Adoption

Goal:

- Replace the legacy mixed shell with the V2 shell and design system baseline.

Work items:

- `WI-1170` V2 shell and design system baseline adoption
- `WI-1172` admin and employee V2 shell rollout for core routes
- `WI-1173` shared workspace primitives and route-first visual contract

Exit criteria:

1. landing, login, admin home, employee home, and top-level layouts follow one V2-based system
2. shared page header, card, queue, workspace, and empty-state patterns are reusable
3. old shell-specific UI assumptions no longer drive new route work

## Phase B. Customer Admin Operating Station Completion

Goal:

- Turn admin into a reliable customer-admin operating station, not a dashboard catalog.

Work items:

- `WI-1174` admin control tower and queue-first home rollout
- `WI-1175` admin operations lane rollout
- `WI-1176` admin payroll, filing, and document lane completion

Exit criteria:

1. admin home acts as a true control tower
2. people, operations, payroll, contracts, notices, and settings surfaces share one working rhythm
3. queue-driven action paths are clearer than summary-card browsing

## Phase C. Employee Work Home Completion

Goal:

- Turn employee into a calm, actionable work home instead of a mixed self-service shell.

Work items:

- `WI-1177` employee today hub completion
- `WI-1178` employee requests and response journeys completion
- `WI-1179` employee documents, notices, and account experience completion

Exit criteria:

1. employee home emphasizes today's tasks, active requests, documents, and alerts
2. requests, documents, and account surfaces use consistent route-first workspaces
3. employee-facing actions feel lighter and clearer than admin surfaces while remaining in the same product family

## Phase D. Role, Tenant, and Capability Realignment

Goal:

- Resolve the product-model contradictions that still leak through UI and journey behavior.

Work items:

- `WI-1180` role and tenant capability contract alignment
- `WI-1181` customer-admin versus ops boundary enforcement
- `WI-1182` membership, acting-role, and workspace-context productization

Exit criteria:

1. platform operator, customer admin, and employee boundaries are explicit
2. workspace context is visible as a product concept, not a technical claim
3. ops-only controls no longer influence customer-facing IA

## Phase E. Admin Operational Productization

Goal:

- Finish the settings and policy surfaces required to actually run the service.

Work items:

- `WI-1183` operational settings consolidation
- `WI-1184` policy and security surfaces completion
- `WI-1185` notification, escalation, and integration management completion

Exit criteria:

1. required day-2 controls exist in admin UI
2. the service no longer depends on hidden configuration for normal customer-admin operation
3. policy ownership is clear between product and ops

## Phase F. Core Journey Closure and Launch Gate

Goal:

- Close the remaining blockers between a strong shell and an actually launchable service.

Work items:

- `WI-1186` service-blocking journey closure bundle
- `WI-1187` production evidence and launch gate bundle

Exit criteria:

1. notice, contracts, approvals, year-end, filing, payroll, and request journeys are trusted by default
2. launch evidence is documented against the real service-readiness criteria
3. release cadence includes `main` CI green and production deploy green as completion gates

## 3. Dependency Rules

1. Phase A must lead because later UI work depends on the V2 shell and workspace primitives.
2. Phase B and Phase C can overlap once the shared shell contract is stable.
3. Phase D must start before the final launch gate because unresolved role/tenant contradictions will invalidate later UI work.
4. Phase E should follow the shell reset so settings use the new product language and layout system.
5. Phase F closes only after representative admin and employee surfaces are on the new shell.

## 4. Active Sequence

1. Close `WI-1170`
2. Reset CI truth through `WI-1188`
3. Start `WI-1172`
4. Start `WI-1173`
5. Then split admin and employee rollout waves under the program above

## 5. Completion Rule

The program is not complete when the wireframe looks better.

It is complete only when:

- the WI chain above is materially closed,
- the main admin and employee journeys work on the V2 shell,
- the product model matches the UI mental model,
- and production deploys stay green through the full repo process.
