# WI-0961: 조직 설정 관리자 UI

## 배경

관리자가 조직 단위 기준값(회계연도, 근무시간, 초과근무 기준, 급여 주기, 타임존, 통화)을 화면에서 확인하고 즉시 수정할 수 있어야 한다.
이미 제공된 `GET/PATCH /api/admin/settings` API를 관리자 UI에 연결한다.

## 범위

### 포함

- `src/app/admin/settings/page.tsx` 신규 생성
- `GET /api/admin/settings` 초기 로드
- `PATCH /api/admin/settings` 저장
- 회계연도 시작월, 표준 근무시간(일/주), 초과근무 기준, 급여 주기, 타임존, 통화 입력 폼
- 한국어 레이블/상태 메시지
- WI 전용 검증 테스트 추가

### 제외

- 조직 설정 API 스키마 변경
- 신규 DB 마이그레이션
- 관리자 네비게이션 IA 개편

## 구현 요약

- `src/app/admin/settings/page.tsx`
  - `AdminSettingsPage` 클라이언트 페이지를 구현했다.
  - 진입 시 `GET /api/admin/settings`로 현재 설정값을 로드한다.
  - 회계/근무/급여 관련 필드를 한국어 폼으로 제공한다.
  - 저장 시 클라이언트 유효성 검증 후 `PATCH /api/admin/settings`를 호출한다.
  - 성공/실패 피드백 메시지 및 다시 불러오기 액션을 제공한다.

- `scripts/tests/e2e-wi0961-org-settings-ui.test.ts`
  - 관리자 설정 페이지 소스에 핵심 한국어 레이블과 API 경로가 포함되는지 검증한다.
  - `PATCH /api/admin/settings` 저장 후 응답 값(급여 주기/타임존/통화 포함) 반영을 검증한다.

## 테스트

- `npx tsx scripts/tests/e2e-wi0961-org-settings-ui.test.ts`
- `npm.cmd run typecheck`
- `npm.cmd run lint`

## 검증 시나리오

- `/admin/settings` 접속 시 기존 조직 설정값이 자동 로드된다.
- 회계연도 시작월/근무시간/초과근무 기준/급여 주기/타임존/통화를 수정 후 저장하면 성공 메시지가 표시된다.
- 통화 코드 3자리 규칙을 위반하면 저장 전 오류가 표시된다.
- 다시 불러오기 버튼으로 서버 최신값을 재조회한다.

## 롤백 계획

- `src/app/admin/settings/page.tsx`를 제거한다.
- `scripts/tests/e2e-wi0961-org-settings-ui.test.ts`를 제거한다.
