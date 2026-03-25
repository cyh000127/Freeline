"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Menu, PackageOpen, Users, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const navigation = [
  { name: "대시보드", href: "/", icon: Menu },
  { name: "굿즈 관리", href: "/goods", icon: PackageOpen },
  { name: "사용자 통계", href: "/statistics", icon: Users },
  { name: "환경 설정", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    router.push("/login");
  };

  return (
    <div className="flex w-[240px] flex-col bg-[#2D2A4A] text-white">
      {/* Logo */}
      <div className="flex h-20 items-center justify-center border-b border-white/10 px-6">
        <div className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <Image src="/booth/assets/logo.png" alt="줄서잇 매니저 로고" width={100} height={20} priority className="h-5 w-auto object-contain" onError={(e) => {
            e.currentTarget.style.display = 'none';
          }} />
          줄서잇 매니저
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-4 py-8">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-white/10 text-lime-400 font-bold"
                  : "text-gray-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Profile Section */}
      <div className="p-4">
        <button className="w-full rounded-xl bg-white/10 px-4 py-3 text-xs font-bold text-white transition-colors hover:bg-white/20">
          총괄 관리자에게 문의하기
        </button>
        
        <div className="mt-6 flex flex-col border-t border-white/10 pt-6">
          <div className="rounded-2xl bg-white/5 p-5 border border-white/5 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2">
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-rose-400 hover:bg-white/10 rounded-xl transition-all"
                title="로그아웃"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex items-center gap-2 mb-2">
              <div className="h-6 w-6 flex items-center justify-center rounded-full bg-lime-400 text-[#2D2A4A] text-[12px] font-black">
                B
              </div>
              <span className="text-[11px] font-bold text-lime-400 uppercase tracking-widest">Booth Info</span>
            </div>
            
            <span className="text-xl font-black text-white truncate block leading-tight">
              {user?.boothName || "부스명 미지정"}
            </span>
            
            <div className="mt-3 flex items-center gap-2 text-gray-300">
              <div className="flex h-5 w-5 items-center justify-center rounded-md bg-white/10">
                <Menu className="w-3 h-3 text-lime-400" />
              </div>
              <span className="text-xs font-semibold truncate">
                {user?.boothLocation || "위치 정보 없음"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
