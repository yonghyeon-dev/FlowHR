# WI-0755 Notices DB Persistence And Notification Read Model

## Summary
- moved notices runtime persistence to first-class data-access stores (`notices`, `noticeReadReceipts`, `noticeNotifications`) instead of audit replay scanning.
- added Prisma schema/migration for notice domain read models:
  - `Notice`
  - `NoticeReadReceipt`
  - `NoticeNotificationQueue`
- wired both runtime adapters:
  - `src/features/shared/prisma-data-access.ts`
  - `src/features/shared/memory-data-access.ts`
- kept audit traces for governance (`notice.created`, `notice.published`, `notice.read`, `notice.notification.enqueued`) while using DB read models for query speed and consistency.

## Scope
- notices domain persistence/read-model upgrade only
- no scheduler/cron/actions expansion
- no new ops console surface

## Testing
- `npm.cmd exec tsx scripts/tests/e2e-wi0407-notices-core-journey-implementation.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0754-notices-audit-persistence-notification-link.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0755-notices-db-persistence-notification-read-model.test.ts`
- `npm.cmd run typecheck`
