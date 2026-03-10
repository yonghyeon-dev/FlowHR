# WI-1074: 부서 관리 표면 식별자 정리

## 배경

- 관리자 부서 관리 화면에서 상위 부서나 담당자 조회가 비어 있으면 raw `departmentId`, `employeeId`가 그대로 노출된다.
- 담당자 선택 목록도 `이름 (internal id)` 형식으로 보일 수 있어 운영 표면에 내부 식별자가 남는다.
- 이 화면은 실제 운영자가 직접 사용하는 관리 표면이라 사람 중심 라벨로 정리해야 한다.

## 목표

- 부서 관리 화면에서 상위 부서와 담당자 표기가 raw 내부 식별자에 fallback되지 않게 한다.
- 담당자 라벨은 이름과 공개용 사번 기준으로 표기하고, 조회 실패 시에도 사용자용 안내 문구만 보이게 한다.

## 범위

- `src/components/departments/AdminDepartmentManagementWorkspace.tsx`
- `scripts/tests/e2e-wi1074-department-surface-humanization.test.ts`
- `package.json`
- `docs/production-gap-inventory.md`
- `docs/production-operating-progress.md`

## 완료 조건

1. 부서 관리 테이블과 담당자 선택 목록에서 raw `employeeId`, `departmentId`가 직접 노출되지 않는다.
2. 담당자 라벨은 이름과 공개용 사번 기준으로 보이고, 누락 시에도 사람용 안내 문구만 보인다.
3. 상위 부서 조회 실패 시 raw `parentId` 대신 사용자 안내 문구를 보여준다.
4. `npm run typecheck`, `npm run test:integration`, `python scripts/ci/check_contracts.py --base origin/main --head HEAD`, `python scripts/ci/check_traceability.py`가 통과한다.
