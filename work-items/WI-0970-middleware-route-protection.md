# WI-0970: Middleware route protection

## Background

`src/middleware.ts` protects authenticated workspace prefixes, but `/onboarding` was not included in `PROTECTED_PREFIX_PATHS`.
Also, `/forgot-password` should be explicitly listed in `PUBLIC_EXACT_PATHS` to keep public auth-route handling explicit.

## Scope

### Included

- Add `/forgot-password` to `PUBLIC_EXACT_PATHS`.
- Add `/onboarding` to `PROTECTED_PREFIX_PATHS`.
- Keep middleware behavior unchanged for all other paths.

### Excluded

- Auth token parsing or redirect URL logic changes.
- Additional route policy updates outside `/forgot-password` and `/onboarding`.
- API contract, schema, or migration changes.

## Implementation Notes

- Updated only the route list constants in `src/middleware.ts`.
- No middleware control-flow changes were introduced.

## Tests

- `npm run typecheck`
- `npm run lint -- --file src/middleware.ts`

## ADR

- Not required: this is a scoped route classification update with no architectural impact.
