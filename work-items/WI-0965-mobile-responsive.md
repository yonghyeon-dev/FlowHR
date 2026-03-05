# WI-0965: 모바일 반응형 개선

## 배경

모바일 화면(특히 768px 이하)에서 사이드바와 메인 콘텐츠 폭, 터치 타겟 크기, 세션/알림 UI의 가독성이 일관되지 않아 조작성이 떨어진다.
본 WI는 `src/app/globals.css`의 모바일 규칙을 강화해 핵심 화면 조작성을 안정화한다.

## 범위

### 포함

- `src/app/globals.css`에 `@media (max-width: 768px)` 규칙 추가
- 모바일에서 `.saas-sidebar` 완전 숨김 처리
- 모바일에서 `.saas-main`/`.saas-content` 풀 너비 보장
- 터치 타겟 최소 44px 확보
  - 알림 벨
  - 세션 메뉴 버튼/링크
- 알림 벨/세션 메뉴 모바일 가독성 개선

### 제외

- 데스크톱(769px 이상) 레이아웃 구조 변경
- 모바일 네비게이션 컴포넌트(`SaasMobileMenu`) 구조 변경
- API/DB/권한/계약 스키마 변경

## 구현 요약

- `src/app/globals.css`
  - `@media (max-width: 768px)` 블록을 추가해 모바일 전용 규칙을 명시했다.
  - `.saas-sidebar`를 `display: none !important`와 폭/패딩/보더 제거로 완전 숨김 처리했다.
  - `.saas-main`, `.saas-content`를 `width/max-width: 100%`로 보강하고 여백을 모바일 기준으로 재정의했다.
  - `.notification-bell`과 세션 메뉴 액션 버튼에 최소 `44px` 터치 타겟을 적용했다.
  - `.session-menu`를 단일 컬럼으로 정리하고 텍스트 줄바꿈/가독성 규칙을 보강했다.

- `scripts/tests/e2e-wi0965-mobile-responsive.test.ts`
  - WI 문서 존재 여부와 모바일 CSS 규칙 핵심 토큰 존재를 검증한다.

## 테스트

- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npx tsx scripts/tests/e2e-wi0965-mobile-responsive.test.ts`

## 검증 시나리오

- 뷰포트 `768px` 이하에서 좌측 사이드바가 렌더링/공간 점유 없이 숨겨진다.
- 메인 콘텐츠가 가로 폭을 전부 사용한다.
- 알림 벨 탭 영역이 최소 44x44 이상으로 동작한다.
- 세션 메뉴 버튼(로그인/로그아웃)의 탭 영역이 최소 44px 이상으로 동작한다.
- 긴 세션 식별자 문자열이 모바일에서 줄바꿈되어 잘리지 않는다.

## 롤백 계획

- `src/app/globals.css`의 WI-0965 `@media (max-width: 768px)` 블록을 제거한다.
- `scripts/tests/e2e-wi0965-mobile-responsive.test.ts`를 제거한다.
- 본 WI 문서를 제거한다.

## ADR

- Not required: 스타일 계층의 반응형 보강만 수행하며 도메인 계약, 보안 경계, 시스템 아키텍처 의사결정 변경이 없다.
