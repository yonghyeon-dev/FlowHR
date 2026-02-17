# WI-0079: Scheduling Anomaly Incident Durable Store and Cooldown Persistence

## Background and Problem

WI-0077/WI-0078 incident APIs use audit-log projection for read paths, but escalation cooldown 판단은 프로세스 재시작/운영 환경 전환 시 재요청 중복 위험이 있습니다.
운영자가 보는 incident 상태와 escalation cooldown 기준을 같은 durable source로 유지해야 온콜 자동화가 안정화됩니다.

## Scope

### In Scope

- Add durable incident table for scheduling anomaly lifecycle read-model.
- Persist incident lifecycle state/history into durable store on lifecycle command.
- Persist escalation cooldown timestamp per incident and use it as cooldown source-of-truth.
- Keep audit projection fallback/backfill path for compatibility.
- Add WI-0079 e2e coverage for durable read + cooldown skip + cross-tenant detail access.

### Out of Scope

- External workflow engine or ticket provider state synchronization
- Automatic incident resolve/close policies
- Additional incident UI changes

## User Scenarios

1. Operator can read incident detail/list from durable storage after lifecycle updates.
2. Escalation command skips incidents when cooldown metadata was already persisted.
3. Cross-tenant operator cannot read other-tenant incident detail.
4. Existing audit projection incidents can be backfilled into durable store without API break.

## Data Changes (Tables and Migrations)

- New table: `ScheduleAnomalyIncident`
- Existing tables (read-only linkage): `WorkSchedule`, `AttendanceRecord`, `AuditLog`
- Migration: `202602170001_scheduling_anomaly_incident_store`

## API/Event Changes

- API shape: unchanged (incident lifecycle/read-model/sla/escalation/auto-actions endpoints remain compatible).
- Audit:
  - `scheduling.anomaly.incident.backfilled`
  - existing incident audit actions remain unchanged
- Domain event shape: unchanged.

## Test Plan

- `npm run typecheck`
- `npx tsx scripts/tests/e2e-wi0077-scheduling-anomaly-incident-escalation-automation.test.ts`
- `npx tsx scripts/tests/e2e-wi0078-scheduling-anomaly-incident-auto-action-execution.test.ts`
- `npx tsx scripts/tests/e2e-wi0079-scheduling-anomaly-incident-durable-store-and-cooldown.test.ts`

## Observability

- Durable backfill path appends `scheduling.anomaly.incident.backfilled` audit log.
- Escalation cooldown source is persisted in `lastEscalationRequestedAt` and traceable in incident store.
- Incident list/detail/sla/escalation APIs keep existing audit signals for operator traceability.

## Rollback Plan

- Revert WI-0079 commit and remove `ScheduleAnomalyIncident` read path usage.
- Roll back migration `202602170001_scheduling_anomaly_incident_store` only with maintenance window and data-loss acceptance.
- Temporary fallback: serve incident read-model strictly from persisted audit projection path.
