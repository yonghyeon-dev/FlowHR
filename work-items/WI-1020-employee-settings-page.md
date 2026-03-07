# WI-1020: 직원 개인 설정 페이지

## Background and Problem
`/employee/settings` 페이지가 존재하지 않음. 알림 설정은 `/employee/notifications/settings`에 있으나 언어/테마 등 개인 설정을 관리할 통합 페이지가 없음.

## Scope

### In Scope
- `src/app/employee/settings/page.tsx` 생성
- 언어 설정 (한국어/영어) — localStorage 기반
- 알림 설정 링크 (기존 `/employee/notifications/settings`로 이동)
- `useSupabaseSession()` 세션 가드 적용

### Out of Scope
- 서버사이드 설정 저장 (새 API 불필요)
- 테마 설정 (향후)
- 비밀번호 변경 (Supabase Auth 관할)

## Implementation Notes
- 간단한 설정 폼: 언어 select + 알림설정 바로가기 링크
- localStorage에 `flowhr-locale` 키로 저장 (기존 i18n provider와 연동)
- 기존 패턴: `src/app/employee/benefits/page.tsx` 수준의 간단한 페이지
- 500줄 상한 준수
- 레이아웃: `src/app/employee/layout.tsx`의 네비게이션에 "설정" 링크 추가

## Test Plan
- 페이지 렌더링 확인
- 언어 변경 후 localStorage 저장 확인
- 비로그인 시 접근 차단 확인

## ADR
- 서버 API 없이 localStorage 기반으로 구현 (MVP)
