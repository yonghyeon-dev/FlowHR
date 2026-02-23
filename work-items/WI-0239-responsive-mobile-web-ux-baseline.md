# WI-0239: Responsive Mobile Web UX Baseline

## Background

Phase 6 `WI-S` requires mobile-ready web UX. Current shell relies on a wide sidebar navigation,
which becomes hard to use on small screens.

## Scope

### In Scope

- 공통 모바일 메뉴 컴포넌트 추가
  - `src/components/layout/SaasMobileMenu.tsx`
- Admin/Employee 레이아웃 모바일 내비게이션 적용
  - 기존 데스크톱 사이드바는 유지
  - 모바일(<=980px)은 sticky 헤더 + 토글 메뉴로 접근
- 글로벌 반응형 스타일 baseline 추가
  - 모바일 메뉴 스타일
  - `saas-main`/`saas-content` 모바일 패딩 조정
  - `actions`/`panel-actions` 버튼 모바일 스택 처리
  - 공통 hero 제목/설명 스타일 정리
- i18n 키 추가
  - `shell.mobileMenu` (ko/en)
- anti-bloat
  - 신규 컴포넌트/레이아웃 파일 300줄 가드 준수

### Out of Scope

- 네이티브 모바일 앱(Phase 7)
- 푸시 알림 연동
- API/DB contract 변경

## Validation

- `npm.cmd exec tsx scripts/tests/e2e-wi0239-responsive-mobile-web-ux-baseline.test.ts`
- `npm.cmd exec tsx scripts/tests/e2e-wi0200-browser-locale-dynamic-ui-language-baseline.test.ts`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run build`
