# Production Deployment Checklist

## Pre-deploy
- Confirm all required production environment variables are configured in Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `DATABASE_URL`.
- Confirm optional variables are reviewed for your environment: `DIRECT_URL` and `NEXT_PUBLIC_FLOWHR_DEV_TOOLS`.
- Run Prisma migrations against production: `npm.cmd run prisma:migrate:deploy`.
- Load seed data: `npm.cmd run db:seed`.

## Supabase setup
- Create the Supabase project for production and record project URL + keys.
- Configure authentication providers and redirect URLs used by the app.
- Verify Row Level Security is enabled and required RLS policies are applied for application tables.

## Vercel setup
- Add production environment secrets in Vercel project settings.
- Confirm build command is `npm run build` and install command matches repo standard.
- Confirm production branch is connected to `main` and auto-deploy policy is correct.

## Post-deploy
- Verify health endpoint returns success: `GET /api/health` should return HTTP `200` and `{"status":"ok"}`.
- Create the first admin user (or promote an existing user) and validate admin sign-in path.
- Run a smoke pass for auth, dashboard load, and one write action.

## Rollback procedure
- Roll back to the previous successful Vercel deployment from the Vercel Deployments UI.
- If a migration caused the issue, stop further deploys and execute the approved database rollback or hotfix migration plan.
- Re-verify `GET /api/health`, authentication, and critical workflows after rollback.
- Record incident notes with root cause, rollback timestamp, and follow-up actions.

