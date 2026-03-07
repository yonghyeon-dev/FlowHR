# WI-1019: 직원 동료 디렉토리 페이지

## Background and Problem
`/employee/people` 페이지가 존재하지 않음. API(`/api/people/employees`)는 있으나 직원이 동료 목록을 조회할 수 있는 UI가 없음.

## Scope

### In Scope
- `src/app/employee/people/page.tsx` 생성
- 같은 조직의 직원 목록 조회 (이름, 이메일, 부서, 직급)
- 검색 기능 (이름/이메일로 필터)
- `useSupabaseSession()` 세션 가드 적용
- 읽기 전용 (수정/삭제 버튼 없음)

### Out of Scope
- 직원 상세 프로필 모달/패널
- 수정/삭제 기능 (관리자 전용)
- 새 API 엔드포인트 추가

## Implementation Notes
- `admin/people/page.tsx` 패턴을 참고하되, 읽기 전용으로 단순화
- API: `GET /api/people/employees` (organization-scoped, active 직원만)
- 테이블 컬럼: 이름, 이메일, 부서, 직급, 상태
- 500줄 상한 준수
- 레이아웃: `src/app/employee/layout.tsx`의 네비게이션에 "동료" 링크 추가

## Test Plan
- 페이지 렌더링 확인
- 직원 목록 표시 확인
- 검색 필터 동작 확인
- 비로그인 시 접근 차단 확인

## ADR
- admin/people의 읽기 전용 버전으로 구현
