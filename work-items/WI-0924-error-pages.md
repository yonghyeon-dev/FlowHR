# WI-0924 Next.js Custom Error Pages

## Scope
- Add a Korean-friendly 404 page (`src/app/not-found.tsx`).
- Add a Korean-friendly runtime error page (`src/app/error.tsx`) with `reset` retry support.
- Add a minimal root-layout-safe global error page (`src/app/global-error.tsx`) with `use client`.
- Add a focused e2e validation script for file existence and Korean copy checks.

## Implementation
- `src/app/not-found.tsx`
  - Added Korean title copy: `페이지를 찾을 수 없습니다`.
  - Added `홈으로 돌아가기` CTA linking to `/`.
  - Reused existing app classes (`landing-page`, `hero-panel`, `btn`) for layout/style consistency.

- `src/app/error.tsx`
  - Added `"use client"` and Next.js error boundary component signature.
  - Added Korean title copy: `문제가 발생했습니다`.
  - Added `다시 시도` button wired to `reset()` and `홈으로 돌아가기` CTA.
  - Added optional digest hint render when error digest exists.

- `src/app/global-error.tsx`
  - Added `"use client"` with minimal `<html>/<body>` structure.
  - Added Korean title copy: `문제가 발생했습니다`.
  - Added inline-safe styles to render even when root layout fails.
  - Added `다시 시도` button wired to `reset()` and home CTA.

- `src/app/globals.css`
  - Added small shared classes (`error-page`, `error-panel`, `error-actions`, `error-hint`) used by `not-found.tsx` and `error.tsx`.

- `scripts/tests/e2e-wi0924-error-pages.test.ts`
  - Verifies `not-found.tsx`, `error.tsx`, and `global-error.tsx` exist.
  - Verifies required Korean strings are present in each file.

## Verification
- `npx tsx scripts/tests/e2e-wi0924-error-pages.test.ts`
- `npm.cmd run typecheck`
- `npm.cmd run lint`
