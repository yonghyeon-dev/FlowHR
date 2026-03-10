# WI-1094: 관리자 휴가 캘린더 표면 후속 정리

## 배경

`LeaveCalendarConsole`에는 아직 운영 표면에 맞지 않는 raw 식별자와 세션 문구가 남아 있다.

- 세션 미연결 상태가 raw 조직 문맥 오류 문구로 노출된다.
- 요약 패널이 `organizationId`를 그대로 보여 준다.
- 휴가 엔트리 목록이 raw `employeeId`를 우선 표시한다.
- 세션 오류가 기술 메시지 그대로 노출될 수 있다.

이 화면도 다른 admin 운영 표면과 동일하게 작업 공간/세션 상태 중심의 제품 언어를 사용해야 한다.

## 목표

관리자 휴가 캘린더 표면에서 raw 조직/직원 식별자와 기술적 세션 오류 문구를 제거하고, 운영자 기준의 제품 언어로 정리한다.

## 범위

- `src/components/leave-calendar/LeaveCalendarConsole.tsx`
- `scripts/tests/e2e-wi1094-admin-leave-calendar-surface-follow-up.test.ts`
- `docs/production-gap-inventory.md`
- `docs/production-operating-progress.md`
- `package.json`

## 완료 조건

1. 화면에서 raw `organizationId`가 직접 노출되지 않는다.
2. 휴가 엔트리 목록이 raw `employeeId` 대신 직원명과 공개용 직원 번호를 사용한다.
3. 세션 미연결 및 세션 오류 문구가 사용자 안내형 문구로 정리된다.
4. devtools 문맥은 작업 공간 상태 / 관리자 세션 상태 기준으로 유지된다.
5. 새 회귀 가드와 기존 통합 검증이 모두 통과한다.
