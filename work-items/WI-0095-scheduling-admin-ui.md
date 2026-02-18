# WI-0095: 근무일정(Admin) UI Baseline

## Background and Problem

FlowHR는 근무일정 API(`WorkSchedule`)를 이미 제공하지만, 관리자 UI에서 직접 생성/조회/삭제를 할 수 없어
스케줄링 기능이 SaaS 제품 가치로 보이지 않습니다.

## Scope

### In Scope

- `/admin`에 “근무 일정” 패널 추가
  - 일정 생성(POST `/api/scheduling/schedules`)
  - 일정 조회(GET `/api/scheduling/schedules`)
  - 일정 삭제(DELETE `/api/scheduling/schedules/{id}`)
- 직원 포털(`/employee`)의 스케줄 리스트와 자연스럽게 연결(같은 기간/직원 기준으로 확인 가능)

### Out of Scope

- 템플릿/로테이션 배치 UI
- 공휴일 캘린더/법정근로시간 정책 엔진

## Test Plan

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run test:integration`
- `npm run test:e2e:mvp`

