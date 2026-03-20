"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, PackageOpen, Users, Settings } from "lucide-react";

const navigation = [
  { name: "대시보드", href: "/", icon: Menu },
  { name: "굿즈 관리", href: "/goods", icon: PackageOpen },
  { name: "사용자 통계", href: "/statistics", icon: Users },
  { name: "환경 설정", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

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
                  ? "text-lime-400 font-bold"
                  : "text-gray-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon className={`h-5 w-5 ${isActive ? "text-lime-400" : ""}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Profile Section */}
      <div className="p-4">
        <button className="w-full rounded-md bg-[#D9F950] px-4 py-3 text-xs font-bold text-[#2D2A4A] transition-colors hover:bg-[#c9e843]">
          총괄 관리자에게 문의하기
        </button>
        
        <div className="mt-6 flex flex-col border-t border-white/20 pt-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#2D2A4A]">
              👤
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold">관리자</span>
              <span className="text-sm text-gray-300">김싸피 팀장</span>
            </div>
          </div>
          <div className="mt-4 text-center">
            <span className="text-lg font-bold text-[#D9F950]">A-01 부스</span>
          </div>
        </div>
      </div>
    </div>
  );
}
