# WI-1126: 직원 홈 dead mode 정리

## 배경

`WI-1124`로 `/employee/attendance`, `/employee/leave`가 전용 route로 승격됐지만,
`src/app/employee/page.tsx`에는 여전히 기존 `home | attendance | leave` 모드 분기와
route 전용 렌더/프리필 잔재가 남아 있었습니다.

이 상태는 다음 구조 모순을 남깁니다.

- 직원 홈이 더 이상 담당하지 않는 workspace 책임을 계속 품고 있음
- 홈 페이지와 전용 route 사이의 경계가 코드에서 불명확함
- `EmployeeApiLogsPanel`이 attendance/leave 전체 props에 결합되어 홈 분리를 방해함

## 목표

- `src/app/employee/page.tsx`를 홈 전용 페이지로 정리합니다.
- attendance/leave 전용 route 책임은 전용 route client에만 남깁니다.
- 홈에서 더 이상 쓰지 않는 dead mode, hero, prefill, workspace props 결합을 제거합니다.

## 범위

### In Scope

- `src/app/employee/page.tsx`의 `home | attendance | leave` 모드 잔재 제거
- 홈 렌더를 `EmployeeAccountOverviewPanels`, `EmployeeScheduleSummaryPanel`, dev-only `EmployeeApiLogsPanel`로 단순화
- `EmployeeApiLogsPanel` props를 홈에서도 재사용 가능한 최소 타입으로 축소
- 회귀 가드 추가

### Out of Scope

- attendance/leave 전용 route의 추가 UX 개선
- employee shell 전체 재구성
- requests/documents/notices 영역 추가 route 승격

## 완료 기준

1. `src/app/employee/page.tsx`에 attendance/leave mode 분기가 더 이상 없다.
2. `src/app/employee/page.tsx`가 홈 전용 렌더만 담당한다.
3. `EmployeeApiLogsPanel`이 홈 전용 최소 props로도 렌더 가능하다.
4. `npm run typecheck`, `npm test`, `npm run test:integration`, `npm run build`가 통과한다.
5. PR CI, main CI, production deploy가 모두 green이다.
