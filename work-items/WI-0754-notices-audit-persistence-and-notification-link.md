# WI-0754 Notices Audit Persistence And Notification Link

## Summary
- converted notices storage from process-memory arrays to audit-backed persistence logic in
  `src/features/notices/store.ts` so notice create/publish/read flows persist through runtime data access.
- rewired notices API routes to use runtime data access:
  - `src/app/api/notices/route.ts`
  - `src/app/api/notices/[noticeId]/publish/route.ts`
  - `src/app/api/notices/[noticeId]/read/route.ts`
  - `src/app/api/notices/read-all/route.ts`
- linked publish flow to notification pipeline anchor by recording `notice.notification.enqueued`
  audit actions on publish.

## Scope
- notices core journey persistence and publish/read behavior only
- no scheduler/cron/actions expansion
- no phase-style helper extraction loop

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0407-notices-core-journey-implementation.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0754-notices-audit-persistence-notification-link.test.ts`
- `npm.cmd run typecheck`
