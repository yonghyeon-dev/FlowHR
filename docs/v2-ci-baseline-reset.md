# V2 CI Baseline Reset

Last updated: 2026-03-12

## Why This Reset Is Needed

The current CI chain is still optimized for the pre-V2 product shell.

Symptoms:

- `quality-gates` repeatedly fails on historical shell/nav/copy expectations rather than real product regressions.
- `test:integration` and `test:e2e:mvp` mix old shell contracts, mid-refactor route contracts, and still-valid business logic guards in one long linear chain.
- V2 adoption turns CI red even when the product is moving in the intended direction.

## Reclassification Rule

Each guard falls into one of three buckets.

### 1. Keep

Keep the guard in mainline CI when it verifies one of these:

- business rules and domain logic
- auth / role / tenant safety
- product-language rules that still apply on V2
- route-first contracts that remain the intended architecture
- deploy/build stability

### 2. Update

Update the guard when:

- the original intent is still valid
- but the exact shell/nav/copy/layout expectation is tied to pre-V2 structure

Typical examples:

- home page translator key assertions
- employee sidebar route assumptions
- admin layout direct-link assumptions
- old workspace summary strip or shell class checks

### 3. Archive

Archive the guard from mainline CI when:

- it encodes a structure that is intentionally replaced by V2
- and keeping it in `quality-gates` only blocks the new baseline

Examples:

- pre-V2 home shell wording as release truth
- hidden-subpage navigation assumptions that V2 intentionally removes
- direct menu/link expectations for routes no longer exposed in the main shell

## New CI Truth Hierarchy

Mainline `quality-gates` should prefer this order:

1. Domain and policy safety
2. Role / tenant / auth boundaries
3. V2 shell and route-first contracts
4. Product-language and localization correctness
5. Build/deploy health

Historical shell-specific layout assertions should not outrank the current product architecture.

## Execution Decision

The mainline gate now treats the following as the current V2 baseline:

- `test:quality-gates:current`
- `test:integration:current`
- `test:e2e:mvp:current`
- `test:e2e:ko-guard:current`

Historical or intentionally replaced shell expectations remain available through explicit non-mainline scripts:

- `test:integration:legacy`
- `test:integration:full`
- `test:e2e:mvp:legacy`
- `test:e2e:full`
- `test:e2e:legacy`
- `test:e2e:ko-guard:legacy`

This keeps the current delivery loop focused on:

1. representative domain journeys
2. auth / tenant / route-first boundaries
3. V2 shell and localization contracts
4. build and deploy stability

## Immediate Working Rule

While `WI-1170` is open:

1. Fix stale guards only when they block the current V2 batch.
2. Record the repeated failure family here.
3. After `WI-1170` closes, execute `WI-1188` as a dedicated CI reset wave.

## Repeated Failure Families Seen During WI-1170

- legacy home i18n-key expectations vs V2 locale branching
- old employee grouped-nav route expectations
- old mobile source-context assumptions
- old workspace summary strip / shell class assumptions
- old ops leave-promotion direct-link assumptions
- old filing ops nav-entry assumptions
- old employee onboarding-as-core-route assumptions
