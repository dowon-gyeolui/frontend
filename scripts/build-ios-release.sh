#!/usr/bin/env bash
# =============================================================================
# ZAMI iOS 릴리스 빌드 — App Store Connect 업로드용 .ipa 생성
# =============================================================================
# ※ macOS + Xcode 에서만 동작한다 (Apple 정책상 다른 OS 에서 빌드 불가).
#
# 사용법:
#   ./scripts/build-ios-release.sh              # 빌드 번호 = 현재 시각(YYYYMMDDHHmm)
#   ./scripts/build-ios-release.sh 42           # 빌드 번호 지정
#   ZAMI_UPLOAD=1 ./scripts/build-ios-release.sh   # 빌드 후 TestFlight 자동 업로드
#
# 필요한 환경변수:
#   ZAMI_TEAM_ID        Apple Developer Team ID (10자리)
#   업로드까지 할 경우 — ASC API 키 (App Store Connect > 사용자 및 액세스 > 통합):
#   ZAMI_ASC_KEY_ID, ZAMI_ASC_ISSUER_ID, 그리고 ~/.appstoreconnect/private_keys/AuthKey_<KEY_ID>.p8
# =============================================================================
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$(pwd)"

BUILD_NUMBER="${1:-$(date +%Y%m%d%H%M)}"
SCHEME="App"
PROJECT="ios/App/App.xcodeproj"     # CocoaPods 아님(SPM) → workspace 아니라 project
ARCHIVE="$ROOT/build/ios/ZAMI.xcarchive"
EXPORT_DIR="$ROOT/build/ios/ipa"

log() { printf '\n\033[1;35m▸ %s\033[0m\n' "$*"; }
fail() { printf '\n\033[1;31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

[ "$(uname)" = "Darwin" ] || fail "iOS 빌드는 macOS 에서만 가능합니다."
command -v xcodebuild >/dev/null || fail "Xcode 커맨드라인 도구가 없습니다."
[ -n "${ZAMI_TEAM_ID:-}" ] || fail "ZAMI_TEAM_ID 환경변수를 설정해 주세요 (Apple Developer Team ID)."

log "의존성 설치 (npm ci)"
npm ci

log "Capacitor 동기화 (cap sync ios)"
npx cap sync ios

log "빌드 번호 설정: $BUILD_NUMBER"
(cd ios/App && xcrun agvtool new-version -all "$BUILD_NUMBER" >/dev/null)

log "아카이브"
rm -rf "$ARCHIVE"
xcodebuild archive \
  -project "$PROJECT" \
  -scheme "$SCHEME" \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath "$ARCHIVE" \
  DEVELOPMENT_TEAM="$ZAMI_TEAM_ID" \
  CODE_SIGN_STYLE=Automatic

log "IPA 추출"
rm -rf "$EXPORT_DIR"
# teamID 를 환경변수 값으로 치환한 임시 ExportOptions 사용
TMP_OPTS="$(mktemp -t ZamiExportOptions.XXXXXX).plist"
sed "s/YOUR_TEAM_ID/$ZAMI_TEAM_ID/" ios/ExportOptions.plist > "$TMP_OPTS"
xcodebuild -exportArchive \
  -archivePath "$ARCHIVE" \
  -exportPath "$EXPORT_DIR" \
  -exportOptionsPlist "$TMP_OPTS"
rm -f "$TMP_OPTS"

IPA="$(ls "$EXPORT_DIR"/*.ipa 2>/dev/null | head -1)"
[ -n "$IPA" ] || fail "IPA 가 생성되지 않았습니다."

log "완료"
ls -lh "$IPA"

if [ "${ZAMI_UPLOAD:-0}" = "1" ]; then
  [ -n "${ZAMI_ASC_KEY_ID:-}" ] && [ -n "${ZAMI_ASC_ISSUER_ID:-}" ] \
    || fail "업로드하려면 ZAMI_ASC_KEY_ID / ZAMI_ASC_ISSUER_ID 가 필요합니다."
  log "App Store Connect 업로드"
  xcrun altool --upload-app -f "$IPA" -t ios \
    --apiKey "$ZAMI_ASC_KEY_ID" --apiIssuer "$ZAMI_ASC_ISSUER_ID"
  echo "업로드 완료 — App Store Connect > TestFlight 에서 처리 상태를 확인하세요 (5~30분 소요)."
else
  cat <<EOF

다음 단계 — 아래 중 하나로 업로드:
  a) Transporter 앱(App Store 무료)에 $IPA 드래그 앤 드롭
  b) ZAMI_UPLOAD=1 로 이 스크립트를 다시 실행 (ASC API 키 필요)
EOF
fi
