# WI-0926 In-App Notification Center

## Scope
- Add a new in-app notification read model (`InAppNotificationEntity`) in shared data access.
- Add authenticated notification center APIs for listing, marking one as read, and marking all as read.
- Add an end-to-end test that validates ownership scoping and read state transitions.

## Implementation
- `src/features/shared/data-access.ts`
  - Added `InAppNotificationEntity`.
  - Added `CreateInAppNotificationInput` and `UpdateInAppNotificationInput`.
  - Added `InAppNotificationStore` to `DataAccess`.

- `src/features/shared/memory-data-access.ts`
  - Added memory state map for in-app notifications.
  - Implemented `inAppNotifications` store methods:
    - `create`
    - `findById`
    - `update`
    - `list` (supports `recipientId`, `unreadOnly`, `limit`)
    - `markAllRead`

- `src/features/shared/prisma-data-access.ts`
  - Added Prisma-backed `inAppNotifications` store with equivalent methods and filtering/sorting.
  - Added mapping helper between Prisma record and `InAppNotificationEntity`.

- `prisma/schema.prisma`
  - Added `InAppNotification` model and `Organization.inAppNotifications` relation.
  - Added indexes for recipient list and unread filtering paths.

- `prisma/migrations/202603050005_wi0926_notification_center/migration.sql`
  - Added SQL migration for `InAppNotification` table, indexes, and foreign key.

- `src/app/api/notifications/route.ts`
  - Added `GET /api/notifications` with auth-required self-scope and `unreadOnly=true` support.
  - Limits list response to latest 50.

- `src/app/api/notifications/[notificationId]/read/route.ts`
  - Added `PATCH /api/notifications/[notificationId]/read`.
  - Enforces owner-only access and sets read state.

- `src/app/api/notifications/mark-all-read/route.ts`
  - Added `POST /api/notifications/mark-all-read`.
  - Marks all unread notifications as read for current actor.

- `scripts/tests/e2e-wi0926-notification-center.test.ts`
  - Seeds notifications directly through `memoryDataAccess.inAppNotifications`.
  - Validates list, single-read, mark-all-read, and cross-user access denial.

## Data Changes
- Table/model: `InAppNotification`
- Migration: `202603050005_wi0926_notification_center`

## Verification
- `npx tsx scripts/tests/e2e-wi0926-notification-center.test.ts`
- `npm.cmd run typecheck`
- `npm.cmd run lint`
