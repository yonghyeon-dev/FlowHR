# WI-0092: SaaS Shell Navigation + Login (Admin/Employee UI 균형 조정)

## Background and Problem

FlowHR가 운영 콘솔처럼 보이는 UX를 줄이고, SaaS 제품으로 보이는 공통 레이아웃/네비게이션/로그인 진입점을 마련한다.
특히 `/admin`, `/employee`가 단일 페이지 테스트 하네스처럼 보이면 “넓은 기능 + 적정 깊이 + UI” 목표 달성에 방해가 된다.

## Scope

### In Scope

- `/admin`, `/employee`에 SaaS Shell 레이아웃 추가(사이드 네비게이션 + 섹션 앵커)
- `/login` 페이지 추가(Supabase Auth 이메일/비밀번호 로그인 + 세션 스냅샷 확인)
- Dev Header/토큰/디버그 정보는 기본 UI에서 숨기고(Details), 필요 시에만 펼쳐서 사용
- UI 회귀 게이트(`e2e-wi0083-ui-journey.test.ts`)의 헤딩 체크를 더 유연하게 수정

### Out of Scope

- 완전한 RBAC 기반 “페이지 접근 제어”(middleware + 서버 세션 동기화)
- 직원/관리자 Role을 기반으로 한 자동 리다이렉트 및 권한 분기 고도화
- Employee.id ↔ Supabase user id/actor id 매핑 자동화(phase 2)

## User Scenarios

1. 사용자는 `/`에서 관리자/직원 흐름으로 진입할 수 있다.
2. 관리자는 `/admin`에서 핵심 섹션(조직/직원/승인/집계/급여)을 빠르게 이동한다.
3. 직원은 `/employee`에서 출퇴근/휴가/스케줄/명세서를 빠르게 이동한다.
4. 개발자는 필요한 경우에만 Dev Header/토큰/디버그 패널을 펼쳐 확인한다.

## Test Plan

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run test:e2e:mvp`
- 로컬 수동 점검:
  - `/admin`, `/employee`, `/employee/payslips`, `/login` 렌더링 확인
  - 네비게이션 앵커 이동 확인

## Rollback Plan

- Shell 레이아웃/헤더/Details 변경 revert
- `/login` 라우트 제거 revert

