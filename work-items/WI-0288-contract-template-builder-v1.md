# WI-0288: Contract Template Builder v1

## Background

기존 `/admin/contracts`는 템플릿 CRUD가 가능하지만, 조항 블록 기반으로 템플릿 본문을 빠르게 구성하는
빌더 경험이 부족했습니다.

## Scope

### In Scope

- 관리자 라우트 추가: `/admin/contracts/builder`
- 조항 블록 빌더 컴포넌트 추가:
  - 조항 추가/수정/삭제
  - `required/optional` 토글
  - 조항 기반 본문 자동 생성 프리뷰
- `POST /api/contracts/templates` 연동으로 초안 템플릿 생성
- 생성 결과(템플릿 ID/버전/상태/카테고리) 요약 표시
- `/admin/contracts` 워크스페이스에 빌더 진입 링크 추가

### Out of Scope

- 드래그앤드롭 고급 레이아웃 빌더
- 다국어 clause 템플릿 라이브러리
- 외부 전자서명 공급자 연동

## Validation

- `npm.cmd run typecheck`
- `npm.cmd run build`
- `npm.cmd exec tsx scripts/tests/e2e-wi0290-payroll-contract-core-journey-e2e-bundle.test.ts`

