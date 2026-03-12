# WI-1175: 관리자 운영 레인 롤아웃

## 배경

`WI-1174`로 `/admin` 홈은 queue-first 컨트롤 타워로 정리됐지만, 운영 워크스페이스 묶음은 아직 홈 카드와 사이드바 링크에 흩어져 있습니다.
이번 WI는 attendance, leave, scheduling, notices, benefits, recruitment, contracts follow-up을 하나의 `operations lane` route로 올려 customer-admin이 홈에서 실제 운영 작업면으로 자연스럽게 이동하도록 정리합니다.

## 범위

1. `/admin/operations` route를 신설한다.
2. admin 홈의 운영 레인 카드, dashboard entry, 사이드바/모바일 메뉴를 새 route 기준으로 정렬한다.
3. 운영 레인 안에서 대표 작업 큐, lane group, follow-up link rhythm을 shared workspace primitives 위로 통일한다.
4. 현재 admin hub truth에 맞는 정적 회귀 가드를 추가한다.

## 완료 조건

1. `/admin/operations`가 queue-first customer-admin operations station으로 보인다.
2. admin 홈에서 operations lane primary entry가 `/admin/operations`로 연결된다.
3. admin navigation의 operations group에 lane entry가 명시된다.
4. `typecheck`, `lint`, `npm test`, `npm run test:e2e:mvp:current`, `npm run test:integration:current`, `npm run test:quality-gates:current`가 green이다.
