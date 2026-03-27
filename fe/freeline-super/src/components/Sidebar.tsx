"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  BarChart3,
  ArrowLeft,
  Ticket,
  Radio
} from "lucide-react";

interface SidebarProps {
  userName: string;
  role: string;
  eventId?: string;
    eventName?: string;
}

export function Sidebar({userName, role, eventId, eventName}: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { name: "대시보드", icon: LayoutDashboard, href: `/events/${eventId || ''}`, exact: true },
    { name: "부스 계정 관리", icon: Store, href: `/events/${eventId || ''}/booths`, exact: false },
    { name: "부스 운영 관리", icon: Radio, href: `/events/${eventId || ''}/operations`, exact: false },
    { name: "방문자 티켓 발급", icon: Ticket, href: `/events/${eventId || ''}/tickets`, exact: false },
    { name: "분석 리포트", icon: BarChart3, href: `/events/${eventId || ''}/report`, exact: false },
  ];

  return (
    <aside className="w-64 bg-[#2D2A4A] h-screen flex flex-col text-white shrink-0 relative overflow-hidden">
      {/* Back to Home Button at the very top */}
      <Link
        href="/"
        className="flex items-center gap-2 px-6 py-4 text-gray-400 hover:text-white transition-all bg-black/10 hover:bg-black/20 group border-b border-white/5 [&>span:not(.sidebar-visible-text)]:hidden"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="sidebar-visible-text text-[13px] font-bold">전체 행사 목록</span>
        <span className="text-[13px] font-bold">전체 행사 목록으로</span>
      </Link>

      {/* Brand Logo */}
        <div className="relative p-8 pb-14 flex items-center gap-3 [&>span:not(.sidebar-brand-visible)]:hidden">
        <Image src="/super/assets/logo.png" alt="Logo" width={40} height={40} className="h-6 w-auto object-contain" />
            <span className="sidebar-brand-visible text-2xl font-bold tracking-tight">줄서잇 매니저</span>
            {eventName && (
                <p className="absolute left-8 top-[4.25rem] max-w-[12rem] truncate text-sm font-semibold text-white/70">
                    {eventName}
                </p>
            )}
        <span className="text-2xl font-bold tracking-tight">줄서잇 매니저</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1">

        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 px-6 py-4 rounded-xl font-bold text-[15px] transition-all ${isActive
                ? "bg-white/10 text-[#C4FF00]"
                : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-6 border-t border-white/10">
        <div className="flex items-center gap-4 px-2 py-3 bg-white/5 rounded-2xl">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0">
            {/* User Avatar Placeholder */}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[13px] text-gray-400 font-medium">{role}</span>
            <span className="text-[15px] font-bold truncate">{userName}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
