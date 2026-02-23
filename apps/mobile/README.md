# FlowHR Mobile (WI-0240)

`apps/mobile` is the Phase 7 (`WI-T`) baseline shell for the FlowHR mobile app.

## Scope

- Expo app bootstrap
- Login bootstrap (token + tenant + actor context)
- Secure session persistence
- Core shell screens:
  - Admin home shell
  - Employee home shell
  - Admin approval queue shell
  - Employee request submit shell
  - Employee request history/status shell
- Shared API client wrapper for FlowHR backend requests
- Push notification baseline
  - permission bootstrap
  - preference toggles
  - in-app notification center shell
  - realtime refresh/polling + category filter
  - notification history search/archive
  - notification history bulk actions (select/read/archive/unarchive)
  - notification history quick preset filters
  - notification history preset pin/recent persistence
  - notification history preset import/export transfer
- Email template baseline
  - transactional template catalog
  - locale switch (`ko`/`en`) and variable preview
  - preview history persistence

## Run (local)

```bash
cd apps/mobile
npm install
npm run start
```

## Environment

Copy `.env.example` to `.env` and override values for local/staging.

