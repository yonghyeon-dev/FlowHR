# WI-0452: Scheduling Service Incident Normalizer Extraction (Line Budget 5500)

## Summary
- Goal: `src/features/scheduling/service.ts`의 incident 정규화/환경 파싱 보일러플레이트를 분리해 파일 성장 속도를 억제한다.
- Scope:
  - incident normalizer 전용 모듈 추출
  - service.ts import 전환
  - service.ts line budget 5,500 이하 유지

## Delivery
- Added `src/features/scheduling/incident-normalizers.ts`
  - `normalizeIncidentListTopN`
  - `resolveAnomalyIncidentSlaTargetMinutes`
  - `resolveAnomalyIncidentWarningMinutes`
  - `normalizeAnomalyIncidentEscalationCooldownMinutes`
  - `normalizeAnomalyIncidentEscalationChannel`
  - `normalizeAnomalyIncidentArchiveOlderThanMinutes`
  - `normalizeAnomalyIncidentArchiveReason`
  - `normalizeAnomalyIncidentReplayTopN`
  - `normalizeAnomalyIncidentReplayIncidentIds`
  - `normalizeReconcileTopN`
  - `parseIsoTimestampToMillis`
  - `isWithinOptionalCreatedAtRange`
- Updated `src/features/scheduling/service.ts`
  - 위 정규화 함수들의 inline 구현 제거 후 모듈 import 사용.
  - line count 감소: 5,616 -> 5,471.
- Added `scripts/tests/e2e-wi0452-scheduling-service-incident-normalizer-extraction-line-budget-5500.test.ts`

## Validation
- [x] `npm.cmd run -s typecheck`
- [x] `npm.cmd exec tsx scripts/tests/e2e-wi0452-scheduling-service-incident-normalizer-extraction-line-budget-5500.test.ts`
