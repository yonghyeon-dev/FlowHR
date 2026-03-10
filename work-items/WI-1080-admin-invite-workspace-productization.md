# WI-1080: 관리자 초대 워크스페이스 표면 정리

## 배경

- 관리자 대시보드의 초대 패널이 `Target organization` 입력으로 raw 조직 컨텍스트를 직접 노출한다.
- 조직 선택은 이미 상단 온보딩 패널에서 수행하므로, 초대 패널에서는 현재 워크스페이스 기준으로 동작만 설명하면 충분하다.

## 목표

- 초대 패널에서 raw 조직 입력을 제거하고, 현재 선택된 워크스페이스를 제품 언어로 안내한다.

## 범위

- `src/components/admin-dashboard/AdminPeopleInvitePanels.tsx`
- `src/app/admin/page-panels.tsx`
- `scripts/tests/e2e-wi1080-admin-invite-workspace-productization.test.ts`
- `package.json`
- `docs/production-gap-inventory.md`
- `docs/production-operating-progress.md`

## 완료 조건

1. 초대 패널에서 `Target organization` 또는 조직 ID 직접 입력 UI가 더 이상 보이지 않는다.
2. 초대 패널은 현재 선택된 워크스페이스를 안내 문구로만 보여주고, 워크스페이스 선택은 온보딩 패널에 남긴다.
3. 선택된 워크스페이스가 없을 때는 복구 가능한 사용자 안내 문구가 표시된다.
4. `npm run typecheck`, `npm test`, `npm run test:integration`, `python scripts/ci/check_contracts.py --base origin/main --head HEAD`, `python scripts/ci/check_traceability.py`, `npm run build`가 통과한다.
