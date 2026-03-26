"use client";

import { Sidebar } from "@/components/sidebar";
import { AuthGuard } from "@/components/AuthGuard";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { InitFlow } from "@/components/InitFlow";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F1F3F5]">
        <div className="text-lg font-medium text-gray-400">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F1F3F5]">
      {user && user.isPasswordChanged === false && <InitFlow />}
      <Sidebar />
      <main className="flex-1 overflow-y-auto w-full">
        {children}
      </main>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <DashboardContent>
        {children}
      </DashboardContent>
    </AuthGuard>
  );
}
