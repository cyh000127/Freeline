import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "줄서잇 매니저 (총괄)",
  description: "줄서잇 총괄 관리자 페이지입니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased bg-[#F1F3F5]">
        {children}
      </body>
    </html>
  );
}
