# FlowHR Role, Tenant, And Product Shell Blueprint

Last updated: 2026-03-11
Purpose: define the intended operating model for roles, tenants, and top-level product shell behavior before the next IA refactor lands.

## 1. Current Mismatch

The current system already has a role-claim baseline:

- canonical role claim: `app_metadata.role`
- canonical tenant claim: `app_metadata.organization_id`
- allowed roles include `admin`, `manager`, `employee`, `payroll_operator`, `system`

But the visible product shell still behaves as if:

1. `/admin` and `/employee` are separate products
2. internal ops and customer-facing affordances are too close together
3. role and tenant context are enforced technically, but not communicated product-wise
4. some capability boundaries are route-driven rather than experience-driven

This creates product confusion even when the underlying auth model is partially correct.

## 2. Target Operating Model

## 2.1 Actor Layers

### Platform Operator

- Internal only
- May cross tenant boundaries when explicitly authorized
- Owns ops dashboards, incidents, repair tools, and force actions
- Must never be presented as a normal customer-facing navigation mode

### Customer Admin

- Acts inside one customer workspace
- Owns people, approvals, benefits, recruitment, payroll, contracts, notices, settings, and reporting
- Can see operational controls that belong to customer administration
- Must not inherit internal ops affordances by default

### Employee

- Acts inside one customer workspace
- Owns self-service flows:
  - attendance
  - leave/request flows
  - documents
  - notices/notifications
  - year-end input
  - onboarding/account flows

## 2.2 Tenant Rules

### Workspace Context

- Every non-system session must act inside one selected customer organization
- The visible shell should describe that as `workspace` or `company workspace`, not by raw organization ID

### Membership

- A sign-in account may have one or more memberships
- Each membership binds:
  - organization
  - employee record when applicable
  - available role set

### Acting Role

- The acting role is the active product mode inside the selected tenant context
- Acting role must change:
  - accessible navigation
  - default landing destination
  - visible actions
  - recovery messaging

## 2.3 Capability Model

### Route Is Not The Whole Permission Model

- Route guards remain necessary
- But capability checks must be modeled by action ownership as well

### Capability Buckets

- `self_service`
- `people_admin`
- `approval_operator`
- `payroll_operator`
- `policy_admin`
- `ops_internal`

### Surface Ownership Rule

Every major screen must declare one primary owner:

- employee
- customer admin
- platform operator

If ownership is unclear, the screen is a redesign candidate.

## 3. Product Shell Rules

## 3.1 Landing

The landing page should communicate:

1. this is one FlowHR product
2. there are role-based entry paths
3. internal dev/ops entry points are never primary product CTAs

## 3.2 Admin Shell

The admin shell should behave as:

- one customer-admin workspace
- not an internal toolbox
- not a generic dashboard catalog

Preferred structure:

- Overview / Control Tower
- Operate
- People & Policy
- Payroll & Filing
- Communication
- Settings

## 3.3 Employee Shell

The employee shell should behave as:

- one self-service workspace
- not a feature index
- not a collection of hidden subpages

Preferred structure:

- Today
- Requests
- Documents
- Notices & Alerts
- Account

## 3.4 Ops Shell

- Internal-only
- Never a peer to customer-admin or employee navigation inside the customer product shell
- Must remain isolated by route, copy, and visibility policy

## 4. Current Route Assessment

## 4.1 Good Enough To Preserve

- `/admin` and `/employee` as separate top-level route namespaces can remain for now
- Dedicated admin workspaces such as payroll, contracts, reports, and settings are valid long-term patterns
- Dedicated employee routes such as payslips, contracts, year-end, and schedule are valid long-term patterns

## 4.2 Must Be Reworked

- employee shell overuses `?focus=` and hash-based hidden subpage behavior
- landing still encourages route entry more than product understanding
- admin shell still exposes too many items without a clear operating hierarchy
- hidden `/ops` affordances still influence visible navigation and mental model

## 4.3 Immediate Refactor Seam

The first refactor seam should be:

- keep route namespaces intact for safety
- redesign shell semantics and navigation grouping
- reduce hidden-subpage behavior on employee
- clarify admin vs ops ownership in visible navigation

This gives structural improvement without forcing a full rewrite of route topology in one step.

## 5. Mapping To Next WIs

### WI-1102

- Freeze the role, tenant, and shell blueprint

### WI-1103

- Choose the first IA seam and document the migration order in `docs/first-ia-refactor-seam-migration-plan.md`:
  - selected first seam: employee shell regrouping and hidden-subpage reduction
  - deferred seams: admin shell regrouping, ops boundary cleanup, shared workspace contract

### WI-1104

- Define the shared workspace interaction contract for all major product areas

### WI-1107 and WI-1108

- Use this blueprint as the acceptance baseline for employee/admin shell refactors

## 6. Acceptance Criteria

1. The difference between `platform operator`, `customer admin`, and `employee` is explicit.
2. Tenant context, membership, and acting role are expressed as product concepts, not only technical claims.
3. The intended admin, employee, and ops shell boundaries are explicit enough to guide refactor WIs.
4. The document identifies what can stay, what must change, and what the first safe refactor seam is.
