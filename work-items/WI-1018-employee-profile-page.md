# WI-1018: 직원 내 프로필 페이지

## Background and Problem
`/employee/profile` 페이지가 존재하지 않음. API(`/api/people/employees/[id]`)는 있으나 UI가 없어 직원이 자신의 프로필을 조회할 수 없음.

## Scope

### In Scope
- `src/app/employee/profile/page.tsx` 생성
- 현재 로그인한 직원의 프로필 정보 표시 (이름, 이메일, 전화번호, 부서, 직급, 상태, 입사일)
- `useSupabaseSession()` 세션 가드 적용
- 기존 employee 페이지 패턴 준수 ("use client" + session guard)

### Out of Scope
- 프로필 수정 기능 (조회 전용)
- 새 API 엔드포인트 추가

## Implementation Notes
- 기존 패턴 참고: `src/app/employee/benefits/page.tsx` (간단한 페이지 구조)
- API: `GET /api/people/employees` 호출 후 현재 사용자의 actorId와 매칭되는 직원 정보 표시
- 또는 employee dashboard(`src/app/employee/page.tsx`)에서 이미 사용하는 직원 정보 fetch 패턴 참고
- 500줄 상한 준수
- 레이아웃: `src/app/employee/layout.tsx`의 네비게이션에 "내 프로필" 링크 추가

## Test Plan
- 페이지 렌더링 확인 (200 응답)
- 직원 정보 표시 확인
- 비로그인 시 접근 차단 확인

## ADR
- 조회 전용 페이지로 구현 (수정은 향후 WI로 분리)
