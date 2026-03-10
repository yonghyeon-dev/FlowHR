# WI-1119: 직원 근태·휴가 작업면 전용 경로 승격

## 배경

`WI-1117`, `WI-1118`에서 요청 상태 확인과 재제출 후속 조치는 `/employee/requests` 전용 경로로 옮겼다.
하지만 Today 홈에는 아직도 근태 정정 입력, 휴가 요청 입력, 휴가 캘린더가 그대로 남아 있어서 홈 화면이 계속 무거운 작업면 역할을 하고 있다.

그 결과:

- Today가 요약 허브가 아니라 실제 입력 콘솔처럼 동작한다.
- `?focus=attendance`, `?focus=leave`, `?focus=leave-calendar`가 여전히 홈 내부 섹션 점프에 의존한다.
- 가이드, 스케줄 보드, 빠른 이동, 체크리스트가 같은 업무를 홈/요청 경로에 분산해서 연결한다.

## 목표

- Today 홈에서 근태·휴가의 task-heavy UI를 제거하고 전용 route로 승격한다.
- `/employee/attendance`, `/employee/leave`를 추가해서 route-first 구조를 강화한다.
- 기존 근태/휴가 deep-link와 가이드 CTA를 새 route로 정렬한다.
- Today 홈은 요약, 우선 처리, 스케줄 확인 중심으로 가볍게 유지한다.

## 범위

### In Scope

- `/employee/attendance` 전용 workspace 추가
- `/employee/leave` 전용 workspace 추가
- attendance / leave / leave-calendar focus 진입점을 새 route로 정렬
- Today 홈에서 근태/휴가 입력 패널 제거
- 가이드, shortcut, workspace hub, schedule board 링크를 새 route로 정렬
- 회귀 가드 추가

### Out of Scope

- `/employee/schedule` 자체 리디자인
- benefits / documents / notices 영역 구조 변경
- admin shell 구조 변경

## 완료 기준

1. Today 홈은 더 이상 근태 정정 입력, 휴가 요청 입력, 휴가 캘린더를 직접 렌더하지 않는다.
2. `/employee/attendance`, `/employee/leave`가 실제 작업면으로 동작한다.
3. `?focus=attendance`, `?focus=leave`, `?focus=leave-calendar` direct-load는 새 route로 정렬된다.
4. 가이드, shortcut, 우선 처리, 스케줄 보드 링크가 새 route 기준으로 동작한다.
5. `npm run typecheck`, `npm test`, `npm run test:integration`이 통과한다.
