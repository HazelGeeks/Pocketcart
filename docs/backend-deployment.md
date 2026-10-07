# Supabase 배포 절차

기존 Pocketcart 운영 프로젝트의 DB 변경과 함수 배포를 관리합니다.
코드 확인일: 2026-10-07. 통합 배포 절차와 운영 상태는 별개입니다. 이전 운영 검증·후속 변경은
[2026-10-03 운영 검토](archive/2026-10-03-supabase-review.md)에 기록합니다. 새 Supabase 프로젝트를 만드는 bootstrap 절차는 아닙니다.

## 하나의 배포 경로

[Supabase Backend Release](../.github/workflows/supabase-release.yml)가 기존
schema/functions/family/freezer/alert 배포 workflow를 대체합니다.
[release.json](../supabase/release.json)은 프로젝트, 고정 CLI 버전, migration과
함수 목록의 정식 원본입니다. 디렉터리와 목록이 다르면 배포 전에 실패합니다.
새 파일을 추가하면 이 목록도 갱신합니다. 함수 인증 설정은
[config.toml](../supabase/config.toml)을 계속 따릅니다.

| action | 동작 |
| --- | --- |
| `plan` | 기본값. 원격 이력 조회와 대상 출력만 수행 |
| `apply-schema` | 명시한 migration을 시간순으로 한 트랜잭션에서 적용 |
| `record-existing` | 운영 적용을 확인한 migration의 해시를 기록; 해당 SQL은 실행하지 않음 |
| `deploy-functions` | 함수 전체 또는 선택 배포 |
| `release` | 명시한 DB 변경 후 함수 배포 |

`migrations`에는 14자리 버전을 쉼표로 구분해 입력합니다. DB에는 `all`을
허용하지 않습니다. `functions`는 `all` 또는 함수명을 입력합니다. `all`은
활성 함수 9개의 목록이며, 임시 중단한 Food Scan은 `disabledFunctions`에 기록해
일반 배포에서 제외합니다. 중단 응답을 교체할 때는 해당 함수만 명시적으로
CLI 배포합니다. 재개 조건은 [Food Scan 안내](../supabase/functions/food-scan/README.md)를 따릅니다.
`smoke`는 기본 `none`이며 family/alerts/receipts를 선택하면 기존 테스트가
일회용 계정을 생성·삭제합니다. 일반 전체 사용자 흐름은 기존 Live User Flow
E2E workflow로 검증합니다.

## 처음 사용할 때 기존 이력 대조

이 실행기의 `pocketcart_deploy.migrations`는 기존 CLI 이력과 별도입니다.
`untracked`는 실행기 기록이 없다는 뜻이며 미배포라는 뜻이 아닙니다.
목록을 보고 오래된 SQL을 모두 apply하지 않습니다.

1. `plan`을 실행하고 운영 프로젝트 ID를 확인합니다.
2. 기존 CLI/배포 이력, 테이블·함수 정의, 권한과 데이터 변경 결과를 SQL 원본과
   대조합니다. 파일 존재나 테이블 이름만으로 적용 완료를 판단하지 않습니다.
3. 확인한 버전만 `record-existing`으로 등록합니다. 등록이 실제 적용을 대신하지
   않습니다. Family/Storage/free-alert/Receipts는 등록 시에도 권한 검사를 실행합니다.
4. 확인하지 못한 버전은 `untracked`로 두고 이후 변경의 선행 조건을 검토합니다.
   기록된 파일은 수정하거나 삭제하지 않고 새 migration을 추가합니다.

기존 Family 테이블이 있는데 이력이 없는 경우 apply를 거부합니다. 먼저
기존 정의와 권한을 확인하고 기록해야 합니다. 새 Family 설치에는
`20260914010000,20260914020000` 두 버전이 함께 필요합니다. Storage는 Family와
My Freezer가 선행 조건입니다. Receipt Scan은 Receipts DB 설치 후 배포합니다.
새 Storage 설치는 `20260914030000,20260914040000,20260914050000,20260914060000`
네 버전을 함께 선택해 최종 권한 검사까지 통과시킵니다.
무료 알림 정책 이후 구형 watchlist 제한 SQL을 재적용하면 안 됩니다.

## 로컬 명령

자격증명 없이 목록과 해시를 확인합니다.

```bash
npm run backend:plan
```

원격 조회·변경에는 `SUPABASE_PROJECT_ID`, `SUPABASE_ACCESS_TOKEN`이 필요합니다.
토큰은 환경변수나 GitHub secret으로 제공하고 파일·문서에 저장하지 않습니다.
대상 프로젝트가 목록과 다르면 중단합니다.

```bash
npm run backend:release -- plan --remote
npm run backend:release -- deploy-functions --functions=receipt-scan
```

운영에 아직 적용되지 않은 SQL임을 확인하고 백업·복구 계획을 준비한 뒤,
필요한 버전만 적용합니다. 아래는 Receipts migration을 선택하는 형식 예입니다.
이미 적용된 운영 DB에는 이 예를 다시 실행하지 말고 기존 이력부터 대조합니다.

```bash
npm run backend:release -- apply-schema --migrations=20260916010000
```

알림 관련 함수 배포에는 `PUSH_FUNCTION_SECRET`도 필요합니다. 시크릿은 접근 제한한
임시 환경 파일(0600)로 전달하고 성공·실패 후 제거하며 값은 명령 인수에 포함하지
않습니다. OpenAI/메일/Apple 등
기존 함수별 시크릿은 별도로 준비해야 하며 이 실행기가 자동 생성하지 않습니다.

## 블로그 에디터 DB 적용

기존 Pocketcart 프로젝트에 다음 두 변경이 필요합니다. SQL과 실행기 기록을
대조하고, 미적용 상태와 백업·복구 범위를 확인한 뒤 순서대로 적용합니다.

| 버전 | 변경 |
| --- | --- |
| [20261007010000](../supabase/migrations/20261007010000_blog_posts.sql) | 글 테이블, 관리자 쓰기·초안 격리, 기존 영문·불문 12개 글 보존 |
| [20261007020000](../supabase/migrations/20261007020000_blog_rich_editor.sql) | 리치 본문·분류·작성자 기본값 `Pocketcart`, 대표 이미지·예약 시간·상단 고정, 공개 뷰, 비공개 `blog-images` 버킷과 접근 정책 |

두 버전이 모두 미적용인 경우의 명령입니다. 첫 버전이 이미 적용됐다면 이력과
정의를 대조한 뒤 두 번째 버전만 선택합니다. 실행기 밖에서 적용한 SQL을
곧바로 재실행하지 않습니다.

```bash
npm run backend:release -- plan --remote --migrations=20261007010000,20261007020000
npm run backend:release -- apply-schema --migrations=20261007010000,20261007020000
```

이 기능에 별도 Edge 함수 배포나 예약 cron은 필요하지 않습니다. 공개 뷰와
이미지 정책은 DB 시간을 기준으로 공개 여부를 판단합니다. 버킷은 비공개이며
JPG·PNG·WebP 파일을 5 MB까지 받습니다. 관리자 권한은 기존 `admin_users`
멤버십을 사용합니다. 신규 SQL은 상품·가격·사용자 데이터를 수정하지 않습니다.

적용 후에는 실행기 이력·RLS·공개 뷰·버킷 검사를 확인하고 새 웹 빌드를
배포합니다. 관리자 글 저장과 이미지 업로드, 비로그인 초안/예약 이미지 접근
차단, 예약 시간 전후 공개 전환을 실제 환경에서 확인합니다. 기존 Storage
정책 중 모든 버킷을 허용하는 정책이 없는지도 대조해야 합니다.
운영 REST의 `PGRST205` 응답은 테이블/뷰가 API 스키마 캐시에 없다는 뜻이므로,
SQL 카탈로그와 권한·스키마 캐시를 확인해 미설치와 구분합니다.

격리된 PostgreSQL 엔진에서 글·이미지 권한, 예약 공개, 동시 수정 충돌과
기존 글 보존을 검사합니다. 이 검사는 운영 적용 확인을 대신하지 않습니다.

```bash
POCKETCART_PGLITE_MODULE=/absolute/path/to/pglite/dist/index.js node tests/integration/blog.mjs
```

## 실패·재실행·검증

DB SQL과 기록은 하나의 트랜잭션입니다. 동일 버전·파일명·해시는 재실행하지
않고, 내용이 바뀌면 거부합니다. 기능별 권한 검사 실패도 전체 DB 배치를
롤백합니다. DB advisory lock과 workflow concurrency로 DB 변경과 workflow
중복 실행을 직렬화합니다. 함수 배포는 순차 실행이며 하나의 원자적 작업이
아닙니다. 중간 실패 후에는 배포된 버전을 확인하고 필요한 함수만 재배포합니다.
로컬에서 별도로 실행하는 CLI 함수 배포는 workflow concurrency 대상이 아닙니다.

타임아웃/네트워크 실패는 커밋 여부가 불명확할 수 있으므로 자동 재시도하지
않습니다. `plan --remote`와 DB 상태를 확인한 뒤 결정합니다. 성공 응답과 함수
목록 출력만으로 사용자 기능 검증을 완료했다고 판단하지 않습니다.

Workflow는 설치·목록 검사·typecheck·lint·테스트·audit를 배포 전에 실행합니다.
로컬 실행 시에도 `npm run verify`와 `npm run audit:ci`를 먼저 수행합니다.
격리 DB 검사는 아래처럼 별도 설치한 PGlite 경로를 지정할 수 있습니다.

```bash
PGLITE_MODULE=/absolute/path/to/pglite/dist/index.js node tests/integration/supabase-release.mjs
```

테스트 DB 검사는 운영 DB 적용, 백업 복구, 실제 함수 호출이나 기기 알림 수신을
입증하지 않습니다. 관련 안내는 [Supabase 목차](../supabase/README.md)와
[운영 가이드](operations-guide.md)를 참조합니다.
