# ZAMI 앱 출시 가이드

> Google Play(안드로이드/갤럭시) · App Store(iOS) 출시 절차.
> **CI 서비스 없이 사내 PC에서 직접 빌드해 올리는 방식**을 기준으로 한다.
> (`codemagic.yaml` 은 과거 시도 흔적이며 이 문서와 무관하다. 쓰지 않으면 삭제해도 된다.)

---

## 0. 앱 구조 — 무엇을 출시하는가

```
[사용자 폰]
   └ ZAMI 네이티브 셸 (Capacitor 8)
        └ WebView → https://thezami.io  (Vercel 에 배포된 Next.js)
                        └ https://api.thezami.io (백엔드)
```

- 네이티브 앱 안에 웹을 **번들하지 않고**, `capacitor.config.ts` 의 `server.url` 로 **배포된 웹을 실시간 로드**한다.
- 장점: 웹만 배포하면 앱도 즉시 갱신된다(스토어 심사 불필요).
- 단점/주의:
  - 인터넷이 없으면 `www/index.html` 폴백 화면만 뜬다.
  - **스토어 심사에서 "웹사이트를 그대로 감싼 앱"으로 판단될 위험**이 있다 (Apple 심사지침 4.2 Minimum Functionality). 아래 §1 참고.
  - 웹을 잘못 배포하면 이미 설치된 앱도 즉시 망가진다. 웹 배포 = 앱 배포다.

네이티브 기능은 현재 **푸시 알림 1개**(`@capacitor/push-notifications`)를 쓴다.

---

## 1. ⚠️ 출시 전 반드시 결정해야 하는 정책 이슈

기술 준비와 별개로, **아래 3개는 심사 반려로 직결된다.** 코드가 아니라 사업 결정이 필요한 부분이다.

### (1) 결제 — 가장 큰 리스크 🔴

현재 `@tosspayments/tosspayments-sdk` 로 **앱 안에서 "별"(디지털 재화)을 웹결제로 판매**한다.

| 스토어 | 규정 | 현재 상태 |
|---|---|---|
| Apple App Store | 지침 3.1.1 — 앱 내에서 쓰는 디지털 콘텐츠는 **반드시 In-App Purchase** | 위반 → **거의 확실히 반려** |
| Google Play | 결제 정책 — 디지털 재화는 **Google Play 결제 시스템 필수** | 위반 → 반려 또는 사후 제재 |

> 한국의 인앱결제 강제 금지법(전기통신사업법 개정)은 "제3자 결제를 **함께** 제공할 수 있다"는 취지이지, 외부 웹결제만 두는 것을 허용하지 않는다. Google 은 한국 한정 '개발자 제공 인앱결제'를 별도 신청해야 하고, Apple 은 한국에서도 IAP 를 요구한다.

**선택지**
- **A. 인앱결제 도입** (정석) — `@capacitor-community/in-app-purchases` 또는 RevenueCat 을 붙이고, 스토어별 상품(소모성 아이템 "별")을 등록. 수수료 15~30%.
- **B. 앱에서는 결제 기능을 감춘다** — 앱 빌드에서 `/store`·결제 버튼을 숨기고 무료 기능만 제공(웹에서는 계속 판매). 심사는 통과하지만 앱 매출은 0.
- **C. 그대로 제출** — 반려를 각오하고 심사 피드백을 받아본다. iOS 는 통과 가능성이 매우 낮다.

→ **결정 전까지 iOS 제출은 보류하고, Android 내부 테스트부터 진행하는 것을 권한다.**

### (2) 소셜 로그인 — Apple 지침 4.8

카카오 로그인을 제공하므로, iOS 는 **Sign in with Apple** 또는 이에 준하는(이름·이메일만 수집, 이메일 가리기 지원, 광고 추적 없음) 대안 로그인을 함께 제공해야 한다.
현재 아이디/비밀번호 로그인이 있어 대안으로 인정될 여지는 있으나, 확실히 하려면 Sign in with Apple 추가가 안전하다.

### (3) 연령 등급

데이팅 앱은 **Apple 17+ / Google Play 성인용(만 18세 이상)** 으로 신고해야 한다. 낮게 신고하면 등급 위반으로 삭제될 수 있다.
심사 제출 시 "미성년자 차단 수단"(가입 시 생년월일 확인)을 설명할 수 있어야 한다.

### (참고) 이미 갖춰진 것 ✅
- 앱 내 회원 탈퇴 (`/mypage` → `DELETE /users/me`) — Apple 5.1.1(v) / Play 계정 삭제 요구사항 충족
- 개인정보처리방침(`/privacy`), 이용약관(`/terms`), 사업자 정보 표기
- 신고/차단, 채팅 모더레이션 — 데이팅 앱 심사에서 반드시 확인하는 항목

---

## 2. 사전 준비 — 빌드 환경

### Android (Windows/Mac/Linux 어디서나 가능)
| 도구 | 버전 |
|---|---|
| JDK | **17~21** (AGP 8.13 요구. 22 이상은 실패) |
| Node.js | 20 또는 22 LTS |
| Android SDK | Platform 36, Build-Tools 36 |
| Android Studio | (선택) GUI 로 빌드/디버깅 시 |

이 PC 에는 `~/.zami-toolchain/` 아래에 JDK 21 · Node 22 · Android SDK 를 설치해 두었다. 셸에서 쓰려면:

```bash
export JAVA_HOME="$HOME/.zami-toolchain/jdk21"
export ANDROID_HOME="$HOME/.zami-toolchain/android-sdk"
export PATH="$JAVA_HOME/bin:$HOME/.zami-toolchain/node/bin:$ANDROID_HOME/platform-tools:$PATH"
```
(`~/.bashrc` 에 넣어두면 편하다. 통째로 지우려면 `rm -rf ~/.zami-toolchain`)

### iOS (**macOS 필수**)
| 도구 | 비고 |
|---|---|
| macOS + Xcode 15 이상 | Apple 정책상 다른 OS 에서 iOS 빌드 불가 |
| Xcode Command Line Tools | `xcode-select --install` |
| Node.js | 20 또는 22 LTS |

> **현재 이 PC 는 Linux 이므로 iOS 빌드/제출은 불가능하다.** Mac 이 준비되면 §5 를 그대로 따라 하면 된다. 코드/설정은 이미 전부 맞춰 두었다.

---

## 3. 업로드 키스토어 생성 (Android, 최초 1회)

```bash
keytool -genkeypair -v \
  -keystore ~/zami-upload-key.jks \
  -alias zami-upload \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -dname "CN=ZAMI, O=멜로비, L=Seoul, C=KR"
```

생성 후 프로젝트에 연결:

```bash
cd frontend/android
cp keystore.properties.example keystore.properties
# keystore.properties 를 열어 storeFile 경로와 비밀번호를 채운다
```

> 🔐 **`.jks` 파일과 비밀번호는 절대 잃어버리면 안 되고, 절대 git 에 올리면 안 된다.**
> (`.gitignore` 로 막아 두었다.) 비밀번호 관리자 + 오프라인 백업 2벌을 권장한다.
> Play App Signing 을 쓰면 업로드 키를 분실해도 재발급 요청은 가능하지만, 며칠이 걸린다.

---

## 4. Android 출시 (Google Play / 갤럭시)

### 4-1. 빌드

```bash
cd frontend
./scripts/build-android-release.sh            # gradle.properties 버전 사용
./scripts/build-android-release.sh 2 1.0.1    # versionCode 2, versionName 1.0.1 로 빌드
```

스크립트가 하는 일: 환경 점검 → `npm ci` → `npx cap sync android` → `gradlew bundleRelease` → 서명 검증.
결과물: `android/app/build/outputs/bundle/release/app-release.aab`

> 실기기에서 먼저 확인하고 싶다면: `cd android && ./gradlew assembleDebug` 후
> `adb install app/build/outputs/apk/debug/app-debug.apk`

**빌드 파이프라인 검증 결과 (2026-08-06)** — 임시 키로 한 번 돌려서 아래를 확인했다.
`BUILD SUCCESSFUL` / `jar verified` / versionCode 1 · versionName 1.0.0 · targetSdk 36 · 세로 고정 ·
POST_NOTIFICATIONS 권한 · FCM 알림 아이콘 메타 · 새 ZAMI 아이콘·스플래시 모두 정상 포함(4.3MB).
검증용 산출물과 임시 키는 **실수로 업로드되지 않도록 삭제**했다.
→ 진짜 출시 AAB 는 §3 대로 본인 키스토어를 만든 뒤 스크립트를 다시 돌리면 된다.

> ⚠️ Play 는 **최초로 업로드한 AAB 의 서명 키를 그 앱의 업로드 키로 영구 고정**한다.
> 임시/테스트 키로 서명한 파일은 절대 업로드하지 말 것.

### 4-2. 버전 올리기 (매 릴리스)

`android/gradle.properties`:
```properties
zamiVersionCode=2      # 이전 릴리스보다 반드시 큰 정수. 한 번 쓴 값은 재사용 불가
zamiVersionName=1.0.1  # 사용자에게 보이는 버전
```

### 4-3. Play Console 등록 절차

**A. 앱 만들기** — 모든 앱 > 앱 만들기
- 앱 이름 `ZAMI`, 기본 언어 한국어, **앱**, **유료 또는 무료: 무료**

**B. 앱 설정(대시보드 체크리스트) — 전부 초록불이 되어야 제출 가능**

| 항목 | ZAMI 기준 입력값 |
|---|---|
| 앱 액세스 권한 | "일부 기능 제한" → **심사용 테스트 계정 ID/PW 제공** (로그인 없이는 아무것도 못 보므로 필수) |
| 광고 | 광고 없음 |
| 콘텐츠 등급 | 설문(IARC) 작성 → 데이팅/사용자 간 소통·사진 공유 있음 → **만 18세 이상** |
| 타겟층 및 콘텐츠 | 만 18세 이상만 선택 (아동 대상 아님) |
| 데이터 보안 | 수집 항목 신고: 이름, 생년월일/출생시간, 사진, 채팅 메시지, 기기 ID(FCM 토큰), 결제 기록. 전송 중 암호화 ✓, 삭제 요청 가능 ✓ |
| 정부 앱 / 금융 / 건강 | 모두 아니오 |
| 개인정보처리방침 | `https://thezami.io/privacy` |
| **계정 삭제** | 앱 내 삭제 있음 + 웹 삭제 요청 경로 제공 (`https://thezami.io/mypage`) |
| 데이팅 앱 선언 | 카테고리 "데이팅" 선택 시 추가 설문 발생 — 성인 인증·신고 기능 설명 |

**C. 스토어 등록정보** (기본 스토어 등록정보)

| 항목 | 규격 | 준비물 |
|---|---|---|
| 앱 이름 | 30자 | ZAMI - 사주·자미두수 소개팅 |
| 간단한 설명 | 80자 | 사주와 자미두수로 찾는 나와 맞는 인연 |
| 자세한 설명 | 4000자 | 기능 소개 (매칭·궁합·채팅·사주 풀이) |
| 앱 아이콘 | 512×512 PNG | ✅ `store-assets/play-icon-512.png` |
| 그래픽 이미지 | 1024×500 | ✅ `store-assets/play-feature-graphic-1024x500.png` |
| 휴대전화 스크린샷 | 2~8장, 최소 1080px | ⛔ **직접 캡처 필요** (홈·매칭·채팅·사주·궁합 5장 권장) |

**D. 출시 트랙 순서** (권장)
```
내부 테스트(최대 100명, 즉시 반영) → 비공개 테스트 → 프로덕션
```
1. 테스트 > **내부 테스트** > 새 버전 만들기
2. `app-release.aab` 업로드 → 출시명/노트 작성 → 저장 → 버전 검토 → **내부 테스트로 출시**
3. 테스터 목록(이메일)을 만들고 **옵트인 링크**를 테스터에게 전달
4. 문제없으면 **프로덕션**으로 승격 (프로덕션 최초 심사는 보통 1~7일)

> ⚠️ **개인 개발자 계정**으로 만든 경우, 프로덕션 출시 전 **테스터 20명 이상이 12일 연속 비공개 테스트**에 참여해야 한다. 사업자(조직) 계정은 면제. 계정 유형을 먼저 확인할 것.

**E. Play App Signing**
최초 업로드 시 자동 적용된다. 우리가 만든 `.jks` 는 "업로드 키"이고, 실제 배포 서명은 Google 이 관리한다.

### 4-4. ⚠️ 테스터에게 나눠주는 방법 — `.aab` 를 폰으로 보내면 안 열린다

**`.aab` 는 설치 파일이 아니다.** Google Play 만 읽는 "배포용 원본"이고, 안드로이드 폰은 APK 만 설치한다.
`.aab` 를 카톡/드라이브로 보내면 받는 사람 폰에서 "열 수 없음" 이 뜬다.

| 목적 | 방법 | 특징 |
|---|---|---|
| 내 폰에서 바로 확인 | `./scripts/build-android-release.sh --apk` → `adb install -r <apk>` | 가장 빠름 |
| 지인 3~5명에게 파일 전달 | 위 `--apk` 산출물을 카톡/드라이브로 전달 | 받는 사람이 '출처를 알 수 없는 앱' 허용 필요. **갤럭시 자동 차단(Auto Blocker) 켜져 있으면 설치 불가** |
| 팀·베타 테스터 다수 | **Firebase App Distribution** 에 APK 업로드 | 이메일 초대 → 링크로 설치. 심사 없음, 무료. 경고 없이 설치됨 |
| 출시 직전 리허설 | **Play Console 내부 테스트** 에 `.aab` 업로드 | 테스터가 Play 스토어에서 정상 설치. 실제 배포와 동일한 경로 |

> APK 와 AAB 는 **같은 키로 서명**해야 한다. 다른 키로 서명한 APK 를 이미 깔아둔 폰은
> Play 버전으로 업데이트할 때 "앱이 설치되지 않았습니다" 가 뜨므로, 기존 앱을 지우고 다시 설치해야 한다.

### 4-5. 갤럭시 스토어(삼성)에 추가 배포 — 선택

Play 와 별개 심사이며, **같은 `.aab` 를 그대로 쓴다** (Seller Portal 에서 앱 등록 > 바이너리 업로드).
차이점: 삼성은 자체 서명을 하지 않으므로 우리 키로 서명된 산출물이 그대로 배포된다 → Play 버전과 서명이 달라 **동시 설치가 불가**하니 유의. 국내 도달률을 크게 올리려는 게 아니면 Play 부터 안정화한 뒤 하는 것을 권한다.

---

## 5. iOS 출시 (App Store) — macOS 필요

### 5-1. Xcode 최초 설정 (Mac 에서 1회)

```bash
cd frontend
npm ci
npx cap sync ios
npx cap open ios        # Xcode 실행
```
Xcode 에서:
1. **App 타겟 > Signing & Capabilities**
   - Team 선택 (자동 서명 ON) → `com.zami.app` 프로비저닝이 자동 생성된다
   - `+ Capability` → **Push Notifications** 추가 (`App.entitlements` 는 이미 만들어 두었다)
2. Apple Developer 사이트 > Certificates, Identifiers & Profiles
   - Identifier `com.zami.app` 에 **Push Notifications** 활성화
   - Keys > **APNs Auth Key(.p8)** 생성 → 백엔드/Firebase 에 등록 (§6)

### 5-2. 빌드

```bash
export ZAMI_TEAM_ID=ABCDE12345          # Apple Developer > Membership 의 Team ID
./scripts/build-ios-release.sh          # 빌드 번호 = 현재 시각
ZAMI_UPLOAD=1 ./scripts/build-ios-release.sh   # 빌드 + TestFlight 업로드
```

스크립트: `npm ci` → `cap sync ios` → 빌드 번호 설정 → `xcodebuild archive` → `exportArchive` → (선택) 업로드.
결과물: `build/ios/ipa/App.ipa`

업로드는 **Transporter 앱**(Mac App Store, 무료)에 `.ipa` 를 드래그하는 방법이 가장 간단하다.

> 버전 규칙: `MARKETING_VERSION`(1.0.0) = 사용자에게 보이는 버전, `CURRENT_PROJECT_VERSION` = 빌드 번호.
> **같은 빌드 번호는 재업로드가 거부**되므로 스크립트가 매번 타임스탬프로 올린다.

### 5-3. App Store Connect 절차

**A. 앱 등록** — 나의 앱 > + > 신규 앱
- 플랫폼 iOS / 이름 ZAMI / 기본 언어 한국어 / 번들 ID `com.zami.app` / SKU `zami-ios-001`

**B. 빌드 업로드 후 처리 대기** (5~30분) → TestFlight 탭에 나타남

**C. TestFlight 내부 테스트**
- 내부 테스터(팀원, 최대 100명)는 심사 없이 즉시 배포 가능
- 외부 테스터(최대 10,000명)는 간단한 베타 심사(보통 1일) 필요

**D. 앱 정보 입력 — 심사 제출 전 필수**

| 항목 | ZAMI 기준 |
|---|---|
| 스크린샷 | **6.9"(1320×2868 또는 1290×2796) 필수**, 6.5"/5.5" 권장. 각 3~10장 ⛔ 직접 캡처 |
| 아이콘 | 1024×1024 ✅ `store-assets/appstore-icon-1024.png` (App Store Connect 는 빌드에 포함된 아이콘을 자동 사용) |
| 프로모션 텍스트 / 설명 / 키워드 | 한국어 |
| 지원 URL / 마케팅 URL | `https://thezami.io` |
| 개인정보처리방침 URL | `https://thezami.io/privacy` |
| 연령 등급 | 설문 → **17+** (데이팅, 무제한 웹 접근) |
| 앱 개인정보 보호(Nutrition Label) | 수집 항목: 연락처 정보, 사용자 콘텐츠(사진·메시지), 식별자, 민감정보(생년월일·출생시간) — "사용자에 연결됨" |
| 수출 규정 | `ITSAppUsesNonExemptEncryption=false` 를 Info.plist 에 넣어 두어 자동 처리됨 ✅ |
| **심사 메모(App Review Information)** | **테스트 계정 ID/PW 필수** + "카카오 로그인은 WebView 안에서 진행됨", "매칭은 KST 자정마다 갱신되므로 심사 시 슬롯 상태 설명" 등을 적어 둘 것 |

**E. 심사 제출** → 보통 24~48시간. 반려 시 Resolution Center 로 사유가 온다.

> 데이팅 앱 심사에서 Apple 이 항상 확인하는 것: ① 신고/차단 기능 ② 부적절 콘텐츠 필터링 ③ 미성년자 차단 ④ 이용약관(EULA) 노출.
> ①~④ 모두 구현되어 있으므로, 심사 메모에 **어느 화면에서 확인할 수 있는지 위치를 명시**해 주면 통과율이 오른다.

---

## 6. 푸시 알림 마무리 — 아직 미완성 ⚠️

JS 쪽(`src/lib/push.ts`, 권한 요청·토큰 등록·알림 탭 라우팅)은 완성돼 있지만 **네이티브 자격증명이 비어 있다.**

### Android (FCM)
1. Firebase 콘솔 > 프로젝트 > Android 앱 추가 > 패키지명 `com.zami.app`
2. **`google-services.json` 다운로드 → `frontend/android/app/google-services.json` 에 저장**
   (이 파일이 없으면 빌드는 되지만 푸시가 전혀 동작하지 않는다. 빌드 스크립트가 경고를 띄운다.)
3. 백엔드에 FCM 서버 키(서비스 계정 JSON) 등록

### iOS (APNs)
1. APNs Auth Key(.p8) 를 Firebase 프로젝트 설정 > 클라우드 메시징에 업로드하거나, 백엔드에서 APNs 로 직접 발송
2. ⚠️ `@capacitor/push-notifications` 는 iOS 에서 **APNs 디바이스 토큰**을 돌려준다 (FCM 등록 토큰이 아니다).
   백엔드가 FCM 으로만 발송한다면 iOS 토큰을 그대로 넣으면 실패한다.
   → 백엔드에서 `platform` 값(`"ios"`/`"android"`)으로 발송 경로를 분기하거나, iOS 도 FCM 토큰을 쓰려면 `@capacitor-firebase/messaging` 으로 교체해야 한다.
   (프론트는 이미 `platform` 을 플랫폼별로 보내도록 수정해 두었다.)

---

## 7. 릴리스 체크리스트

매 릴리스마다:

- [ ] 웹(`main` → Vercel) 배포가 정상인지 확인 — **앱은 배포된 웹을 그대로 로드한다**
- [ ] `android/gradle.properties` 의 `zamiVersionCode` +1, `zamiVersionName` 갱신
- [ ] iOS 는 스크립트가 빌드 번호 자동 증가 / 필요시 `MARKETING_VERSION` 을 Android 와 동일하게
- [ ] 실기기에서 스모크 테스트: 로그인 → 온보딩 → 홈 → 채팅 → 결제(있다면) → 푸시 수신
- [ ] 백엔드 하위 호환 확인 (구버전 앱도 계속 동작해야 한다 — 앱은 강제 업데이트 장치가 없다)
- [ ] `./scripts/build-android-release.sh` 로 AAB 생성 → 내부 테스트 업로드
- [ ] (Mac) `./scripts/build-ios-release.sh` 로 IPA 생성 → TestFlight 업로드
- [ ] 출시 노트 작성 (한국어)

---

## 8. 문제 해결

| 증상 | 원인/해결 |
|---|---|
| `릴리스 서명 키가 없습니다` | `android/keystore.properties` 미작성 → §3 |
| `Unsupported class file major version` / Gradle 실패 | JDK 22+ 사용 중. `JAVA_HOME` 을 JDK 21 로 |
| `SDK location not found` | `ANDROID_HOME` 미설정 또는 `android/local.properties` 없음 |
| 앱이 흰 화면 / "인터넷 연결을 확인해주세요" | `thezami.io` 배포 실패 또는 네트워크 차단. `capacitor.config.ts` 의 `allowNavigation` 확인 |
| 카카오 로그인 후 앱으로 안 돌아옴 | `allowNavigation` 에 해당 도메인 누락 |
| 푸시가 안 옴 (Android) | `google-services.json` 누락 → §6 |
| 푸시가 안 옴 (iOS) | Push Notifications capability 미추가 또는 APNs 키 미등록 → §5-1, §6 |
| Play 업로드 시 "버전 코드가 이미 사용됨" | `zamiVersionCode` 를 올리지 않음 |
