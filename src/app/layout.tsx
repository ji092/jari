import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "자리네컷 (ZARINAECUT) - Y2K Retro Photo Booth",
  description: "앉은 자리에서 찍는 윈도우98 / Y2K 레트로 컨셉의 인생네컷 포토부스 서비스. 사진은 서버에 저장되지 않고 안전하게 다운로드됩니다.",
  keywords: ["자리네컷", "인생네컷", "Y2K", "레트로", "윈도우98", "포토부스", "웹캠 촬영"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="bg-[#008080] text-black overflow-hidden w-screen h-screen">
        {children}
      </body>
    </html>
  );
}

