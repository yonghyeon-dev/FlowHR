# WI-1125: 직원 홈 페이지 export 정리

## 배경

`WI-1124`가 머지된 뒤 production deploy가 실패했고, 로그를 확인한 결과 `src/app/employee/page.tsx`가 Next.js page 파일에서 허용되지 않는 named export `EmployeeSelfServicePage`를 그대로 내보내고 있었습니다.

이 문제는 두 가지를 동시에 보여줍니다.

- 배포 차단 원인: Next build가 page file export 규칙 위반으로 실패
- 구조 모순: route-first로 분리된 뒤에도 홈 page file이 여전히 외부에서 가져다 쓰던 예전 export 습관을 유지

## 목표

- `src/app/employee/page.tsx`를 Next page 규칙에 맞는 default-export 중심 파일로 정리합니다.
- page file의 named export를 제거해서 production deploy를 복구합니다.
- 이 상태를 회귀 가드로 고정해 같은 문제가 다시 배포에서만 터지지 않게 합니다.

## 범위

### In Scope

- employee home page file named export 제거
- 관련 회귀 가드 추가
- 진행 문서 최신화

### Out of Scope

- 홈 모놀리스 전체 경량화
- attendance / leave route 내부 로직 추가 정리
- employee shell 추가 IA 개편

## 완료 기준

1. `src/app/employee/page.tsx`가 `EmployeeSelfServicePage` named export를 더 이상 노출하지 않는다.
2. `npm run typecheck`, `npm test`, `npm run test:integration`이 통과한다.
3. PR CI, main CI, production deploy가 green으로 복구된다.
