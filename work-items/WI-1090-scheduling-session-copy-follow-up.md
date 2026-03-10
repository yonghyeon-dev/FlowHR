# WI-1090: 스케줄링 세션 문구 후속 정리

## 배경

- admin/employee scheduling 표면은 devtools 문맥에서 여전히 raw 세션 조직/세션 계정 성격의 라벨을 사용한다.
- 실제 값은 이미 세션 존재 여부만 중요하므로, 내부 식별자 성격 라벨 대신 연결 상태 문구로 통일하는 편이 제품 표면에 맞다.

## 목표

- scheduling admin/employee 화면의 devtools 세션 문맥을 작업 공간/관리자 세션/직원 세션 상태 문구로 통일한다.

## 범위

- `src/components/scheduling/AdminSchedulingWorkspaceView.tsx`
- `src/components/scheduling/EmployeeScheduleBoardView.tsx`
- `src/components/scheduling/copy.ts`
- `scripts/tests/e2e-wi0619-admin-scheduling-session-context-and-devtools-log-gate.test.ts`
- `scripts/tests/e2e-wi0621-employee-schedule-session-context-productization.test.ts`
- `scripts/tests/e2e-wi1090-scheduling-session-copy-follow-up.test.ts`
- `package.json`
- `docs/production-gap-inventory.md`
- `docs/production-operating-progress.md`

## 완료 조건

1. admin scheduling devtools는 raw session organization / actor code를 `<code>`로 노출하지 않는다.
2. employee scheduling devtools는 raw session organization / employee code를 `<code>`로 노출하지 않는다.
3. scheduling copy는 `작업 공간 상태`, `관리자 세션 상태`, `직원 세션 상태`와 대응 영문 문구를 사용한다.
4. WI-1090 전용 가드와 기존 scheduling 세션 가드가 통과한다.
