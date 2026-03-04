# WI-0918 Auth Pages (회원가입/비밀번호 재설정)

## Scope
- Supabase Auth 기반 회원가입/비밀번호 재설정 UI 페이지를 추가한다.
- 로그인 페이지에서 회원가입/비밀번호 찾기 페이지로 이동할 수 있는 링크를 제공한다.
- 파일 존재 및 로그인 링크 연결 여부를 검증하는 WI 전용 테스트를 추가한다.

## Implementation
- 신규 페이지 추가:
  - `src/app/(auth)/signup/page.tsx`
    - 조직명, 이메일, 비밀번호, 비밀번호 확인 입력 폼
    - `getSupabaseClient().auth.signUp()` 호출
    - 회원가입 성공 시 이메일 인증 안내 문구 표시
    - 조직명과 `role: "admin"` 메타데이터를 `signUp` 옵션 `data`로 전달
    - 중복 이메일/비밀번호 길이/이메일 형식 등 오류를 한국어 메시지로 매핑
  - `src/app/(auth)/forgot-password/page.tsx`
    - 이메일 입력 폼
    - `getSupabaseClient().auth.resetPasswordForEmail()` 호출
    - `redirectTo`를 `/reset-password`로 지정
    - 성공 시 이메일 존재 여부를 노출하지 않는 공통 안내 문구 표시
  - `src/app/(auth)/reset-password/page.tsx`
    - 새 비밀번호/비밀번호 확인 입력 폼
    - 세션 확인 후 `getSupabaseClient().auth.updateUser({ password })` 호출
    - 성공 시 로그인 페이지(`/login`)로 리다이렉트
    - 링크 만료/세션 없음 등 오류를 한국어 메시지로 처리
- 로그인 페이지 업데이트:
  - `src/app/login/page.tsx`
    - 로그인 패널에 `href="/signup"` 및 `href="/forgot-password"` 링크 추가
- Supabase 클라이언트:
  - 기존 `src/lib/supabase/client.ts` 재사용 (신규 생성 없음)

## Test
- 신규 테스트: `scripts/tests/e2e-wi0918-auth-pages.test.ts`
  - `src/app/(auth)/signup/page.tsx` 존재 확인
  - `src/app/(auth)/forgot-password/page.tsx` 존재 확인
  - `src/app/(auth)/reset-password/page.tsx` 존재 확인
  - `src/app/login/page.tsx`에 `/signup`, `/forgot-password` 링크 존재 확인

## Verification
- `npm.cmd exec tsx scripts/tests/e2e-wi0918-auth-pages.test.ts`
- `npm.cmd run typecheck`
- `npm.cmd run lint`

