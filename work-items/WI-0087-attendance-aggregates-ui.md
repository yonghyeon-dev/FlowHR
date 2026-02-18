# WI-0087: Attendance Aggregates UI (근태 집계)

## Background and Problem

FlowHR는 `GET /api/attendance/aggregates`로 근태 집계를 제공하지만,
현재 UI에서는 JSON 로그를 직접 확인해야 해서 실사용(검증/운영)이 느립니다.
근태 집계는 “근태집계 및 마감” 기능의 핵심 기반이므로, UI에서 바로 읽히는 형태로 노출해야 합니다.

## Scope

### In Scope

- `/admin`의 “근태 집계” 패널에서 근태 집계 결과를 리스트로 렌더링
  - 직원별 승인/대기/반려/급여반영 건수
  - 정규/연장/야간/휴일 시간(분 → 시간 변환) 표시
- “근태 집계(전체)” 버튼 추가(tenant 전체 집계)
- 집계 결과에서 “이 직원으로 필터” 버튼으로 다른 패널의 employeeId 입력을 빠르게 세팅

### Out of Scope

- 마감(Period Close) 정책/DB 모델/잠금 로직
- CSV/엑셀 내보내기

## Test Plan

- `npm run lint`
- `npm run typecheck`
- `npm test`
- 로컬 수동 검증:
  - 여러 직원의 출퇴근 승인 데이터 생성 → 근태 집계(전체) 조회 → 집계 수치/시간 표시 확인

