# WI-0086: Admin Priority Queue Inline Actions

## Background and Problem

현재 `/` Command Center는 미승인/미확정 건수를 빠르게 확인할 수는 있지만,
실제 승인/반려/확정을 위해서는 ID를 복사해서 입력 필드에 붙여넣는 과정이 필요합니다.
이 단계가 운영자의 조치 시간을 늘리고, Shift/Flex 대비 “운영 속도” KPI 달성에 방해가 됩니다.

## Scope

### In Scope

- `/`의 “우선 조치 큐” 패널에서 아래 항목을 **리스트로 표시**하고 **인라인 액션** 제공
  - 출퇴근(PENDING): 승인/반려
  - 휴가(PENDING): 승인/반려(반려 사유 필수)
  - 급여(PREVIEWED): 확정
- 큐 조회는 특정 직원 필터 없이(tenant 전체) 조회
- 반려 사유 입력 필드 추가(출퇴근: 선택, 휴가: 필수)

### Out of Scope

- 상세 페이지/검색/페이지네이션
- 실시간 스트리밍 큐(SSE) 및 SLA 기반 자동 정렬

## User Scenarios

1. 운영자가 “우선순위 큐 새로고침”을 누르면 미처리 건이 즉시 리스트로 표시된다.
2. 운영자는 리스트에서 바로 승인/반려/확정을 처리한다.
3. 처리 후 리스트가 갱신되어 다음 우선 건으로 자연스럽게 진행된다.

## Data Changes (Tables and Migrations)

- 없음

## API/Event Changes

- 없음 (기존 API 사용)

## Test Plan

- `npm run lint`
- `npm run typecheck`
- `npm test`
- 로컬 수동 검증:
  - PENDING 출퇴근/휴가, PREVIEWED 급여 Run 생성 후 큐에서 인라인 처리 → 상태 변화 확인

## Rollback Plan

- `src/app/page.tsx`, `src/app/globals.css`의 WI-0086 변경 revert

