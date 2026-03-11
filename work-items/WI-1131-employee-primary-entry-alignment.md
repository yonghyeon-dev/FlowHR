# WI-1131: 직원 주작업 진입점 정렬

## 배경

`WI-1130`으로 직원 근태 정정과 휴가 요청의 주작업 화면은 각각 `/employee/attendance/correction`, `/employee/leave/request`로 승격됐다.

하지만 일부 실제 진입점은 아직 base route를 직접 가리킨다.

- 모바일 메뉴: `/employee/attendance`, `/employee/leave`
- 직원 가이드 카드: `/employee/attendance`, `/employee/leave`
- 직원 가이드 quick action copy: `/employee/attendance`, `/employee/leave`

이 상태는 이미 compatibility 전용으로 남겨둔 base route를 여전히 제품 표면의 주진입점처럼 보이게 만든다.

## 목표

1. 직원 가이드와 모바일 메뉴의 근태/휴가 주작업 링크를 stable subroute로 정렬한다.
2. base route는 legacy hash 진입만 흡수하는 compatibility layer로만 남긴다.
3. 관련 정적 가드를 새 진입 구조에 맞게 갱신한다.

## 범위

### In Scope

- `src/app/employee/layout.tsx`
- `src/app/employee/guide/page.tsx`
- `src/components/employee-guide/copy.ts`
- `scripts/tests/e2e-wi1117-employee-requests-route-seam.test.ts`
- `scripts/tests/e2e-wi1121-employee-workspace-hero-alignment.test.ts`
- `scripts/tests/e2e-wi1123-employee-mobile-source-context-alignment.test.ts`
- 신규 회귀 가드 추가

### Out of Scope

- 근태/휴가 workspace 내부 UX 재설계
- 가이드 전체 정보구조 개편
- 모바일 메뉴 구조 재분류

## 완료 기준

1. 모바일 메뉴의 근태 링크가 `/employee/attendance/correction`을 사용한다.
2. 모바일 메뉴의 휴가 링크가 `/employee/leave/request`를 사용한다.
3. 직원 가이드의 근태/휴가 CTA와 quick action copy가 새 subroute를 사용한다.
4. 관련 통합 가드가 새 진입 구조를 검증한다.
5. `npm run typecheck`, 관련 회귀 가드, `npm run test:integration`이 통과한다.
