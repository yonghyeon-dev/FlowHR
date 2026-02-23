# FlowHR Mobile (WI-0240)

`apps/mobile` is the Phase 7 (`WI-T`) baseline shell for the FlowHR mobile app.

## Scope

- Expo app bootstrap
- Login bootstrap (token + tenant + actor context)
- Secure session persistence
- Core shell screens:
  - Admin home shell
  - Employee home shell
- Shared API client wrapper for FlowHR backend requests

## Run (local)

```bash
cd apps/mobile
npm install
npm run start
```

## Environment

Copy `.env.example` to `.env` and override values for local/staging.

