# WI-1124: 직원 근태 휴가 워크스페이스 추출

## 배경

`WI-1119`로 `/employee/attendance`, `/employee/leave` 경로를 승격했지만 실제 구현은 여전히 홈 모놀리스 `EmployeeSelfServicePage`에 기대고 있습니다.

이 구조는 다음 모순을 남깁니다.

- 전용 route가 생겼는데도 홈 화면 구현이 route workspace를 계속 소유합니다.
- attendance / leave 작업면이 route-first 구조처럼 보이지만 실제로는 홈 화면 내부 모드 전환에 가깝습니다.
- shared workspace implementation slice를 시작해야 하는 시점인데 가장 중요한 employee 전용 작업면이 아직 모놀리스 결합 상태입니다.

## 목표

- `/employee/attendance`, `/employee/leave`가 홈 모놀리스 대신 전용 workspace client를 사용하도록 분리합니다.
- 분리된 workspace client가 근태/휴가 route에서 필요한 snapshot, mutation, prefill, hero, chrome, panel 구성을 직접 소유하게 합니다.
- 다음 단계에서 홈 화면 경량화와 shared workspace frame 정리를 이어갈 수 있는 시임을 만듭니다.

## 범위

### In Scope

- `attendance-leave-workspace-client` 신설
- `/employee/attendance`, `/employee/leave` route를 새 workspace client로 전환
- 관련 정적 가드 갱신
- dedicated route extraction 회귀 가드 추가
- 진행 문서 최신화

### Out of Scope

- 홈 화면 `EmployeeSelfServicePage` 경량화 완료
- attendance / leave form 자체의 UX 재설계
- requests / schedule workspace 구조 변경

## 완료 기준

1. `/employee/attendance`, `/employee/leave`가 더 이상 `EmployeeSelfServicePage`를 직접 import하지 않는다.
2. 새 workspace client가 근태/휴가 route 전용 snapshot / mutation / prefill / hero 구성을 소유한다.
3. 관련 정적 가드와 신규 WI 가드가 통과한다.
4. `npm run typecheck`, `npm test`, `npm run test:integration`이 통과한다.
