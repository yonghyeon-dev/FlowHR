# WI-0991: 출산휴가 일수 상한 검증 (근로기준법)

## Priority: MEDIUM (P0 법적 준수)
## Type: Feature

## Problem
출산휴가(MATERNITY) 신청 시 일수 상한 검증이 없음.
근로기준법: 단태 90일, 다태 120일. 배우자 출산휴가 10일.

## Solution
1. `src/features/leave/service.ts`에서 LeaveRequest 생성 시 leaveType 확인
2. leaveType === 'MATERNITY':
   - 단태: 최대 90일
   - 다태: 최대 120일 (다태 여부는 신청 시 플래그로 전달)
3. leaveType === 'PATERNITY': 최대 10일
4. 초과 시 400 에러 반환
5. Employee 모델에 isMultipleBirth 필드가 없으면 신청 폼에서 체크박스로 받기

## Files to Change
- `src/features/leave/service.ts` — 출산휴가 일수 검증 로직 추가
- `src/features/leave/schemas.ts` — 다태 여부 필드 추가 (필요 시)

## Acceptance Criteria
- 출산휴가 91일 이상 신청 시 400 에러 (단태)
- 다태 121일 이상 신청 시 400 에러
- 배우자 출산휴가 11일 이상 신청 시 400 에러
- 정상 범위 내 신청은 성공
- 기존 테스트 통과

## Data Changes
- 모델: `LeaveRequest`
- 마이그레이션: `202603050014_wi0991_maternity_leave_validation`
- 스키마 변경: LeaveType enum 에 MATERNITY, PATERNITY 추가

## PR Body Rules
- .github/PULL_REQUEST_TEMPLATE.md 양식 정확히 준수
- Backend-only 체크
- Break-glass 미체크
- checkbox 뒤 괄호 텍스트 금지
