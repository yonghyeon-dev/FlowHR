# WI-1143: route-first 워크스페이스 시각 파동 2

## 배경

- `WI-1140`, `WI-1141`로 관리자 허브와 직원 홈의 첫 시각 셸 베이스라인을 고정했다.
- `WI-1142`로 대표 admin/employee route-first 작업면에 공통 워크스페이스 프리미티브를 처음 도입했다.
- 아직 route-first로 옮겨진 실제 업무 화면 중 `admin payroll-close`, `employee attendance/leave`는 기존 패널/히어로 구조를 많이 유지하고 있어 시각적 일관성이 약하다.

## 목표

- `admin payroll-close`와 `employee attendance/leave` 작업면에 공통 workspace shell, header, summary strip, inline feedback 시각 규칙을 적용한다.
- 직원 작업면 hero가 generic home copy 대신 각 workspace 목적에 맞는 제목/설명/메타를 사용하도록 정리한다.
- 기존 route semantics와 업무 동작은 바꾸지 않고 visual layer와 product copy만 정렬한다.

## 범위

- `src/components/payroll-close/PayrollClosePeriodConsole.tsx`
- `src/app/employee/attendance-leave-workspace-client.tsx`
- `src/components/employee-dashboard/EmployeeDashboardChrome.tsx`
- `src/app/globals.css`
- `scripts/tests/e2e-wi1143-route-first-workspace-visual-wave-two.test.ts`
- `package.json`
- `docs/production-operating-progress.md`

## 비범위

- notices, benefits, recruitment, contracts 전체 workspace visual refactor
- attendance/leave panel 내부 폼 구조 재설계
- payroll-close 비즈니스 로직 변경
- 모바일 전용 workspace 재배치

## 완료 기준

1. `admin payroll-close`와 `employee attendance/leave`가 공통 workspace shell과 visual primitive class를 사용한다.
2. 직원 attendance/leave hero가 route 목적에 맞는 title/description/meta를 직접 사용한다.
3. 관련 회귀 가드가 추가되고 `npm test`, `npm run typecheck`, `npm run test:integration`을 통과한다.
4. PR CI, `main` CI, `vercel-production-deploy`까지 green으로 닫는다.
