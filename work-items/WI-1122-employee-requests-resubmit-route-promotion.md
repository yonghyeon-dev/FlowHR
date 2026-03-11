# WI-1122: 직원 요청 재제출 경로 승격

## 배경

`WI-1117`부터 `WI-1121`까지 직원 셸을 route-first 구조로 옮겼지만,
`/employee/requests`의 재제출 워크스페이스는 아직 선택한 항목을
`/employee?focus=attendance` 또는 `/employee?focus=leave`로 되돌려 보냅니다.

현재 모순:

- 요청 워크스페이스는 명시적인 route인데, 재제출만 홈의 숨은 subpage를 다시 거칩니다.
- 재제출 CTA가 구조적으로 구형 `?focus=` 내비게이션에 의존합니다.
- route-first 모델 아래에서도 요청에서 작업면으로 이어지는 경로가 일관되지 않습니다.

## 목표

- 요청 워크스페이스의 재제출 CTA를 숨은 `?focus=` 경유 없이 전용 route로 직접 연결합니다.
- attendance 재제출은 `/employee/attendance`, leave 재제출은 `/employee/leave`로 직접 이동합니다.
- 재제출 handoff에도 `source=employee-requests` 맥락을 유지합니다.

## 범위

### In Scope

- `/employee/requests` 재제출 CTA의 draft href 변경
- 재제출 handoff route 회귀 가드 추가
- 기존 employee requests seam 가드의 stale expectation 보정

### Out of Scope

- 요청 워크스페이스 UI 재배치
- 재제출 상세 패널 copy 변경
- mobile IA 전체 정렬

## 완료 기준

1. `/employee/requests` 재제출 CTA가 더 이상 `/employee?focus=`를 사용하지 않는다.
2. attendance 재제출은 `/employee/attendance`, leave 재제출은 `/employee/leave`로 직접 이동한다.
3. 재제출 handoff는 `source=employee-requests`를 유지한다.
4. `npm run typecheck`, `npm test`, `npm run test:integration`이 통과한다.
