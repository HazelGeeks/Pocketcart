# Home·Cart 기준 UI/UX 점검

## 범위와 근거

- iPhone 17 / iOS 26.5 시뮬레이터에서 현재 로그인 상태로 직접 이동하고 접근성 트리와 화면을 확인했다.
- 확인: Home, Cart 및 도움말 모달, 상품 상세, Map 지도/목록, Food Scan 두 모드, Notifications, Settings, My Freezer 빈 상태/추가 폼, Family 펼침, Shopping Profile, Edit Profile, Plus 판매 불가 상태, Shopping area 편집 열기/닫기.
- 로그인·가입·이메일 인증·비밀번호 재설정, 스캔 결과, 식품이 들어 있는 Freezer, 실제 결제 화면은 코드만 검토하거나 미검증 상태다. 계정 로그아웃, 촬영/업로드, 구매, 초대 발급, 데이터 수정은 점검에 포함하지 않았다.
- 사용자 첨부 화면은 디자인 요구의 기준으로 사용했다. 시뮬레이터의 시스템 기어 오버레이와 검은 카메라 프리뷰는 앱 UI 결함으로 판정하지 않았다.
- 최초 점검에서는 앱 코드를 변경하지 않았다. 이후 사용자 승인으로 아래 개선을 구현했다. 배포는 수행하지 않았다.


## 개선 완료 점검표

아래 구현 항목은 모두 반영했다. 원래 점검 내용은 하단에 이력으로 유지한다.

| 항목 | 상태 | 구현 및 확인 |
|---|---|---|
| 화면별 스크롤·탭바 | 완료 | route/filter별 ScrollView와 위치 저장을 분리. 기본 탭바 자동 숨김 해제. Home 재조회 중 기존 콘텐츠 유지. 위치 격리 회귀 테스트 및 Settings → Cart 상단/탭바 직접 확인 |
| 상품 상세 뒤로가기 | 완료 | 헤더 왼쪽 버튼 추가, 검색·필터 유지. Home 목록 추가 로딩 개수와 route별 위치 복원 |
| 지원 지역 지도 | 완료 | 사용자 위치가 지원 지역 밖이면 지원 매장으로 중심 이동. 실제 사용자 위치·거리는 유지. 시뮬레이터 Langley 중심과 1260km 표시, 회귀 테스트 확인 |
| My Freezer | 완료 | 작은 공유/개수 요약 + Add·알림 아이콘. 3개 통계 카드 제거. 추가·수정/알림 설정을 공통 모달로 분리 |
| Freezer 날짜 | 완료 | 월 이동/날짜 선택/날짜 없음 지원. 날짜 선택 후 폼 반영과 취소 확인. 윤년·연도 전환 테스트 추가 |
| Family | 완료 | Settings에는 한 행만 표시. Members/Invitations/Shared food/Membership 모달 구성. 접힌 상태의 초대 버튼과 잘못된 Cart 복사 안내 제거 |
| Notifications | 완료 | 긴 관리 카드를 Manage alerts 버튼+모달로 분리. 최근 알림 목록을 앞에 표시 |
| 알림 상품 정보 | 완료 | 상품 ID로 최신 표시명·썸네일 조회. ID가 없는 레거시 항목은 기존 이름/아이콘 유지. 임의 제품 매칭 없음 |
| 알림 → 상품 상세 | 완료 | 클릭할 때 상품 가격 재조회. 실패 안내 및 늦은 응답이 다른 화면으로 강제 이동하지 않도록 방어. Taiwan Cabbage 관리 항목 → 현재 상세 직접 확인 |
| 상품 상세 위계·중복 | 완료 | Cart 추가를 진한 주 버튼으로 변경. 알림은 보조 버튼. 중복 Product information/Previous prices 섹션 제거, 기간별 가격 기록·매장 비교 유지 |
| 알림 활성 상태 | 완료 | 활성 상품에 Alert enabled · Manage 표시. 관리 화면에서 해제 가능. 시뮬레이터에서 활성 상태 직접 확인 |
| Settings | 완료 | 큰 Account 제목/배경 대신 사용자명·General 배지. 이메일 중복 제거, 하단 Account actions로 명확화 |
| Plus | 완료 | 판매 불가 안내 중복 제거. Restore/Manage 비활성 표시, 복원 동작 유지. General 용어 통일 |
| Shopping Profile | 완료 | 설정 진입은 설문 소개·번호 카드 제거. 상단 저장/취소 행. 편집 중 Cancel은 저장하지 않도록 수정하고 선택 → Cancel → 재진입으로 확인 |
| Shopping area | 완료 | 본문 펼침 대신 모달. 위치 설정 시도 후 메시지도 모달 안에서 표시 |
| Map 목록 | 완료 | 테두리 카드/별도 View deals 행 대신 구분선 행과 화살표. 즐겨찾기·지도 포커스·상품 보기 동작 유지 |
| Edit Profile | 완료 | 중복 본문 제목/소개 제거. 이름·이메일·저장 폼만 표시, 시뮬레이터 확인 |
| Home·Cart·Food Scan | 유지/보완 완료 | 기존 핵심 구조 유지. Home·Cart 스크롤 문제와 상세 연결 보완. Food Scan 안전 한계 안내 및 결과 기능 유지 |

### 검증 범위

- 로컬 타입 검사, 린트, 전체 테스트, 웹 빌드를 수행한다. 최종 실행 결과는 하단 검증 기록에 명시한다.
- iPhone 17 / iOS 26.5에서 Settings, Family 모달, Freezer 추가 모달/달력, Shopping Profile 취소, Plus, 위치 모달, Edit Profile, Map 지도/목록, Notifications 관리 및 상품 상세 연결, Cart 복귀를 확인했다.
- 데이터 추가·삭제, 초대 생성, 계정 정보 저장, 결제는 실행하지 않았다. 실제 결제·실기기 촬영 결과·Android 화면 검증은 별도이며, 이 UI 개선 완료 표시가 해당 통합 검증까지 완료했다는 뜻은 아니다.
- 상품 ID가 없는 기존 알림 2개는 최신 상품 연결 대상에서 제외했다. 상품 원본 데이터 자체는 수정하지 않았다.

## 최초 점검: 우선 확인할 동작 문제

### 1. 화면 이동 시 스크롤 위치 및 하단 탭

Cart에서 Settings로 이동할 때 프로필 카드 상단이 잘린 상태, 다시 Cart로 돌아왔을 때 요약이 상단 밖에 있고 하단 탭이 숨겨진 상태를 관찰했다. 즉 화면 첫 진입 상태와 다른 화면의 스크롤 상태가 분리되는지 확인해야 한다.

`src/screens/NativeAppScreen.native.tsx`는 여러 탭에 같은 ScrollView를 사용한다. `src/hooks/useNativeDetailScroll.ts:7`은 detailKey가 null이 아닐 때만 상단 복귀를 수행한다. `src/hooks/useNativeBottomBarVisibility.ts:41`은 탭 전환 시 숨김 상태를 초기화하지만 후속 스크롤 이벤트와의 관계는 추가 재현이 필요하다. 정확한 숨김 원인을 확정한 것은 아니다.

개선 기준: 탭별 위치를 의도적으로 저장/복원하거나 첫 진입 시 상단으로 이동한다. 탭 전환 직후 내비게이션이 사라지지 않아야 한다.

### 2. 상품 상세의 명시적 뒤로가기 부재

Product Details 상단에 뒤로가기 버튼이 없다. `src/screens/NativeAppScreen.native.tsx:170`은 Alerts와 Settings 하위 화면에만 onBack을 연결한다. 제스처/Android 시스템 뒤로가기는 별도로 존재하지만 사용자가 발견하기 어렵다.

개선 기준: 상품 상세 좌측 뒤로가기 버튼으로 검색·필터·목록 위치를 유지하며 복귀한다.

### 3. 지원 지역 밖에서 지도와 목록 불일치

시뮬레이터 위치에서 지도는 San Francisco를 표시하고, 목록은 BC 매장과 1260km 이상의 거리를 표시했다. 지원 지역 안내는 있지만 지도에서 매장을 볼 수 없다.

`src/hooks/useNativeBackNavigation.ts:154`는 Map 진입 시 위치가 있으면 user 모드를 선택한다. `src/hooks/useNativeStoreMap.ts:68`의 중심 계산은 이 모드를 우선한다.

개선 기준: 지원 지역 밖이면 지원 매장 범위로 지도를 맞추거나, 명확한 “View supported area” 동작을 제공한다. 임의의 사용자 위치로 바꾸지는 않는다.

## 화면별 디자인 개선

| 화면 | 관찰 | 제안 | 순서 |
|---|---|---|---|
| My Freezer | 소개·공유 설명·알림 스위치/시간 설명·3개 통계가 목록보다 먼저 등장. 추가 폼이 본문 중간에 펼쳐짐 | 작은 요약과 Add, 목록 중심으로 축소. 알림 설정/설명은 모달, 추가·수정도 모달. 날짜는 직접 YYYY-MM-DD 입력 대신 날짜 선택기 검토 | 높음 |
| Family / Settings | 가족 관리가 Settings 안에서 펼쳐지고 초대 생성 버튼이 접힌 상태에도 별도로 노출 | Settings에는 Family 한 행만 두고 관리 모달/별도 화면으로 이동. 초대·멤버·탈퇴를 목적별로 구분 | 높음 |
| Notifications | Product alerts 관리 카드와 요금제 설명이 알림 목록을 아래로 밀어냄. 상품명은 저장 당시 언어가 혼재하고 이미지가 없음 | 최근 알림을 먼저 표시. 관리 목록은 “Manage alerts · 3/5”로 열기. 상품 ID로 최신 표시명/이미지 연결 | 높음 |
| 상품 상세 | 큰 진한 알림 CTA가 Cart 버튼보다 강조됨. 지난 가격/변동률/매장 정보가 여러 섹션에서 반복 | Add to cart를 주 동작, 알림은 보조 동작. 가격 기록과 매장 비교는 유지하고 중복 정보만 축소 | 높음 |
| Settings | 큰 Account 카드, My account, 하단 Account가 반복. 개인정보 이메일도 여러 번 표시 | 사용자명·General 배지를 작은 프로필 행으로 통합. 설정 행과 섹션 구분선은 유지 | 중간 |
| Plus | “coming soon”과 “not available” 반복. 비활성 Restore/Manage가 활성 링크처럼 보임 | 판매 불가 상태를 한 번만 표시. 복원 필요성은 유지하되 이용 가능한 동작과 비활성 상태를 분명히 구분. General/Free 용어 통일 | 중간 |
| Shopping Profile | 신규 가입 설문형 소개와 번호 카드가 설정 변경 화면에도 그대로 등장 | 설정 진입 시 소개 축소, 현재 선택값과 간결한 편집 섹션 중심. 저장 버튼 접근성 개선 | 중간 |
| Map 목록 | 각 매장이 테두리 카드이고 별도 View deals 행까지 있어 높이가 큼 | Home처럼 로고·매장명·거리 중심의 간결한 행으로 정리. 지도/목록 전환은 유지 | 중간 |
| Edit Profile | 입력 2개와 저장 동작은 명확. 내비게이션과 본문 제목 중복 | 본문 제목과 소개만 축소. 기능 구조 유지 | 낮음 |
| Food Scan 촬영 | 두 모드·프레임·촬영 버튼이 명확 | 현재 구조 유지. 결과 화면은 실촬영 데이터로 별도 점검. 식품 안전 한계 안내는 유지 | 낮음 |
| Cart | 이미지 행·Clear·도움말 모달의 구조는 현재 기준에 부합 | 위 스크롤/탭 동작 확인을 우선. 추가 설명/옵션을 다시 상단에 늘리지 않기 | 유지 |
| Home | 검색·카테고리·상품 행이 일관적 | 기본 구성 유지. 이번에는 전면 재설계 제안 없음 | 유지 |

## 추가로 발견한 연결 및 문구 문제

- `src/components/nativeApp/FamilyPanel.tsx:71`: 식품 이동 확인 안내에 “personal Cart can be copied from the Cart screen”이 남아 있다. 이미 제거한 버튼을 안내하므로 수정 필요.
- `src/components/nativeApp/SaleAlertsPanel.tsx:95`: 알림 항목은 View이며 상품 상세로 이동하는 동작이 없다. 알림 → 현재 가격 확인 흐름을 연결할 가치가 크다. 과거 알림 가격을 현재 가격으로 오인하지 않도록 상세에서는 최신 가격을 별도 조회해야 한다.
- `src/components/nativeApp/SubscriptionPanel.tsx:16`과 Settings의 General 배지: 동일 플랜을 Free/General로 혼용한다.
- 상품 상세의 Notify me 버튼은 등록 여부 대신 submitting 여부만 표시한다. 이미 모니터링 중인 상품이면 상태를 보여주고 수정/해제 진입을 제공하는 것이 명확하다.

## 권장 적용 순서

1. 스크롤/탭 전환, 상품 상세 뒤로가기, 지원 지역 지도 처리, 제거된 Cart 복사 안내 수정.
2. My Freezer와 Family를 작은 요약 + 목록 + 목적별 모달로 정리.
3. Notifications의 관리/알림 분리와 상품 상세 동작 위계 정리.
4. Settings·Plus·Shopping Profile의 반복 제목/문구/비활성 표현 정리.

공통 기준: 콘텐츠를 먼저 표시하고 주요 동작은 한 가지를 강조한다. 도움말은 헤더 ?, 편집·관리는 모달 또는 별도 화면, 삭제성 동작은 목록 하단/관련 항목에서 제공한다. 조회 화면과 편집 폼을 같은 구조로 억지로 통일하지 않는다.

## 최종 검증 기록

- `npm run typecheck`: 통과.
- `npm run lint`: 통과 (475 files).
- `npm test`: 335개 통과, 실패 0.
- `npm run build:web`: 통과.
- `git diff --check`: 통과.
- NativeAppScreen.native.tsx: 299줄. 새 모달/달력/알림 관리 코드는 별도 컴포넌트와 훅으로 분리.
- 후속 배포 요청의 최종 검사: `release:native:check`, iOS production JavaScript/Hermes export, 외부 release doctor 통과. 보안 정책 통과 (승인된 Expo 전이 의존성 예외 5건).
- 실제 스토어용 스크린샷 및 실기기 검증은 별도 출시 게이트로 유지.
