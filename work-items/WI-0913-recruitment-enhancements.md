# WI-0913 Recruitment Enhancements

## Scope
- Add optional hiring manager linkage on recruitment opening creation.
- Add optional stage reason field for recruitment referral stage updates.
- Enforce rejection reason when changing referral stage to `REJECTED`.

## API Changes
- `POST /api/recruitment/openings`
  - Request body adds `hiringManagerId?: string`.
  - Response opening now includes `hiringManagerId?: string`.
- `PATCH /api/recruitment/referrals/[referralId]/stage`
  - Request body adds `reason?: string`.
  - If `stage === "REJECTED"` and `reason` is missing, return `400` with
    `recruitment.referral.stage.reason_required`.
  - Response referral now includes `stageReason?: string`.
- Compatibility:
  - Existing `POST /api/recruitment/referrals/[referralId]/stage` is kept and
    reuses the same validation logic.

## Data Model Changes
- `src/features/shared/data-access.ts`
  - `RecruitmentOpeningEntity` adds `hiringManagerId?: string`.
  - `RecruitmentReferralEntity` adds `stageReason?: string`.
  - Recruitment create/update input types include corresponding optional fields.
- `src/features/shared/memory-data-access.ts`
  - Recruitment opening create/update persists `hiringManagerId`.
  - Recruitment referral create/update persists `stageReason`.
- `src/features/recruitment/schemas.ts`
  - Opening create schema accepts `hiringManagerId`.
  - Referral stage update schema accepts `reason`.

## Service/Store Changes
- `src/features/recruitment/store.ts`
  - Opening item mapping includes `hiringManagerId`.
  - Referral item mapping includes `stageReason`.
  - Stage update writes `stageReason` on `REJECTED` and clears it otherwise.
- `src/features/recruitment/types.ts`
  - `RecruitmentOpeningItem` adds `hiringManagerId?: string`.
  - `RecruitmentReferralItem` adds `stageReason?: string`.

## Test
- Added: `scripts/tests/e2e-wi0913-recruitment-enhancements.test.ts`
- Validates:
  - 조직/직원/관리자 셋업
  - opening 생성 시 `hiringManagerId` 저장 및 `GET` 확인
  - `REJECTED` stage 변경에서 `reason` 누락 시 `400`
  - `REJECTED` stage 변경에서 `reason` 포함 시 `200`
  - 후보 `GET` 응답에 `stageReason` 포함 확인

## Verification
- `npm.cmd exec tsx scripts/tests/e2e-wi0913-recruitment-enhancements.test.ts`
- `npm.cmd run typecheck`
- `npm.cmd run lint`
