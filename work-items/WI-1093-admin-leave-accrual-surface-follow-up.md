# WI-1093: 관리자 연차 자동 부여 표면 후속 정리

## 배경

`LeaveAccrualAutoGrantConsole`에는 아직 운영 표면에 어울리지 않는 내부 문구와 식별자 노출이 남아 있다.

- 작업 공간 미연결 상태가 `세션 조직` 기반 오류 문구로 노출된다.
- 요약 패널이 `organizationId`를 그대로 보여 준다.
- 대상 상세가 raw `employeeId`와 enum 상태를 직접 보여 준다.
- 세션 오류와 상세 사유가 기술 메시지 그대로 남을 수 있다.

이 화면은 운영 관리자 표면이므로, 다른 admin 운영 화면과 같은 수준의 제품 언어로 맞춰야 한다.

## 목표

연차 자동 부여 화면에서 raw 세션/조직/직원 식별자와 기술적 상태 문구를 제거하고, 관리자용 제품 언어로 정리한다.

## 범위

- `src/components/leave-accrual/LeaveAccrualAutoGrantConsole.tsx`
- `scripts/tests/e2e-wi1093-admin-leave-accrual-surface-follow-up.test.ts`
- `docs/production-gap-inventory.md`
- `docs/production-operating-progress.md`
- `package.json`

## 완료 조건

1. 화면에 `세션 조직`, `Session organization`, `organizationId` 같은 raw 세션/조직 문구가 사용자 표면으로 남지 않는다.
2. 요약 패널이 raw 조직 ID 대신 작업 공간 기준의 제품 언어를 사용한다.
3. 대상 상세가 raw `employeeId` 대신 사람이 읽을 수 있는 직원 표기를 사용한다.
4. 상태, 사유, 세션 오류가 기술 메시지 대신 제품 언어로 정리된다.
5. 새 회귀 가드와 기존 통합 검증이 모두 통과한다.
