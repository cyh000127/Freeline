"use client";

import { Users, Zap } from "lucide-react";
import type { EventSummaryDto } from "@/lib/api/report";

interface Props {
  summary: EventSummaryDto;
}

function formatPeakHour(peakHour: string | null): string {
  if (!peakHour) return "-";
  const match = peakHour.match(/T?(\d{1,2})$/);
  if (match) return `${parseInt(match[1])}시`;
  return peakHour;
}

export function EventSummaryCard({ summary }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="p-2 bg-[#2D2A4A] rounded-xl">
          <Users className="w-4 h-4 text-[#C4FF00]" />
        </div>
        <h3 className="text-base font-bold text-gray-900">행사 전체 요약</h3>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-xl p-4">
          <span className="text-[13px] font-bold text-gray-500 block mb-1">
            전체 방문자
          </span>
          <span className="text-xl font-black text-gray-900">
            {summary.totalVisitors.toLocaleString()}
            <span className="text-sm font-bold text-gray-400 ml-1">명</span>
          </span>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <span className="text-[13px] font-bold text-gray-500 block mb-1">
            전체 대기 등록
          </span>
          <span className="text-xl font-black text-gray-900">
            {summary.totalRegistrations.toLocaleString()}
            <span className="text-sm font-bold text-gray-400 ml-1">건</span>
          </span>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <span className="text-[13px] font-bold text-gray-500 block mb-1">
            전체 이탈률
          </span>
          <span className="text-xl font-black text-gray-900">
            {(summary.overallDropoutRate * 100).toFixed(1)}
            <span className="text-sm font-bold text-gray-400 ml-1">%</span>
          </span>
        </div>
      </div>

      {summary.peakHour && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[#2D2A4A] rounded-xl w-fit mt-4">
          <Zap className="w-4 h-4 text-[#C4FF00]" />
          <span className="text-[13px] font-bold text-white">
            피크 시간대
          </span>
          <span className="text-[13px] font-black text-[#C4FF00]">
            {formatPeakHour(summary.peakHour)}
          </span>
        </div>
      )}
    </div>
  );
}
