# FlowHR UI/UX-First Refactor Blueprint

Last updated: 2026-03-11
Purpose: define the structural refactor plan at large, medium, and small granularity so implementation can continue without drifting after future session compaction.

## 1. Why This Exists

FlowHR is no longer at the stage where isolated bug fixes or surface polish are enough.

The current product still contains structural contradictions that repeatedly reappear as:

- broken or misleading navigation
- tenant mismatch and role confusion
- admin and employee journeys that feel like separate products
- ops-only controls leaking into customer-facing mental models
- UI that exposes implementation concepts instead of product concepts

This document exists to prevent the execution loop from regressing into one-off cleanup work.

## 2. Core Contradictions That Must Be Fixed

### 2.1 Product Identity Contradiction

- Current state:
  - `/admin` and `/employee` often feel like separate apps.
  - The home page and surrounding shell do not fully explain whether FlowHR is one product with role-based views or multiple loosely connected products.
- Why this is a problem:
  - Customers cannot build a clean mental model from the UI alone.
- Required direction:
  - Treat FlowHR as one SaaS product with role-based views inside a single customer workspace.

### 2.2 Role Contradiction

- Current state:
  - Platform operator, customer admin, and employee concerns are partially mixed.
  - Some admin-visible flows look like internal tools rather than customer-admin tools.
- Why this is a problem:
  - Authorization and UI ownership feel arbitrary.
- Required direction:
  - Separate the acting roles into:
    - `platform operator`
    - `customer admin`
    - `employee`

### 2.3 Tenant Contradiction

- Current state:
  - `organizationId`, `actorId`, `employeeId`, and `userId` still influence UI and workflow shape in inconsistent ways.
  - Some admin-created data did not line up cleanly with employee-visible tenant flows.
- Why this is a problem:
  - The user sees one company workspace, but the system behaves like multiple overlapping contexts.
- Required direction:
  - Make tenant membership and acting role explicit in the model while hiding internal identifiers from the surface.

### 2.4 Information Architecture Contradiction

- Current state:
  - Some flows behave like pages, but are implemented as section jumps or `?focus=` states.
  - Some shortcuts and hidden routes still reflect implementation history more than user intent.
- Why this is a problem:
  - The UI looks unstable because navigation semantics are unstable.
- Required direction:
  - If a section behaves like a page, promote it to a route or a clear workspace destination.

### 2.5 Workspace Pattern Contradiction

- Current state:
  - Notices, benefits, recruitment, contracts, payroll, and approval surfaces often solve loading, empty, error, and save states independently.
- Why this is a problem:
  - UX quality varies by screen and fixes do not compound.
- Required direction:
  - Standardize the workspace interaction model before continuing broad surface cleanup.

### 2.6 Ops Boundary Contradiction

- Current state:
  - Some hidden or internal controls still influence customer-facing structure or copy.
  - The product still carries traces of console-like thinking.
- Why this is a problem:
  - Customer admins should not have to infer what is “real product” versus “internal operations.”
- Required direction:
  - Make `ops-only`, `customer-admin`, and `employee` boundaries explicit in the product model and route policy.

## 3. Target Product Model

## 3.1 Large Category A. Product And Role Model

### Medium A1. Actor Layers

#### Small A1-1. Platform Operator

- Internal only
- Owns platform health, forced operations, cross-tenant operations
- Must not appear as a normal customer-facing navigation mode

#### Small A1-2. Customer Admin

- Customer company operator
- Owns people, approvals, notices, benefits, recruitment, contracts, payroll, policies, and operational settings

#### Small A1-3. Employee

- Customer company employee
- Owns self-service journeys: view, request, respond, acknowledge, confirm

### Medium A2. Identity And Membership Model

#### Small A2-1. User Identity

- A sign-in account
- May have one or more memberships

#### Small A2-2. Tenant Membership

- Membership in one customer organization
- Determines workspace context

#### Small A2-3. Acting Role

- The role currently used inside the selected tenant
- Must be explicit in authorization and in top-level shell behavior

### Medium A3. Permission Model

#### Small A3-1. Capability-Based Access

- Permissions should map to actions and workspaces, not only routes

#### Small A3-2. Route Guards As Secondary Enforcement

- Routes still protect entry points
- But permission logic should live below route level too

#### Small A3-3. Surface Ownership

- Every screen must be classified as one of:
  - employee-facing
  - customer-admin-facing
  - ops-only

## 3.2 Large Category B. Product Shell And Information Architecture

### Medium B1. Top-Level Product Shape

#### Small B1-1. Single Product, Role-Based Views

- Preserve role-specific views
- Stop reinforcing the impression that `/admin` and `/employee` are different products

#### Small B1-2. Home And Entry Clarification

- The landing and shell must explain role entry clearly
- Dev/ops entry points must never compete with core product navigation

### Medium B2. Navigation Rules

#### Small B2-1. Stable Destinations Only

- Every visible entry point must land on a stable route or stable workspace state

#### Small B2-2. Section Jump Reduction

- `?focus=` and hash jumps are allowed only for genuinely intra-page behavior
- Hidden subpages masquerading as sections should be promoted

#### Small B2-3. Shortcut Governance

- Dashboard shortcuts must be treated as real product entry points
- Dead or policy-hidden shortcuts should be removed, not patched forever

### Medium B3. Route Policy

#### Small B3-1. Customer Routes

- Customer-admin and employee routes remain visible only when they map to real product destinations

#### Small B3-2. Ops Routes

- Internal-only tools remain isolated and non-competing

#### Small B3-3. Promotion Rules

- If a route or section needs repeated reliability exceptions, it becomes a redesign candidate

## 3.3 Large Category C. Shared Workspace Interaction System

### Medium C1. Workspace Frame

#### Small C1-1. Standard Header

- Title
- purpose
- status context
- back/return affordance

#### Small C1-2. Standard Body Zones

- summary
- list/table
- detail/editor
- action bar

### Medium C2. Standard Interaction States

#### Small C2-1. Loading State

- must look intentional, not blank

#### Small C2-2. Empty State

- must explain why nothing is visible and what the user can do next

#### Small C2-3. Success / Warning / Error State

- must be visibly differentiated

#### Small C2-4. Confirmation Rules

- destructive or irreversible actions require confirmation

### Medium C3. Cross-Surface Behavior

#### Small C3-1. Write Action Feedback

- submit
- save
- publish
- delete
- acknowledge

#### Small C3-2. Recovery Pattern

- recoverable errors need next steps, not just failure text

#### Small C3-3. Shared Language Primitives

- status
- timestamps
- role labels
- session guidance

## 3.4 Large Category D. Trust, Language, And Visual Product Quality

### Medium D1. Humanized Domain Language

#### Small D1-1. Remove Internal IDs And Enums

- no customer-facing CUID, raw IDs, enum names, or internal hash/code semantics

#### Small D1-2. Domain-Meaningful Labels

- requests, approvals, balances, notices, filings, and receipts must read like HR work, not API output

### Medium D2. Localization

#### Small D2-1. Korean-First Product Language

- Korean surfaces should not mix in English headings or internal operator jargon

#### Small D2-2. Date/Time Formatting

- locale-aware date/time summaries everywhere user-facing

#### Small D2-3. Recovery And Error Copy

- error language must be recovery-oriented and role-appropriate

### Medium D3. External Notifications

#### Small D3-1. Operator Notification Format

- Slack/Discord/webhook payloads must be readable as actions, not payload dumps

#### Small D3-2. Actionability

- include links, owners, urgency, and human-readable item descriptions

## 3.5 Large Category E. Operational Productization

### Medium E1. Customer-Admin Settings

#### Small E1-1. Notification And Escalation Settings
#### Small E1-2. Leave And Attendance Policy Settings
#### Small E1-3. Feature Management Boundaries

### Medium E2. Ops Boundary

#### Small E2-1. Explicit Ops-Only Classification
#### Small E2-2. Hidden Route Policy
#### Small E2-3. Customer-Safe Copy Around Managed Features

## 3.6 Large Category F. Visual Design System And Interaction Tone

### Medium F1. Design Direction

#### Small F1-1. Product Mood

- The product should feel like a modern operating tool, not a legacy ERP console.
- The product should feel warm, deliberate, and readable rather than cold, over-dense, or generic.

#### Small F1-2. Density Strategy

- `customer admin` surfaces may be dense, but must remain scannable.
- `employee` surfaces should be lighter, calmer, and more action-oriented.
- The two roles should still look like the same product family.

#### Small F1-3. Visual Identity

- Prefer paper-like neutral backgrounds, strong ink-like text, and restrained accent color.
- Status colors should support action priority, not dominate the layout.
- Cards, rails, and context panels should communicate hierarchy through spacing and tone before relying on heavy borders.

### Medium F2. Layout Model

#### Small F2-1. Admin Layout

- Preferred pattern:
  - left navigation rail
  - center queue/workspace
  - right context/action panel
- Admin should feel like an operating station, not a landing page plus scattered cards.

#### Small F2-2. Employee Layout

- Preferred pattern:
  - Today hub
  - quick actions
  - active requests/status
  - document hub
- Employee should feel like a personal work home, not a compressed feature catalog.

#### Small F2-3. Mobile Layout

- Mobile must not be a reduced desktop clone.
- Admin mobile should prioritize urgent approvals, alerts, and checks.
- Employee mobile should prioritize attendance, requests, document access, and notifications.

### Medium F3. Interaction Tone

#### Small F3-1. State-First UI

- Prefer queues, state changes, and next actions over decorative dashboard cards.
- The interface should answer:
  - what needs attention
  - why
  - what to do next

#### Small F3-2. Context Panels

- Detail and context panels should explain impact, history, blockers, and next action.
- Context should not be an afterthought; it is part of the decision surface.

#### Small F3-3. Feedback Rhythm

- Success, warning, danger, waiting, and blocked states must be visibly distinct.
- Toasts, inline banners, confirmations, and empty states must share a common visual rhythm.

## 3.7 HRWIRE Adoption Rules

The `HRWIRE` assets are useful as UI direction, but they are not the product model themselves.

Adopt from `HRWIRE`:

- admin `control tower` framing
- employee `today hub` framing
- queue + workspace + context split for admin-heavy flows
- mobile as a distinct information architecture
- session-aware UX and role-aware entry framing

Do not adopt from `HRWIRE` without redesign:

- any pattern that reinforces `/admin` and `/employee` as separate products
- dashboard-heavy layouts where queues should dominate
- section structure that looks elegant but still depends on fragile hidden states
- visual polish without an aligned role/tenant/product boundary model

## 4. Refactor Execution Order

## 4.1 Phase 1. Structural Definition

Goal:

- lock the product model before more surface cleanup drifts the roadmap

Deliverables:

- role/tenant model definition
- product shell and route policy definition
- first IA refactor seam selection

WI candidates:

- `WI-1101`: operating reset and roadmap rewrite
- `WI-1102`: role/tenant/product-shell blueprint
- `WI-1103`: first IA refactor seam selection and migration plan
- `WI-1113`: visual design principles and shell system definition

Reference design docs:

- `docs/role-tenant-product-shell-blueprint.md`

## 4.2 Phase 2. Shared UX Systemization

Goal:

- stop solving similar UI trust problems screen by screen

Deliverables:

- shared workspace interaction rules
- shared confirmation/feedback/recovery primitives
- shared status/date/time language rules

WI candidates:

- `WI-1104`: shared workspace interaction contract
- `WI-1105`: shared feedback and confirmation primitives
- `WI-1106`: shared product-language and date/time standardization
- `WI-1114`: shared admin/employee shell component system

## 4.3 Phase 3. Role And IA Refactor

Goal:

- make admin and employee flows feel like coherent role-based product areas

Deliverables:

- reduced `?focus=` dependence
- stable dashboard shortcuts
- clearer route ownership between admin, employee, and ops

WI candidates:

- `WI-1107`: employee self-service IA refactor
- `WI-1108`: admin dashboard and workspace entry refactor
- `WI-1109`: ops boundary and hidden-route policy cleanup
- `WI-1115`: mobile-first parity and dedicated mobile IA cleanup

## 4.4 Phase 4. Trust And Reliability Closure

Goal:

- finish remaining reliability and language gaps under the new structure

Deliverables:

- notice create reliability
- tenant-aligned admin to employee continuity
- remaining year-end and filing trust issues
- remaining humanization gaps only where still justified

WI candidates:

- `WI-1110`: notice and write-flow trust recovery
- `WI-1111`: tenant continuity and role-aligned data flow recovery
- `WI-1112`: year-end and filing final trust recovery

## 5. Dependency Rules

1. Do not continue broad screen-by-screen UI cleanup without first checking whether the issue belongs to a structural category above.
2. Do not design new customer-facing navigation before the role and shell model are explicit.
3. Do not move more settings into admin UI without classifying whether they are customer-admin or ops-only.
4. Shared workspace primitives should land before repeated per-screen feedback cleanup continues at scale.
5. Do not approve a new major UI direction unless it also specifies layout model, density strategy, and role ownership.

## 6. Definition Of Done For This Blueprint

This blueprint is usable only if:

1. future WI can be mapped to a large, medium, and small category from this file
2. contradictions are explicit enough that future drift can be detected
3. the next implementation wave can start from this file without re-deriving the product model
