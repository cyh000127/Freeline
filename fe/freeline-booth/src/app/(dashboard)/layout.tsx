import { Sidebar } from "@/components/sidebar";
import { AuthGuard } from "@/components/AuthGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden bg-[#F1F3F5]">
        <Sidebar />
        <main className="flex-1 overflow-y-auto w-full">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
