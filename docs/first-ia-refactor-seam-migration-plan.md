# FlowHR First IA Refactor Seam Migration Plan

Last updated: 2026-03-11
Purpose: choose the first safe information-architecture refactor seam and define the migration order.

## 1. Decision

The first IA refactor seam is:

- `employee shell regrouping and hidden-subpage reduction`

This means the first structural implementation wave should focus on:

1. regrouping employee navigation around a smaller number of product areas
2. reducing the current dependence on `?focus=` and hash-driven hidden subpages
3. clarifying which employee experiences are real routes versus intra-page sections

## 2. Why This Seam Comes First

## 2.1 Highest Visible Product Confusion

The employee shell currently exposes the clearest product-shape contradiction:

- too many sidebar links
- too many links that are not real pages
- direct-load and client-side focus behavior used as structural navigation
- a self-service product that often feels like an implementation surface

This is the most obvious place where users can feel that the IA is unstable.

## 2.2 Safest Structural Refactor

Compared with admin shell refactoring:

- employee flows have lower ops sensitivity
- there are fewer operator-only dependencies
- the refactor can be performed without redefining all admin action flows first

Compared with full route-topology changes:

- the shell can be regrouped before every route is rewritten
- promotion rules can be introduced incrementally

## 2.3 Strongest UX Payoff

Employee UX benefits immediately from:

- Today-first navigation
- request-state clarity
- document access clarity
- fewer ambiguous hidden sections

This gives a strong visible improvement while still aligning with the deeper product model.

## 3. Seams Considered But Rejected For First Position

## 3.1 Admin Shell Regrouping

Reason not first:

- valuable, but touches more operational surfaces at once
- higher risk of mixing shell redesign with queue/action redesign
- better to do after the employee seam proves the shell principles

## 3.2 Ops Boundary Cleanup

Reason not first:

- necessary, but mostly a boundary and visibility problem
- not the strongest user-facing IA contradiction
- should follow once customer-admin and employee shell expectations are clearer

## 3.3 Shared Workspace Contract

Reason not first:

- architecturally important
- but easier to define after the first shell regrouping clarifies what counts as a page, a workspace, and a section

## 4. Target Employee IA

The employee shell should converge on five top-level areas:

1. `Today`
2. `Requests`
3. `Documents`
4. `Notices & Alerts`
5. `Account`

Secondary experiences may remain under those groups, but should not appear as top-level hidden-subpage links.

## 5. Promotion Rules

Promote a section to a real route when any of the following are true:

1. the section needs its own deep link
2. the section contains its own list/detail/task flow
3. the section is referenced by multiple shortcuts or guide CTA
4. the section frequently requires its own recovery, loading, or empty-state logic

Keep a section inline only when:

1. it is genuinely same-page context
2. it has no independent task ownership
3. it does not require stable external entry

## 6. Migration Order

## Step 1. Employee Navigation Regrouping

- regroup current employee nav entries under:
  - Today
  - Requests
  - Documents
  - Notices & Alerts
  - Account
- remove direct top-level exposure of hidden-section links

## Step 2. Hidden-Subpage Audit

- classify each current `?focus=` target as:
  - keep inline
  - promote to route
  - remove/merge

## Step 3. Route Promotion Slice

- promote the highest-value hidden subpages into explicit routes
- keep compatibility redirects only where necessary

## Step 4. Dashboard Shortcut Alignment

- rewire dashboard quick actions and guide CTA to the new route/group model

## Step 5. Mobile Alignment

- ensure mobile reflects the same grouped model rather than copying the old dense list

## 7. Next Implementation Mapping

### WI-1104

- define the shared workspace interaction contract after the employee shell regrouping model is explicit

### WI-1107

- implement the employee shell regrouping

### WI-1108

- apply the same shell lessons to admin regrouping

## 8. Acceptance Criteria

1. One first seam is explicitly chosen.
2. The document explains why it comes before the other seams.
3. The target employee IA is grouped into stable product areas.
4. The migration order is concrete enough to derive the next implementation WI.
