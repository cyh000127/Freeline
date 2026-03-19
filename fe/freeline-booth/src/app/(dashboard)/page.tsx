"use client";

import { Card } from "@/components/ui/card";
import { PauseCircle, XCircle } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="p-8">
      {/* Header Area */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">실시간 대기 현황</h1>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-sm font-medium text-gray-700">현재 부스 정상 운영 중</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Card className="flex h-14 items-center px-5 shadow-sm border-0 bg-white">
            <div className="flex items-center gap-4">
              <span className="text-xs font-semibold text-gray-500">예상 대기 시간</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold tracking-tighter text-gray-900">0</span>
                <span className="text-sm font-medium text-gray-900">분</span>
              </div>
            </div>
          </Card>

          <button className="flex h-14 items-center justify-center gap-2 rounded-xl bg-[#F59E0B] px-6 font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#FBBF24] hover:shadow-md">
            <PauseCircle className="h-5 w-5" />
            운영중지
          </button>
          
          <button className="flex h-14 items-center justify-center gap-2 rounded-xl bg-[#EF4444] px-6 font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F87171] hover:shadow-md">
            <XCircle className="h-5 w-5" />
            운영종료
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 mt-2">
        {/* Tabs */}
        <div className="mb-6 self-start inline-flex h-14 items-center justify-center rounded-2xl bg-white p-1.5 shadow-sm border border-gray-100">
          <button className="inline-flex h-full items-center justify-center rounded-xl bg-[#2D2A4A] px-8 text-sm font-bold text-white shadow transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#3A375C] hover:shadow-md">
            대기 0
          </button>
          <button className="inline-flex h-full items-center justify-center whitespace-nowrap rounded-xl px-8 text-sm font-medium text-gray-500 transition-all hover:text-gray-900 hover:bg-gray-50">
            입장
          </button>
          <button className="inline-flex h-full items-center justify-center whitespace-nowrap rounded-xl px-8 text-sm font-medium text-gray-500 transition-all hover:text-gray-900 hover:bg-gray-50">
            취소
          </button>
        </div>

        {/* Empty State */}
        <div className="flex flex-1 items-center justify-center text-lg font-medium text-gray-400">
          현재 예약한 고객님이 없습니다.
        </div>
      </div>
    </div>
  );
}
