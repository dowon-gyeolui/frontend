ZAMI 프론트엔드 개요


1. 프로젝트

ZAMI(자미)는 사주와 자미두수 기반 매칭을 핵심으로 하는 한국 데이팅 모바일 웹앱이다.
모바일 전용 (iPhone 기준 402x874 사이즈), 한국어 UI.
배포 도메인은 thezami.io (Vercel).
백엔드는 별도 저장소이며 api.thezami.io로 통신한다.


2. 기술 스택

Next.js 16.2.4 (App Router, RSC, Server Actions)
React 19.2.4
TypeScript 5
Tailwind CSS 4
shadcn 컴포넌트
@base-ui/react
lucide-react 아이콘
class-variance-authority, clsx, tailwind-merge
tw-animate-css


3. 폴더 구조

src/app
    auth                    카카오 OAuth 콜백 처리
    onboarding              가입 후 필수 정보 입력 (name, birth-date, birth-time, done)
    home                    홈 화면 (4-슬롯 매칭 카드 + 행동 가이드)
    matching                매칭 리스트 + 채팅 탭
    matching/[id]           채팅 룸
    profile/[id]            상대 공개 프로필 상세
    destiny/[id]            페어 사주 심층 풀이 (운명의 실타래)
    date-spots/[id]         데이트 장소 추천 (프리미엄)
    saju                    내 사주 풀이
    saju/detail             사주 심층 풀이
    jamidusu                자미두수 (프리미엄)
    mypage                  마이페이지 (프로필 편집, 탈퇴)
    premium                 프리미엄 페이월
    layout.tsx              루트 레이아웃 (OnboardingProvider 등)
    page.tsx                랜딩/로그인

src/components
    brand
        zami-logo.tsx                       ZAMI 워드마크 (Figma node 14:1910 기준)
    common
        scrollable-date-input.tsx           년/월/일 키보드 + 달력 픽커 입력기
        typing-time-input.tsx               시간 키보드 + 다이얼 입력기
    layout
        app-shell.tsx                       상단 + 하단 nav 공통 레이아웃 (빨간 점 알림)
    matching
        match-card.tsx                      매칭 카드 (사진/이름/나이/한줄평)
        match-info-modal.tsx                매칭 정보 확인 모달
        daily-match-slot-card.tsx           4-슬롯 카드 (사주/자미두수, 잠금/카운트다운)
        chat-thread-row.tsx                 채팅 리스트 row (스와이프 나가기 + unread 배지)
        attachment-menu.tsx                 채팅 + 버튼 메뉴 (사진/카메라/음성)
        compatibility-report-drawer.tsx     채팅 헤더의 운명 분석 드로어
        report-modal.tsx                    신고 모달
    mypage
        photo-upload-modal.tsx              다중 사진 갤러리 모달
        bio-edit-modal.tsx                  한 줄 자기소개 수정
        basic-info-edit-modal.tsx           기본 정보 수정 (키, MBTI, 직업 등)
        required-info-edit-modal.tsx        필수 정보 수정 (이름, 생년월일, 출생지)
    onboarding
        onboarding-shell.tsx                온보딩 단계 표시 + 공통 레이아웃
    payment
        payment-modal.tsx                   결제 모달 (현재 데모, Toss 연결 예정)
    saju
        element-pentagon.tsx                오행 5각형 차트
        saju-myeongsik.tsx                  명식 표 (생시/생일/생월/생년 그리드)
        saju-glossary.tsx                   사주 용어 풀이
    screens                                 (Figma 시안 raw 컴포넌트들)
    ui                                      shadcn 베이스 컴포넌트들

src/lib
    api.ts                  apiFetch 래퍼 (JWT 자동 첨부, FastAPI detail 추출)
    auth.ts                 JWT 토큰 저장/조회/삭제 (로그아웃 시 캐시도 정리)
    cache.ts                stale-while-revalidate localStorage 캐시
    chat.ts                 채팅 API (메시지 송수신, mark-read, leaveThread)
    config.ts               API_URL 환경변수
    birth-place.ts          한국 17개 시도 + 해외/기타 출생지 목록
    match-keywords.ts       매칭 카드 키워드 + 한줄평 다양화 알고리즘
    onboarding-context.tsx  온보딩 단계간 상태 공유 (React context)
    profile-completion.ts   프로필 완성도 계산 (홈/마이페이지 공통)
    saju.ts                 사주 디스플레이 헬퍼 (천간/지지 한자, 오행 색상 등)


4. 주요 기능

가) 인증
    카카오 OAuth 로그인 (백엔드의 /auth/kakao 리다이렉트)
    JWT 토큰 localStorage 저장
    탈퇴 시 자동 로그아웃 + 캐시 무효화

나) 온보딩
    4단계: 이름 -> 생년월일 -> 출생시간 -> 완료
    OnboardingProvider 컨텍스트로 단계간 상태 공유
    완료 시 모든 정보 한번에 백엔드에 PATCH

다) 매칭
    홈에 4장의 매칭 카드 (2x2 그리드)
        slot 0: 사주 무료, 즉시 unlock
        slot 1: 자미두수 유료, 즉시 보이지만 결제 필요
        slot 2: 사주 무료, 72시간 후 unlock
        slot 3: 자미두수 유료, 72시간 후 unlock + 결제 필요
    KST 정오 12:00 기준 사이클 (모든 사용자가 같은 카운트다운)
    매칭 리스트 페이지: 누적 히스토리 (그동안 매칭됐던 모든 후보)
    상세 정보 페이지 (/profile/[id]): 사진/나이/MBTI/한줄소개 + 궁합 점수

라) 채팅
    1:1 채팅, 2.5초 폴링 방식
    텍스트 + 이미지 + 카메라 + 음성 메시지 (MediaRecorder API)
    안 읽은 메시지 unread 배지 (각 row + 하단 nav 매칭 아이콘 빨간 점)
    좌측 스와이프로 나가기 버튼 노출 (KakaoTalk 스타일)
    소프트 leave: 본인 view 에서만 사라지고 상대는 history 유지
    재전송 시 자동으로 thread 부활

마) 사주
    명식 표 (4 컬럼 x 7 행: 천간/십성/지지/십성/지장간/12운성/12신살)
    오행 5각형 차트
    LLM 기반 4섹션 풀이 (성격/연애/재물/조언)
    자미두수 (프리미엄): 12궁 + 14주성 LLM 풀이

바) 페어 풀이 (프리미엄)
    운명의 실타래 (/destiny/[id]): 5섹션 LLM 풀이
        첫인상, 성격 궁합, 연애 스타일, 주의 포인트, 장기 전망
    데이트 장소 추천 (/date-spots/[id]): 4-5개 장소 LLM 추천

사) 다중 사진 갤러리
    프로필 사진 최대 6장 등록
    메인 사진 선택 (별 표시)
    개별 삭제 + Cloudinary 자동 정리

아) 입력 위젯
    날짜: 년/월/일 박스 직접 키보드 입력 + 달력 아이콘으로 native picker 호출
    시간: HH:MM 키보드 자동 포맷 + 시계 아이콘으로 다이얼 picker 호출
    각 박스 부분 삭제 시 다른 칸 보존 (mid-typing 보호)


5. 캐시 전략

src/lib/cache.ts 에서 stale-while-revalidate 패턴 구현
    토큰별로 네임스페이스 (다른 사용자 데이터 leak 방지)
    캐시 우선 표시 -> 백그라운드 리프레시 -> 새 데이터로 교체
    실패 시 stale-but-valid 유지

대상 엔드포인트와 TTL:
    /saju/me                            24시간
    /saju/me/detailed                   24시간 (LLM 호출, 비싸므로 길게)
    /saju/me/jamidusu                   24시간
    /compatibility/today                1시간
    /compatibility/destiny/{id}         24시간
    /compatibility/date-recommendation/{id}  24시간

무효화 트리거:
    로그아웃 (auth.ts)
    프로필 수정 (사진/필수정보/기본정보)
    탈퇴


6. 모더레이션 / 안전

채팅 메시지 송신 실패 시 백엔드의 한국어 사유를 그대로 사용자에게 표시
사진 업로드 실패 시 한국어 거절 사유 표시 (얼굴 없음, 다중 인물, NSFW 등)
24시간 누적 3회 위반 시 채팅 24시간 정지 (백엔드 enforced, 프론트는 403 에러 메시지 표시)


7. 환경변수

NEXT_PUBLIC_API_URL    백엔드 API 베이스 URL (Vercel env 에 설정)
                       프로덕션: https://api.thezami.io
                       로컬:    http://localhost:8000


8. 빌드 / 배포

GitHub: dowon-gyeolui/frontend (main 브랜치)
Vercel: 자동 배포 (main 푸시 시 트리거)
도메인: thezami.io, www.thezami.io (가비아 DNS)
