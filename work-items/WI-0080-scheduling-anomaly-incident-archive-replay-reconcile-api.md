# WI-0080: Scheduling Anomaly Incident Archive/Replay/Reconcile API

## Background and Problem

WI-0079로 incident durable store를 도입했지만, 운영 관점에서 다음 공백이 남아 있습니다.

- 장기 운영 시 incident store 데이터 누적에 대한 보존(archive) 정책 실행 경로 부재
- 장애/운영 이슈 시 audit source로부터 durable store를 재구성(replay)하는 표준 경로 부재
- store와 audit projection 사이 정합성을 점검(reconcile)하는 점검 API 부재

운영자 자동화 신뢰도를 높이기 위해 archive/replay/reconcile 운영 API를 추가합니다.

## Scope

### In Scope

- 신규 운영 API:
  - `POST /scheduling/anomalies/incidents/archive`
  - `POST /scheduling/anomalies/incidents/replay`
  - `POST /scheduling/anomalies/incidents/reconcile`
- Archive:
  - 조건(`olderThanMinutes`, `state`, `assigneeId`) 기반 incident store 정리
  - audit tombstone(`scheduling.anomaly.incident.archived`) 기록
- Replay:
  - audit projection(옵션: archived 포함) 기반 store 재구성
  - dry-run/target incident replay 지원
- Reconcile:
  - store vs audit projection 정합성 비교 리포트
  - mismatch 유형 분류(`STORE_MISSING`, `ORPHANED_STORE`, `FIELD_MISMATCH`)

### Out of Scope

- 외부 워크플로 엔진 재처리(dead-letter replay) 구현
- incident archival 장기 스냅샷 테이블 분리
- incident lifecycle 도메인 이벤트 스키마 변경

## User Scenarios

1. 운영자는 오래된 resolved incident를 dry-run 후 안전하게 archive할 수 있다.
2. 운영자는 archive 이후 필요 시 audit source로 incident store를 replay할 수 있다.
3. 운영자는 reconcile 결과로 store/audit 불일치 항목을 즉시 식별할 수 있다.
4. 테넌트 경계 내에서만 archive/replay/reconcile 동작이 수행된다.

## Data Changes (Tables and Migrations)

- 신규 마이그레이션 없음
- 기존 `ScheduleAnomalyIncident` 테이블 재사용
- archive는 store row 삭제 + audit tombstone 방식으로 처리

## API/Event Changes

- API:
  - `POST /scheduling/anomalies/incidents/archive`
  - `POST /scheduling/anomalies/incidents/replay`
  - `POST /scheduling/anomalies/incidents/reconcile`
- Domain event:
  - 신규 없음
- Audit:
  - `scheduling.anomaly.incident.archived`
  - `scheduling.anomaly.incident.archive.generated`
  - `scheduling.anomaly.incident.replay.generated`
  - `scheduling.anomaly.incident.reconciliation.generated`

## Test Plan

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run test:integration`
- `npx tsx scripts/tests/e2e-wi0079-scheduling-anomaly-incident-durable-store-and-cooldown.test.ts`
- `npx tsx scripts/tests/e2e-wi0080-scheduling-anomaly-incident-archive-replay-reconcile.test.ts`

## Observability

- Archive summary/audit:
  - total/eligible/candidates/archived/skipped/failed
- Replay summary/audit:
  - requested/replayed/notFound/failed, includeArchived/from/to
- Reconcile summary/audit:
  - compared/returned, mismatch 분포

## Rollback Plan

- WI-0080 커밋 revert
- 신규 route 비활성화 및 service 함수 제거
- 데이터 복구가 필요하면 replay API(`includeArchived=true`) 또는 운영 스크립트로 재구성
