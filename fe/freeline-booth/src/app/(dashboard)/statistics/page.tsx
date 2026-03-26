"use client";

import { Card } from "@/components/ui/card";
import { Users, BarChart3, TrendingUp } from "lucide-react";

export default function StatisticsPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-gray-900 mb-2">사용자 통계</h1>
        <p className="text-gray-500 font-medium">부스 방문객 데이터를 분석하고 리포트를 확인하세요.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6 border-0 shadow-sm bg-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 rounded-2xl">
              <Users className="w-6 h-6 text-indigo-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">누적 방문객</p>
              <p className="text-2xl font-black text-gray-900">0명</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-0 shadow-sm bg-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 rounded-2xl">
              <BarChart3 className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">평균 대기 시간</p>
              <p className="text-2xl font-black text-gray-900">0분</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-0 shadow-sm bg-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 rounded-2xl">
              <TrendingUp className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">시간당 최고 방문</p>
              <p className="text-2xl font-black text-gray-900">0명</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="flex-1 bg-white/50 border-2 border-dashed border-gray-200 rounded-[32px] flex flex-col items-center justify-center text-gray-400 min-h-[400px]">
        <div className="p-6 bg-gray-50 rounded-full mb-4">
          <BarChart3 className="w-12 h-12 text-gray-300" />
        </div>
        <p className="text-xl font-bold">통계 데이터가 충분하지 않습니다.</p>
        <p className="text-sm font-medium mt-1">부스 운영이 시작되면 리포트가 생성됩니다.</p>
      </Card>
    </div>
  );
}
