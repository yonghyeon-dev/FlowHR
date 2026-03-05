# WI-0990: 개인정보보호법(PIPA) 동의 기록

## Priority: HIGH (P0 법적 준수)
## Type: Feature

## Problem
회원가입 시 개인정보 처리 동의 체크박스 없음. 동의 기록이 DB에 저장되지 않음.
개인정보보호법(PIPA) 위반 가능성.

## Solution
1. `src/app/(auth)/signup/page.tsx`에 개인정보 처리 동의 체크박스 추가
2. 체크하지 않으면 가입 버튼 비활성화
3. Prisma 스키마에 `PersonalDataConsent` 모델 추가:
   - id, userId, consentType (PRIVACY_POLICY, TERMS_OF_SERVICE), consentedAt, version, ipAddress
4. 가입 API에서 동의 기록 저장
5. 동의 약관 내용은 간단한 텍스트로 (상세 법률 검토는 추후)

## Data Changes
- 모델: `PersonalDataConsent`
- Migration ID: `202603050013_wi0990_pipa_consent_record`
- specs/auth 계약 버전 및 API 버전 동기화

## Files to Change
- `prisma/schema.prisma` — PersonalDataConsent 모델 추가
- `src/app/(auth)/signup/page.tsx` — 동의 체크박스 UI 추가
- `src/features/auth/service.ts` — 가입 시 동의 기록 저장

## Acceptance Criteria
- 회원가입 페이지에 개인정보 처리 동의 체크박스 표시
- 미체크 시 가입 불가
- 가입 성공 시 PersonalDataConsent 레코드 생성
- 기존 테스트 통과

## PR Body Rules
- .github/PULL_REQUEST_TEMPLATE.md 양식 정확히 준수
- UI changed files 체크
- Break-glass 미체크
- checkbox 뒤 괄호 텍스트 금지
