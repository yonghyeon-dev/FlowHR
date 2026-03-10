# WI-1083: 관리자 결재 세션 문맥 표면 정리

## 배경

- 결재 정책, 결재 이력, 결재 템플릿 화면의 devtools 문맥 줄이 여전히 세션 조직 ID와 세션 액터 ID를 raw 값으로 노출한다.
- `WI-1082`에서 대시보드 계열 공용 문맥을 정리했으므로, 결재 계열도 같은 규칙으로 맞춰야 한다.

## 목표

- 관리자 결재 정책/이력/템플릿 화면의 devtools 세션 문맥을 연결 상태 중심 제품 문구로 치환한다.

## 범위

- `src/app/admin/approval-policy/page.tsx`
- `src/app/admin/approval-history/page.tsx`
- `src/app/admin/approval-templates/page.tsx`
- `scripts/tests/e2e-wi1083-admin-approval-session-context-humanization.test.ts`
- `package.json`
- `docs/production-gap-inventory.md`
- `docs/production-operating-progress.md`

## 완료 조건

1. 결재 정책/이력/템플릿 화면의 devtools 세션 문맥이 raw ID 대신 연결 상태 문구를 노출한다.
2. 기존 세션 문맥 라벨은 유지되어 가시성은 남고, raw 코드 값만 사라진다.
3. 관련 회귀 가드가 추가되고 기존 통합 검증 묶음에 연결된다.
4. `npm run typecheck`, `npm test`, `npm run test:integration`, `python scripts/ci/check_contracts.py --base origin/main --head HEAD`, `python scripts/ci/check_traceability.py`가 통과한다.
