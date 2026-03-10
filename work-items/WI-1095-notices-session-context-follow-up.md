# WI-1095: 공지 세션 문맥 표면 후속 정리

## 배경

관리자 공지 화면과 직원 공지 화면의 devtools 문맥에는 아직 raw 조직/액터/직원 식별자가 그대로 노출된다.

- 관리자 공지 필터 패널이 조직/관리자 식별자를 직접 보여 준다.
- 직원 공지 필터 패널이 조직/직원 식별자를 직접 보여 준다.

같은 성격의 운영 표면은 이미 작업 공간 상태 / 관리자 세션 상태 / 직원 세션 상태로 정리됐기 때문에, 공지 화면도 동일한 제품 언어를 사용해야 한다.

## 목표

공지 admin/employee 화면의 devtools 문맥을 raw 식별자 대신 연결 상태 기반 제품 언어로 통일한다.

## 범위

- `src/components/notices/AdminNoticeWorkspaceView.tsx`
- `src/components/notices/EmployeeNoticeBoard.tsx`
- `scripts/tests/e2e-wi1095-notices-session-context-follow-up.test.ts`
- `docs/production-gap-inventory.md`
- `docs/production-operating-progress.md`
- `package.json`

## 완료 조건

1. 관리자 공지 화면에서 raw 조직/관리자 식별자가 직접 보이지 않는다.
2. 직원 공지 화면에서 raw 조직/직원 식별자가 직접 보이지 않는다.
3. 두 화면 모두 작업 공간 상태 / 관리자 세션 상태 / 직원 세션 상태 기준으로 표기된다.
4. 새 회귀 가드와 기존 통합 검증이 모두 통과한다.
