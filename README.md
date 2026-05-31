# ZAMI 프론트엔드

> 사주 + 자미두수 기반 한국 데이팅 모바일 웹앱

[![Next.js](https://img.shields.io/badge/Next.js-16.2.4-black)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19.2.4-blue)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)](https://typescriptlang.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-4-38BDF8)](https://tailwindcss.com)

---

## 프로젝트 개요

| 항목 | 내용 |
|---|---|
| **서비스명** | ZAMI (자미) |
| **타깃** | 한국 모바일 사용자 (iPhone 402×874 기준) |
| **핵심 가치** | 사주 + 자미두수 기반 정밀 매칭 |
| **언어** | 한국어 전용 |
| **배포 도메인** | [thezami.io](https://thezami.io) (Vercel) |
| **백엔드 URL** | api.thezami.io (별도 저장소) |

---

## 기술 스택

### 핵심 프레임워크
- **Next.js 16.2.4** — App Router, RSC, Server Actions
- **React 19.2.4**
- **TypeScript 5**

### 스타일 / UI
- **Tailwind CSS 4** + `tw-animate-css`
- **shadcn** 컴포넌트 라이브러리
- **@base-ui/react** — 헤드리스 UI 프리미티브
- **lucide-react** — 아이콘
- `class-variance-authority`, `clsx`, `tailwind-merge`

---

## 폴더 구조

### `src/app` — 라우트

| 경로 | 설명 |
|---|---|
| `/auth` | 카카오 OAuth 콜백 처리 |
| `/onboarding/{name,birth-date,birth-time,done}` | 가입 후 필수 정보 입력 (4단계) |
| `/home` | 홈 (4-슬롯 매칭 카드 + 행동 가이드) |
| `/matching` | 매칭 리스트 + 채팅 탭 |
| `/matching/[id]` | 채팅 룸 |
| `/profile/[id]` | 상대 공개 프로필 |
| `/destiny/[id]` | 운명의 실타래 (페어 사주 풀이) |
| `/date-spots/[id]` | 데이트 장소 추천 (프리미엄) |
| `/saju` | 내 사주 풀이 |
| `/saju/detail` | 사주 심층 풀이 |
| `/jamidusu` | 자미두수 (프리미엄) |
| `/mypage` | 마이페이지 (프로필 편집, 탈퇴) |
| `/premium` | 프리미엄 페이월 |

### `src/components`

#### brand
- `zami-logo.tsx` — ZAMI 워드마크 (Figma node 14:1910 기준)

#### common
- `scrollable-date-input.tsx` — 년/월/일 키보드 + 달력 픽커
- `typing-time-input.tsx` — 시간 키보드 + 다이얼 입력기

#### layout
- `app-shell.tsx` — 상단 + 하단 nav 공통 (빨간 점 알림)

#### matching
- `match-card.tsx` — 매칭 카드 (사진/이름/나이/한줄평)
- `match-info-modal.tsx` — 매칭 정보 확인 모달
- `daily-match-slot-card.tsx` — 4-슬롯 카드 (잠금/카운트다운)
- `chat-thread-row.tsx` — 채팅 row (스와이프 나가기 + unread 배지)
- `attachment-menu.tsx` — 채팅 첨부 메뉴 (사진/카메라/음성)
- `compatibility-report-drawer.tsx` — 채팅 헤더 운명 분석
- `report-modal.tsx` — 신고 모달

#### mypage
- `photo-upload-modal.tsx` — 다중 사진 갤러리 모달
- `bio-edit-modal.tsx` — 한 줄 자기소개 수정
- `basic-info-edit-modal.tsx` — 기본 정보 (키, MBTI, 직업 등)
- `required-info-edit-modal.tsx` — 필수 정보 (이름, 생년월일, 출생지)

#### onboarding / payment / saju / screens / ui
- `onboarding-shell.tsx` — 단계 표시 + 공통 레이아웃
- `payment-modal.tsx` — 결제 모달 (Toss 연결 예정)
- `element-pentagon.tsx` — 오행 5각형 차트
- `saju-myeongsik.tsx` — 명식 표 그리드
- `saju-glossary.tsx` — 사주 용어 풀이
- `screens/` — Figma 시안 raw 컴포넌트
- `ui/` — shadcn 베이스 컴포넌트

### `src/lib` — 유틸 / API

| 파일 | 역할 |
|---|---|
| `api.ts` | apiFetch 래퍼 (JWT 자동 첨부, FastAPI `detail` 추출) |
| `auth.ts` | JWT 토큰 관리 (로그아웃 시 캐시도 정리) |
| `cache.ts` | stale-while-revalidate localStorage 캐시 |
| `chat.ts` | 채팅 API (송수신, mark-read, leaveThread) |
| `config.ts` | `API_URL` 환경변수 |
| `birth-place.ts` | 한국 17개 시도 + 해외/기타 |
| `match-keywords.ts` | 매칭 카드 키워드/한줄평 다양화 알고리즘 |
| `onboarding-context.tsx` | 온보딩 단계간 상태 공유 (React Context) |
| `profile-completion.ts` | 프로필 완성도 계산 |
| `saju.ts` | 사주 디스플레이 헬퍼 (천간/지지 한자, 오행 색상) |

---

## 주요 기능

### 1. 인증
- 카카오 OAuth 로그인 (`/auth/kakao` 리다이렉트)
- JWT 토큰 localStorage 저장
- 탈퇴 시 자동 로그아웃 + 캐시 무효화

### 2. 온보딩 (4단계)
```
이름 → 생년월일 → 출생시간 → 완료
```
- `OnboardingProvider` 컨텍스트로 단계간 상태 공유
- 완료 시 모든 정보 한번에 백엔드 PATCH

### 3. 매칭

#### 4-슬롯 매칭 카드 (홈, 2×2 그리드)

| 슬롯 | 기반 | 결제 | 잠금 시간 |
|---|---|---|---|
| **Slot 0** | 사주 | 무료 | 즉시 |
| **Slot 1** | 자미두수 | 유료 | 즉시 (결제 시 사진 공개) |
| **Slot 2** | 사주 | 무료 | 72시간 후 |
| **Slot 3** | 자미두수 | 유료 | 72시간 후 + 결제 필요 |

> **KST 자정 00:00 기준 사이클** — 모든 사용자가 같은 시각 카운트다운

- **매칭 리스트 페이지**: 누적 히스토리 (그동안 매칭됐던 모든 후보)
- **상세 페이지** (`/profile/[id]`): 사진/나이/MBTI/한줄소개 + 궁합 점수

### 4. 채팅
- 1:1 채팅, 2.5초 폴링
- **메시지 타입**: 텍스트 / 이미지 / 카메라 / 음성 (`MediaRecorder` API)
- 안 읽은 메시지 배지 (각 row + 하단 nav 매칭 아이콘)
- 좌측 스와이프로 나가기 버튼 (KakaoTalk 스타일)
- **소프트 leave**: 본인 view에서만 사라지고 상대는 history 유지
- 재전송 시 자동으로 thread 부활

### 5. 사주
- **명식 표** (4 컬럼 × 7 행): 천간/십성/지지/십성/지장간/12운성/12신살
- **오행 5각형 차트**
- **LLM 4섹션 풀이**: 성격 / 연애 / 재물 / 조언
- **자미두수** (프리미엄): 12궁 + 14주성 LLM 풀이

### 6. 페어 풀이 (프리미엄)
- **운명의 실타래** (`/destiny/[id]`)
  - 첫인상 / 성격 궁합 / 연애 스타일 / 주의 포인트 / 장기 전망
- **데이트 장소 추천** (`/date-spots/[id]`)
  - 4~5개 장소 LLM 추천

### 7. 다중 사진 갤러리
- 프로필 사진 **최대 6장** 등록
- 메인 사진 선택 (별 아이콘)
- 개별 삭제 + Cloudinary 자동 정리

### 8. 입력 위젯
- **날짜**: 년/월/일 박스 키보드 입력 + 달력 아이콘으로 native picker
- **시간**: HH:MM 자동 포맷 + 시계 아이콘으로 다이얼 picker
- 각 박스 부분 삭제 시 다른 칸 보존 (mid-typing 보호)

---

## 캐시 전략

`src/lib/cache.ts` — **stale-while-revalidate 패턴**

```
[캐시 우선 표시] → [백그라운드 리프레시] → [새 데이터로 교체]
                                       └─ 실패 시 stale-but-valid 유지
```

### 캐시 대상 + TTL

| 엔드포인트 | TTL | 비고 |
|---|---|---|
| `/saju/me` | 24h | |
| `/saju/me/detailed` | 24h | LLM 호출, 비싸므로 길게 |
| `/saju/me/jamidusu` | 24h | LLM 호출 |
| `/compatibility/today` | 1h | |
| `/compatibility/destiny/{id}` | 24h | LLM 호출 |
| `/compatibility/date-recommendation/{id}` | 24h | LLM 호출 |

### 무효화 트리거
- - 로그아웃 (`auth.ts`)
- - 프로필 수정 (사진/필수정보/기본정보)
- - 탈퇴

> 토큰별로 네임스페이스 → 다른 사용자 데이터 leak 방지

---

## 모더레이션 / 안전

| 위반 종류 | 차단 방식 | UI |
|---|---|---|
| 채팅 부적절 메시지 | 백엔드 3-레이어 검증 | 한국어 사유 토스트 |
| 사진 업로드 실패 | AWS Rekognition 검증 | 거절 사유 (얼굴 없음/다중 인물/NSFW 등) |
| 누적 위반 | 24h 내 3회 → 24h 채팅 정지 | 403 + 잔여 시간 안내 |

---

## 환경변수

```bash
# Vercel 환경변수
NEXT_PUBLIC_API_URL=https://api.thezami.io  # 프로덕션
# NEXT_PUBLIC_API_URL=http://localhost:8000  # 로컬
```

---

## 빌드 / 배포

| 항목 | 값 |
|---|---|
| **GitHub** | `dowon-gyeolui/frontend` (main 브랜치) |
| **CI/CD** | Vercel 자동 배포 (main 푸시 시 트리거) |
| **도메인** | thezami.io, www.thezami.io (가비아 DNS) |

### 로컬 개발

```bash
cd frontend
npm install
npm run dev    # http://localhost:3000
```
