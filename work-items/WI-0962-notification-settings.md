# WI-0962: 알림 설정 UI

## 배경

직원 사용자가 알림 수신 채널과 알림 유형을 직접 제어할 수 있는 화면이 필요하다.
MVP 범위에서는 서버 연동 없이 브라우저 로컬스토리지에 저장해 즉시 사용 경험을 제공한다.

## 범위

### 포함

- `src/app/employee/notifications/settings/page.tsx` 신규 생성
- 이메일/인앱 알림 채널 on/off 토글 UI 제공
- 알림 유형별 on/off 토글 UI 제공
  - 휴가
  - 근태
  - 급여
- 설정 변경 시 로컬스토리지 자동 저장
- 기본값 복원 버튼 제공
- 한국어 카피 적용

### 제외

- 알림 설정 API 연동 및 DB 저장
- 알림 채널/유형별 세부 규칙(시간대, 빈도, 묶음 발송 등)
- 관리자용 알림 정책 화면

## 구현 요약

- `src/app/employee/notifications/settings/page.tsx`
  - 클라이언트 컴포넌트로 구현했다.
  - 저장 키 `flowhr.employee.notification-settings.v1`를 사용해 로컬스토리지에서 초기값을 읽는다.
  - 이메일/인앱 채널 토글과 휴가/근태/급여 유형 토글을 각각 버튼으로 제공한다.
  - 토글 변경 시 자동 저장되며 마지막 저장 시각을 화면에 표시한다.
  - 저장 실패 시 안내 문구를 노출하고, 기본값 복원 기능을 제공한다.

- `scripts/tests/e2e-wi0962-notification-settings.test.ts`
  - 페이지 파일에 핵심 요구사항 문자열(채널/유형 토글, 로컬스토리지 키, 한국어 카피)이 포함되는지 검증한다.
  - WI 문서의 존재 및 핵심 범위 키워드를 검증한다.

## 테스트

- `npm.cmd run typecheck`
- `npm.cmd run lint`
- `npx tsx scripts/tests/e2e-wi0962-notification-settings.test.ts`

## 검증 시나리오

- `/employee/notifications/settings` 진입 시 알림 설정 화면이 표시된다.
- `이메일 알림`, `인앱 알림` 토글을 클릭하면 상태가 `켜짐/꺼짐`으로 즉시 반영된다.
- `휴가/근태/급여` 토글이 각각 독립적으로 on/off 전환된다.
- 새로고침 후에도 마지막 토글 상태가 유지된다(로컬스토리지 저장 확인).
- `기본값으로 복원` 클릭 시 모든 설정이 기본값으로 돌아간다.

## 롤백 계획

- `src/app/employee/notifications/settings/page.tsx` 파일을 제거한다.
- `scripts/tests/e2e-wi0962-notification-settings.test.ts` 파일을 제거한다.
- 본 WI 문서를 제거한다.
