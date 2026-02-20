# Auth Invite Test Cases

## Functional Cases

1. Admin generates invite with `deliveryMode=link` (201) and receives non-null `actionLink`.
2. Admin generates invite with `deliveryMode=email` (201) and receives `actionLink=null`.
3. Generated user has `app_metadata.role`, `app_metadata.organization_id` set.
4. Optional `actor_id` claim is stored when provided.
5. Non-admin caller is rejected (403).
6. Missing actor context is rejected (401).
7. When actor has `organizationId`, mismatching payload organization id is rejected (403).
8. Invalid email, role, or delivery mode is rejected (400).

## Regression Focus

1. `deliveryMode=email` must not leak or persist `actionLink`.
2. `auth.invite.generated` and `auth.user.claims.updated` audit events remain emitted for both delivery modes.
3. Default mode without `deliveryMode` remains `link` for backward compatibility.
