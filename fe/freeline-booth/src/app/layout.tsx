import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "줄서잇 매니저 (부스)",
  description: "줄서잇 부스 관리자 페이지입니다.",
};

import { AuthProvider } from "@/context/AuthContext";
import { ModalProvider } from "@/context/ModalContext";
import { GlobalModal } from "@/components/GlobalModal";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        <ModalProvider>
          <AuthProvider>
            {children}
            <GlobalModal />
          </AuthProvider>
        </ModalProvider>
      </body>
    </html>
  );
}
