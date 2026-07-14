# 🎞️ 자리네컷 (ZARINAECUT)

> 방명록을 쓰면 입장할 수 있는 브라우저 기반 레트로 포토부스 서비스

🔗 **[https://jari-alpha.vercel.app](https://jari-alpha.vercel.app)**

---

## 소개

**자리네컷**은 인생네컷에서 영감을 받아 만든 웹 포토부스입니다.
로그인도 결제도 없이, 방명록 한 줄만 남기면 사진을 찍을 수 있어요.
촬영된 사진은 **서버에 저장되지 않으며**, 모든 이미지 처리(촬영·보정·필터·드로잉·합성)는 브라우저에서 이루어집니다.
Windows 98 / Y2K 감성의 데스크톱 UI를 그대로 재현했습니다.

---

## 주요 기능

- 📝 **방명록 입장권** — 방명록(1~200자) 작성 후 포토부스 이용 (미입력/초과 시 안내)
- 📷 **8컷 촬영** — 3·2·1 카운트다운 + 셔터음 + 플래시, 전/후면 카메라 전환, 실시간 뷰티 보정
- 🖼️ **프레임 6종 × 레이아웃 2종** — 흰색/회색/검정/추억의스사/파란곰/90's, 2×2 & 1×4 세로
- 🎨 **필터 8종** — 원본 / 흑백 / 뽀샤시 / 세피아 / 네온 / 비네팅 / 시티팝 / Y2K VHS(타임스탬프)
- ✏️ **드로잉** — 펜(색상·굵기)·지우개·되돌리기로 사진 위에 자유롭게 꾸미기
- 💾 **저장** — PNG 다운로드 / 모바일 공유 / 카카오톡 등 인앱 브라우저 저장 지원
- 🎵 **BGM 플레이어** — 화면 전환에도 끊기지 않는 전역 음악(6곡)

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router), React 19, TypeScript |
| 스타일 | Tailwind CSS 4 (레트로 커스텀 테마) |
| 상태 관리 | Zustand |
| 이미지 처리 | Canvas 2D API (필터·드로잉·합성, 클라이언트 사이드) |
| 카메라 / 오디오 | MediaDevices API / Web Audio API |
| 백엔드 | Next.js Route Handler (`/api/guestbook`) |
| 데이터베이스 | TiDB Cloud (MySQL 호환, `mysql2`) — 방명록 텍스트만 저장 |
| 배포 | Vercel |

---

## 시작하기

**요구사항**: Node.js `v22.22.1` (`.nvmrc` 참고)

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 을 열면 됩니다.
(카메라는 HTTPS 또는 `localhost`에서만 동작합니다.)

### 환경 변수

방명록 저장을 위해 프로젝트 루트에 `.env.local`을 만들고 TiDB 접속 정보를 입력합니다.

| 변수 | 필수 | 설명 |
|------|------|------|
| `TIDB_HOST` | ✅ | DB 호스트 |
| `TIDB_USER` | ✅ | DB 사용자 |
| `TIDB_PASSWORD` | ✅ | DB 비밀번호 |
| `TIDB_PORT` | ⬜ | 기본 4000 |
| `TIDB_DATABASE` | ⬜ | 기본 `zari` |

`guestbook` 테이블 스키마:

```sql
CREATE TABLE guestbook (
  id         BIGINT       NOT NULL AUTO_INCREMENT,
  nickname   VARCHAR(50)  NOT NULL DEFAULT '익명의 방문자',
  message    VARCHAR(200) NOT NULL,
  ip_hash    VARCHAR(64)  NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_created_at (created_at DESC)
);
```

---

## 스크립트

```bash
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드
npm run start    # 빌드 결과 실행
npm run lint     # ESLint 검사
```

---

## 배포

[Vercel](https://vercel.com)로 배포하며, 환경 변수(`TIDB_*`)는 Vercel 프로젝트 설정에 등록합니다.
카메라 API를 위해 HTTPS가 필요하며 Vercel은 기본 제공합니다.
