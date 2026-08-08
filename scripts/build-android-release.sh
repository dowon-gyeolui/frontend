#!/usr/bin/env bash
# =============================================================================
# ZAMI Android 릴리스 빌드
# =============================================================================
# 기본은 Play 업로드용 .aab. --apk 를 주면 폰에 바로 설치되는 .apk 를 만든다.
#
#   ※ .aab 는 "설치 파일이 아니다". 폰으로 보내도 열리지 않는다.
#      Play Console 에 올리면 Google 이 기기별 APK 로 변환해 배포한다.
#      카톡/드라이브로 직접 나눠 줄 파일이 필요하면 --apk 를 쓸 것.
#
# 사용법:
#   ./scripts/build-android-release.sh                  # .aab (Play 업로드용)
#   ./scripts/build-android-release.sh --apk            # .apk (직접 설치용)
#   ./scripts/build-android-release.sh 3 1.0.2          # versionCode 3, versionName 1.0.2
#   ./scripts/build-android-release.sh --apk 3 1.0.2
#
# 사전 준비 (RELEASE.md 참고):
#   - JDK 21, Android SDK (ANDROID_HOME 또는 android/local.properties)
#   - android/keystore.properties (업로드 키스토어 경로/비밀번호)
# =============================================================================
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$(pwd)"

BUILD_APK=0
if [ "${1:-}" = "--apk" ]; then
  BUILD_APK=1
  shift
fi

VERSION_CODE="${1:-}"
VERSION_NAME="${2:-}"

log() { printf '\n\033[1;35m▸ %s\033[0m\n' "$*"; }
fail() { printf '\n\033[1;31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

# --- 사전 점검 -------------------------------------------------------------
log "환경 점검"
command -v node >/dev/null || fail "node 가 없습니다."
command -v npm  >/dev/null || fail "npm 이 없습니다."

JAVA_MAJOR="$(java -version 2>&1 | head -1 | sed -E 's/.*"([0-9]+).*/\1/')"
[ "$JAVA_MAJOR" -ge 17 ] && [ "$JAVA_MAJOR" -le 21 ] \
  || fail "JDK 17~21 이 필요합니다 (현재 $JAVA_MAJOR). JAVA_HOME 을 맞춰 주세요."

if [ ! -f android/local.properties ] && [ -z "${ANDROID_HOME:-}" ] && [ -z "${ANDROID_SDK_ROOT:-}" ]; then
  fail "Android SDK 경로가 없습니다. ANDROID_HOME 을 설정하거나 android/local.properties 에 sdk.dir 를 적어 주세요."
fi

if [ ! -f android/keystore.properties ] && [ -z "${ZAMI_KEYSTORE_FILE:-}" ]; then
  fail "android/keystore.properties 가 없습니다. keystore.properties.example 을 복사해 채워 주세요."
fi

if [ ! -f android/app/google-services.json ]; then
  printf '\033[1;33m! google-services.json 이 없습니다 — 이 빌드에서는 푸시 알림이 동작하지 않습니다.\033[0m\n'
fi

# --- 버전 --------------------------------------------------------------------
GRADLE_ARGS=()
if [ -n "$VERSION_CODE" ]; then GRADLE_ARGS+=("-PzamiVersionCode=$VERSION_CODE"); fi
if [ -n "$VERSION_NAME" ]; then GRADLE_ARGS+=("-PzamiVersionName=$VERSION_NAME"); fi

# --- 빌드 --------------------------------------------------------------------
log "의존성 설치 (npm ci)"
npm ci

log "Capacitor 동기화 (cap sync android)"
npx cap sync android

cd android
chmod +x gradlew

if [ "$BUILD_APK" = "1" ]; then
  log "APK 빌드 (assembleRelease) — 직접 설치용"
  ./gradlew clean assembleRelease "${GRADLE_ARGS[@]}"
  cd "$ROOT"
  OUT="android/app/build/outputs/apk/release/app-release.apk"
else
  log "App Bundle 빌드 (bundleRelease) — Play 업로드용"
  ./gradlew clean bundleRelease "${GRADLE_ARGS[@]}"
  cd "$ROOT"
  OUT="android/app/build/outputs/bundle/release/app-release.aab"
fi

[ -f "$OUT" ] || fail "산출물이 생성되지 않았습니다: $OUT"

# --- 검증 --------------------------------------------------------------------
log "서명 검증"
if command -v jarsigner >/dev/null; then
  jarsigner -verify "$OUT" | tail -3
fi

log "완료"
ls -lh "$OUT"

if [ "$BUILD_APK" = "1" ]; then
  cat <<EOF

이 파일은 폰에 바로 설치된다.
  - USB 연결 시:  adb install -r $ROOT/$OUT
  - 파일 전달 시:  받는 사람이 '출처를 알 수 없는 앱 설치'를 허용해야 하고,
                   갤럭시는 자동 차단(Auto Blocker)이 켜져 있으면 설치가 막힌다.
  ※ 배포 대상이 몇 명을 넘어가면 Play 내부 테스트나 Firebase App Distribution 을 쓰는 편이 낫다.
     (설치 경고 없이 스토어처럼 설치된다 — RELEASE.md §4-3)
EOF
else
  cat <<EOF

.aab 는 설치 파일이 아니다. 폰으로 보내면 열리지 않으니 Play Console 에 올릴 것.
  1. 앱 선택 > 테스트 > 내부 테스트 > 새 버전 만들기
  2. 위 .aab 업로드 → 출시 노트 작성 → 검토 후 출시
  3. 테스터에게 '옵트인 링크' 전달 → 테스터는 Play 스토어에서 정상 설치
  파일: $ROOT/$OUT
  (지인에게 파일로 직접 보내려면 --apk 로 다시 빌드)
EOF
fi
