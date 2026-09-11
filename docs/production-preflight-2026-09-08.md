# 운영 사전 점검 — 2026-09-08 UTC

대상: `main`, `a680fc0ac8dffcac155ca0c96bbb056e31443d1b`.
읽기 전용 운영 점검. 앱 배포, DB 변경, 테스트 계정 생성, 알림 발송은 실행하지 않았다.

## 판정

로컬 릴리스 검증은 통과. TestFlight 배포 전 EAS 인증·운영 변수·Apple 서명과 현재 버전의 실기기 동작 검증이 필요하다. 운영 데이터 범위도 제한적이다.

## 확인한 결과

- `npm run release:native:check`: 타입 검사, lint, 254개 테스트, 웹 export, 네이티브 설정 및 스토어 자료 검사 통과.
- 현재 커밋의 [Mobile Release Check](https://github.com/HazelGeeks/Pocketcart/actions/runs/34199812510) 성공.
- `npm run audit:ci`: 통과. 기존 정책이 허용한 전이 빌드 도구 high 취약점 5건은 남아 있다. 취약점 0건이라는 의미는 아니다.
- https://pocketcart.hazelgeeks.workers.dev 및 `/support`, `/privacy`, `/terms`, `/delete-account`: HTTP 200. 브라우저 화면과 폼 제출 성공을 증명하지 않는다.
- 필수 GitHub 시크릿 5개 이름 확인. 값의 유효성이나 로컬 CLI 인증을 증명하지 않는다.
- 최근 [할인 알림 동기화](https://github.com/HazelGeeks/Pocketcart/actions/runs/34187721822) 성공: 생성 0, 전송 0, 수신 확인 0. 실제 푸시 수신 검증은 남아 있다.
- `freezer_items`, `product_aliases`, `admin_audit_logs` API 존재 확인. 익명 접근에서 freezer 및 audit 행 수는 0. 전체 RLS 또는 사용자 간 격리 검증은 수행하지 않았다.
- 공개 Auth 설정: 이메일 가입 허용, 이메일 확인 필요, Google/Apple 로그인 비활성화. 실제 가입 메일 전달과 콜백은 미검증.

## 현재 데이터

2026-09-08 07:42 UTC, 로컬 앱 설정의 `jmxbvqrvxshlybeomagw.supabase.co`를 공개 클라이언트 권한으로 조회했다. EAS 운영 빌드가 같은 프로젝트를 사용하는지는 아직 확인할 수 없다.

| 항목 | 결과 |
|---|---:|
| 상품 | 2,524 |
| 가격 행 | 15,157 |
| 활성 매장 | 31 |
| 현재 유효한 가격 행 | 562 |
| 현재 유효한 가격이 있는 상품 | 140 (5.5%) |
| 이미지 없는 상품 | 2,304 (91.3%) |

유효 가격은 활성 매장에 속하고 `coalesce(valid_from, observed_at) <= 점검 시각`, `valid_to`가 없거나 점검 시각 이후인 행이다. 앱의 추가 표시·우선순위 규칙은 반영하지 않았다. 최신 observed_at은 9월 4일 07:00 UTC, 가장 늦은 만료는 9월 11일 06:59:59.999 UTC다. 이는 실제 수집 실행 시각을 뜻하지 않는다.

## 남은 확인과 우선순위

1. **EAS 인증 복구 후 iOS 운영 설정 확인**: 로컬 `eas whoami`가 Not logged in. 외부 doctor의 변수 실패 6개는 조회 불가를 포함하므로 실제 미설정으로 단정하지 않는다. Supabase URL·공개 키·인증 콜백과 Apple Developer/App Store Connect·서명을 확인한다. Android Maps/Firebase는 Android 배포 시 별도 확인한다.
2. **서버와 현재 코드 일치 확인**: GitHub 최신 스키마 배포는 8월 6일, 함수 배포도 8월 6일이다. 이후 수동 배포 여부는 미확인. 최신 migration 적용과 함수 버전을 관리 API에서 대조해야 한다. 전체 schema.sql은 데이터 변경 구문을 포함하므로 점검 목적으로 실행하지 않는다.
3. **Cloudflare 계정 접근 확인**: 배포 이력 조회에서 대상 계정 인증 오류. 사이트는 응답하지만 현재 소스와 배포 버전 일치는 확인하지 못했다.
4. **현재 버전 실제 사용자 흐름 검증**: GitHub의 최근 E2E 성공은 7월 14일이다. 가입·메일 인증·로그인·관심상품·가격·계정 삭제 및 실기기 푸시 수신을 재검증한다.
5. **TestFlight 빌드**: GitHub의 최근 성공 빌드는 7월 14일 iOS preview-simulator다. production/TestFlight 빌드의 증거가 아니며 스토어 제출 워크플로 이력은 없다. 다른 경로의 업로드 여부는 미확인이다.
6. **베타 데이터 운영**: 유효 가격이 있는 지역·매장 중심으로 범위를 정하고, 가격 갱신 담당·주기와 오류 신고 대응을 정한다. 이미지 보강을 진행한다.
7. **스토어 공개 준비**: screenshots 디렉터리에는 README만 있다. 실제 제출용 화면 캡처가 필요하다.

운영 모니터링·백업/복구 설정, 사용자 간 접근 격리, 실기기 권한·지도·카메라 동작, 스토어 콘솔 상태는 이번 점검에서 검증하지 못했다.

## 후속 iOS 설정 확인

- Expo CLI와 이번에 연 Expo 브라우저 모두 미로그인 상태를 확인했다. 로그인 화면을 준비했다.
- production 프로필은 production 환경, 실기기 iOS, 자동 빌드 번호 증가로 구성되어 있다. 번들 ID는 네이티브 설정과 Expo 설정 모두 `com.pocketcart.app`이다.
- 로컬 키체인 조회에서 유효한 Apple Development 서명 identity 1개만 확인했다. Apple Distribution identity는 로컬에서 확인되지 않았으며, EAS 원격 인증서 보유 여부는 로그인 후 확인해야 한다.
- App Store Connect 앱 ID `ascAppId`는 `eas.json`에 지정되지 않았다. 실제 스토어 앱 레코드와 제출 인증을 확인한 뒤 필요한 값을 설정해야 한다.
- 기존 CI는 환경 검사 다음에 실제 빌드를 시작한다. 읽기 전용 점검을 위해 이 워크플로를 실행하지 않았다.

## Expo 브라우저 로그인 후 확인

사용자가 로그인한 `@w_sungjun/pocketcart`의 EAS 화면에서 확인했다. 앞선 미로그인 조회 결과 중 아래 항목은 해결되었다.

- production 환경에 `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_AUTH_REDIRECT_URL`, `EXPO_PUBLIC_SUPABASE_PRODUCT_IMAGE_BUCKET`가 모두 존재한다.
- Supabase URL은 앞서 데이터 점검한 프로젝트와 일치한다. 콜백은 `pocketcart://auth/callback`, 버킷은 `product-images`다. 마스킹된 anon key 값은 열거나 복사하지 않았으므로 유효성까지 검증한 것은 아니다.
- Android Maps 변수도 production에 있으며, Firebase 파일은 development/preview/production에 Secret으로 등록되어 있다.
- 프로젝트 Credentials 화면의 iOS 영역에는 번들 ID 목록이 없고 `Upload Apple credentials` / `Get started`가 표시된다. 이 프로젝트에 iOS 서명 설정이 연결되지 않은 상태다. 계정 전체의 Apple 인증서나 Apple Developer 가입 상태까지 확인한 것은 아니다.
- EAS 전체 빌드 목록에서 iOS 성공 이력은 preview-simulator이며 production iOS 빌드는 없다. Android production 성공 이력은 별도로 존재한다. 표시된 기존 빌드 산출물은 Expired 상태다.
- EAS Submissions에는 첫 제출 안내만 있으며 제출 이력이 없다. EAS 외부에서 직접 제출했는지는 미확인이다.

다음 단계는 Apple Developer 팀 및 App Store Connect 앱 레코드 확인, iOS 배포 인증서·프로비저닝 연결이다. 브라우저 로그인은 완료되었지만 로컬 CLI 로그인 완료를 뜻하지 않는다. 이번에는 인증서 생성·권한 부여·빌드·제출을 실행하지 않았다.

## Apple 계정 재확인

로그인된 Apple Developer Account 페이지에서 계정 상태가 `Pending`으로 표시된다. `Purchase your membership` 안내와 구매 처리에 최대 48시간이 걸릴 수 있다는 문구가 함께 표시된다. 사용자는 가입 완료를 알렸으나 현재 포털에서 멤버십 활성화는 확인되지 않았다. 결제 실패나 미결제로 단정할 수 없다. 활성화 후 개발자 팀·인증서·App Store Connect 앱 등록을 이어서 확인해야 한다. 구매나 재결제는 실행하지 않았다.

## 멤버십 활성화 후 재확인

- 이후 새로고침한 Apple 계정에서 Pending 표시가 사라지고 Apple Developer Program 멤버십 상세가 표시됨. 개인 가입, Team ID `AU7PKKMSB8`, 갱신일 2027-09-08 확인. Team ID는 현재 Xcode 프로젝트 설정과 일치한다.
- 최신 Program License Agreement를 2026-10-01까지 수락하라는 별도 배너가 표시된다. 자동 수락하지 않았다.
- App Store Connect의 Apps 진입 시 최초 Terms of Service 동의 화면이 표시되어 앱 목록·등록 단계에 도달하지 못했다. 사용자 검토를 위해 화면을 유지했으며 체크박스와 Agree는 조작하지 않았다.

## 앱 등록 완료

- 사용자 동의 후 App Store Connect 접근 가능. Apple Developer에 `PocketCart` / `com.pocketcart.app` App ID를 등록하고 Push Notifications 및 Sign In with Apple을 활성화했다. 이는 서버의 Apple 로그인 제공자 설정이나 실제 푸시 전달 완료를 뜻하지 않는다.
- `PocketCart` 단독 이름은 이미 사용 중이라는 오류로 거절됨. 사용자가 선택한 `PocketCart: Grocery Savings`로 iOS 앱을 생성했다.
- 앱 URL: https://appstoreconnect.apple.com/apps/6809854257/distribution
- Apple ID: `6809854257`, SKU: `pocketcart-ios`, 기본 언어: English (U.S.). 앱 상태: iOS 1.0 Prepare for Submission.
- `eas.json`의 production iOS 제출 설정에 ascAppId와 appleTeamId를 연결했다. 기기 홈 화면 이름은 PocketCart 그대로 유지한다.
- Expo CLI는 여전히 Not logged in. Expo 웹 인증서 설정은 distribution certificate 및 provisioning profile 업로드를 요구한다. 인증서 생성·업로드, 빌드, TestFlight 제출은 아직 수행하지 않았다.
- App Store Connect에는 별도의 최신 Apple Developer Program License Agreement 수락 안내가 계속 표시된다. 이전 App Store Connect 이용약관 수락과 별개다.

## CLI 서명 설정 시작

- `eas whoami`로 `w_sungjun` 로그인 확인.
- `eas credentials:configure-build --platform ios --profile production` 실행 후 Apple 계정 로그인을 시도했다.
- 기존 로컬 Apple 세션은 만료되어 있었고, EAS가 Keychain에 저장된 암호로 자동 로그인을 시도했지만 인증이 거절됐다. EAS는 해당 저장 암호를 Keychain에서 제거했다고 출력했다.
- 재시도하지 않고 종료했다. 사용자가 터미널에서 Apple 암호 및 필요시 2단계 인증을 직접 입력해야 한다. 이번 실행에서 배포 인증서나 프로비저닝 프로파일은 생성되지 않았다.

## APNs entitlement 오류 수정 및 서명 완료

- 사용자 재시도에서 EAS가 `$(APS_ENVIRONMENT)`를 유효하지 않은 aps-environment 값으로 거절했다. EAS capability 동기화는 Xcode 빌드 변수 치환 전에 파일을 읽는다.
- 별도 Debug/Release entitlement의 APNs 값을 각각 `development`/`production`으로 지정하고, 사용하지 않는 Xcode APS_ENVIRONMENT 설정을 제거했다. 릴리스 검사도 실제 APNs 값을 확인하도록 수정했다.
- 네이티브 설정 검사, plist/Xcode 프로젝트 구문 검사, lint, diff whitespace 검사 통과.
- 사용자 로그인 세션으로 `credentials:configure-build --platform ios --profile production` 재실행: capability 동기화 성공, Apple Distribution Certificate 생성 성공, App Store provisioning profile 생성 및 active 상태 확인. 명령 exit 0, `All credentials are ready to build` 확인.
- 이번 오류 수정에서 앱 빌드나 TestFlight 업로드는 실행하지 않았다.

## 2026-09-11 커밋 전 재검증

- 위 운영 데이터와 외부 서비스 상태는 각 점검 당시의 기록이며 현재 상태를 보증하지 않는다.
- Account 화면의 프로필 헤더·섹션 메뉴·하단 로그아웃 구성을 정리했다. 계정 삭제, 위치 설정, 알림 진입 동작은 유지했다.
- iOS 빌드 번호를 2로 맞췄으며 릴리스 검사가 최초 번호 1에 고정되지 않도록 양의 정수 검증으로 변경했다.
- 새 보안 권고에 대응해 lockfile의 xmldom 및 js-yaml을 기존 호환 범위 내 패치 버전으로 갱신했다. 보안 예외는 추가하지 않았다.
- `release:native:check` 통과: 타입 검사, lint, 254개 테스트, 웹 export, 네이티브 설정 및 스토어 자료 검사. `audit:ci` 통과, 기존 정책이 허용한 전이 빌드 도구 high 항목 5건은 남아 있다.
- 이번 검증은 실기기 화면·푸시 수신·TestFlight 배포를 포함하지 않는다. 스토어 제출용 실제 스크린샷도 별도 준비가 필요하다.
