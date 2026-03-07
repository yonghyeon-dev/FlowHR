# WI-1029: 계약 템플릿 삭제/아카이브 API 추가

## Background and Problem
`/api/contracts/templates/[templateId]` 경로에 DELETE 핸들러가 없어 405 반환. 불필요한 템플릿이 계속 쌓이며 정리 불가.

### 영향
- 관리자가 실수로 만든 템플릿을 삭제할 수 없음
- 템플릿 목록이 계속 증가

### 원인
- `[templateId]/route.ts`에 DELETE export 미구현

## Scope

### In Scope
- `src/app/api/contracts/templates/[templateId]/route.ts`에 DELETE 핸들러 추가
- soft delete (isArchived 플래그) 방식: 기존 계약에서 참조 중인 템플릿은 실제 삭제하면 안 됨
- 목록 조회 시 `isArchived: false`인 것만 반환하도록 필터 추가

### Out of Scope
- 프론트엔드 삭제 버튼 UI
- 아카이브된 템플릿 복원 API

## Test Plan
1. `DELETE /api/contracts/templates/{id}` → 200 + `{ template: { isArchived: true } }`
2. 삭제 후 목록 조회에서 해당 템플릿 미노출
3. 존재하지 않는 ID → 404
4. typecheck, lint 통과

## ADR
- hard delete 대신 soft delete(isArchived) 채택: 기존 계약의 templateId FK 무결성 유지
- ContractTemplate 모델에 `isArchived Boolean @default(false)` 필드 추가 필요

## Data Changes
- Migration ID: `202603070002_wi1029_contract_template_archive`
- Migration: ContractTemplate 테이블에 isArchived 컬럼 추가 (Boolean DEFAULT false)
- 기존 데이터 영향 없음 (default false)
