# 운영 구조와 유지보수 검토

저장소의 운영 책임과 보완 우선순위를 설명합니다. 코드 확인일: 2026-10-03.
최초 저장소 검토에서는 운영 Supabase의 함수 버전·적용 migration·백업 설정이나
App Store Connect의 현재 제출 상태는 조회하지 않았습니다.
운영 Supabase의 후속 조회·권한 수정·실제 계정 검증 결과는
[2026-10-03 운영 검토](archive/2026-10-03-supabase-review.md)에 별도로 기록합니다.

## 디렉터리 책임

| 위치 | 역할 | 유지보수 기준 |
| --- | --- | --- |
| `src/`, 앱 진입점 | 웹·네이티브 화면과 클라이언트 동작 | [코드 지도](code-map.md)에서 기능별 책임 탐색 |
| `ios/`, `android/`, `app.json`, `eas.json` | 네이티브 프로젝트와 빌드 설정 | 설정 동기화 검사, 바이너리별 실기기 검증 |
| `database/schema.sql` | 기본 스키마와 SQL 참조 | 후속 migration과 함께 검토; 단독으로 운영 재적용 금지 |
| [supabase](../supabase/README.md) | SQL 변경 이력, 서버 함수, 함수 인증 설정 | 적용 이력·배포 버전·권한 검증을 함께 관리 |
| [store-assets](../store-assets/README.md) | 등록 문구, 심사 자료, 개인정보 답변, 스크린샷 | 제출할 빌드와 연결하고 외부 등록 상태는 별도 기록 |
| `scripts/`, `.github/workflows/` | 검증·배포·정기 작업 | 모든 배포 진입점에 동일한 필수 검증 적용 |
| [vendor](dependency-security.md) | 보안 수정한 외부 라이브러리와 설치 아카이브 | 원본·라이선스·해시 유지, upstream 수정 출시 추적 |
| `docs/`, `docs/archive/` | 현재 절차와 과거 증거 | 과거 성공을 현재 운영 완료 상태로 사용하지 않기 |

## 보완 우선순위

### 1. Food Scan 임시 중단

Food Scan은 임시 미사용으로 전환했습니다. 앱의 공통 feature flag가 메뉴·화면·
진입·네트워크 요청을 차단합니다. 운영 함수도 이미지 본문을 읽거나 AI를 호출하지
않는 `503 FEATURE_DISABLED` 응답으로 교체했습니다. 일반 전체 배포에서는
제외하고 분석 구현은 재개 작업을 위해 보존했습니다. 재개 전에는 사용자 인증과
원자적 사용량·비용 제한이 필요합니다. Receipt Scan은 정상 운영합니다.

### 2. 통합한 DB 변경과 함수 배포 경로

기존 5개 배포 workflow와 3개 feature 배포 스크립트를 Supabase Backend Release와
공통 실행기로 통합했습니다. 모든 migration과 함수는 release 목록과 실제 파일을
대조합니다. DB는 명시한 버전만 처리하고, SQL·해시 기록·기능별 권한 검사를 한
트랜잭션에서 실행합니다. workflow concurrency와 DB lock으로 중복 DB 적용을
직렬화합니다. 함수 전체 배포는 활성 함수 9개를 대상으로 하며 Food Scan은 제외합니다.

기존 운영 적용 이력은 자동으로 추정하거나 등록하지 않습니다. 처음에는
`untracked`로 표시하며, 실제 정의와 과거 이력을 확인해 기록해야 합니다.
새 환경 bootstrap 검증은 여전히 별도 작업입니다. 자세한 절차는
[백엔드 배포](backend-deployment.md)를 참조합니다.

### 3. 정확한 바이너리와 스토어 자료 연결

[`eas-submit.yml`](../.github/workflows/eas-submit.yml)은 이제 필수 `build_id`를 사용하고,
로컬 제출 명령도 build UUID 또는 실제 artifact 경로를 요구합니다.
제출 전에 해당 ID의 commit·플랫폼·profile·실기기 검증 결과를 대조해야 합니다.
현재 스토어 검사는 이미지 기본 규격과 metadata를 검사하지만 screenshot 파일,
심사 답변의 placeholder, 제출 빌드와 자료의 일치는 필수 실패 조건이 아닙니다.
기본 에셋 검사와 플랫폼별 제출 준비 검사를 구분해야 합니다.

스크린샷 기록은 build 17에서 촬영한 2026-09-25 자료이고 Android 촬영은
미완료로 기록되어 있습니다. 정식 원본으로 통합한 `response-draft.txt`에는
영상·데이터 출처·사용 권리 placeholder가 남아 있습니다. 제출별 manifest에
빌드 ID, commit, locale, 이미지 규격, 영상, QA 결과와 등록 확인 날짜를 연결하고,
심사 답변은 같은 원본을 답변과 Notes에 복사하고 저장된 값을 재확인해야 합니다.

### 4. 배포 진입점의 검증 일치

Mobile Release Check, 수동 EAS 빌드·제출과 Supabase 배포 경로에 보안 audit를
적용했습니다. Supabase 통합 workflow는 목록·typecheck·lint·테스트도 검사합니다.
EAS CLI는 `eas.json`, Supabase CLI는 `supabase/release.json`에서 버전을 고정하고,
로컬과 CI Node는 `.nvmrc`를 사용합니다. 변경한 workflow의 실제 원격 CI 실행은
커밋·푸시 이후 별도로 확인해야 합니다.

### 5. 장애 대응과 정기 운영 기록

백업 언급은 있지만 복구 연습, 복구 목표, 담당자와 장애 대응을 모은 절차는
저장소에서 확인하지 못했습니다. 공급자에서 백업이 꺼져 있다는 뜻은 아닙니다.
이번 운영 조회에서 PITR은 비활성이고 조회 가능한 백업 목록은 없었습니다.
[운영 검토](archive/2026-10-03-supabase-review.md)의 관찰을 기준으로 실제 복구 가능
시점·보존 기간과 비공개 영수증 사진 복구 범위를 확인해야 합니다.
가격 데이터 최신성·현재 가격 커버리지·이미지 누락, 알림 실패/지연,
이미지 분석 사용량/비용을 운영 지표로 정하고 이상 시 알림과 대응 방법을
연결해야 합니다. 계정 삭제는 DB·사진·인증 공급자 처리까지 점검해야 합니다.

## 변경 후 확인 순서

1. 로컬 release 검사와 전체 dependency audit를 통과시킵니다.
2. 해당 backend 변경을 테스트 DB에서 검증하고 기존 데이터 보존을 확인합니다.
3. 대상 프로젝트와 적용 SQL·함수 목록을 확인하고 백업/복구 준비 후 배포합니다.
4. 실제 함수 버전, DB 권한, 사용자 흐름과 정기 작업 결과를 확인합니다.
5. 지정한 네이티브 빌드로 로그인·촬영·알림·삭제를 실기기에서 확인합니다.
6. 그 빌드의 심사 자료를 검증하고 외부 스토어에 저장된 상태를 확인합니다.

현재 로컬 검사가 통과해도 위의 운영·실기기·심사 단계가 완료됐다는 뜻은
아닙니다. 보안 포크의 추가 유지보수 절차는 [의존성 보안](dependency-security.md),
빌드와 제출 명령은 [스토어 릴리스](mobile-store-release.md)를 따릅니다.
