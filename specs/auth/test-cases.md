# Auth Invite Test Cases

## Functional Cases

1. Admin generates invite link (201) and receives `actionLink`.
2. Generated user has `app_metadata.role`, `app_metadata.organization_id` set.
3. Optional `actor_id` claim is stored when provided.
4. Non-admin caller is rejected (403).
5. Missing actor context is rejected (401).
6. When actor has `organizationId`, mismatching payload organization id is rejected (403).
7. Invalid email or role is rejected (400).

