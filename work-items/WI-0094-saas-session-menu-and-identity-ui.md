# WI-0094: SaaS Session Menu + Identity UI Cleanup

## Background and Problem

`/admin`, `/employee` UI가 "콘솔/테스트 하네스" 느낌을 주는 이유 중 하나는
토큰/헤더/디버그 정보가 화면에 먼저 보이고, 로그인/로그아웃 같은 SaaS 기본 UX가 약하기 때문이다.

## Scope

### In Scope

- 사이드바에 세션 상태(이메일/role/org) + 로그아웃 버튼을 제공하는 Session Menu 추가
- `/admin`, `/employee`, `/employee/payslips`에서 토큰/Dev Header 입력은 기본 UI에서 숨기고,
  `NEXT_PUBLIC_FLOWHR_DEV_TOOLS`일 때만 override 입력을 노출
- “개발/검증용” 라벨을 기본 UX에서 제거하고(문구/섹션명), SaaS 사용 흐름 중심으로 정리
- `ROADMAP.md`에 최근 반영(WI-0092/0093) 및 UI-first WIs 완료 상태를 최신화

### Out of Scope

- middleware 기반 페이지 접근 제어(SSR 보호)
- 사용자 초대/프로비저닝(계정 생성) UI

## Test Plan

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run test:integration`
- `npm run test:e2e:mvp`
- `npm run build`

