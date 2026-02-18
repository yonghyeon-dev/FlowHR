# WI-0100: 관리자 승인 처리 이력(타임라인) UX

## Background and Problem

승인함에서 액션(승인/반려/확정)을 수행해도 처리 결과를 한 눈에 확인하기 어렵습니다.
운영자는 방금 어떤 항목이 성공/실패했는지 즉시 추적할 수 있어야 재처리/문의 대응이 쉬워집니다.

## Scope

### In Scope

- `/admin#approvals`에 최근 처리 이력 패널 추가
  - 출퇴근/휴가/급여 액션별 성공/실패 상태
  - 처리 시각, 대상 ID, 액션 라벨 표시
  - 일괄 처리 시 각 항목별 결과 누적

### Out of Scope

- 서버 영속 로그 조회 API
- 알림/웹훅 기반 에스컬레이션
- 결재선(다단 승인) 엔진

## Test Plan

- `npm run lint`
- `npm run typecheck`
- `npm test`
- (CI) `npm run test:integration`
- (CI) `npm run test:e2e:mvp`

