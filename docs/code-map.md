# 기능별 코드 탐색 안내

코드 구조 확인일: 2026-10-07. 기능을 수정할 때 어디서 읽기 시작할지 정리한 문서입니다.
실행·배포 방법은 [프로젝트 README](../README.md)와 각 설정 가이드에서 확인합니다.

## 먼저 읽을 파일

| 관심 영역 | 시작점 | 역할 |
| --- | --- | --- |
| 네이티브 앱 | [App.native.tsx](../App.native.tsx) → [NativeAppScreen.native.tsx](../src/screens/NativeAppScreen.native.tsx) | 폰트·Provider, 화면과 탭 연결 |
| 웹사이트·관리자 | [App.tsx](../App.tsx) → [routeState.ts](../src/routing/routeState.ts) | 웹 라우팅, 법적·지원 페이지, 관리자 진입 |
| 플랫폼 구분 | [NativeAppScreen.tsx](../src/screens/NativeAppScreen.tsx) | 웹에서 쓰는 앱 화면 변형; `.native.tsx`와 함께 확인 |
| 데이터 연결 | [supabaseClient.ts](../src/services/supabaseClient.ts) | 공개 환경 설정, 인증 세션, 클라이언트 생성 |
| 검증·명령 | [package.json](../package.json) | 실행·검사·빌드·배포 명령의 원본 |

## 기능별 읽는 순서

화면 → hook → service → 순수 utility 순서로 따라갑니다. 화면에서 모든 데이터 처리와
저장 동작을 찾으려 하지 말고, hook이 호출하는 service와 관련 테스트를 함께 봅니다.

| 기능 | 화면 또는 진입점 | 상태·데이터 처리 |
| --- | --- | --- |
| 상품 검색·가격 | [NativeHomeTab.tsx](../src/components/nativeApp/NativeHomeTab.tsx) | [useNativeCatalog.ts](../src/hooks/useNativeCatalog.ts), [marketData](../src/services/marketData/index.ts) |
| Cart | [NativeListTabs.tsx](../src/components/nativeApp/NativeListTabs.tsx) | [useNativeShoppingPlan.ts](../src/hooks/useNativeShoppingPlan.ts), [shoppingList.ts](../src/services/shoppingList.ts) |
| Freezer | [NativeFreezerTab.tsx](../src/components/nativeApp/NativeFreezerTab.tsx) | [useMyFreezer.ts](../src/hooks/useMyFreezer.ts), [myFreezer.ts](../src/services/myFreezer.ts), [freezerStorage.ts](../src/services/freezerStorage.ts) |
| Receipts | [NativeReceiptsTab.tsx](../src/components/nativeApp/receipts/NativeReceiptsTab.tsx) | [useReceipts.ts](../src/hooks/useReceipts.ts), [receipts.ts](../src/services/receipts.ts) |
| Account·로그인 | [NativeAccountTab.tsx](../src/components/nativeApp/NativeAccountTab.tsx) | [useNativeAccount.ts](../src/hooks/useNativeAccount.ts), [nativeSocialAuth.ts](../src/services/nativeSocialAuth.ts) |
| Family | [FamilyPanel.tsx](../src/components/nativeApp/FamilyPanel.tsx) | [FamilyContext.tsx](../src/contexts/FamilyContext.tsx), [useFamilyCart.ts](../src/hooks/useFamilyCart.ts), [family.ts](../src/services/family.ts) |
| Map | [NativeMapTab.tsx](../src/components/nativeApp/NativeMapTab.tsx) | [useNativeStoreMap.ts](../src/hooks/useNativeStoreMap.ts), [mapLocationSearch.ts](../src/services/mapLocationSearch.ts) |
| Food Scan (temporarily paused) | [FoodScanPanel.tsx](../src/components/nativeApp/FoodScanPanel.tsx) | [foodScan.ts](../src/services/foodScan.ts) |
| 할인·만료 알림 | [useNativeSaleAlerts.ts](../src/hooks/useNativeSaleAlerts.ts), [useFreezerReminders.ts](../src/hooks/useFreezerReminders.ts) | [saleAlerts.ts](../src/services/saleAlerts.ts), [pushNotifications.ts](../src/services/pushNotifications.ts), [freezerNotifications.ts](../src/services/freezerNotifications.ts) |
| 관리자 | [useAdminWorkspaceCommands.ts](../src/hooks/useAdminWorkspaceCommands.ts) | [adminBackoffice](../src/services/adminBackoffice/index.ts), [adminStore.ts](../src/state/adminStore.ts) |
| 블로그 작성·게시 | [AdminBlogPanel.tsx](../src/components/admin/AdminBlogPanel.tsx), [BlogRichTextEditor.tsx](../src/components/admin/BlogRichTextEditor.tsx), [BlogScreen.tsx](../src/screens/BlogScreen.tsx) | [useAdminBlogEditor.ts](../src/hooks/useAdminBlogEditor.ts), [usePublishedBlogPosts.ts](../src/hooks/usePublishedBlogPosts.ts), [blog.ts](../src/services/blog.ts), [blogImages.ts](../src/services/blogImages.ts), [BlogArticleBody.tsx](../src/components/blog/BlogArticleBody.tsx), [blog_posts migration](../supabase/migrations/20261007010000_blog_posts.sql), [rich editor migration](../supabase/migrations/20261007020000_blog_rich_editor.sql) |
| Flyer 가져오기 | [useAdminFlyerImport.ts](../src/hooks/useAdminFlyerImport.ts) | [flyerAiImport.ts](../src/services/flyerAiImport.ts), [flyerBatchImport.ts](../src/utils/flyerBatchImport.ts) |

## 폴더별 책임

- `src/components/`: UI와 상호작용. `nativeApp/`, `admin/`, `marketing/`으로 구분합니다.
- `src/hooks/`: 화면 상태, 계정·가족 범위, 비동기 요청과 취소·재시도 흐름.
- `src/services/`: API·인증·저장소·네이티브 SDK 경계.
- `src/utils/`: 계산·정규화·검증 등 UI와 분리한 로직.
- `src/styles/`, `src/screens/*Styles/`, `src/shared/design/`: 스타일과 공유 색상.
- `supabase/functions/`: 서버 함수. `supabase/migrations/`: 순서가 있는 DB 변경.
- `database/schema.sql`: 기준 스키마. 운영에 전체 파일을 재실행하는 절차가 아닙니다.
- `tests/`: 동작 회귀 검사. `scripts/`: 빌드·운영·검증 진입점.
- `vendor/`: 검증된 보안 포크와 설치 아카이브. [유지보수 절차](dependency-security.md)를 따릅니다.

컴포넌트의 PascalCase, hook의 `use` 접두사, `.native.tsx` 플랫폼 접미사는 유지합니다.
서비스 폴더의 `index.ts`는 도메인 진입점입니다. 같은 이름의 파일·폴더를 함께 만들거나,
플랫폼 변형을 일반 파일로 합치기 전에 resolver와 양쪽 빌드를 확인합니다.

## 검증 위치

주제와 같은 이름의 테스트를 `tests/`에서 찾아 먼저 읽습니다. 전체 로컬 검증은
`npm run release:native:check`, 전체 의존성 보안 검증은 `npm run audit:ci`입니다.
이 명령은 실기기, 운영 DB 적용, 실제 배포나 스토어 심사 완료를 대신하지 않습니다.
