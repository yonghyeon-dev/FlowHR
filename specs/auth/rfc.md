# Auth Invite RFC (WI-0111)

## Goal

- Keep SaaS onboarding simple for 1-admin operation while supporting two invite delivery paths.
- Preserve claim provisioning (`role`, `organization_id`, optional `actor_id`) in Supabase `app_metadata`.

## Decision

`POST /auth/invites` adds `deliveryMode`:

- `link` (default): generate action link and return it to authorized caller.
- `email`: dispatch invite email via Supabase and return `actionLink=null`.

Both modes must update user claims and append the same audit trail.

## Security and Governance Notes

- Endpoint remains `admin`/`system` only.
- `actionLink` is treated as secret; no persistence in logs or stores.
- `deliveryMode=email` must not expose action link in API response.

## Backward Compatibility

- Existing callers that omit `deliveryMode` continue to receive `link` behavior.
- Contract/API version bump: `0.1.0` -> `0.2.0` (backward-compatible feature addition).

## Follow-up

- Optional future WI: invite lifecycle (reissue/expire/revoke) and branded email templates.
