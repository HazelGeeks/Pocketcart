# Supabase 운영 검토와 권한 수정

2026-10-03 America/Vancouver 기준 Pocketcart 프로젝트
`jmxbvqrvxshlybeomagw`의 실제 운영 상태를 조회하고 제한된 후속 변경을 적용한
기록입니다. Supabase CLI 2.119.0과 운영 REST/Storage/Edge API를 사용했습니다.
토큰·계정 비밀번호·실사용자 정보는 이 문서에 포함하지 않습니다.

## 확인한 운영 구성

- 프로젝트 상태는 `ACTIVE_HEALTHY`, 지역은 `ca-central-1`입니다.
- `public`의 테이블 26개 모두 RLS가 활성화되어 있습니다.
- `product-images`는 공개 이미지 전달용, `receipts`는 비공개 사진용입니다.
  Receipts는 사용자 경로·파일명·MIME·크기 제한과 접근 정책을 사용합니다.
- 서버 함수 10개가 존재합니다. 활성 제품 기능의 일반 배포는 9개이며,
  Food Scan은 현재 중단 응답을 제공하는 보존 엔드포인트입니다.
- 운영 함수 파일을 내려받아 대조했습니다. 구형 `back-office-flyer`를 현재
  저장소 코드로 배포한 뒤 재다운로드했고, 다운로드된 모든 TypeScript 파일이
  대응하는 로컬 파일과 일치했습니다. Food Scan 중단 응답도 일치했습니다.

## 수정하고 운영에서 재검증한 사항

### 상품 이미지 관리 권한

운영의 기존 `product_images_auth_insert/update/delete` 정책은 일반 로그인
사용자에게 상품 이미지 수정·삭제를 허용했습니다. 이는 저장소의 관리자 전용
정책과 달랐고 Advisor의 일반 RLS 점검만으로 발견되지 않았습니다.

새 [migration](../../supabase/migrations/20261003010000_storage_access_and_rls_performance.sql)으로
관리자만 이미지 객체를 조회·업로드·수정·삭제하도록 변경했습니다. 공개 버킷의
알려진 이미지 URL 전달은 유지했습니다. SQL과 해시 기록을 한 트랜잭션으로
처리하고 `pocketcart_deploy.migrations`에서 버전·파일명·해시 저장을 재조회했습니다.
이전 migration이나 운영 상품 데이터를 재실행·삭제하지 않았습니다.

임시 일반 계정과 임시 관리자 계정으로 각각 요청해 일반 사용자의 업로드·수정·
삭제가 차단되고 관리자 CRUD와 공개 URL 열람이 정상임을 확인했습니다.
검사 후 테스트 이미지, 임시 관리자 멤버십과 계정을 제거했습니다.

### Food Scan 중단

앱 공통 flag가 메뉴·화면·탭 진입과 네트워크 분석 요청을 차단합니다.
운영 `food-scan/index.ts`는 요청 이미지 본문을 읽거나 OpenAI를 호출하지 않고
`503 FEATURE_DISABLED`를 반환합니다. 잘못된 토큰으로도 중단 응답이 유지되는지
확인했고 운영 소스를 재다운로드해 대조했습니다.
`analysis.ts`는 재개 개발용으로 보존하며 중단 엔트리에서 import하지 않습니다.
일반 전체 배포에서도 제외했습니다. 공유 OpenAI 시크릿과 Receipt Scan은 유지했습니다.
앱 메뉴 변경은 새 바이너리 배포가 필요하며 기존 설치 앱의 UI가 바뀌었다는 뜻은 아닙니다.

### RLS 성능

개인/가족 소유권 조건을 유지하면서 Freezer와 Storage의 안정적인 인증 helper를
쿼리당 한 번 평가하도록 변경했습니다. 기존 성능 WARN 8개는 운영 Advisor
재조회에서 `No issues found`로 해소됐습니다.

### 기존 데이터 제약조건 검증

매장 위도·경도와 상품 GTIN 검사 3개가 `NOT VALID` 상태였습니다.
매장 254개와 상품 3,657개에서 위반 건수가 각각 0임을 먼저 조회한 뒤,
[검증 migration](../../supabase/migrations/20261003020000_validate_catalog_constraints.sql)을
적용했습니다. 데이터 행을 수정하거나 삭제하지 않았고, 이후 미검증 제약조건이
0개이며 매장·상품 수가 동일함을 재조회했습니다. 격리 DB에서도 위반 데이터가
있으면 적용과 이력 기록이 롤백되고 기존 행이 보존되는지 확인했습니다.

## 실제 운영 사용자 흐름 검사

기존 사용자 대신 일회용 QA 계정과 합성 영수증만 사용했습니다. 정책 수정 후
다음 검사를 다시 실행했습니다.

- Family: 로그인, 초대·수락·재사용·취소, 공유 Cart/Freezer, 오래된 쓰기 거부,
  외부 사용자 격리와 제거한 구성원 접근 차단.
- 무료 알림: 5개를 넘는 저장, 중복 갱신, 동시 갱신, 서비스 전용 RPC 차단,
  삭제와 Freezer 저장.
- Receipts: 비로그인·타인 조회/수정/사진 접근 차단, 세션 간 동기화, 동시 수정
  보호, 실제 OpenAI 합성 영수증 추출, 사용자별 원자적 quota, 영수증·사진 삭제,
  운영 계정 삭제 함수의 영수증·quota·저장/임시 사진 정리.
- 관리자 RPC 7개: 일반 로그인 계정의 호출이 `Admin access required`로 거부됨.
- 개인·가족·영수증·관리자 테이블 18개: 비로그인 HEAD 조회가 거부되거나
  접근 가능한 행 수가 0임. 개인정보 응답 본문을 요청하지 않음.
- 인증이 필요한 Edge 함수 8개: 잘못된 토큰/시크릿으로 실제 작업 요청이 거부됨.
  `send-sale-alert-push`의 빈 입력은 정상 no-op이므로 가상의 alert ID를 넣어
  인증 거부를 확인했으며 알림은 전송하지 않음.

실기기 푸시 수신, 실제 Apple/Google 로그인, 기존 유료 사용자 복원,
유효한 관리자 계정의 실제 Flyer OCR 추출은 이번 검사의 완료 범위가 아닙니다.
Flyer는 소스 일치와 서버 초기화/인증 경로를 확인했습니다.

## 남은 운영 항목

1. **유출 비밀번호 보호**: 보안 Advisor가 비활성을 보고했습니다.
   Supabase의 [공식 안내](https://supabase.com/docs/guides/auth/password-security)에
   따르면 Pro 이상에서 사용할 수 있습니다. 이번에 요금제·인증 설정을 바꾸지 않았습니다.
2. **백업/복구**: 백업 조회 결과 `pitr_enabled=false`, `backups=null`,
   `physical_backup_data={}`, `walg_enabled=true`였습니다. 이는 조회 가능한
   복구 목록이 없다는 관찰이며 백업 데이터가 전혀 없다는 단정은 아닙니다.
   실제 복구 가능 시점·보존 기간과 Storage 사진의 복구 범위를 확인하고
   별도 환경에서 복구 연습이 필요합니다.
3. **기존 migration 기록**: CLI 이력은 기존 31개 중 19개만 기록되어 있었습니다.
   Family/Storage/무료 알림은 실제 기능·권한이 동작해 이력 부재가 미배포를
   의미하지 않습니다. 신규 실행기에는 이번 migration 2개만 기록했습니다.
   구형 quota migration은 최종 정책이 아니므로 재적용하면 안 됩니다.
   기존 파일의 정확한 적용·내용을 대조한 뒤 [배포 절차](../backend-deployment.md)에
   따라 이력을 정리해야 합니다. 확인하지 않은 기존 해시를 자동 등록하지 않았습니다.

보안 WARN은 `authenticated_security_definer_function_executable` 14개와
유출 비밀번호 보호 1개입니다. 14개는 로그인 사용자에게 필요한 관리자/본인/가족
RPC이며 실행 권한을 일괄 제거하면 기능이 깨집니다. 함수 정의의 고정 search_path,
비로그인 EXECUTE 차단, 내부 관리자/본인/가족 검사와 실제 거부/격리 검사를
대조했습니다. 이 경고를 숨기거나 보안 검사 전체가 0개라고 보고하지 않습니다.

## 로컬 검증과 배포 범위

앱 release 검사 453개 테스트, 격리 DB의 트랜잭션/롤백/재실행/해시 검증과 실제
Family/Storage/Receipt migration·이미지 권한 검사, 전체 의존성 audit를 통과했습니다.
운영에서는 신규 권한/성능·제약조건 검증 migration 2개와 Food Scan 중단·Flyer
함수만 적용했습니다.
Git 커밋·푸시, 웹/네이티브 배포나 스토어 제출은 수행하지 않았습니다.
