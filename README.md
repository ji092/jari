# 🎞️ 자리네컷

> 방명록을 쓰면 입장할 수 있는 브라우저 기반 포토부스 서비스

🔗 **[https://jari-alpha.vercel.app](https://jari-alpha.vercel.app)**

---

## 소개

**자리네컷**은 인생네컷에서 영감을 받아 만든 웹 포토부스입니다.  
로그인도 결제도 없이, 방명록 한 줄만 남기면 사진을 찍을 수 있어요.  
촬영된 사진은 서버에 저장되지 않으며, 모든 이미지 처리는 브라우저에서 이루어집니다.

---

## 주요 기능

- 📝 **방명록 입장권** — 방명록 작성 후 포토부스 이용 가능
- 📷 **8컷 촬영** — 카운트다운 + 셔터음 + 플래시 효과
- 🖼️ **프레임 선택** — 2×2 / 1×4 세로 레이아웃
- ✨ **필터 적용** — 원본 / 흑백 / 뽀샤시
- 💾 **PNG 다운로드** — 완성된 사진을 바로 저장
- 🎵 **BGM 플레이어** — 화면 전환에도 끊기지 않는 음악

---

## 시작하기

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 을 열면 됩니다.

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| 프레임워크 | Next.js (App Router), TypeScript |
| 스타일 | Tailwind CSS |
| 상태 관리 | Zustand |
| 이미지 처리 | Canvas API (클라이언트 사이드) |
| 오디오 | Web Audio API |
| 데이터베이스 | Supabase / TiDB |
| 배포 | Vercel |

---

## 개발 서버 실행

```bash
npm run dev      # npm
yarn dev         # yarn
pnpm dev         # pnpm
bun dev          # bun
```

---

## 배포

[Vercel](https://vercel.com) 을 통해 배포합니다.  
main 브랜치에 푸시하면 자동으로 배포됩니다.
