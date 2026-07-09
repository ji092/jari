# 💾 자리네컷 (ZARINAECUT) - Project Status & Architecture Log

앉은 자리에서 찍는 레트로 윈도우98 / Y2K 컨셉의 인생네컷 포토부스 웹 서비스 **자리네컷**의 전체 아키텍처, 기능 정의, 그리고 작업 및 수정사항을 기록하는 로그 문서입니다.

---

## 🏗️ 전체 아키텍처 & 시스템 구조

### 1. 서비스 컨셉 & 흐름
자리네컷은 **비로그인**, **사진 서버 미저장**, **방명록 서버 저장**을 핵심 원칙으로 하는 웹 애플리케이션입니다.

```mermaid
graph TD
    A[바탕화면 Desktop UI] --> B[방명록 작성 GuestbookWrite]
    B -->|방명록 작성 API 완료| C[프레임 선택 FrameSelect]
    C -->|배열 및 프레임 선택 완료| D[카메라 촬영 Camera]
    D -->|8장 촬영 완료| E[사진 4장 선택 PhotoSelect]
    E -->|4장 선택 완료| F[필터 및 완성 Result]
    F -->|Canvas API 합성| G[PNG 다운로드 Client Device]
    
    H[BGM 플레이어] -->|전역 fixed 고정| A & B & C & D & E & F
```

### 2. 기술 스택 (Tech Stack)
*   **Frontend**: Next.js 16 (App Router, Turbopack), TypeScript, Tailwind CSS
*   **State Management**: Zustand (화면 흐름 및 BGM 전역 상태 제어)
*   **APIs**: Next.js API Routes (`/api/guestbook`)
*   **Database**: TiDB Cloud (MySQL 호환, `mysql2` 드라이버) - 방명록 텍스트 데이터만 저장 (사진 저장 안 함) ※ 초기 설계는 PostgreSQL(Supabase)였으나 2026-06-16 TiDB로 교체
*   **Web APIs**:
    *   `MediaDevices.getUserMedia()`: 카메라 웹캠 연동
    *   `HTML5 Canvas API`: 클라이언트 사이드 이미지 합성 및 필터
    *   `Web Audio API`: 찰칵 셔터 사운드 생성
    *   `HTML5 Audio`: 전역 BGM 재생

### 3. 디렉토리 구조 (Folder Structure)
```text
jari/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # 루트 레이아웃 (BGM 및 전역 컨텍스트)
│   │   ├── page.tsx                # 바탕화면 진입점 (단일 페이지 내 창 레이어링)
│   │   ├── globals.css             # 전역 스타일 (윈도우98 커스텀 클래스 포함)
│   │   └── api/
│   │       └── guestbook/
│   │           └── route.ts        # GET/POST 방명록 API (TiDB 연동)
│   ├── components/
│   │   ├── desktop/
│   │   │   ├── Desktop.tsx         # 바탕화면 컨테이너 (청록색 배경)
│   │   │   ├── DesktopIcon.tsx     # 더블클릭 실행 가능한 바탕화면 아이콘
│   │   │   ├── Taskbar.tsx         # 하단 태스크바 (시작 버튼, 시계, 창 탭)
│   │   │   └── StartMenu.tsx       # 시작 메뉴 팝업
│   │   ├── windows/
│   │   │   ├── Win98Window.tsx     # 윈도우98 스타일 공통 창 래퍼 (드래그 가능)
│   │   │   ├── GuestbookList.tsx   # 방명록 목록 창
│   │   │   ├── GuestbookWrite.tsx  # 방명록 작성 창
│   │   │   ├── FrameSelect.tsx     # 프레임 선택 창
│   │   │   ├── Camera.tsx          # 촬영 창 (카메라 뷰 + 카운트다운)
│   │   │   ├── PhotoSelect.tsx     # 사진 4장 선택 창
│   │   │   └── Result.tsx          # 필터 선택 + 완성본 미리보기 + 저장
│   │   ├── bgm/
│   │   │   └── BgmPlayer.tsx       # 우측 하단 고정 BGM 플레이어
│   │   └── ui/
│   │       └── Win98Button.tsx     # 레트로 윈도우 버튼
│   ├── constants/
│   │   └── frames.ts               # 프레임 목록 및 슬롯 좌표 설정
│   ├── hooks/
│   │   └── useCamera.ts            # 카메라 스트림 및 촬영 제어 훅 (BGM은 bgmStore에서 직접 관리)
│   ├── lib/
│   │   └── db.ts                   # TiDB(mysql2) 커넥션 풀 싱글턴
│   ├── store/
│   │   ├── bgmStore.ts             # BGM 상태 관리 (재생, 트랙, 진행률 등)
│   │   └── flowStore.ts            # 화면 단계 및 창 오픈 상태 관리
│   ├── types/
│   │   └── index.ts                # 공통 타입 정의
│   └── utils/
│       └── canvasCompose.ts        # Canvas 이미지 합성 엔진 (필터 로직 포함)
└── public/
    ├── bgm/                        # 6곡의 레트로 BGM mp3 파일
    └── frames/                     # 프레임별 PNG (frame_2x2.png / frame_1x4.png, 6종)
```

---

## 🛠️ 핵심 기능 명세

### 1. 바탕화면 & 테스크바 (Desktop & Taskbar)
*   **Retro UI**: 청록색 `#008080` 배경, 윈도우98 스타일 아이콘.
*   **아이콘**: 더블클릭 시 해당 프로그램 창 오픈.
    *   `자리네컷` ➡️ 방명록 작성창 (`write`)
    *   `방명록` ➡️ 방명록 목록창 (`guestbook`)
    *   `내 사진첩` ➡️ 경고 팝업 ("여기에는 저장되지 않아요!")
    *   `내 PC` ➡️ 로컬 저장소 안내 창
    *   `휴지통` ➡️ 빈 휴지통 창
*   **Taskbar & StartMenu**: 활성화된 창 탭 표시, 디지털 시계 실시간 연동, 시작 메뉴 팝업 작동.
*   **BGM 플레이어**: 우측 하단 고정, 트랙 재생/일시정지/이전/다음 기능, 접기/펼치기 및 마퀴 애니메이션 지원.

### 2. 방명록 시스템 (Guestbook)
*   **작성 (GuestbookWrite)**: 닉네임은 '익명의 포토쟁이' 고정. 응원 메시지(최대 200자) 입력 후 완료 시 API 호출. 성공하면 프레임 선택 단계로 자동 이동.
*   **목록 (GuestbookList)**: 메모장(`방명록.txt`) 컨셉 UI. 최신 방명록 데이터 무한 스크롤 또는 페이징 열람. 상단 티커 마퀴 작동.

### 3. 촬영 및 합성 Flow (Photo Booth Flow)
1.  **프레임 선택 (FrameSelect)**: 2x2 또는 1x4 레이아웃 중 선택 후 프레임 스킨 디자인 선택.
2.  **카메라 촬영 (Camera)**: `getUserMedia` 웹캠 스트림 실행. 촬영 클릭 시 3! 2! 1! 카운트다운 진행 후 찰칵 사운드(Web Audio API)와 함께 플래시 효과. 총 8장 순차 촬영 및 임시 dataURL 저장.
3.  **사진 선택 (PhotoSelect)**: 촬영된 8장 중 마음에 드는 4장을 배치 순서대로 선택 (선택 번호 1~4 뱃지 표시).
4.  **필터 및 합성 (Result)**: 4장 사진에 필터(원본, 흑백, 뽀샤시) 선택적 적용. Canvas API로 [배경 그라디언트 ➡️ 사진 4장 ➡️ 프레임 PNG 오버레이 ➡️ 로고 텍스트] 순서로 합성.
5.  **저장**: `canvas.toBlob()`을 활용해 로컬 디바이스에 PNG 파일 다운로드. (서버에 사진 전송 원천 차단)

---

## 📝 수정사항 및 개발 로그 (Changelog)

이 프로젝트의 구현 진행 상황과 변경/수정 사항을 이곳에 주기적으로 기록합니다.

| 일자 | 작업 내용 | 상세 및 비고 | 진행 상황 |
| :--- | :--- | :--- | :---: |
| 2026-06-16 | 요구사항 분석 및 아키텍처 문서 정의 | `자리네컷_요구사항분석서.docx`, `자리네컷_프론트엔드_기능정의서.docx` 파싱 완료 및 `PROJECT_STATUS.md` 생성 | **[완료]** |
| 2026-06-16 | 프로젝트 초기 설정 및 스켈레톤 구축 | Next.js 프로젝트 생성 및 Zustand, Tailwind CSS 세팅 완료 | **[완료]** |
| 2026-06-16 | 핵심 기능 및 Retro UI 컴포넌트 구현 | 공통 Window/Button, Desktop, Taskbar, Guestbook, Camera/useCamera, PhotoSelect, Result/canvasCompose, BGM 플레이어 구현 완료 | **[완료]** |
| 2026-06-16 | 빌드 및 품질 검증 | npm run build를 통한 TypeScript 및 Next.js 빌드 성공 확인 | **[완료]** |
| 2026-06-16 | 바탕화면 포인터 이벤트 버그 수정 | 윈도우 창 영역의 포인터 락 문제 해결 (바탕화면 아이콘 더블클릭 오작동 버그 픽스) | **[완료]** |
| 2026-06-16 | TiDB 연동 | `mysql2` 드라이버 설치, `src/lib/db.ts` 커넥션 풀 생성, `/api/guestbook` route를 인메모리 → 실제 TiDB 쿼리로 교체, DB명 `zari` / 닉네임 `익명의 방문자` 반영 | **[완료]** |
| 2026-07-07 | 전체 코드 리뷰 (버그 탐색) | 치명 5건 / 중간 3건 / 개선 5건 / 보류 4건 식별 — 상세는 아래 "코드 리뷰 결과" 섹션 참고 | **[완료]** |
| 2026-07-07 | 치명 버그 5건 수정 | Camera interval 누수, AudioContext 누수, Result 영구 스피너, BGM 자동재생 중단, 방명록 INSERT 동시성 경쟁 | **[완료]** |
| 2026-07-08 | 중간 버그 3건 + 개선 5건 수정 | API 4xx 검증 강화, Safari 검은 프레임 방지, 창 닫힘 후 화면 전환 방지, BGM 진행바, resetAll 창 초기화, revokeObjectURL 중복, DB 환경변수 검증 | **[완료]** |
| 2026-07-08 | 빌드 검증 | `npm run build` (Next.js 16.2.9 + TypeScript 검사) 통과 확인 | **[완료]** |
| 2026-07-08 | 문서 현행화 | 기술 스택의 DB 표기를 PostgreSQL(Supabase) → **TiDB Cloud(mysql2)** 로 교체 기록 반영, Next.js 버전 표기 갱신(14+ → 16), 디렉토리 구조를 실제 `src/` 구조에 맞게 수정 (`lib/db.ts`·`constants/frames.ts` 추가, 미존재 `filters.ts`·`useBgm.ts` 제거) | **[완료]** |

---

## 🔍 코드 리뷰 결과 (2026-07-07 ~ 07-08)

### ✅ 해결 완료

**치명 (5건) — 2026-07-07 수정**

| # | 위치 | 문제 | 조치 |
| :---: | :--- | :--- | :--- |
| 1 | `Camera.tsx` | 카운트다운 `setInterval`이 언마운트 시 미정리 → 언마운트 후 `addPhoto` 호출로 다음 세션 사진 목록 오염 | `mountedRef` + `intervalRef` 도입, 언마운트 시 interval 정리 및 스토어 호출 차단 |
| 2 | `Camera.tsx` | 촬영마다 `new AudioContext()` 생성 후 미해제 → Chrome 한도(~6개) 초과 시 셔터음 무음 | 단일 AudioContext 재사용 (`audioCtxRef`), 언마운트 시 `close()` |
| 3 | `Result.tsx` | `isGenerating` 초기값 `true` + guard early-return에서 해제 누락 → 영구 로딩 스피너 | 초기값 `false`로 변경, guard 경로에 `setIsGenerating(false)` 추가 |
| 4 | `BgmPlayer.tsx` | 트랙 자동 전환 시 두 effect의 실행 순서 문제로 이전 src에 `play()` → 거부 → `pause()` → 자동재생 영구 중단 | play/pause 동기화 effect의 deps에서 `trackIndex` 제거 |
| 5 | `route.ts` | INSERT 후 `ORDER BY created_at DESC LIMIT 1` 재조회 → 동시 요청 시 타인의 행 반환 | `randomUUID()`로 id 선발급 후 해당 id로 INSERT/SELECT. 하단의 `import mysql`도 최상단으로 이동 |

**중간 (3건) — 2026-07-08 수정**

| # | 위치 | 문제 | 조치 |
| :---: | :--- | :--- | :--- |
| 6 | `route.ts` GET | `?page=abc` → NaN이 `LIMIT NaN`으로 SQL에 전달돼 500 | 비정수 파라미터는 400 응답으로 사전 차단 |
| 7 | `useCamera.ts` | `setIsReady(true)`가 `video.play()` 완료 전에 실행 → Safari 자동재생 거부 시 검은 프레임 캡처 | `play().then()` 성공 후에만 `isReady` 설정, 실패 시 안내 메시지 |
| 8 | `GuestbookWrite.tsx` | 전송 중 창을 닫아도 POST 완료 시 `openWindow('frame')` 강제 실행 | `mountedRef` 가드로 언마운트 후 화면 전환/상태 갱신 차단 |

**개선 (5건) — 2026-07-08 수정**

| # | 위치 | 문제 | 조치 |
| :---: | :--- | :--- | :--- |
| 9 | `BgmPlayer.tsx` | `if (dur && cur)`에서 `cur=0`이 falsy → 트랙 시작 시 진행바가 이전 값에 고정 | `!isNaN(cur)` 조건으로 교체 + 트랙 변경 시 `setProgress(0)` |
| 10 | `flowStore.ts` | `resetAll()`이 `openWindows`/`activeWindow` 미초기화 → 재시작 후 열린 창 잔류 | 창 상태도 함께 초기화 |
| 11 | `Result.tsx` | `revokeObjectURL`이 두 경로에서 중복 호출 | setter 내 인라인 revoke 제거, `[previewUrl]` cleanup effect가 단독 담당 |
| 12 | `route.ts` POST | 잘못된 JSON body → `request.json()` 예외 → 500 | try/catch로 400 응답 |
| 13 | `db.ts` | 환경변수 누락 시 pool 생성은 성공하고 첫 쿼리에서 난해한 연결 에러 | `TIDB_HOST/USER/PASSWORD` 누락 시 명확한 메시지로 즉시 throw |

**파생 수정 (1건)**: `Result.tsx`의 "처음부터 다시 찍기"가 카메라 창 대신 **프레임 선택 창**을 열도록 변경 — `resetAll()`이 배열/프레임 선택을 지우므로 카메라로 직행하면 마지막 합성 단계에서 실패하기 때문.

### ⏳ 남은 항목 (의도된 설계로 보류 — 필요 시 개선)

| 위치 | 내용 | 권장 방향 |
| :--- | :--- | :--- |
| `route.ts` (IP 해시) | 단순 XOR 해시라 충돌이 많아 어뷰징 방지 실효성 낮음 (주석상 의도된 선택) | `crypto.createHash('sha256')` 교체 |
| `route.ts` (sanitize) | HTML 이스케이프를 **저장 시점**에 적용 → JSON 응답에 `&amp;` 노출, React 렌더 시 이중 이스케이프 가능 | 원문 저장 + 렌더 시점 이스케이프로 전환 |
| `bgmStore.ts` | `isOpen: true` — BGM 플레이어가 첫 방문 시 항상 펼쳐진 상태 | UX 의도에 따라 결정 (기획 확인) |
| `route.ts` GET (LIMIT) | limit/offset이 문자열 보간으로 SQL에 삽입 — 현재는 정수 검증으로 안전하나 구조상 placeholder가 정석 | mysql2의 LIMIT placeholder 제약 확인 후 교체 |

---

> [!IMPORTANT]
> **사진 보안 원칙**: 사용자가 찍은 사진 데이터는 어떠한 형태로도 백엔드 서버나 외부 DB에 전송되어서는 안 됩니다. 모든 합성 및 저장 작업은 클라이언트의 브라우저 단에서 완결되도록 안전하게 구현해야 합니다.
