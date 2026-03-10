# WI-1120: 직원 일정 작업면 route-first 전환

## 배경

`WI-1117`, `WI-1118`, `WI-1119`에서 요청·근태·휴가 작업을 Today 홈에서 분리했지만, 일정 영역은 아직 홈 안에 큰 패널로 남아 있습니다.

현재 구조는 다음 모순을 남깁니다.

- `/employee/schedule` 전용 route가 이미 있는데 Today 홈에도 일정 작업면이 중복됩니다.
- 빠른 이동과 focus 진입은 아직 `schedule` 섹션 점프를 전제로 합니다.
- Today 홈이 요약/우선 처리 허브가 아니라 작업 패널 묶음처럼 느껴집니다.

## 목표

- 일정은 `/employee/schedule` 전용 route를 기준으로 진입하게 정렬합니다.
- Today 홈에서는 일정 작업면 대신 가벼운 요약과 다음 액션만 제공합니다.
- `schedule` 관련 빠른 이동과 focus 진입도 route-first 기준으로 정리합니다.

## 범위

### In Scope

- Today 홈에서 `EmployeeSchedulePanel` 제거
- 홈용 일정 요약 패널 추가
- `schedule` focus 진입을 `/employee/schedule`로 승격
- employee shortcut / 안내 링크 / 홈 CTA를 route-first로 정렬
- 관련 회귀 가드 추가 및 오래된 source guard 정리

### Out of Scope

- `/employee/schedule` 자체의 상세 리디자인
- admin scheduling 구조 변경
- leave calendar / request monitoring route 구조 변경

## 완료 기준

1. Today 홈은 더 이상 큰 일정 작업 패널을 직접 렌더링하지 않는다.
2. `schedule` deep-link 및 빠른 이동은 `/employee/schedule`를 안정 entry로 사용한다.
3. 홈에는 일정 상태를 보여주는 요약 패널과 다음 액션만 남는다.
4. `npm run typecheck`, `npm test`, `npm run test:integration`이 통과한다.
